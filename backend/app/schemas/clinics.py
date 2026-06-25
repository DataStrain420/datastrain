from datetime import datetime

from pydantic import BaseModel, Field


class ClinicCreate(BaseModel):
    name: str = Field(max_length=200)
    location: str = Field(max_length=300)
    website: str | None = None
    logo_url: str | None = None
    description: str | None = None
    specialties: str | None = None  # JSON-encoded list of strings
    consultation_fee_gbp: int | None = None
    consultation_style: str | None = Field(default=None, max_length=200)
    cqc_report_url: str | None = Field(default=None, max_length=500)
    verified: bool = False


class ClinicResponse(BaseModel):
    id: int
    name: str
    location: str
    website: str | None
    logo_url: str | None
    description: str | None
    specialties: str | None
    consultation_fee_gbp: int | None
    consultation_style: str | None = None
    cqc_report_url: str | None = None
    verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
