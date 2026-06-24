from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Clinic
from app.schemas.clinics import ClinicResponse

router = APIRouter(prefix="/clinics", tags=["clinics"])


@router.get("/", response_model=list[ClinicResponse])
async def list_clinics(
    sort: str | None = None,
    location: str | None = None,
    verified: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Clinic)

    if location:
        query = query.where(Clinic.location.ilike(f"%{location}%"))
    if verified is not None:
        query = query.where(Clinic.verified.is_(verified))

    if sort == "newest":
        query = query.order_by(Clinic.created_at.desc())
    elif sort == "cheapest":
        query = query.order_by(Clinic.consultation_fee_gbp.asc().nullslast())
    else:
        query = query.order_by(Clinic.name)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return [ClinicResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/{clinic_id}", response_model=ClinicResponse)
async def get_clinic(clinic_id: int, db: AsyncSession = Depends(get_db)):
    clinic = await db.get(Clinic, clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return ClinicResponse.model_validate(clinic)
