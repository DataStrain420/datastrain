import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_admin, get_current_user
from app.database import get_db
from app.models import (
    Batch,
    ConditionRating,
    Grower,
    HelpfulVote,
    KudosEventType,
    Review,
    ReviewComment,
    ReviewStatus,
    User,
)
from app.schemas.reviews import (
    CommentCreate,
    CommentResponse,
    ConditionRatingResponse,
    ReviewModerateRequest,
    ReviewResponse,
    ReviewUpdateStep2,
)
from app.services.image_service import save_upload
from app.services.kudos import award_kudos

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _review_to_response(review: Review) -> ReviewResponse:
    # Deserialize effects JSON
    effects_list = None
    if review.effects:
        try:
            effects_list = json.loads(review.effects)
        except json.JSONDecodeError:
            effects_list = None

    # Deserialize flavours JSON
    flavours_list = None
    if review.flavours:
        try:
            flavours_list = json.loads(review.flavours)
        except json.JSONDecodeError:
            flavours_list = None

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        username=review.user.username if review.user else None,
        avatar_url=review.user.avatar_url if review.user else None,
        community_status=review.user.community_status if review.user else None,
        batch_id=review.batch_id,
        batch_number=review.batch.batch_number if review.batch else None,
        strain_id=(
            review.batch.strain.id
            if review.batch and review.batch.strain
            else None
        ),
        strain_name=(
            review.batch.strain.name
            if review.batch and review.batch.strain
            else None
        ),
        grower_id=(
            review.batch.grower.id
            if review.batch and review.batch.grower
            else None
        ),
        grower_name=(
            review.batch.grower.name
            if review.batch and review.batch.grower
            else None
        ),
        appearance_rating=review.appearance_rating,
        aroma_rating=review.aroma_rating,
        moisture_rating=review.moisture_rating,
        flavour_rating=review.flavour_rating,
        effect_rating=review.effect_rating,
        written_narrative=review.written_narrative,
        photo_product_url=review.photo_product_url,
        photo_closeup_url=review.photo_closeup_url,
        photo_packaging_url=review.photo_packaging_url,
        thc_content=review.thc_content,
        cbd_content=review.cbd_content,
        consumption_method=review.consumption_method,
        effects=effects_list,
        flavours=flavours_list,
        conditions_public=review.conditions_public,
        condition_efficacy_rating=review.condition_efficacy_rating,
        effect_duration_hours=review.effect_duration_hours,
        effect_duration_mins=review.effect_duration_mins,
        status=review.status,
        is_verified=review.status == ReviewStatus.APPROVED.value,
        rejection_reason=review.rejection_reason,
        helpful_votes=review.helpful_votes,
        condition_ratings=[
            ConditionRatingResponse.model_validate(cr)
            for cr in review.condition_ratings
        ],
        created_at=review.created_at,
    )


def _load_review_query():
    return (
        select(Review)
        .options(
            selectinload(Review.user),
            selectinload(Review.batch).selectinload(Batch.strain),
            selectinload(Review.batch).selectinload(Batch.grower),
            selectinload(Review.condition_ratings),
        )
    )


# ── Step 1: Submit review ────────────────────────────────────────────────────


