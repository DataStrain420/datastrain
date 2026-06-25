from datetime import datetime

from pydantic import BaseModel, Field


class GrowerCreate(BaseModel):
    name: str = Field(max_length=100)
    country_of_origin: str = Field(max_length=100)
    website: str | None = None
    logo_url: str | None = None
    phone_number: str | None = Field(default=None, max_length=40)
    address_street: str | None = Field(default=None, max_length=200)
    address_city: str | None = Field(default=None, max_length=100)
    address_postcode: str | None = Field(default=None, max_length=20)
    address_country: str | None = Field(default=None, max_length=100)
    verified: bool = False


class GrowerResponse(BaseModel):
    id: int
    name: str
    country_of_origin: str
    website: str | None
    logo_url: str | None
    phone_number: str | None = None
    address_street: str | None = None
    address_city: str | None = None
    address_postcode: str | None = None
    address_country: str | None = None
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
