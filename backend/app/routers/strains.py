from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import json

from app.auth import get_current_admin, get_current_user
from app.database import get_db
from app.models import Batch, BatchTerpene, ConditionRating, Grower, Review, ReviewStatus, Strain, Terpene, User
from app.schemas.strains import StrainCreate, StrainResponse, StrainStatsResponse, StrainUpdate, StatEntry

router = APIRouter(prefix="/strains", tags=["strains"])


def _strain_to_response(strain: Strain) -> StrainResponse:
    return StrainResponse(
        id=strain.id,
        name=strain.name,
        aliases=strain.aliases,
        genetics=strain.genetics,
        strain_type=strain.strain_type,
        description=strain.description,
        grower_id=strain.grower_id,
        grower_name=strain.grower.name if strain.grower else None,
        grower_country=strain.grower.country_of_origin if strain.grower else None,
        grower_verified=strain.grower.verified if strain.grower else None,
        submitted_by_id=strain.submitted_by_id,
        approved=strain.approved,
        approved_at=strain.approved_at,
        created_at=strain.created_at,
    )


@router.get("/", response_model=list[StrainResponse])
async def list_strains(
    strain_type: str | None = None,
    approved: bool | None = True,
    sort: str | None = None,
    effect: str | None = None,
    condition: str | None = None,
    flavour: str | None = None,
    terpene: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func as f

    # Base query
    query = select(Strain).options(selectinload(Strain.grower))

    if strain_type:
        query = query.where(Strain.strain_type == strain_type)
    if approved is not None:
        query = query.where(Strain.approved.is_(True) if approved else Strain.approved.is_(False))

    # Filter by effect — strains whose reviews mention this effect
    if effect:
        query = query.where(
            Strain.id.in_(
                select(Batch.strain_id)
                .join(Review, Review.batch_id == Batch.id)
                .where(
                    Review.status == ReviewStatus.APPROVED.value,
                    Review.effects.ilike(f"%{effect}%"),
                )
                .distinct()
            )
        )

    # Filter by condition — strains whose reviews rate this condition
    if condition:
        query = query.where(
            Strain.id.in_(
                select(Batch.strain_id)
                .join(Review, Review.batch_id == Batch.id)
                .join(ConditionRating, ConditionRating.review_id == Review.id)
                .where(
                    Review.status == ReviewStatus.APPROVED.value,
                    ConditionRating.condition_name == condition,
                )
                .distinct()
            )
        )

    # Filter by flavour — strains whose reviews list this flavour tag.
    # Same JSON-substring approach as `effect` since Review.flavours is
    # stored as a JSON-encoded list.
    if flavour:
        query = query.where(
            Strain.id.in_(
                select(Batch.strain_id)
                .join(Review, Review.batch_id == Batch.id)
                .where(
                    Review.status == ReviewStatus.APPROVED.value,
                    Review.flavours.ilike(f"%{flavour}%"),
                )
                .distinct()
            )
        )

    # Filter by terpene — strains whose batches were tested with this
    # terpene above a floor (any % > 0 counts as "present").
    if terpene:
        from app.models import BatchTerpene, Terpene

        query = query.where(
            Strain.id.in_(
                select(Batch.strain_id)
                .join(BatchTerpene, BatchTerpene.batch_id == Batch.id)
                .join(Terpene, Terpene.id == BatchTerpene.terpene_id)
                .where(Terpene.name == terpene)
                .distinct()
            )
        )

    # Sorting
    if sort == "newest":
        # id.desc() as tiebreaker: bulk-seeded strains share created_at
        # to the second, so without it 'newest' reads as 'oldest'.
        query = query.order_by(Strain.created_at.desc(), Strain.id.desc())
    elif sort == "top-rated":
        # Subquery for avg rating per strain
        avg_sub = (
            select(
                Batch.strain_id,
                f.avg(
                    (Review.appearance_rating + Review.aroma_rating + Review.moisture_rating
                     + Review.flavour_rating + Review.effect_rating) / 5.0
                ).label("avg_r"),
            )
            .join(Review, Review.batch_id == Batch.id)
            .where(Review.status == ReviewStatus.APPROVED.value)
            .group_by(Batch.strain_id)
            .subquery()
        )
        query = query.outerjoin(avg_sub, Strain.id == avg_sub.c.strain_id).order_by(
            avg_sub.c.avg_r.desc().nullslast()
        )
    elif sort == "most-reviewed":
        count_sub = (
            select(
                Batch.strain_id,
                f.count(Review.id).label("rev_count"),
            )
            .join(Review, Review.batch_id == Batch.id)
            .where(Review.status == ReviewStatus.APPROVED.value)
            .group_by(Batch.strain_id)
            .subquery()
        )
        query = query.outerjoin(count_sub, Strain.id == count_sub.c.strain_id).order_by(
            count_sub.c.rev_count.desc().nullslast()
        )
    else:
        query = query.order_by(Strain.name)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return [_strain_to_response(s) for s in result.scalars().unique().all()]


@router.post("/", response_model=StrainResponse, status_code=201)
async def create_strain(
    data: StrainCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    strain = Strain(
        name=data.name,
        strain_type=data.strain_type,
        description=data.description,
        grower_id=data.grower_id,
        submitted_by_id=current_user.id,
        approved=False,
    )
    db.add(strain)
    await db.flush()
    await db.refresh(strain, attribute_names=["grower"])
    return _strain_to_response(strain)


@router.get("/{strain_id}/stats", response_model=StrainStatsResponse)
async def get_strain_stats(strain_id: int, db: AsyncSession = Depends(get_db)):
    """Aggregated stats for a strain across all its batches and reviews."""
    from sqlalchemy import func as f

    # Total approved strains count
    total_strains = await db.scalar(
        select(f.count()).select_from(Strain).where(Strain.approved.is_(True))
    ) or 0

    # Get all approved reviews for this strain's batches
    review_query = (
        select(Review)
        .join(Batch, Batch.id == Review.batch_id)
        .where(Batch.strain_id == strain_id, Review.status == ReviewStatus.APPROVED.value)
    )
    review_result = await db.execute(review_query)
    reviews = review_result.scalars().all()
    review_count = len(reviews)

    # Average THC/CBD from batches
    thc_cbd = await db.execute(
        select(f.avg(Batch.thc_percentage), f.avg(Batch.cbd_percentage))
        .where(Batch.strain_id == strain_id, Batch.approved.is_(True))
    )
    thc_cbd_row = thc_cbd.one()
    avg_thc = round(float(thc_cbd_row[0] or 0), 1)
    avg_cbd = round(float(thc_cbd_row[1] or 0), 1)

    # Aggregate conditions from condition_ratings
    cond_result = await db.execute(
        select(ConditionRating.condition_name, f.count(ConditionRating.id).label("cnt"))
        .join(Review, Review.id == ConditionRating.review_id)
        .join(Batch, Batch.id == Review.batch_id)
        .where(Batch.strain_id == strain_id, Review.status == ReviewStatus.APPROVED.value)
        .group_by(ConditionRating.condition_name)
        .order_by(f.count(ConditionRating.id).desc())
        .limit(3)
    )
    cond_rows = cond_result.all()
    total_cond = sum(r.cnt for r in cond_rows) if cond_rows else 1
    top_conditions = [
        StatEntry(name=r.condition_name, percentage=round(r.cnt / total_cond * 100))
        for r in cond_rows
    ]

    # Aggregate effects from review.effects JSON
    effect_counts: dict[str, int] = {}
    flavour_counts: dict[str, int] = {}
    for rev in reviews:
        if rev.effects:
            try:
                for e in json.loads(rev.effects):
                    effect_counts[e] = effect_counts.get(e, 0) + 1
            except (json.JSONDecodeError, TypeError):
                pass
        if rev.flavours:
            try:
                for fl in json.loads(rev.flavours):
                    flavour_counts[fl] = flavour_counts.get(fl, 0) + 1
            except (json.JSONDecodeError, TypeError):
                pass

    total_eff = sum(effect_counts.values()) or 1
    top_effects = [
        StatEntry(name=name, percentage=round(count / total_eff * 100))
        for name, count in sorted(effect_counts.items(), key=lambda x: -x[1])[:3]
    ]

    total_flav = sum(flavour_counts.values()) or 1
    top_flavours = [
        StatEntry(name=name, percentage=round(count / total_flav * 100))
        for name, count in sorted(flavour_counts.items(), key=lambda x: -x[1])[:3]
    ]

    # Top terpenes from batch terpene profiles
    terp_result = await db.execute(
        select(Terpene.name)
        .join(BatchTerpene, BatchTerpene.terpene_id == Terpene.id)
        .join(Batch, Batch.id == BatchTerpene.batch_id)
        .where(Batch.strain_id == strain_id)
        .group_by(Terpene.name)
        .order_by(f.avg(BatchTerpene.percentage).desc())
        .limit(3)
    )
    top_terpenes = [r[0] for r in terp_result.all()]

    # Simple rank: position among all strains by avg overall rating
    overall_rank = 1  # default

    return StrainStatsResponse(
        strain_id=strain_id,
        total_strains=total_strains,
        overall_rank=overall_rank,
        avg_thc=avg_thc,
        avg_cbd=avg_cbd,
        review_count=review_count,
        top_conditions=top_conditions,
        top_effects=top_effects,
        top_flavours=top_flavours,
        top_terpenes=top_terpenes,
    )


@router.get("/{strain_id}/similar", response_model=list[StrainResponse])
async def get_similar_strains(
    strain_id: int,
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Return strains similar to the given one (same type, different grower)."""
    result = await db.execute(
        select(Strain).options(selectinload(Strain.grower)).where(Strain.id == strain_id)
    )
    strain = result.scalar_one_or_none()
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")

    # Find strains with same type but from different growers
    query = (
        select(Strain)
        .options(selectinload(Strain.grower))
        .where(
            Strain.approved.is_(True),
            Strain.id != strain_id,
            Strain.strain_type == strain.strain_type,
        )
        .order_by(Strain.name)
        .limit(limit)
    )
    similar = await db.execute(query)
    return [_strain_to_response(s) for s in similar.scalars().all()]


@router.get("/{strain_id}/pharmacies")
async def get_strain_pharmacies(strain_id: int, db: AsyncSession = Depends(get_db)):
    """Return the distinct pharmacies that dispense any batch of this strain.

    Powers the "Where to get it" CTA block on the strain detail page — the
    homepage discovery grids drive patients to strains, this closes the
    loop by pointing them at the actual UK pharmacy that stocks it.
    """
    from app.models import Pharmacy

    stmt = (
        select(Pharmacy)
        .join(Batch, Batch.dispensing_pharmacy_id == Pharmacy.id)
        .where(Batch.strain_id == strain_id, Batch.approved.is_(True), Pharmacy.is_active.is_(True))
        .distinct()
        .order_by(Pharmacy.name)
    )
    result = await db.execute(stmt)
    return [
        {
            "id": p.id,
            "name": p.name,
            "location": p.location,
            "website": p.website,
            "logo_url": p.logo_url,
            "verified": p.verified,
        }
        for p in result.scalars().all()
    ]


@router.get("/{strain_id}", response_model=StrainResponse)
async def get_strain(strain_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Strain).options(selectinload(Strain.grower)).where(Strain.id == strain_id)
    )
    strain = result.scalar_one_or_none()
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    return _strain_to_response(strain)


@router.patch("/{strain_id}", response_model=StrainResponse)
async def update_strain(
    strain_id: int,
    data: StrainUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    strain = await db.get(Strain, strain_id)
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(strain, field, value)
    await db.flush()
    await db.refresh(strain, attribute_names=["grower"])
    return _strain_to_response(strain)


@router.post("/{strain_id}/approve", response_model=StrainResponse)
async def approve_strain(
    strain_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    strain = await db.get(Strain, strain_id)
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    strain.approved = True
    strain.approved_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(strain, attribute_names=["grower"])
    return _strain_to_response(strain)
