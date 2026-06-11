from datetime import datetime

from pydantic import BaseModel, Field


class GrowerCreate(BaseModel):
    name: str = Field(max_length=100)
    country_of_origin: str = Field(max_length=100)
    website: str | None = None
    logo_url: str | None = None
    verified: bool = False


class GrowerResponse(BaseModel):
    id: int
    name: str
    country_of_origin: str
    website: str | None
    logo_url: str | None
    verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class GrowerRankedResponse(BaseModel):
    id: int
    name: str
    logo_url: str | None
    verified: bool
    rank: int
    avg_rating: float
    review_count: int
