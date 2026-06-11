"""Static emblem (achievement badge) definitions.

Each emblem has a check function that takes a User + db session and returns
True when the user has met the unlock criteria.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Awaitable

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import HelpfulVote, KudosEvent, KudosEventType, Review, ReviewStatus, User, UserLibraryEntry


@dataclass(frozen=True)
class EmblemDef:
    id: str
    name: str
    icon: str
    description: str
    check: Callable[[User, AsyncSession], Awaitable[bool]]


# ── Check functions ──────────────────────────────────────────────────────────


async def _check_strain_scout(user: User, db: AsyncSession) -> bool:
    """Reviewed 5+ different strains."""
    result = await db.execute(
        select(func.count(func.distinct(Review.batch_id)))
        .where(Review.user_id == user.id, Review.status == ReviewStatus.APPROVED.value)
    )
    return (result.scalar() or 0) >= 5


async def _check_daily_logger(user: User, _db: AsyncSession) -> bool:
    """Submitted 7+ reviews (proxy for consistent logging)."""
    return user.review_count >= 7


async def _check_trusted_taster(user: User, db: AsyncSession) -> bool:
    """10+ approved reviews."""
    result = await db.execute(
        select(func.count(Review.id))
        .where(Review.user_id == user.id, Review.status == ReviewStatus.APPROVED.value)
    )
    return (result.scalar() or 0) >= 10


async def _check_trailblazer(user: User, db: AsyncSession) -> bool:
    """First reviewer on 3+ batches."""
    result = await db.execute(
        select(func.count(KudosEvent.id))
        .where(
            KudosEvent.user_id == user.id,
            KudosEvent.event_type == KudosEventType.FIRST_REVIEW_ON_BATCH.value,
        )
    )
    return (result.scalar() or 0) >= 3


async def _check_community_pillar(user: User, _db: AsyncSession) -> bool:
    """Gained 10+ followers."""
    return user.follower_count >= 10


async def _check_connoisseur(user: User, _db: AsyncSession) -> bool:
    """Reached 500+ kudos points."""
    return user.kudos_points >= 500


async def _check_helpful_hero(user: User, db: AsyncSession) -> bool:
    """Received 50+ helpful votes across all reviews."""
    result = await db.execute(
        select(func.sum(Review.helpful_votes))
        .where(Review.user_id == user.id, Review.status == ReviewStatus.APPROVED.value)
    )
    return (result.scalar() or 0) >= 50


async def _check_collector(user: User, db: AsyncSession) -> bool:
    """Added 10+ strains to library (tried or favourite)."""
    result = await db.execute(
        select(func.count(UserLibraryEntry.id))
        .where(UserLibraryEntry.user_id == user.id)
    )
    return (result.scalar() or 0) >= 10


async def _check_photo_pro(user: User, db: AsyncSession) -> bool:
    """Uploaded photos on 10+ reviews."""
    result = await db.execute(
        select(func.count(Review.id))
        .where(
            Review.user_id == user.id,
            Review.status == ReviewStatus.APPROVED.value,
            Review.photo_product_url.isnot(None),
        )
    )
    return (result.scalar() or 0) >= 10


async def _check_first_timer(user: User, db: AsyncSession) -> bool:
    """Submitted their first review."""
    return user.review_count >= 1


async def _check_well_connected(user: User, _db: AsyncSession) -> bool:
    """Following 20+ other users."""
    return user.following_count >= 20


async def _check_og_member(user: User, _db: AsyncSession) -> bool:
    """Account created (early adopter placeholder — always true for seed users)."""
    return user.is_verified


# ── Registry ─────────────────────────────────────────────────────────────────

ALL_EMBLEMS: list[EmblemDef] = [
    EmblemDef("first-timer", "First Timer", "\U0001F331", "Submitted your first review", _check_first_timer),
    EmblemDef("strain-scout", "Strain Scout", "\U0001F50D", "Reviewed 5+ different strains", _check_strain_scout),
    EmblemDef("daily-logger", "Daily Logger", "\U0001F4C5", "Submitted 7+ reviews", _check_daily_logger),
    EmblemDef("trusted-taster", "Trusted Taster", "\U0001F44D", "10+ approved reviews", _check_trusted_taster),
    EmblemDef("trailblazer", "Trailblazer", "\U0001F525", "First reviewer on 3+ batches", _check_trailblazer),
    EmblemDef("helpful-hero", "Helpful Hero", "\U0001F4AA", "Received 50+ helpful votes", _check_helpful_hero),
    EmblemDef("photo-pro", "Photo Pro", "\U0001F4F8", "Uploaded photos on 10+ reviews", _check_photo_pro),
    EmblemDef("collector", "Collector", "\U0001F4DA", "Added 10+ strains to library", _check_collector),
    EmblemDef("community-pillar", "Community Pillar", "\U0001F91D", "Gained 10+ followers", _check_community_pillar),
    EmblemDef("well-connected", "Well Connected", "\U0001F310", "Following 20+ users", _check_well_connected),
    EmblemDef("connoisseur", "Connoisseur", "\U0001F451", "Reached 500+ kudos points", _check_connoisseur),
    EmblemDef("og-member", "OG Member", "\U0001F48E", "Early adopter of DataStrain", _check_og_member),
]


async def get_unlocked_emblems(user: User, db: AsyncSession) -> list[dict]:
    """Return list of emblem dicts the user has unlocked."""
    unlocked = []
    for emblem in ALL_EMBLEMS:
        if await emblem.check(user, db):
            unlocked.append({
                "id": emblem.id,
                "name": emblem.name,
                "icon": emblem.icon,
                "description": emblem.description,
            })
    return unlocked


async def get_all_emblems_with_status(user: User, db: AsyncSession) -> list[dict]:
    """Return ALL emblems with an `unlocked` boolean flag."""
    result = []
    for emblem in ALL_EMBLEMS:
        result.append({
            "id": emblem.id,
            "name": emblem.name,
            "icon": emblem.icon,
            "description": emblem.description,
            "unlocked": await emblem.check(user, db),
        })
    return result
