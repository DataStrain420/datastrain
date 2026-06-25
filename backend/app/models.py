import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────


class CommunityStatus(str, enum.Enum):
    SEEDLING = "seedling"
    SPROUT = "sprout"
    GROWER = "grower"
    CULTIVATOR = "cultivator"
    MASTER_CULTIVATOR = "master_cultivator"
    LEGEND = "legend"


class StrainType(str, enum.Enum):
    INDICA = "indica"
    SATIVA = "sativa"
    HYBRID = "hybrid"


class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class LibraryListType(str, enum.Enum):
    TRIED = "tried"
    WISHLIST = "wishlist"
    FAVOURITE = "favourite"


class KudosEventType(str, enum.Enum):
    REVIEW_SUBMITTED = "review_submitted"
    HELPFUL_VOTE_RECEIVED = "helpful_vote_received"
    FOLLOWER_GAINED = "follower_gained"
    FIRST_REVIEW_ON_BATCH = "first_review_on_batch"


# ─── Users ────────────────────────────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    slogan: Mapped[str | None] = mapped_column(String(150), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pinned_strain_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("strains.id"), nullable=True)
    community_status: Mapped[str] = mapped_column(
        String(20), default=CommunityStatus.SEEDLING.value
    )
    kudos_points: Mapped[int] = mapped_column(Integer, default=0)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Privacy controls — what's visible on public profile
    show_bio: Mapped[bool] = mapped_column(Boolean, default=True)
    show_conditions: Mapped[bool] = mapped_column(Boolean, default=False)
    show_reviews: Mapped[bool] = mapped_column(Boolean, default=True)
    show_library: Mapped[bool] = mapped_column(Boolean, default=False)
    show_followers: Mapped[bool] = mapped_column(Boolean, default=True)
    show_kudos: Mapped[bool] = mapped_column(Boolean, default=True)
    show_effects: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    reviews: Mapped[list["Review"]] = relationship(back_populates="user")
    library_entries: Mapped[list["UserLibraryEntry"]] = relationship(
        back_populates="user"
    )
    kudos_events: Mapped[list["KudosEvent"]] = relationship(back_populates="user")


# ─── Growers ──────────────────────────────────────────────────────────────────


class Grower(Base):
    __tablename__ = "growers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_of_origin: Mapped[str] = mapped_column(String(100), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Contact + structured address — surfaced on the grower detail page.
    phone_number: Mapped[str | None] = mapped_column(String(40), nullable=True)
    address_street: Mapped[str | None] = mapped_column(String(200), nullable=True)
    address_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address_postcode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    strains: Mapped[list["Strain"]] = relationship(
        back_populates="grower", foreign_keys="Strain.grower_id"
    )


# ─── Strains ─────────────────────────────────────────────────────────────────


class Strain(Base):
    __tablename__ = "strains"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    strain_type: Mapped[str] = mapped_column(String(10), nullable=False)
    aliases: Mapped[str | None] = mapped_column(String(300), nullable=True)  # comma-separated
    genetics: Mapped[str | None] = mapped_column(String(300), nullable=True)  # e.g. "Sunset Sherbet x Thin Mints GSC"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    grower_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("growers.id"), nullable=True
    )
    submitted_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    grower: Mapped["Grower | None"] = relationship(
        back_populates="strains", foreign_keys=[grower_id]
    )
    batches: Mapped[list["Batch"]] = relationship(back_populates="strain")


# ─── Pharmacies ───────────────────────────────────────────────────────────────


class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(300), nullable=False)
    # Public-listing fields
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Internal dispensing integration
    api_endpoint: Mapped[str | None] = mapped_column(String(500), nullable=True)
    api_key_secret: Mapped[str | None] = mapped_column(String(200), nullable=True)
    stock_last_updated: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


# ─── Clinics ─────────────────────────────────────────────────────────────────


class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(300), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON-serialised list of specialty strings (e.g. ["Chronic pain", "Anxiety"])
    specialties: Mapped[str | None] = mapped_column(Text, nullable=True)
    consultation_fee_gbp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Free-text describing how consultations are run (e.g. "Video first appt,
    # in-person follow-ups", "Video only", "In-person, London"). Surfaced on
    # the clinic page alongside the fee.
    consultation_style: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Link to the clinic's CQC inspection report on cqc.org.uk — rendered as
    # an external "View CQC report" button on the clinic detail page.
    cqc_report_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


# ─── Batches ──────────────────────────────────────────────────────────────────


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    strain_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("strains.id"), nullable=False
    )
    grower_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("growers.id"), nullable=False
    )
    batch_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    thc_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    cbd_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    tested_date: Mapped[date] = mapped_column(Date, nullable=False)
    lab_report_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Gamma-irradiated for microbial sterilisation? Nullable when unknown so
    # the frontend can render "unknown" rather than a misleading default.
    irradiated: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    dispensing_pharmacy_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("pharmacies.id"), nullable=True
    )
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    strain: Mapped["Strain"] = relationship(back_populates="batches")
    grower: Mapped["Grower"] = relationship(foreign_keys=[grower_id])
    terpene_profiles: Mapped[list["BatchTerpene"]] = relationship(
        back_populates="batch", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship(back_populates="batch")


# ─── Terpenes ─────────────────────────────────────────────────────────────────


class Terpene(Base):
    __tablename__ = "terpenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    aroma_notes: Mapped[str | None] = mapped_column(String(300), nullable=True)


class BatchTerpene(Base):
    __tablename__ = "batch_terpenes"

    batch_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("batches.id"), primary_key=True
    )
    terpene_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("terpenes.id"), primary_key=True
    )
    percentage: Mapped[float] = mapped_column(Float, nullable=False)

    batch: Mapped["Batch"] = relationship(back_populates="terpene_profiles")
    terpene: Mapped["Terpene"] = relationship()


