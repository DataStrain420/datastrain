from datetime import datetime

from pydantic import BaseModel, Field


class StrainCreate(BaseModel):
    name: str = Field(max_length=200)
    strain_type: str = Field(pattern="^(indica|sativa|hybrid)$")
    description: str | None = None
    grower_id: int | None = None


class StrainUpdate(BaseModel):
    name: str | None = None
    strain_type: str | None = None
    description: str | None = None
    grower_id: int | None = None


class StrainResponse(BaseModel):
    id: int
    name: str
    aliases: str | None = None
    genetics: str | None = None
    strain_type: str
    description: str | None
    grower_id: int | None
    grower_name: str | None = None
    grower_country: str | None = None
    grower_verified: bool | None = None
    submitted_by_id: int | None
    approved: bool
    approved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StatEntry(BaseModel):
    name: str
    percentage: float


class StrainStatsResponse(BaseModel):
    strain_id: int
    total_strains: int
    overall_rank: int
    avg_thc: float
    avg_cbd: float
    review_count: int
    top_conditions: list[StatEntry]
    top_effects: list[StatEntry]
    top_flavours: list[StatEntry]
    top_terpenes: list[str]
    condition_rank: StatEntry | None = None
    effect_rank: StatEntry | None = None
    flavour_rank: StatEntry | None = None
