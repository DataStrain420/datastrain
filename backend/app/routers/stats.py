from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Review, ReviewStatus, Strain

router = APIRouter(prefix="/stats", tags=["stats"])


class PublicStats(BaseModel):
    total_strains: int
    total_reviews: int


@router.get("/public", response_model=PublicStats)
async def public_stats(db: AsyncSession = Depends(get_db)):
    """Lightweight aggregates for the home page trust strip. Approved-only —
    unapproved patient submissions must not inflate the public count."""
    strain_count = await db.scalar(
        select(func.count(Strain.id)).where(Strain.approved.is_(True))
    ) or 0
    review_count = await db.scalar(
        select(func.count(Review.id)).where(Review.status == ReviewStatus.APPROVED.value)
    ) or 0
    return PublicStats(total_strains=strain_count, total_reviews=review_count)
