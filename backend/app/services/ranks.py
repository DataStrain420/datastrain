"""Community-rank progression — kudos thresholds and promotion logic.

The DataStrain "community status" ladder is driven entirely off `users.kudos_points`.
Each tier has a minimum kudos threshold; crossing the next threshold promotes the
user (we never demote, even if the seed data places a user above their kudos
total — promotions only).
"""

from app.models import CommunityStatus, User

# Ordered tiers — lowest to highest. The label is used by the API/UI; the
# `min_kudos` is the inclusive lower bound to be in that tier.
RANK_TIERS: list[tuple[CommunityStatus, str, int]] = [
    (CommunityStatus.SEEDLING, "Seedling", 0),
    (CommunityStatus.SPROUT, "Sprout", 100),
    (CommunityStatus.GROWER, "Grower", 300),
    (CommunityStatus.CULTIVATOR, "Cultivator", 750),
    (CommunityStatus.MASTER_CULTIVATOR, "Master Cultivator", 1750),
    (CommunityStatus.LEGEND, "Legend", 4000),
]

# Quick lookup by status value
_STATUS_INDEX: dict[str, int] = {t[0].value: i for i, t in enumerate(RANK_TIERS)}


def tier_index_for_status(status_value: str) -> int:
    """Return the index of a stored community_status value in RANK_TIERS.

    Unknown values default to Seedling (index 0)."""
    return _STATUS_INDEX.get(status_value, 0)


def tier_index_for_kudos(kudos: int) -> int:
    """Return the highest tier index whose threshold the user has met."""
    idx = 0
    for i, (_, _, threshold) in enumerate(RANK_TIERS):
        if kudos >= threshold:
            idx = i
        else:
            break
    return idx


def get_progression(user: User) -> dict:
    """Compute the progression payload for a user.

    Returns a dict with:
        current_status_threshold: int           kudos at which current tier started
        next_status: str | None                 enum value of next tier, or None at top
        next_status_label: str | None           human label
        next_status_threshold: int | None       kudos required to reach next tier
    """
    current_idx = tier_index_for_status(user.community_status)
    # Don't let an empty/unknown status leave us below their actual kudos progress
    kudos_idx = tier_index_for_kudos(user.kudos_points)
    idx = max(current_idx, kudos_idx)

    _, _, current_threshold = RANK_TIERS[idx]
    if idx + 1 < len(RANK_TIERS):
        next_status, next_label, next_threshold = RANK_TIERS[idx + 1]
        return {
            "current_status_threshold": current_threshold,
            "next_status": next_status.value,
            "next_status_label": next_label,
            "next_status_threshold": next_threshold,
        }
    return {
        "current_status_threshold": current_threshold,
        "next_status": None,
        "next_status_label": None,
        "next_status_threshold": None,
    }


def maybe_promote(user: User) -> bool:
    """Promote the user's community_status if their kudos have crossed a new
    threshold. Never demotes. Returns True if a promotion happened."""
    current_idx = tier_index_for_status(user.community_status)
    target_idx = tier_index_for_kudos(user.kudos_points)
    if target_idx > current_idx:
        user.community_status = RANK_TIERS[target_idx][0].value
        return True
    return False
