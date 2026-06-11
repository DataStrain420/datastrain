import json
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Batch,
    BatchTerpene,
    ConditionRating,
    Grower,
    Review,
    ReviewStatus,
    SearchQuery,
    Strain,
    Terpene,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


class SearchResultItem(BaseModel):
    type: str  # "strain", "grower", "condition", "effect", "terpene"
    id: int | None = None
    name: str
    detail: str | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]


class TrendingItem(BaseModel):
    query: str
    count: int
    top_result_type: str | None = None


@router.get("/trending", response_model=list[TrendingItem])
async def trending_searches(
    limit: int = Query(8, ge=1, le=20),
    days: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
):
    """Return the most popular search queries from the last N days."""
    since = datetime.utcnow() - timedelta(days=days)

    stmt = (
        select(
            SearchQuery.query,
            func.count(SearchQuery.id).label("cnt"),
            # Pick the most common top_result_type for this query
            func.max(SearchQuery.top_result_type).label("top_type"),
        )
        .where(SearchQuery.created_at >= since)
        .group_by(SearchQuery.query)
        .order_by(func.count(SearchQuery.id).desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [
        TrendingItem(query=row.query, count=row.cnt, top_result_type=row.top_type)
        for row in result.all()
    ]


@router.get("/", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(10, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
):
    """Search across strains, growers, conditions, effects, and terpenes."""
    pattern = f"%{q}%"
    results: list[SearchResultItem] = []

    try:
        # ── Strains (name, aliases, description) ─────────────────────
        stmt = (
            select(Strain)
            .where(
                Strain.approved.is_(True),
                or_(
                    Strain.name.ilike(pattern),
                    Strain.aliases.ilike(pattern),
                    Strain.description.ilike(pattern),
                ),
            )
            .order_by(Strain.name)
            .limit(limit)
        )
        strain_rows = await db.execute(stmt)
        for s in strain_rows.scalars().all():
            detail_parts = [s.strain_type]
            if s.aliases:
                detail_parts.append(f"Aka: {s.aliases}")
            results.append(
                SearchResultItem(
                    type="strain",
                    id=s.id,
                    name=s.name,
                    detail=" · ".join(detail_parts),
                )
            )

        # ── Growers ──────────────────────────────────────────────────
        stmt = (
            select(Grower)
            .where(Grower.name.ilike(pattern))
            .order_by(Grower.name)
            .limit(limit)
        )
        grower_rows = await db.execute(stmt)
        for g in grower_rows.scalars().all():
            results.append(
                SearchResultItem(
                    type="grower",
                    id=g.id,
                    name=g.name,
                    detail=g.country_of_origin,
                )
            )

        # ── Conditions ───────────────────────────────────────────────
        stmt = (
            select(
                ConditionRating.condition_name,
                func.count(ConditionRating.id).label("cnt"),
            )
            .join(Review, Review.id == ConditionRating.review_id)
            .where(
                ConditionRating.condition_name.ilike(pattern),
                Review.status == ReviewStatus.APPROVED.value,
            )
            .group_by(ConditionRating.condition_name)
            .order_by(func.count(ConditionRating.id).desc())
            .limit(limit)
        )
        cond_rows = await db.execute(stmt)
        for row in cond_rows.all():
            results.append(
                SearchResultItem(
                    type="condition",
                    name=row.condition_name,
                    detail=f"{row.cnt} review{'s' if row.cnt != 1 else ''}",
                )
            )

        # ── Effects (from review JSON) ───────────────────────────────
        effect_stmt = (
            select(Review.effects)
            .where(
                Review.status == ReviewStatus.APPROVED.value,
                Review.effects.ilike(pattern),
                Review.effects.isnot(None),
            )
            .limit(50)
        )
        effect_rows = await db.execute(effect_stmt)
        seen_effects: set[str] = set()
        for row in effect_rows.all():
            try:
                effects_list = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                if isinstance(effects_list, list):
                    for eff in effects_list:
                        if isinstance(eff, str) and q.lower() in eff.lower() and eff not in seen_effects:
                            seen_effects.add(eff)
            except (json.JSONDecodeError, TypeError):
                pass
        for eff in sorted(seen_effects)[:limit]:
            results.append(
                SearchResultItem(
                    type="effect",
                    name=eff,
                    detail="Effect",
                )
            )

        # ── Terpenes ─────────────────────────────────────────────────
        terp_stmt = (
            select(Terpene.id, Terpene.name)
            .where(Terpene.name.ilike(pattern))
            .order_by(Terpene.name)
            .limit(limit)
        )
        terp_rows = await db.execute(terp_stmt)
        for row in terp_rows.all():
            results.append(
                SearchResultItem(
                    type="terpene",
                    id=row.id,
                    name=row.name,
                    detail="Terpene",
                )
            )

    except Exception:
        logger.exception("Search query failed")
        raise

    # ── Log the search query (fire-and-forget) ───────────────────────
    if len(q.strip()) >= 2:
        top_type = results[0].type if results else None
        db.add(SearchQuery(
            query=q.strip().lower(),
            result_count=len(results),
            top_result_type=top_type,
        ))

    return SearchResponse(query=q, results=results)
