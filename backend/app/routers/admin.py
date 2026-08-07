from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_admin
from app.database import get_db
from app.models import (
    Batch,
    BatchTerpene,
    Grower,
    Review,
    ReviewStatus,
    Strain,
    Terpene,
    User,
)
from app.schemas.batches import BatchResponse
from app.schemas.growers import GrowerCreate, GrowerResponse
from app.schemas.reviews import ReviewResponse
from app.routers.reviews import _review_to_response
from app.schemas.strains import StrainResponse
from app.schemas.terpenes import BatchTerpeneResponse, TerpeneCreate, TerpeneResponse

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Moderation Queues ────────────────────────────────────────────────────────


@router.get("/queue/reviews", response_model=list[ReviewResponse])
async def pending_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    # _review_to_response reads review.batch.grower.name — with async
    # SQLAlchemy, any relationship not eager-loaded here would trigger an
    # implicit lazy load and raise, which historically 500'd the endpoint
    # and made the moderation queue appear empty.
    result = await db.execute(
        select(Review)
        .options(
            selectinload(Review.user),
            selectinload(Review.batch).selectinload(Batch.strain),
            selectinload(Review.batch).selectinload(Batch.grower),
            selectinload(Review.condition_ratings),
        )
        .where(Review.status == ReviewStatus.PENDING.value)
        .order_by(Review.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    reviews = result.scalars().unique().all()
    return [_review_to_response(r) for r in reviews]


@router.get("/queue/strains", response_model=list[StrainResponse])
async def pending_strains(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    result = await db.execute(
        select(Strain)
        .options(selectinload(Strain.grower))
        .where(Strain.approved == False)
        .order_by(Strain.created_at.asc())
    )
    strains = result.scalars().all()
    return [
        StrainResponse(
            id=s.id,
            name=s.name,
            strain_type=s.strain_type,
            description=s.description,
            grower_id=s.grower_id,
            grower_name=s.grower.name if s.grower else None,
            submitted_by_id=s.submitted_by_id,
            approved=s.approved,
            approved_at=s.approved_at,
            created_at=s.created_at,
        )
        for s in strains
    ]


@router.get("/queue/batches", response_model=list[BatchResponse])
async def pending_batches(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    result = await db.execute(
        select(Batch)
        .options(
            selectinload(Batch.strain),
            selectinload(Batch.grower),
            selectinload(Batch.terpene_profiles).selectinload(BatchTerpene.terpene),
        )
        .where(Batch.approved == False)
        .order_by(Batch.created_at.asc())
    )
    batches = result.scalars().unique().all()
    return [
        BatchResponse(
            id=b.id,
            strain_id=b.strain_id,
            strain_name=b.strain.name if b.strain else None,
            grower_id=b.grower_id,
            grower_name=b.grower.name if b.grower else None,
            batch_number=b.batch_number,
            thc_percentage=b.thc_percentage,
            cbd_percentage=b.cbd_percentage,
            tested_date=b.tested_date,
            lab_report_url=b.lab_report_url,
            irradiated=b.irradiated,
            dispensing_pharmacy_id=b.dispensing_pharmacy_id,
            approved=b.approved,
            created_at=b.created_at,
            terpene_profiles=[
                BatchTerpeneResponse(
                    terpene_id=bt.terpene_id,
                    terpene_name=bt.terpene.name if bt.terpene else "",
                    percentage=bt.percentage,
                )
                for bt in b.terpene_profiles
            ],
        )
        for b in batches
    ]


# ─── Grower Management ───────────────────────────────────────────────────────


@router.get("/growers", response_model=list[GrowerResponse])
async def list_growers(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Grower).order_by(Grower.name))
    return [GrowerResponse.model_validate(g) for g in result.scalars().all()]


@router.post("/growers", response_model=GrowerResponse, status_code=201)
async def create_grower(
    data: GrowerCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    grower = Grower(
        name=data.name,
        country_of_origin=data.country_of_origin,
        website=data.website,
        logo_url=data.logo_url,
        phone_number=data.phone_number,
        address_street=data.address_street,
        address_city=data.address_city,
        address_postcode=data.address_postcode,
        address_country=data.address_country,
        verified=data.verified,
    )
    db.add(grower)
    await db.flush()
    await db.refresh(grower)
    return GrowerResponse.model_validate(grower)


# ─── Terpene Management ──────────────────────────────────────────────────────


@router.get("/terpenes", response_model=list[TerpeneResponse])
async def list_terpenes(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    result = await db.execute(select(Terpene).order_by(Terpene.name))
    return [TerpeneResponse.model_validate(t) for t in result.scalars().all()]


@router.post("/terpenes", response_model=TerpeneResponse, status_code=201)
async def create_terpene(
    data: TerpeneCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    terpene = Terpene(
        name=data.name,
        description=data.description,
        aroma_notes=data.aroma_notes,
    )
    db.add(terpene)
    await db.flush()
    await db.refresh(terpene)
    return TerpeneResponse.model_validate(terpene)


# ─── Analytics ────────────────────────────────────────────────────────────────


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    review_count = (await db.execute(select(func.count(Review.id)))).scalar() or 0
    pending_count = (
        await db.execute(
            select(func.count(Review.id)).where(
                Review.status == ReviewStatus.PENDING.value
            )
        )
    ).scalar() or 0
    strain_count = (await db.execute(select(func.count(Strain.id)))).scalar() or 0
    batch_count = (await db.execute(select(func.count(Batch.id)))).scalar() or 0

    return {
        "total_users": user_count,
        "total_reviews": review_count,
        "pending_reviews": pending_count,
        "total_strains": strain_count,
        "total_batches": batch_count,
    }
