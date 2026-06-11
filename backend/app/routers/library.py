from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import Batch, Strain, User, UserLibraryEntry
from app.schemas.library import (
    LibraryEntryCreate,
    LibraryEntryResponse,
    LibraryEntryUpdate,
)

router = APIRouter(prefix="/library", tags=["library"])


def _entry_to_response(entry: UserLibraryEntry) -> LibraryEntryResponse:
    return LibraryEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        batch_id=entry.batch_id,
        strain_id=entry.strain_id,
        strain_name=(
            entry.strain.name
            if entry.strain
            else (entry.batch.strain.name if entry.batch and entry.batch.strain else None)
        ),
        batch_number=entry.batch.batch_number if entry.batch else None,
        list_type=entry.list_type,
        date_tried=entry.date_tried,
        notes=entry.notes,
        created_at=entry.created_at,
    )


@router.get("/", response_model=list[LibraryEntryResponse])
async def get_library(
    list_type: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(UserLibraryEntry)
        .options(
            selectinload(UserLibraryEntry.strain),
            selectinload(UserLibraryEntry.batch).selectinload(Batch.strain),
        )
        .where(UserLibraryEntry.user_id == current_user.id)
    )
    if list_type:
        query = query.where(UserLibraryEntry.list_type == list_type)
    query = query.offset(skip).limit(limit).order_by(UserLibraryEntry.created_at.desc())
    result = await db.execute(query)
    return [_entry_to_response(e) for e in result.scalars().unique().all()]


@router.post("/", response_model=LibraryEntryResponse, status_code=201)
async def add_to_library(
    data: LibraryEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not data.batch_id and not data.strain_id:
        raise HTTPException(
            status_code=400, detail="Either batch_id or strain_id required"
        )

    entry = UserLibraryEntry(
        user_id=current_user.id,
        batch_id=data.batch_id,
        strain_id=data.strain_id,
        list_type=data.list_type,
        date_tried=data.date_tried,
        notes=data.notes,
    )
    db.add(entry)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(UserLibraryEntry)
        .options(
            selectinload(UserLibraryEntry.strain),
            selectinload(UserLibraryEntry.batch).selectinload(Batch.strain),
        )
        .where(UserLibraryEntry.id == entry.id)
    )
    entry = result.scalar_one()
    return _entry_to_response(entry)


@router.delete("/{entry_id}")
async def remove_from_library(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.get(UserLibraryEntry, entry_id)
    if not entry or entry.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.flush()
    return {"detail": "Removed"}


@router.patch("/{entry_id}", response_model=LibraryEntryResponse)
async def update_library_entry(
    entry_id: int,
    data: LibraryEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.get(UserLibraryEntry, entry_id)
    if not entry or entry.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Entry not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    await db.flush()

    result = await db.execute(
        select(UserLibraryEntry)
        .options(
            selectinload(UserLibraryEntry.strain),
            selectinload(UserLibraryEntry.batch).selectinload(Batch.strain),
        )
        .where(UserLibraryEntry.id == entry_id)
    )
    entry = result.scalar_one()
    return _entry_to_response(entry)
