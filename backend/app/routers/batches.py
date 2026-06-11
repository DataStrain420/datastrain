from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_admin
from app.database import get_db
from app.models import Batch, BatchTerpene, ConditionRating, Review, ReviewStatus, Terpene
from app.schemas.batches import (
    BatchCardResponse,
    BatchCreate,
    BatchResponse,
    BatchUpdate,
)
from app.schemas.terpenes import BatchTerpeneResponse

router = APIRouter(prefix="/batches", tags=["batches"])


def _batch_to_response(batch: Batch) -> BatchResponse:
    terpenes = []
    for bt in batch.terpene_profiles:
        terpenes.append(
            BatchTerpeneResponse(
                terpene_id=bt.terpene_id,
                terpene_name=bt.terpene.name if bt.terpene else "",
                percentage=bt.percentage,
            )
        )
    return BatchResponse(
        id=batch.id,
        strain_id=batch.strain_id,
        strain_name=batch.strain.name if batch.strain else None,
        grower_id=batch.grower_id,
        grower_name=batch.grower.name if batch.grower else None,
        batch_number=batch.batch_number,
        thc_percentage=batch.thc_percentage,
        cbd_percentage=batch.cbd_percentage,
        tested_date=batch.tested_date,
        lab_report_url=batch.lab_report_url,
        dispensing_pharmacy_id=batch.dispensing_pharmacy_id,
        approved=batch.approved,
        created_at=batch.created_at,
        terpene_profiles=terpenes,
    )


@router.get("/", response_model=list[BatchResponse])
async def list_batches(
    strain_id: int | None = None,
    grower_id: int | None = None,
    approved: bool | None = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
    )
    if strain_id:
        query = query.where(Batch.strain_id == strain_id)
    if grower_id:
        query = query.where(Batch.grower_id == grower_id)
    if approved is not None:
        query = query.where(Batch.approved == approved)
    query = query.offset(skip).limit(limit).order_by(Batch.created_at.desc())
    result = await db.execute(query)
    return [_batch_to_response(b) for b in result.scalars().unique().all()]


@router.post("/", response_model=BatchResponse, status_code=201)
async def create_batch(
    data: BatchCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    batch = Batch(
        strain_id=data.strain_id,
        grower_id=data.grower_id,
        batch_number=data.batch_number,
        thc_percentage=data.thc_percentage,
        cbd_percentage=data.cbd_percentage,
        tested_date=data.tested_date,
        lab_report_url=data.lab_report_url,
        dispensing_pharmacy_id=data.dispensing_pharmacy_id,
    )
    db.add(batch)
    await db.flush()

    # Add terpene profiles
    for tp in data.terpene_profiles:
        bt = BatchTerpene(
            batch_id=batch.id,
            terpene_id=tp.terpene_id,
            percentage=tp.percentage,
        )
        db.add(bt)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
        .where(Batch.id == batch.id)
    )
    batch = result.scalar_one()
    return _batch_to_response(batch)


