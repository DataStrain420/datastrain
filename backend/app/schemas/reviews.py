from datetime import datetime

from pydantic import BaseModel, Field


class ConditionRatingCreate(BaseModel):
    condition_name: str = Field(max_length=100)
    efficacy_rating: int = Field(ge=1, le=5)


class ConditionRatingResponse(BaseModel):
    id: int
    condition_name: str
    efficacy_rating: int

    model_config = {"from_attributes": True}


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    username: str | None = None
    avatar_url: str | None = None
    community_status: str | None = None
    batch_id: int
    batch_number: str | None = None
    strain_id: int | None = None
    strain_name: str | None = None
    grower_id: int | None = None
    grower_name: str | None = None

    # Step 1 ratings (1-5)
    appearance_rating: int
    aroma_rating: int
    moisture_rating: int
    flavour_rating: int
    effect_rating: int
    written_narrative: str | None

    # Photos
    photo_product_url: str | None = None
    photo_closeup_url: str | None = None
    photo_packaging_url: str | None = None

    # Step 2 optional fields
    thc_content: float | None = None
    cbd_content: float | None = None
    consumption_method: str | None = None
    effects: list[str] | None = None
    flavours: list[str] | None = None
    conditions_public: bool = False
    condition_efficacy_rating: int | None = None
    effect_duration_hours: int | None = None
    effect_duration_mins: int | None = None

    status: str
    # True when the review has been admin-verified. Unverified reviews are
    # still visible but wear a badge and don't contribute to aggregate stats.
    is_verified: bool = False
    rejection_reason: str | None
    helpful_votes: int
    condition_ratings: list[ConditionRatingResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewUpdateStep2(BaseModel):
    thc_content: float | None = Field(None, ge=0, le=100)
    cbd_content: float | None = Field(None, ge=0, le=100)
    consumption_method: str | None = Field(
        None, pattern="^(flower|oil|vape|edible|tincture|concentrate)$"
    )
    effects: list[str] | None = Field(None, min_length=1, max_length=3)
    condition_ratings: list[ConditionRatingCreate] | None = None
    conditions_public: bool = False
    condition_efficacy_rating: int | None = Field(None, ge=1, le=5)
    effect_duration_hours: int | None = Field(None, ge=0, le=24)
    effect_duration_mins: int | None = Field(None, ge=0, le=59)


class ReviewModerateRequest(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")
    rejection_reason: str | None = None


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class CommentResponse(BaseModel):
    id: int
    review_id: int
    user_id: int
    username: str | None = None
    avatar_url: str | None = None
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}
