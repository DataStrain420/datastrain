async def pre_screen_review(narrative: str | None, photo_url: str) -> dict:
    """AI-assisted review pre-screening stub.

    In Phase 1, all reviews go to manual moderation.
    Future: use Claude to check for inappropriate content,
    PII in photos, etc.
    """
    return {"auto_approve": False, "flags": []}