@router.get("/cards", response_model=list[BatchCardResponse])
async def list_batch_cards(
    strain_type: str | None = None,
    effect: str | None = None,
    condition: str | None = None,
    grower_id: int | None = None,
    sort: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Return card data for batches, with filtering and sorting. One batch per strain."""
    from app.models import ConditionRating, Strain

    # Get one batch per strain (the most recent approved one)
    from sqlalchemy import distinct

    # Subquery: latest approved batch per strain
    latest_batch = (
        select(
            Batch.strain_id,
            func.max(Batch.id).label("batch_id"),
        )
        .where(Batch.approved.is_(True))
        .group_by(Batch.strain_id)
        .subquery()
    )

    stmt = (
        select(Batch.id)
        .join(latest_batch, Batch.id == latest_batch.c.batch_id)
        .join(Strain, Strain.id == Batch.strain_id)
        .where(Strain.approved.is_(True))
    )

    if strain_type:
        stmt = stmt.where(Strain.strain_type == strain_type)
    if grower_id:
        stmt = stmt.where(Batch.grower_id == grower_id)
    if effect:
        stmt = stmt.where(
            Batch.id.in_(
                select(Review.batch_id)
                .where(Review.status == ReviewStatus.APPROVED.value, Review.effects.ilike(f"%{effect}%"))
                .distinct()
            )
        )
    if condition:
        stmt = stmt.where(
            Batch.id.in_(
                select(Review.batch_id)
                .join(ConditionRating, ConditionRating.review_id == Review.id)
                .where(Review.status == ReviewStatus.APPROVED.value, ConditionRating.condition_name.ilike(condition))
                .distinct()
            )
        )

    # Sorting
    if sort in ("top-rated", "top-rated-week"):
        from datetime import datetime, timedelta
        review_filter = [Review.status == ReviewStatus.APPROVED.value]
        if sort == "top-rated-week":
            review_filter.append(Review.created_at >= datetime.utcnow() - timedelta(days=7))
        avg_sub = (
            select(Review.batch_id, func.avg(
                (Review.appearance_rating + Review.aroma_rating + Review.moisture_rating
                 + Review.flavour_rating + Review.effect_rating) / 5.0
            ).label("avg_r"))
            .where(*review_filter)
            .group_by(Review.batch_id)
            .subquery()
        )
        stmt = stmt.outerjoin(avg_sub, Batch.id == avg_sub.c.batch_id).order_by(avg_sub.c.avg_r.desc().nullslast())
    elif sort == "most-reviewed":
        count_sub = (
            select(Review.batch_id, func.count(Review.id).label("cnt"))
            .where(Review.status == ReviewStatus.APPROVED.value)
            .group_by(Review.batch_id)
            .subquery()
        )
        stmt = stmt.outerjoin(count_sub, Batch.id == count_sub.c.batch_id).order_by(count_sub.c.cnt.desc().nullslast())
    elif sort == "newest":
        stmt = stmt.order_by(Batch.created_at.desc())
    else:
        stmt = stmt.order_by(Strain.name)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    batch_ids = [row[0] for row in result.all()]

    cards = []
    for bid in batch_ids:
        card = await get_batch_card(bid, db)
        cards.append(card)
    return cards


@router.get("/top-rated", response_model=list[BatchCardResponse])
async def top_rated_batches(
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Return batches ranked by average review rating, with full card data."""
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

    stmt = (
        select(Batch.id)
        .join(Review, Review.batch_id == Batch.id)
        .where(Batch.approved.is_(True), Review.status == ReviewStatus.APPROVED.value)
        .group_by(Batch.id)
        .order_by(avg_rating.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    batch_ids = [row[0] for row in result.all()]

    if not batch_ids:
        fallback = await db.execute(
            select(Batch.id).where(Batch.approved.is_(True)).limit(limit)
        )
        batch_ids = [row[0] for row in fallback.all()]

    cards = []
    for bid in batch_ids:
        card = await get_batch_card(bid, db)
        cards.append(card)
    return cards


@router.get("/{batch_id}", response_model=BatchResponse)
async def get_batch(batch_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
        .where(Batch.id == batch_id)
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return _batch_to_response(batch)


@router.patch("/{batch_id}", response_model=BatchResponse)
async def update_batch(
    batch_id: int,
    data: BatchUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)
    await db.flush()

    result = await db.execute(
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
        .where(Batch.id == batch_id)
    )
    batch = result.scalar_one()
    return _batch_to_response(batch)


@router.post("/{batch_id}/approve", response_model=BatchResponse)
async def approve_batch(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.approved = True
    await db.flush()

    result = await db.execute(
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
        .where(Batch.id == batch_id)
    )
    batch = result.scalar_one()
    return _batch_to_response(batch)


@router.get("/{batch_id}/card", response_model=BatchCardResponse)
async def get_batch_card(batch_id: int, db: AsyncSession = Depends(get_db)):
    """Top Trumps card data — all stats formatted for card UI."""
    result = await db.execute(
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
        .where(Batch.id == batch_id)
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Aggregate review stats
    stats = await db.execute(
        select(
            func.avg(Review.appearance_rating),
            func.avg(Review.aroma_rating),
            func.avg(Review.moisture_rating),
            func.avg(Review.flavour_rating),
            func.avg(Review.effect_rating),
            func.count(Review.id),
        ).where(
            Review.batch_id == batch_id,
            Review.status == ReviewStatus.APPROVED.value,
        )
    )
    row = stats.one()
    avg_appearance, avg_aroma, avg_moisture, avg_flavour, avg_effect, review_count = row

    # Top 3 terpenes by percentage
    top_terpenes = sorted(
        batch.terpene_profiles, key=lambda t: t.percentage, reverse=True
    )[:3]

    # Top condition (most frequently reported)
    top_condition_result = await db.execute(
        select(ConditionRating.condition_name, func.count(ConditionRating.id).label("cnt"))
        .join(Review, Review.id == ConditionRating.review_id)
        .where(Review.batch_id == batch_id, Review.status == ReviewStatus.APPROVED.value)
        .group_by(ConditionRating.condition_name)
        .order_by(func.count(ConditionRating.id).desc())
        .limit(1)
    )
    top_condition_row = top_condition_result.first()
    top_condition = top_condition_row[0] if top_condition_row else None

    # First review photo as strain image
    photo_result = await db.execute(
        select(Review.photo_product_url)
        .where(
            Review.batch_id == batch_id,
            Review.status == ReviewStatus.APPROVED.value,
            Review.photo_product_url.isnot(None),
        )
        .limit(1)
    )
    photo_row = photo_result.first()
    strain_image_url = photo_row[0] if photo_row else None

    # Derive effect/flavour labels from ratings (1-5 scale)
    effect_labels = {5: "Euphoric", 4: "Relaxed", 3: "Mellow", 2: "Mild", 1: "Subtle"}
    flavour_labels = {5: "Gassy", 4: "Sweet", 3: "Earthy", 2: "Citrus", 1: "Herbal"}
    top_effect = effect_labels.get(round(avg_effect) if avg_effect else 0) if avg_effect else None
    top_flavour_label = flavour_labels.get(round(avg_flavour) if avg_flavour else 0) if avg_flavour else None

    card_response = BatchCardResponse(
        id=batch.id,
        strain_id=batch.strain.id if batch.strain else None,
        strain_name=batch.strain.name if batch.strain else "",
        strain_aliases=batch.strain.aliases if batch.strain else None,
        strain_type=batch.strain.strain_type if batch.strain else "",
        grower_id=batch.grower.id if batch.grower else None,
        grower_name=batch.grower.name if batch.grower else "",
        batch_number=batch.batch_number,
        thc_percentage=batch.thc_percentage,
        cbd_percentage=batch.cbd_percentage,
        top_terpenes=[
            BatchTerpeneResponse(
                terpene_id=t.terpene_id,
                terpene_name=t.terpene.name if t.terpene else "",
                percentage=t.percentage,
            )
            for t in top_terpenes
        ],
        avg_appearance_rating=round(avg_appearance, 1) if avg_appearance else None,
        avg_aroma_rating=round(avg_aroma, 1) if avg_aroma else None,
        avg_moisture_rating=round(avg_moisture, 1) if avg_moisture else None,
        avg_flavour_rating=round(avg_flavour, 1) if avg_flavour else None,
        avg_effect_rating=round(avg_effect, 1) if avg_effect else None,
        review_count=review_count,
        top_condition=top_condition,
        top_effect=top_effect,
        top_flavour_label=top_flavour_label,
        strain_image_url=strain_image_url,
        strain_description=batch.strain.description if batch.strain else None,
    )

    # Compute rank for this batch among all approved batches
    avg_all = func.avg(
        (
            Review.appearance_rating
            + Review.aroma_rating
            + Review.moisture_rating
            + Review.flavour_rating
            + Review.effect_rating
        )
        / 5.0
    ).label("avg_rating")

    ranked_stmt = (
        select(Batch.id)
        .join(Review, Review.batch_id == Batch.id)
        .where(Batch.approved.is_(True), Review.status == ReviewStatus.APPROVED.value)
        .group_by(Batch.id)
        .order_by(avg_all.desc())
    )
    ranked_result = await db.execute(ranked_stmt)
    ranked_ids = [row[0] for row in ranked_result.all()]
    rank = (ranked_ids.index(batch_id) + 1) if batch_id in ranked_ids else None

    # Compute 30-day rolling rank
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    recent_avg = func.avg(
        (
            Review.appearance_rating
            + Review.aroma_rating
            + Review.moisture_rating
            + Review.flavour_rating
            + Review.effect_rating
        )
        / 5.0
    ).label("recent_avg")

    recent_ranked_stmt = (
        select(Batch.id)
        .join(Review, Review.batch_id == Batch.id)
        .where(
            Batch.approved.is_(True),
            Review.status == ReviewStatus.APPROVED.value,
            Review.created_at >= thirty_days_ago,
        )
        .group_by(Batch.id)
        .order_by(recent_avg.desc())
    )
    recent_result = await db.execute(recent_ranked_stmt)
    recent_ids = [row[0] for row in recent_result.all()]
    recent_rank = (recent_ids.index(batch_id) + 1) if batch_id in recent_ids else None

    # Compute per-category ranks
    top_condition_rank = None
    top_effect_rank = None
    top_flavour_rank = None

    # Condition rank: among all batches with reviews for this condition,
    # rank by average efficacy rating for that condition
    if top_condition:
        cond_rank_stmt = (
            select(Review.batch_id)
            .join(ConditionRating, ConditionRating.review_id == Review.id)
            .join(Batch, Batch.id == Review.batch_id)
            .where(
                Review.status == ReviewStatus.APPROVED.value,
                Batch.approved.is_(True),
                ConditionRating.condition_name == top_condition,
            )
            .group_by(Review.batch_id)
            .order_by(func.avg(ConditionRating.efficacy_rating).desc())
        )
        cond_result = await db.execute(cond_rank_stmt)
        cond_ids = [row[0] for row in cond_result.all()]
        top_condition_rank = (cond_ids.index(batch_id) + 1) if batch_id in cond_ids else None

    # Effect rank: among all batches with this effect label, rank by avg effect rating
    if top_effect:
        effect_rank_stmt = (
            select(Batch.id)
            .join(Review, Review.batch_id == Batch.id)
            .where(
                Review.status == ReviewStatus.APPROVED.value,
                Batch.approved.is_(True),
            )
            .group_by(Batch.id)
            .having(func.round(func.avg(Review.effect_rating)) == round(avg_effect))
            .order_by(func.avg(Review.effect_rating).desc())
        )
        effect_result = await db.execute(effect_rank_stmt)
        effect_ids = [row[0] for row in effect_result.all()]
        top_effect_rank = (effect_ids.index(batch_id) + 1) if batch_id in effect_ids else None

    # Flavour rank: among all batches with this flavour label, rank by avg flavour rating
    if top_flavour_label:
        flav_rank_stmt = (
            select(Batch.id)
            .join(Review, Review.batch_id == Batch.id)
            .where(
                Review.status == ReviewStatus.APPROVED.value,
                Batch.approved.is_(True),
            )
            .group_by(Batch.id)
            .having(func.round(func.avg(Review.flavour_rating)) == round(avg_flavour))
            .order_by(func.avg(Review.flavour_rating).desc())
        )
        flav_result = await db.execute(flav_rank_stmt)
        flav_ids = [row[0] for row in flav_result.all()]
        top_flavour_rank = (flav_ids.index(batch_id) + 1) if batch_id in flav_ids else None

    card_dict = card_response.model_dump()
    card_dict["rank"] = rank
    card_dict["recent_rank"] = recent_rank
    card_dict["top_condition_rank"] = top_condition_rank
    card_dict["top_effect_rank"] = top_effect_rank
    card_dict["top_flavour_rank"] = top_flavour_rank
    return BatchCardResponse(**card_dict)
