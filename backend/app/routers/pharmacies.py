from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin
from app.database import get_db
from app.models import Pharmacy
from app.schemas.pharmacies import PharmacyCreate, PharmacyResponse

router = APIRouter(prefix="/pharmacies", tags=["pharmacies"])


@router.get("/", response_model=list[PharmacyResponse])
async def list_pharmacies(
    sort: str | None = None,
    location: str | None = None,
    verified: bool | None = None,
    is_active: bool | None = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Pharmacy)

    if location:
        query = query.where(Pharmacy.location.ilike(f"%{location}%"))
    if verified is not None:
        query = query.where(Pharmacy.verified.is_(verified))
    if is_active is not None:
        query = query.where(Pharmacy.is_active.is_(is_active))

    if sort == "newest":
        query = query.order_by(Pharmacy.created_at.desc())
    else:
        query = query.order_by(Pharmacy.name)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return [PharmacyResponse.model_validate(p) for p in result.scalars().all()]


@router.get("/{pharmacy_id}", response_model=PharmacyResponse)
async def get_pharmacy(pharmacy_id: int, db: AsyncSession = Depends(get_db)):
    pharmacy = await db.get(Pharmacy, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return PharmacyResponse.model_validate(pharmacy)


@router.post("/", response_model=PharmacyResponse, status_code=201)
async def create_pharmacy(
    data: PharmacyCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    pharmacy = Pharmacy(
        name=data.name,
        location=data.location,
        website=data.website,
        logo_url=data.logo_url,
        description=data.description,
        verified=data.verified,
        api_endpoint=data.api_endpoint,
        is_active=data.is_active,
    )
    db.add(pharmacy)
    await db.flush()
    await db.refresh(pharmacy)
    return PharmacyResponse.model_validate(pharmacy)
