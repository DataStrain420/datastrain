from sqlalchemy.ext.asyncio import AsyncSession

from app.models import KudosEvent, KudosEventType, User
from app.services.ranks import maybe_promote

# Points awarded per event type
POINTS_MAP = {
    KudosEventType.REVIEW_SUBMITTED: 10,
    KudosEventType.HELPFUL_VOTE_RECEIVED: 5,
    KudosEventType.FOLLOWER_GAINED: 15,
    KudosEventType.FIRST_REVIEW_ON_BATCH: 20,
}


async def award_kudos(
    user_id: int,
    event_type: KudosEventType,
    db: AsyncSession,
    reference_id: int | None = None,
    reference_type: str | None = None,
) -> KudosEvent:
    points = POINTS_MAP.get(event_type, 0)

    event = KudosEvent(
        user_id=user_id,
        event_type=event_type.value,
        points_awarded=points,
        reference_id=reference_id,
        reference_type=reference_type,
    )
    db.add(event)

    user = await db.get(User, user_id)
    if user:
        user.kudos_points += points
        # Auto-promote community_status if a new threshold was crossed
        maybe_promote(user)

    await db.flush()
    return event
