from datetime import datetime

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8)
    is_verified: bool = False  # prescription confirmation checkbox


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    bio: str | None = None
    slogan: str | None = None
    avatar_url: str | None = None
    pinned_strain_id: int | None = None
    # Privacy toggles
    show_bio: bool | None = None
    show_conditions: bool | None = None
    show_reviews: bool | None = None
    show_library: bool | None = None
    show_followers: bool | None = None
    show_kudos: bool | None = None
    show_effects: bool | None = None


class EmblemResponse(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    unlocked: bool = True


class UserResponse(BaseModel):
    """Full profile — returned on /me (private, own account)."""
    id: int
    username: str
    email: str
    bio: str | None
    slogan: str | None = None
    avatar_url: str | None
    pinned_strain_id: int | None = None
    community_status: str
    kudos_points: int
    follower_count: int
    following_count: int
    review_count: int
    is_verified: bool
    created_at: datetime
    emblems: list[EmblemResponse] = []
    # Rank progression — set by the /me endpoint
    current_status_threshold: int = 0
    next_status: str | None = None
    next_status_label: str | None = None
    next_status_threshold: int | None = None
    # Privacy settings (visible to own user only)
    show_bio: bool = True
    show_conditions: bool = False
    show_reviews: bool = True
    show_library: bool = False
    show_followers: bool = True
    show_kudos: bool = True
    show_effects: bool = True
    # True when the account's email is in ADMIN_EMAILS — lets the patient
    # dashboard show a cross-link into the admin portal.
    is_admin: bool = False

    model_config = {"from_attributes": True}


class ReviewSummary(BaseModel):
    id: int
    batch_id: int
    strain_name: str | None = None
    batch_number: str | None = None
    grower_name: str | None = None
    grower_id: int | None = None
    strain_id: int | None = None
    appearance_rating: int
    aroma_rating: int
    moisture_rating: int
    flavour_rating: int
    effect_rating: int
    written_narrative: str | None
    photo_product_url: str | None = None
    photo_closeup_url: str | None = None
    photo_packaging_url: str | None = None
    effects: list[str] | None = None
    flavours: list[str] | None = None
    condition_ratings: list[dict] = []
    helpful_votes: int = 0
    created_at: datetime


class UserPublicResponse(BaseModel):
    """Public profile — what other users see. Fields may be null if set to private."""
    id: int
    username: str
    bio: str | None = None
    slogan: str | None = None
    avatar_url: str | None
    pinned_strain_id: int | None = None
    community_status: str
    kudos_points: int | None = None
    follower_count: int | None = None
    review_count: int | None = None
    created_at: datetime
    emblems: list[EmblemResponse] = []
    is_following: bool = False
    # Public data sections (null = user set to private)
    reviews: list[ReviewSummary] | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
