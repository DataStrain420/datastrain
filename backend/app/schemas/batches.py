from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.terpenes import BatchTerpeneCreate, BatchTerpeneResponse


class BatchCreate(BaseModel):
    strain_id: int
    grower_id: int
    batch_number: str = Field(max_length=50)
    thc_percentage: float = Field(ge=0, le=100)
    cbd_percentage: float = Field(ge=0, le=100)
    tested_date: date
    lab_report_url: str | None = None
    irradiated: bool | None = None
    dispensing_pharmacy_id: int | None = None
    terpene_profiles: list[BatchTerpeneCreate] = []


class BatchUpdate(BaseModel):
    thc_percentage: float | None = None
    cbd_percentage: float | None = None
    lab_report_url: str | None = None
    irradiated: bool | None = None
    dispensing_pharmacy_id: int | None = None


class BatchResponse(BaseModel):
    id: int
    strain_id: int
    strain_name: str | None = None
    grower_id: int
    grower_name: str | None = None
    batch_number: str
    thc_percentage: float
    cbd_percentage: float
    tested_date: date
    lab_report_url: str | None
    irradiated: bool | None
    dispensing_pharmacy_id: int | None
    approved: bool
    created_at: datetime
    terpene_profiles: list[BatchTerpeneResponse] = []

    model_config = {"from_attributes": True}


class BatchCardResponse(BaseModel):
    """Pre-shaped data for the Top Trumps card UI."""

    id: int
    strain_id: int | None = None
    strain_name: str
    strain_aliases: str | None = None
    strain_type: str
    grower_id: int | None = None
    grower_name: str
    batch_number: str
    rank: int | None = None
    thc_percentage: float
    cbd_percentage: float
    irradiated: bool | None = None
    top_terpenes: list[BatchTerpeneResponse]
    avg_appearance_rating: float | None
    avg_aroma_rating: float | None
    avg_moisture_rating: float | None
    avg_flavour_rating: float | None
    avg_effect_rating: float | None
    review_count: int
    recent_rank: int | None = None
    top_condition: str | None = None
    top_condition_rank: int | None = None
    top_effect: str | None = None
    top_effect_rank: int | None = None
    top_flavour_label: str | None = None
    top_flavour_rank: int | None = None
    strain_image_url: str | None = None
    strain_description: str | None = None