@router.post("/", response_model=ReviewResponse, status_code=201)
async def submit_review(
    batch_id: int = Form(...),
    appearance_rating: int = Form(..., ge=1, le=5),
    aroma_rating: int = Form(..., ge=1, le=5),
    moisture_rating: int = Form(..., ge=1, le=5),
    flavour_rating: int = Form(..., ge=1, le=5),
    effect_rating: int = Form(..., ge=1, le=5),
    written_narrative: str = Form(None),
    confirmed_own_experience: bool = Form(False),
    confirmed_medical_only: bool = Form(False),
    photo_product: UploadFile = File(...),
    photo_closeup: UploadFile = File(...),
    photo_packaging: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Batch must exist. Unapproved batches are allowed because patients can
    # submit a new batch inline during the review flow; the review itself
    # stays PENDING and admins moderate both together.
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=400, detail="Batch not found")

    # Check one review per user per batch. Message tells them the status
    # so they know where to find it (or that it's still awaiting approval).
    existing = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id, Review.batch_id == batch_id
        )
    )
    prior = existing.scalar_one_or_none()
    if prior:
        if prior.status == ReviewStatus.REJECTED.value:
            raise HTTPException(
                status_code=409,
                detail="Your previous review of this batch was removed. Delete it from your dashboard before submitting a new one.",
            )
        raise HTTPException(
            status_code=409,
            detail="You have already reviewed this batch — visit your dashboard to edit it.",
        )

    # Save photos
    photo_product_url = await save_upload(photo_product)
    photo_closeup_url = await save_upload(photo_closeup)
    photo_packaging_url = await save_upload(photo_packaging)

    # Create review
    review = Review(
        user_id=current_user.id,
        batch_id=batch_id,
        appearance_rating=appearance_rating,
        aroma_rating=aroma_rating,
        moisture_rating=moisture_rating,
        flavour_rating=flavour_rating,
        effect_rating=effect_rating,
        written_narrative=written_narrative,
        photo_product_url=photo_product_url,
        photo_closeup_url=photo_closeup_url,
        photo_packaging_url=photo_packaging_url,
        confirmed_own_experience=confirmed_own_experience,
        confirmed_medical_only=confirmed_medical_only,
        status=ReviewStatus.PENDING.value,
    )
    db.add(review)
    await db.flush()

    # Update user review count
    current_user.review_count += 1

    # Award kudos
    await award_kudos(
        current_user.id,
        KudosEventType.REVIEW_SUBMITTED,
        db,
        reference_id=review.id,
        reference_type="review",
    )

    # Check if first review on batch
    batch_review_count = await db.execute(
        select(Review).where(Review.batch_id == batch_id)
    )
    if len(batch_review_count.scalars().all()) == 1:
        await award_kudos(
            current_user.id,
            KudosEventType.FIRST_REVIEW_ON_BATCH,
            db,
            reference_id=review.id,
            reference_type="review",
        )

    await db.flush()

    # Reload with relationships
    result = await db.execute(_load_review_query().where(Review.id == review.id))
    review = result.scalar_one()
    return _review_to_response(review)


