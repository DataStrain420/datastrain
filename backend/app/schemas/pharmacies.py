from datetime import datetime

from pydantic import BaseModel, Field


class PharmacyCreate(BaseModel):
    name: str = Field(max_length=200)
    location: str = Field(max_length=300)
    api_endpoint: str | None = None
    is_active: bool = True


class PharmacyResponse(BaseModel):
    id: int
    name: str
    location: str
    api_endpoint: str | None
    stock_last_updated: datetime | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
