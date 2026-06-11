from pydantic import BaseModel, Field


class TerpeneCreate(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = None
    aroma_notes: str | None = None


class TerpeneResponse(BaseModel):
    id: int
    name: str
    description: str | None
    aroma_notes: str | None

    model_config = {"from_attributes": True}


class BatchTerpeneCreate(BaseModel):
    terpene_id: int
    percentage: float = Field(ge=0, le=100)


class BatchTerpeneResponse(BaseModel):
    terpene_id: int
    terpene_name: str
    percentage: float
