from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin
from app.database import get_db
from app.models import Pharmacy
from app.schemas.pharmacies import PharmacyCreate, PharmacyResponse

router = APIRouter(prefix="/pharmacies", tags=["pharmacies"])


@router.get("/", response_model=list[PharmacyResponse])
async def list_pharmacies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Pharmacy).offset(skip).limit(limit).order_by(Pharmacy.name)
    )
    return [PharmacyResponse.model_validate(p) for p in result.scalars().all()]


@router.post("/", response_model=PharmacyResponse, status_code=201)
async def create_pharmacy(
    data: PharmacyCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    pharmacy = Pharmacy(
        name=data.name,
        location=data.location,
        api_endpoint=data.api_endpoint,
        is_active=data.is_active,
    )
    db.add(pharmacy)
    await db.flush()
    await db.refresh(pharmacy)
    return PharmacyResponse.model_validate(pharmacy)
