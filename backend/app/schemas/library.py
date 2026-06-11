from datetime import date, datetime

from pydantic import BaseModel, Field


class LibraryEntryCreate(BaseModel):
    batch_id: int | None = None
    strain_id: int | None = None
    list_type: str = Field(pattern="^(tried|wishlist|favourite)$")
    date_tried: date | None = None
    notes: str | None = None


class LibraryEntryUpdate(BaseModel):
    date_tried: date | None = None
    notes: str | None = None
    list_type: str | None = None


class LibraryEntryResponse(BaseModel):
    id: int
    user_id: int
    batch_id: int | None
    strain_id: int | None
    strain_name: str | None = None
    batch_number: str | None = None
    list_type: str
    date_tried: date | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
