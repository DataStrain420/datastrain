from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_admin, get_current_user
from app.database import get_db
from app.models import Batch, BatchTerpene, ConditionRating, Review, ReviewStatus, Strain, Terpene, User
from app.schemas.batches import (
    BatchCardResponse,
    BatchCreate,
    BatchResponse,
    BatchSubmit,
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
        irradiated=batch.irradiated,
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
    query = query.offset(skip).limit(limit).order_by(Batch.created_at.desc(), Batch.id.desc())
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


@router.post("/submit", response_model=BatchResponse, status_code=201)
async def submit_batch(
    data: BatchSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patient-facing endpoint. Creates an unapproved batch (and optionally an
    unapproved strain) so a review can be attached to something admins can
    later approve."""
    # Batch number must be unique — reject early with a clear message.
    existing = await db.execute(
        select(Batch).where(func.lower(Batch.batch_number) == data.batch_number.strip().lower())
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=409,
            detail="A batch with that number already exists. Try searching for it instead.",
        )

    strain_id = data.strain_id
    if strain_id is None:
        if not data.new_strain_name or not data.new_strain_type:
            raise HTTPException(
                status_code=422,
                detail="Either strain_id or both new_strain_name and new_strain_type must be provided.",
            )
        strain = Strain(
            name=data.new_strain_name.strip(),
            strain_type=data.new_strain_type,
            grower_id=data.grower_id,
            submitted_by_id=current_user.id,
            approved=False,
        )
        db.add(strain)
        await db.flush()
        strain_id = strain.id

    batch = Batch(
        strain_id=strain_id,
        grower_id=data.grower_id,
        batch_number=data.batch_number.strip(),
        thc_percentage=data.thc_percentage,
        cbd_percentage=data.cbd_percentage,
        tested_date=data.tested_date or date.today(),
        irradiated=data.irradiated,
        approved=False,
    )
    db.add(batch)
    await db.flush()

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
    flavour: str | None = None,
    terpene: str | None = None,
    grower_id: int | None = None,
    pharmacy_id: int | None = None,
    thc_min: float | None = Query(None, ge=0, le=50),
    thc_max: float | None = Query(None, ge=0, le=50),
    irradiated: bool | None = None,
    sort: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Return card data for batches, with filtering and sorting. One batch per strain."""
    from app.models import ConditionRating, Strain

    # Get one batch per strain (the most recent approved one)
    from sqlalchemy import distinct

    # Subquery: latest approved batch per strain. When filtering by pharmacy
    # or THC range, restrict the dedup pool so we don't drop strains whose
    # newest overall batch happens not to match the filter — we want the
    # newest *qualifying* batch instead.
    latest_batch_filter = [Batch.approved.is_(True)]
    if pharmacy_id is not None:
        latest_batch_filter.append(Batch.dispensing_pharmacy_id == pharmacy_id)
    if thc_min is not None:
        latest_batch_filter.append(Batch.thc_percentage >= thc_min)
    if thc_max is not None:
        latest_batch_filter.append(Batch.thc_percentage <= thc_max)
    if irradiated is not None:
        # Strict match — batches with `irradiated IS NULL` (unknown) are
        # excluded so the filter actually narrows the result.
        latest_batch_filter.append(Batch.irradiated.is_(irradiated))
    latest_batch = (
        select(
            Batch.strain_id,
            func.max(Batch.id).label("batch_id"),
        )
        .where(*latest_batch_filter)
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
    if flavour:
        # Flavours are stored as a JSON-serialised list on Review.flavours,
        # so an ilike substring match is the cheapest cross-dialect approach.
        stmt = stmt.where(
            Batch.id.in_(
                select(Review.batch_id)
                .where(Review.status == ReviewStatus.APPROVED.value, Review.flavours.ilike(f"%{flavour}%"))
                .distinct()
            )
        )
    if terpene:
        # Only include batches where the requested terpene is one of the
        # top-3 by percentage — the same three shown on the card. Without
        # this, a batch with the terpene at trace level (e.g. 0.2%) would
        # match the filter but never surface the terpene in its card,
        # which reads to patients as an incorrect result.
        from app.models import BatchTerpene, Terpene
        from sqlalchemy import func as f

        rank_col = f.rank().over(
            partition_by=BatchTerpene.batch_id,
            order_by=BatchTerpene.percentage.desc(),
        ).label("rn")
        ranked = (
            select(BatchTerpene.batch_id, BatchTerpene.terpene_id, rank_col)
            .subquery()
        )
        stmt = stmt.where(
            Batch.id.in_(
                select(ranked.c.batch_id)
                .join(Terpene, Terpene.id == ranked.c.terpene_id)
                .where(Terpene.name == terpene, ranked.c.rn <= 3)
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
        # Tiebreaker on Batch.id so ties resolve identically to the rank
        # query in _RankContext; without this the listing and the card's
        # displayed rank can drift apart when two batches share an average.
        stmt = stmt.outerjoin(avg_sub, Batch.id == avg_sub.c.batch_id).order_by(avg_sub.c.avg_r.desc().nullslast(), Batch.id.asc())
    elif sort == "most-reviewed":
        count_sub = (
            select(Review.batch_id, func.count(Review.id).label("cnt"))
            .where(Review.status == ReviewStatus.APPROVED.value)
            .group_by(Review.batch_id)
            .subquery()
        )
        stmt = stmt.outerjoin(count_sub, Batch.id == count_sub.c.batch_id).order_by(count_sub.c.cnt.desc().nullslast())
    elif sort == "newest":
        # id.desc() as tiebreaker: bulk-seeded batches share created_at
        # to the second, so without it Postgres falls back to id-ascending
        # and 'newest' reads as 'oldest'.
        stmt = stmt.order_by(Batch.created_at.desc(), Batch.id.desc())
    elif sort == "thc-high":
        stmt = stmt.order_by(Batch.thc_percentage.desc().nullslast())
    elif sort == "thc-low":
        stmt = stmt.order_by(Batch.thc_percentage.asc().nullslast())
    else:
        stmt = stmt.order_by(Strain.name)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    batch_ids = [row[0] for row in result.all()]
    return await _build_cards(batch_ids, db)


def _avg_rating_expr():
    """Average of the five 1–5 review sub-ratings, normalised to a single score."""
    return func.avg(
        (
            Review.appearance_rating
            + Review.aroma_rating
            + Review.moisture_rating
            + Review.flavour_rating
            + Review.effect_rating
        )
        / 5.0
    )


class _RankContext:
    """Caches catalogue-wide ranking lists for the lifetime of a single request.

    Building N cards at once (e.g. the top-rated endpoint) would otherwise
    recompute the same global rankings once per card — the dominant cost of
    those endpoints. Each ranking is computed once here and shared; a card's
    rank is just its position in the cached, ordered list.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self._cache: dict = {}

    async def _position(self, key, stmt, batch_id):
        ids = self._cache.get(key)
        if ids is None:
            result = await self.db.execute(stmt)
            ids = [row[0] for row in result.all()]
            self._cache[key] = ids
        return (ids.index(batch_id) + 1) if batch_id in ids else None

    async def overall_rank(self, batch_id):
        # Rank over the *latest* approved batch per strain, matching the
        # dedup the cards listing uses. Without this, the card's rank can
        # disagree with its position in a top-rated list (e.g. card listed
        # #1 displaying "rank 30" because earlier batches of the same
        # strain dominate the all-batches ranking).
        latest_batch = (
            select(Batch.strain_id, func.max(Batch.id).label("batch_id"))
            .where(Batch.approved.is_(True))
            .group_by(Batch.strain_id)
            .subquery()
        )
        stmt = (
            select(Batch.id)
            .join(latest_batch, Batch.id == latest_batch.c.batch_id)
            .join(Review, Review.batch_id == Batch.id)
            .where(Batch.approved.is_(True), Review.status == ReviewStatus.APPROVED.value)
            .group_by(Batch.id)
            .order_by(_avg_rating_expr().desc(), Batch.id.asc())
        )
        return await self._position("overall", stmt, batch_id)

    async def recent_rank(self, batch_id):
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        latest_batch = (
            select(Batch.strain_id, func.max(Batch.id).label("batch_id"))
            .where(Batch.approved.is_(True))
            .group_by(Batch.strain_id)
            .subquery()
        )
        stmt = (
            select(Batch.id)
            .join(latest_batch, Batch.id == latest_batch.c.batch_id)
            .join(Review, Review.batch_id == Batch.id)
            .where(
                Batch.approved.is_(True),
                Review.status == ReviewStatus.APPROVED.value,
                Review.created_at >= thirty_days_ago,
            )
            .group_by(Batch.id)
            .order_by(_avg_rating_expr().desc(), Batch.id.asc())
        )
        return await self._position("recent", stmt, batch_id)

    async def condition_rank(self, batch_id, condition):
        stmt = (
            select(Review.batch_id)
            .join(ConditionRating, ConditionRating.review_id == Review.id)
            .join(Batch, Batch.id == Review.batch_id)
            .where(
                Review.status == ReviewStatus.APPROVED.value,
                Batch.approved.is_(True),
                ConditionRating.condition_name == condition,
            )
            .group_by(Review.batch_id)
            .order_by(func.avg(ConditionRating.efficacy_rating).desc())
        )
        return await self._position(("condition", condition), stmt, batch_id)

    async def effect_rank(self, batch_id, rounded_effect):
        stmt = (
            select(Batch.id)
            .join(Review, Review.batch_id == Batch.id)
            .where(Review.status == ReviewStatus.APPROVED.value, Batch.approved.is_(True))
            .group_by(Batch.id)
            .having(func.round(func.avg(Review.effect_rating)) == rounded_effect)
            .order_by(func.avg(Review.effect_rating).desc())
        )
        return await self._position(("effect", rounded_effect), stmt, batch_id)

    async def flavour_rank(self, batch_id, rounded_flavour):
        stmt = (
            select(Batch.id)
            .join(Review, Review.batch_id == Batch.id)
            .where(Review.status == ReviewStatus.APPROVED.value, Batch.approved.is_(True))
            .group_by(Batch.id)
            .having(func.round(func.avg(Review.flavour_rating)) == rounded_flavour)
            .order_by(func.avg(Review.flavour_rating).desc())
        )
        return await self._position(("flavour", rounded_flavour), stmt, batch_id)


@router.get("/top-rated", response_model=list[BatchCardResponse])
async def top_rated_batches(
    limit: int = Query(6, ge=1, le=20),
    days: int | None = Query(None, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Return batches ranked by average review rating.

    Pass `days=30` to restrict the ranking to reviews from the last 30
    days — powers the "top batches this month" home-page section without
    letting old, stale reviews dominate the list.
    """
    review_filter = [Review.status == ReviewStatus.APPROVED.value]
    if days is not None:
        review_filter.append(Review.created_at >= datetime.utcnow() - timedelta(days=days))

    # Dedupe to the latest approved batch per strain — one card per grower's
    # take on a strain, ranked by the current batch's rating. Without this,
    # a strain with two batches showed up twice in the feed and the older
    # batch confusingly displayed without a rank.
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
        .join(Review, Review.batch_id == Batch.id)
        .where(Batch.approved.is_(True), *review_filter)
        .group_by(Batch.id)
        .order_by(_avg_rating_expr().desc(), Batch.id.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    batch_ids = [row[0] for row in result.all()]

    if not batch_ids:
        fallback = await db.execute(
            select(Batch.id).where(Batch.approved.is_(True)).limit(limit)
        )
        batch_ids = [row[0] for row in fallback.all()]

    return await _build_cards(batch_ids, db)


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
    cards = await _build_cards([batch_id], db)
    if not cards:
        raise HTTPException(status_code=404, detail="Batch not found")
    return cards[0]


# Effect/flavour labels derived from the rounded 1–5 average rating.
_EFFECT_LABELS = {5: "Euphoric", 4: "Relaxed", 3: "Mellow", 2: "Mild", 1: "Subtle"}
_FLAVOUR_LABELS = {5: "Gassy", 4: "Sweet", 3: "Earthy", 2: "Citrus", 1: "Herbal"}


async def _build_cards(batch_ids: list[int], db: AsyncSession) -> list[BatchCardResponse]:
    """Build Top Trumps cards for many batches with a small, fixed number of
    queries. All per-card data (relations, review stats, top condition, photo)
    is loaded in bulk rather than once per card, and catalogue-wide rankings
    are computed once via a shared cache. Cards keep the order of `batch_ids`.
    """
    if not batch_ids:
        return []

    # Batches + relations (one bulk load, not one per card)
    batch_result = await db.execute(
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
        .where(Batch.id.in_(batch_ids))
    )
    batches = {b.id: b for b in batch_result.scalars().unique().all()}

    # Review stats per batch (one grouped query)
    stats_result = await db.execute(
        select(
            Review.batch_id,
            func.avg(Review.appearance_rating),
            func.avg(Review.aroma_rating),
            func.avg(Review.moisture_rating),
            func.avg(Review.flavour_rating),
            func.avg(Review.effect_rating),
            func.count(Review.id),
        )
        .where(
            Review.batch_id.in_(batch_ids),
            Review.status == ReviewStatus.APPROVED.value,
        )
        .group_by(Review.batch_id)
    )
    stats = {row[0]: tuple(row[1:]) for row in stats_result.all()}

    # Most-reported condition per batch (one grouped query): tally per
    # (batch, condition) and keep the highest-count condition for each batch.
    cond_result = await db.execute(
        select(
            Review.batch_id,
            ConditionRating.condition_name,
            func.count(ConditionRating.id),
        )
        .join(ConditionRating, ConditionRating.review_id == Review.id)
        .where(
            Review.batch_id.in_(batch_ids),
            Review.status == ReviewStatus.APPROVED.value,
        )
        .group_by(Review.batch_id, ConditionRating.condition_name)
    )
    top_condition: dict[int, str] = {}
    best_cond_count: dict[int, int] = {}
    for bid, name, cnt in cond_result.all():
        if cnt > best_cond_count.get(bid, -1):
            best_cond_count[bid] = cnt
            top_condition[bid] = name

    # First approved review photo per batch (one query, earliest review wins)
    photo_result = await db.execute(
        select(Review.batch_id, Review.photo_product_url)
        .where(
            Review.batch_id.in_(batch_ids),
            Review.status == ReviewStatus.APPROVED.value,
            Review.photo_product_url.isnot(None),
        )
        .order_by(Review.id)
    )
    photos: dict[int, str] = {}
    for bid, url in photo_result.all():
        photos.setdefault(bid, url)

    # Previous sibling batch per current batch — same strain + grower with
    # a lower id. Two bulk queries: one to discover the prev batch id, one
    # to fetch its number and review stats.
    from sqlalchemy.orm import aliased

    Prev = aliased(Batch)
    prev_lookup_stmt = (
        select(Batch.id, func.max(Prev.id))
        .join(
            Prev,
            (Prev.strain_id == Batch.strain_id)
            & (Prev.grower_id == Batch.grower_id)
            & (Prev.id < Batch.id)
            & (Prev.approved.is_(True)),
        )
        .where(Batch.id.in_(batch_ids))
        .group_by(Batch.id)
    )
    prev_lookup = dict((row[0], row[1]) for row in (await db.execute(prev_lookup_stmt)).all())

    prev_stats: dict[int, tuple[str, float | None, int]] = {}
    prev_ids = list({v for v in prev_lookup.values() if v is not None})
    if prev_ids:
        prev_rating_expr = _avg_rating_expr()
        prev_stats_stmt = (
            select(
                Batch.id,
                Batch.batch_number,
                prev_rating_expr,
                func.count(Review.id),
            )
            .outerjoin(
                Review,
                (Review.batch_id == Batch.id)
                & (Review.status == ReviewStatus.APPROVED.value),
            )
            .where(Batch.id.in_(prev_ids))
            .group_by(Batch.id, Batch.batch_number)
        )
        for pid, pnum, pavg, pcount in (await db.execute(prev_stats_stmt)).all():
            prev_stats[pid] = (pnum, float(pavg) if pavg is not None else None, int(pcount or 0))

    ctx = _RankContext(db)
    cards: list[BatchCardResponse] = []
    for bid in batch_ids:
        batch = batches.get(bid)
        if not batch:
            continue

        avg_appearance, avg_aroma, avg_moisture, avg_flavour, avg_effect, review_count = (
            stats.get(bid, (None, None, None, None, None, 0))
        )
        cond = top_condition.get(bid)
        top_effect = _EFFECT_LABELS.get(round(avg_effect)) if avg_effect else None
        top_flavour_label = _FLAVOUR_LABELS.get(round(avg_flavour)) if avg_flavour else None

        top_terpenes = sorted(
            batch.terpene_profiles, key=lambda t: t.percentage, reverse=True
        )[:3]

        card = BatchCardResponse(
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
            tested_date=batch.tested_date,
            irradiated=batch.irradiated,
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
            top_condition=cond,
            top_effect=top_effect,
            top_flavour_label=top_flavour_label,
            strain_image_url=photos.get(bid),
            strain_description=batch.strain.description if batch.strain else None,
            previous_batch_id=prev_lookup.get(bid),
            previous_batch_number=(prev_stats.get(prev_lookup.get(bid)) or (None, None, 0))[0],
            previous_avg_rating=(
                round(prev_stats[prev_lookup[bid]][1], 1)
                if prev_lookup.get(bid) and prev_stats.get(prev_lookup[bid]) and prev_stats[prev_lookup[bid]][1] is not None
                else None
            ),
            previous_review_count=(
                prev_stats[prev_lookup[bid]][2]
                if prev_lookup.get(bid) and prev_stats.get(prev_lookup[bid])
                else None
            ),
        )

        card_dict = card.model_dump()
        card_dict["rank"] = await ctx.overall_rank(bid)
        card_dict["recent_rank"] = await ctx.recent_rank(bid)
        card_dict["top_condition_rank"] = (
            await ctx.condition_rank(bid, cond) if cond else None
        )
        card_dict["top_effect_rank"] = (
            await ctx.effect_rank(bid, round(avg_effect)) if top_effect else None
        )
        card_dict["top_flavour_rank"] = (
            await ctx.flavour_rank(bid, round(avg_flavour)) if top_flavour_label else None
        )
        cards.append(BatchCardResponse(**card_dict))

    return cards