# ── Step 2: Update review with optional enrichment data ──────────────────────


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review_step2(
    review_id: int,
    data: ReviewUpdateStep2,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(_load_review_query().where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your review")

    # Update step 2 fields
    if data.thc_content is not None:
        review.thc_content = data.thc_content
    if data.cbd_content is not None:
        review.cbd_content = data.cbd_content
    if data.consumption_method is not None:
        review.consumption_method = data.consumption_method
    if data.effects is not None:
        review.effects = json.dumps(data.effects)
    review.conditions_public = data.conditions_public
    if data.condition_efficacy_rating is not None:
        review.condition_efficacy_rating = data.condition_efficacy_rating
    if data.effect_duration_hours is not None:
        review.effect_duration_hours = data.effect_duration_hours
    if data.effect_duration_mins is not None:
        review.effect_duration_mins = data.effect_duration_mins

    # Handle condition ratings — replace existing
    if data.condition_ratings is not None:
        # Delete existing condition ratings
        for cr in list(review.condition_ratings):
            await db.delete(cr)
        await db.flush()

        # Add new condition ratings
        for cond in data.condition_ratings:
            cr = ConditionRating(
                review_id=review.id,
                condition_name=cond.condition_name,
                efficacy_rating=cond.efficacy_rating,
            )
            db.add(cr)

    await db.flush()

    # Reload with relationships
    result = await db.execute(_load_review_query().where(Review.id == review.id))
    review = result.scalar_one()
    return _review_to_response(review)


@router.delete("/{review_id}", status_code=204)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Let a patient delete their own review — but only while it's PENDING
    or REJECTED. Approved reviews are part of the public record and count
    toward denormalised stats; deleting them is an admin action."""
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your review")
    if review.status == ReviewStatus.APPROVED.value:
        raise HTTPException(
            status_code=400,
            detail="Approved reviews can't be deleted — contact support if you need it removed.",
        )
    await db.delete(review)
    await db.flush()
    # Keep the user's review counter honest.
    if current_user.review_count > 0:
        current_user.review_count -= 1
    return None


# ── List & detail ────────────────────────────────────────────────────────────


@router.get("/mine", response_model=list[ReviewResponse])
async def list_my_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    """Return every review the current user has authored, at any status —
    the public list_reviews defaults to APPROVED-only, so PENDING or
    REJECTED reviews would otherwise be invisible to their own author."""
    query = (
        _load_review_query()
        .where(Review.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(Review.created_at.desc())
    )
    result = await db.execute(query)
    return [_review_to_response(r) for r in result.scalars().unique().all()]


@router.get("/", response_model=list[ReviewResponse])
async def list_reviews(
    batch_id: int | None = None,
    strain_id: int | None = None,
    user_id: int | None = None,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = _load_review_query()
    if batch_id:
        query = query.where(Review.batch_id == batch_id)
    if strain_id:
        # Cover every batch of this strain in one call — the per-batch
        # fetch pattern would miss reviews on unapproved (patient-
        # submitted) batches, or on any batch outside a hard-coded slice.
        query = query.where(
            Review.batch_id.in_(select(Batch.id).where(Batch.strain_id == strain_id))
        )
    if user_id:
        query = query.where(Review.user_id == user_id)
    if status:
        query = query.where(Review.status == status)
    else:
        # Post-moderation model: reviews are live the moment they're
        # submitted. Show everything except rejected — pending items get an
        # "Unverified" badge on the frontend but are otherwise visible.
        query = query.where(Review.status != ReviewStatus.REJECTED.value)
    query = query.offset(skip).limit(limit).order_by(Review.created_at.desc())
    result = await db.execute(query)
    return [_review_to_response(r) for r in result.scalars().unique().all()]


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(_load_review_query().where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return _review_to_response(review)


# ── Helpful votes ────────────────────────────────────────────────────────────


@router.post("/{review_id}/helpful", status_code=201)
async def cast_helpful_vote(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    existing = await db.execute(
        select(HelpfulVote).where(
            HelpfulVote.user_id == current_user.id,
            HelpfulVote.review_id == review_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already voted")

    vote = HelpfulVote(user_id=current_user.id, review_id=review_id)
    db.add(vote)
    review.helpful_votes += 1

    # Award kudos to review author
    await award_kudos(
        review.user_id,
        KudosEventType.HELPFUL_VOTE_RECEIVED,
        db,
        reference_id=review_id,
        reference_type="review",
    )

    await db.flush()
    return {"detail": "Vote cast"}


@router.delete("/{review_id}/helpful")
async def remove_helpful_vote(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HelpfulVote).where(
            HelpfulVote.user_id == current_user.id,
            HelpfulVote.review_id == review_id,
        )
    )
    vote = result.scalar_one_or_none()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")

    review = await db.get(Review, review_id)
    if review:
        review.helpful_votes = max(0, review.helpful_votes - 1)
    await db.delete(vote)
    await db.flush()
    return {"detail": "Vote removed"}


# ── Moderation ───────────────────────────────────────────────────────────────


@router.patch("/{review_id}/moderate", response_model=ReviewResponse)
async def moderate_review(
    review_id: int,
    data: ReviewModerateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    result = await db.execute(_load_review_query().where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if data.action == "approve":
        review.status = ReviewStatus.APPROVED.value
        review.rejection_reason = None
    elif data.action == "reject":
        review.status = ReviewStatus.REJECTED.value
        review.rejection_reason = data.rejection_reason

    await db.flush()
    await db.refresh(review)
    return _review_to_response(review)


# ─── Review Comments ─────────────────────────────────────────────────────────


def _comment_to_response(comment: ReviewComment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        review_id=comment.review_id,
        user_id=comment.user_id,
        username=comment.user.username if comment.user else None,
        avatar_url=comment.user.avatar_url if comment.user else None,
        text=comment.text,
        created_at=comment.created_at,
    )


@router.get("/{review_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    review_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReviewComment)
        .options(selectinload(ReviewComment.user))
        .where(ReviewComment.review_id == review_id)
        .order_by(ReviewComment.created_at.asc())
    )
    return [_comment_to_response(c) for c in result.scalars().all()]


@router.post("/{review_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    review_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify review exists
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    comment = ReviewComment(
        review_id=review_id,
        user_id=current_user.id,
        text=data.text,
    )
    db.add(comment)
    await db.flush()

    # Reload with user relationship
    result = await db.execute(
        select(ReviewComment)
        .options(selectinload(ReviewComment.user))
        .where(ReviewComment.id == comment.id)
    )
    comment = result.scalar_one()
    return _comment_to_response(comment)


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = await db.get(ReviewComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")
    await db.delete(comment)
    await db.flush()
