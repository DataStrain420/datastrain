from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Batch, Grower, Review, ReviewStatus, Strain
from app.schemas.growers import GrowerRankedResponse, GrowerResponse

router = APIRouter(prefix="/growers", tags=["growers"])


@router.get("/", response_model=list[GrowerResponse])
async def list_growers(
    sort: str | None = None,
    country: str | None = None,
    verified: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Grower)

    if country:
        query = query.where(Grower.country_of_origin == country)
    if verified is not None:
        query = query.where(Grower.verified.is_(verified))

    if sort == "top-rated":
        avg_sub = (
            select(
                Batch.grower_id,
                func.avg(
                    (Review.appearance_rating + Review.aroma_rating + Review.moisture_rating
                     + Review.flavour_rating + Review.effect_rating) / 5.0
                ).label("avg_r"),
            )
            .join(Review, Review.batch_id == Batch.id)
            .where(Review.status == ReviewStatus.APPROVED.value)
            .group_by(Batch.grower_id)
            .subquery()
        )
        query = query.outerjoin(avg_sub, Grower.id == avg_sub.c.grower_id).order_by(
            avg_sub.c.avg_r.desc().nullslast()
        )
    elif sort == "most-strains":
        count_sub = (
            select(
                Strain.grower_id,
                func.count(Strain.id).label("strain_count"),
            )
            .where(Strain.approved.is_(True))
            .group_by(Strain.grower_id)
            .subquery()
        )
        query = query.outerjoin(count_sub, Grower.id == count_sub.c.grower_id).order_by(
            count_sub.c.strain_count.desc().nullslast()
        )
    else:
        query = query.order_by(Grower.name)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return [GrowerResponse.model_validate(g) for g in result.scalars().unique().all()]


@router.get("/top-rated", response_model=list[GrowerRankedResponse])
async def top_rated_growers(
    limit: int = 12, db: AsyncSession = Depends(get_db)
):
    """Return growers ranked by average review rating across their batches."""
    avg_rating = func.avg(
        (
            Review.appearance_rating
            + Review.aroma_rating
            + Review.moisture_rating
            + Review.flavour_rating
            + Review.effect_rating
        )
        / 5.0
    ).label("avg_rating")
    review_count = func.count(Review.id).label("review_count")

    stmt = (
        select(Grower.id, Grower.name, Grower.logo_url, Grower.verified, avg_rating, review_count)
        .join(Batch, Batch.grower_id == Grower.id)
        .join(Review, Review.batch_id == Batch.id)
        .where(Review.status == ReviewStatus.APPROVED.value)
        .group_by(Grower.id, Grower.name, Grower.logo_url, Grower.verified)
        .order_by(avg_rating.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    # If no reviewed growers yet, fall back to all growers ordered by name
    if not rows:
        fallback = await db.execute(select(Grower).order_by(Grower.name).limit(limit))
        growers = fallback.scalars().all()
        return [
            GrowerRankedResponse(
                id=g.id,
                name=g.name,
                logo_url=g.logo_url,
                verified=g.verified,
                rank=i + 1,
                avg_rating=0.0,
                review_count=0,
            )
            for i, g in enumerate(growers)
        ]

    return [
        GrowerRankedResponse(
            id=row.id,
            name=row.name,
            logo_url=row.logo_url,
            verified=row.verified,
            rank=i + 1,
            avg_rating=round(float(row.avg_rating), 1),
            review_count=row.review_count,
        )
        for i, row in enumerate(rows)
    ]


@router.get("/{grower_id}", response_model=GrowerResponse)
async def get_grower(grower_id: int, db: AsyncSession = Depends(get_db)):
    grower = await db.get(Grower, grower_id)
    if not grower:
        raise HTTPException(status_code=404, detail="Grower not found")
    return GrowerResponse.model_validate(grower)