# ─── Pharmacy Stock ───────────────────────────────────────────────────────────


class PharmacyStock(Base):
    __tablename__ = "pharmacy_stock"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pharmacy_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("pharmacies.id"), nullable=False
    )
    batch_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("batches.id"), nullable=False
    )
    in_stock: Mapped[bool] = mapped_column(Boolean, default=False)
    quantity_available: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_checked: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    last_changed: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    pharmacy: Mapped["Pharmacy"] = relationship()
    batch: Mapped["Batch"] = relationship()


# ─── Reviews ──────────────────────────────────────────────────────────────────


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "batch_id", name="uq_user_batch_review"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    batch_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("batches.id"), nullable=False
    )
    # Step 1 — required ratings (1-5 stars)
    appearance_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    aroma_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    moisture_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    flavour_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    effect_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    written_narrative: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Step 1 — three required photos
    photo_product_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    photo_closeup_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    photo_packaging_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    photo_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Step 1 — confirmation checkboxes
    confirmed_own_experience: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmed_medical_only: Mapped[bool] = mapped_column(Boolean, default=False)

    # Step 2 — optional enrichment fields
    thc_content: Mapped[float | None] = mapped_column(Float, nullable=True)
    cbd_content: Mapped[float | None] = mapped_column(Float, nullable=True)
    consumption_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    effects: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    flavours: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    conditions_public: Mapped[bool] = mapped_column(Boolean, default=False)
    condition_efficacy_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    effect_duration_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    effect_duration_mins: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[str] = mapped_column(
        String(10), default=ReviewStatus.PENDING.value
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    helpful_votes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="reviews")
    batch: Mapped["Batch"] = relationship(back_populates="reviews")
    condition_ratings: Mapped[list["ConditionRating"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )
    comments: Mapped[list["ReviewComment"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )


class ConditionRating(Base):
    __tablename__ = "condition_ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    review_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("reviews.id"), nullable=False
    )
    condition_name: Mapped[str] = mapped_column(String(100), nullable=False)
    efficacy_rating: Mapped[int] = mapped_column(Integer, nullable=False)

    review: Mapped["Review"] = relationship(back_populates="condition_ratings")


# ─── Community: Follows & Votes ──────────────────────────────────────────────


class UserFollow(Base):
    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_user_follow"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    follower_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    following_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


class HelpfulVote(Base):
    __tablename__ = "helpful_votes"
    __table_args__ = (
        UniqueConstraint("user_id", "review_id", name="uq_helpful_vote"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    review_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("reviews.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


class ReviewComment(Base):
    __tablename__ = "review_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    review_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("reviews.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    review: Mapped["Review"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship()


# ─── Patient Library ─────────────────────────────────────────────────────────


class UserLibraryEntry(Base):
    __tablename__ = "user_library"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    batch_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("batches.id"), nullable=True
    )
    strain_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("strains.id"), nullable=True
    )
    list_type: Mapped[str] = mapped_column(String(10), nullable=False)
    date_tried: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="library_entries")
    batch: Mapped["Batch | None"] = relationship()
    strain: Mapped["Strain | None"] = relationship()


# ─── Kudos & Activity ─────────────────────────────────────────────────────────


class KudosEvent(Base):
    __tablename__ = "kudos_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)
    points_awarded: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reference_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="kudos_events")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


# ─── Quick Reports (bug/feedback widget) ─────────────────────────────────────


class ReportType(str, enum.Enum):
    BUG = "bug"
    FEATURE = "feature"
    FEEDBACK = "feedback"
    OTHER = "other"


class ReportSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class Report(Base):
    """User-submitted bug / feature / feedback report from the Quick Report
    widget. user_id is nullable so anonymous visitors can still submit."""

    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    report_type: Mapped[str] = mapped_column(
        String(20), default=ReportType.BUG.value, nullable=False
    )
    severity: Mapped[str] = mapped_column(
        String(20), default=ReportSeverity.MEDIUM.value, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    page_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # JSON-encoded list of uploaded image URLs (kept simple — no separate table).
    screenshot_urls: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=ReportStatus.OPEN.value, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    user: Mapped["User | None"] = relationship(foreign_keys=[user_id])


# ─── Search Analytics ────────────────────────────────────────────────────────


class SearchQuery(Base):
    __tablename__ = "search_queries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    query: Mapped[str] = mapped_column(String(200), nullable=False)
    result_count: Mapped[int] = mapped_column(Integer, default=0)
    top_result_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
