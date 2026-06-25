from datetime import datetime

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    """Payload accepted from the Quick Report widget. All optional fields
    fall back to sensible defaults so anonymous + minimal-info submissions
    still work."""

    report_type: str = Field(default="bug", pattern="^(bug|feature|feedback|other)$")
    severity: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    page_path: str | None = Field(default=None, max_length=500)
    screenshot_urls: list[str] = Field(default_factory=list)
    user_agent: str | None = Field(default=None, max_length=500)


class ReportStatusUpdate(BaseModel):
    status: str = Field(pattern="^(open|in_progress|closed)$")


class ReportResponse(BaseModel):
    id: int
    user_id: int | None
    username: str | None = None
    report_type: str
    severity: str
    title: str
    description: str | None
    page_path: str | None
    screenshot_urls: list[str] = []
    user_agent: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
