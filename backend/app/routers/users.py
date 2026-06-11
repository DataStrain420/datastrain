from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    get_current_user,
    get_optional_user,
    hash_password,
    verify_password,
)
from app.database import get_db
import json

from app.models import Batch, Review, ReviewStatus, User, UserFollow
from app.schemas.users import (
    EmblemResponse,
    ReviewSummary,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublicResponse,
    UserResponse,
    UserUpdate,
)
from app.services.emblems import get_all_emblems_with_status
from app.services.ranks import get_progression, maybe_promote

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check uniqueness
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email or username already taken")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        is_verified=data.is_verified,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Lazy backfill — promote any user whose kudos already exceed their stored
    # tier (covers seeded accounts and any kudos awarded before the ranks
    # service existed). Never demotes.
    if maybe_promote(current_user):
        await db.flush()
        await db.refresh(current_user)

    emblem_dicts = await get_all_emblems_with_status(current_user, db)
    resp = UserResponse.model_validate(current_user)
    resp.emblems = [EmblemResponse(**e) for e in emblem_dicts]
    progression = get_progression(current_user)
    resp.current_status_threshold = progression["current_status_threshold"]
    resp.next_status = progression["next_status"]
    resp.next_status_label = progression["next_status_label"]
    resp.next_status_threshold = progression["next_status_threshold"]
    return resp


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.bio is not None:
        current_user.bio = data.bio
    if data.slogan is not None:
        current_user.slogan = data.slogan
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    if data.pinned_strain_id is not None:
        current_user.pinned_strain_id = data.pinned_strain_id
    # Privacy toggles
    for field in ("show_bio", "show_conditions", "show_reviews", "show_library", "show_followers", "show_kudos", "show_effects"):
        val = getattr(data, field, None)
        if val is not None:
            setattr(current_user, field, val)
    await db.flush()
    await db.refresh(current_user)
    emblem_dicts = await get_all_emblems_with_status(current_user, db)
    resp = UserResponse.model_validate(current_user)
    resp.emblems = [EmblemResponse(**e) for e in emblem_dicts]
    progression = get_progression(current_user)
    resp.current_status_threshold = progression["current_status_threshold"]
    resp.next_status = progression["next_status"]
    resp.next_status_label = progression["next_status_label"]
    resp.next_status_threshold = progression["next_status_threshold"]
    return resp


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an image file as profile avatar."""
    from app.services.image_service import save_upload

    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    url = await save_upload(file)
    current_user.avatar_url = url
    await db.flush()
    await db.refresh(current_user)
    emblem_dicts = await get_all_emblems_with_status(current_user, db)
    resp = UserResponse.model_validate(current_user)
    resp.emblems = [EmblemResponse(**e) for e in emblem_dicts]
    progression = get_progression(current_user)
    resp.current_status_threshold = progression["current_status_threshold"]
    resp.next_status = progression["next_status"]
    resp.next_status_label = progression["next_status_label"]
    resp.next_status_threshold = progression["next_status_threshold"]
    return resp


@router.get("/{username}", response_model=UserPublicResponse)
async def get_public_profile(
    username: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Compute emblems
    emblem_dicts = await get_all_emblems_with_status(user, db)

    # Check if current user is following this profile
    is_following = False
    if current_user and current_user.id != user.id:
        follow_result = await db.execute(
            select(UserFollow).where(
                UserFollow.follower_id == current_user.id,
                UserFollow.following_id == user.id,
            )
        )
        is_following = follow_result.scalar_one_or_none() is not None

    resp = UserPublicResponse(
        id=user.id,
        username=user.username,
        bio=user.bio if user.show_bio else None,
        slogan=user.slogan,
        avatar_url=user.avatar_url,
        pinned_strain_id=user.pinned_strain_id,
        community_status=user.community_status,
        kudos_points=user.kudos_points if user.show_kudos else None,
        follower_count=user.follower_count if user.show_followers else None,
        review_count=user.review_count if user.show_reviews else None,
        created_at=user.created_at,
        is_following=is_following,
    )
    resp.emblems = [EmblemResponse(**e) for e in emblem_dicts]

    # Load reviews if public
    if user.show_reviews:
        rev_result = await db.execute(
            select(Review)
            .options(
                selectinload(Review.batch).selectinload(Batch.strain),
                selectinload(Review.batch).selectinload(Batch.grower),
                selectinload(Review.condition_ratings),
            )
            .where(Review.user_id == user.id, Review.status == ReviewStatus.APPROVED.value)
            .order_by(Review.created_at.desc())
            .limit(20)
        )
        reviews = rev_result.scalars().unique().all()
        resp.reviews = [
            ReviewSummary(
                id=r.id,
                batch_id=r.batch_id,
                strain_name=r.batch.strain.name if r.batch and r.batch.strain else None,
                batch_number=r.batch.batch_number if r.batch else None,
                grower_name=r.batch.grower.name if r.batch and r.batch.grower else None,
                grower_id=r.batch.grower.id if r.batch and r.batch.grower else None,
                strain_id=r.batch.strain.id if r.batch and r.batch.strain else None,
                appearance_rating=r.appearance_rating,
                aroma_rating=r.aroma_rating,
                moisture_rating=r.moisture_rating,
                flavour_rating=r.flavour_rating,
                effect_rating=r.effect_rating,
                written_narrative=r.written_narrative,
                photo_product_url=r.photo_product_url,
                photo_closeup_url=r.photo_closeup_url,
                photo_packaging_url=r.photo_packaging_url,
                effects=json.loads(r.effects) if r.effects else None,
                flavours=json.loads(r.flavours) if r.flavours else None,
                condition_ratings=[
                    {"condition_name": cr.condition_name, "efficacy_rating": cr.efficacy_rating}
                    for cr in r.condition_ratings
                ],
                helpful_votes=r.helpful_votes,
                created_at=r.created_at,
            )
            for r in reviews
        ]

    return resp


@router.post("/{user_id}/follow", status_code=201)
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.execute(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already following")

    follow = UserFollow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    current_user.following_count += 1
    target.follower_count += 1
    await db.flush()
    return {"detail": "Followed"}


@router.delete("/{user_id}/follow")
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    )
    follow = result.scalar_one_or_none()
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")

    target = await db.get(User, user_id)
    await db.delete(follow)
    current_user.following_count = max(0, current_user.following_count - 1)
    if target:
        target.follower_count = max(0, target.follower_count - 1)
    await db.flush()
    return {"detail": "Unfollowed"}
