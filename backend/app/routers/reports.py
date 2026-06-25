"""Quick Report endpoints — user-submitted bug/feedback reports captured by
the floating QuickReport widget. Anonymous submissions are allowed; if the
caller is authenticated, the user_id is attached for later triage."""

import json

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_admin, get_optional_user
from app.database import get_db
from app.models import Report, User
from app.schemas.reports import ReportCreate, ReportResponse, ReportStatusUpdate
from app.services.image_service import save_upload

router = APIRouter(prefix="/reports", tags=["reports"])


def _to_response(report: Report) -> ReportResponse:
    urls: list[str] = []
    if report.screenshot_urls:
        try:
            urls = json.loads(report.screenshot_urls)
        except json.JSONDecodeError:
            urls = []
    return ReportResponse(
        id=report.id,
        user_id=report.user_id,
        username=report.user.username if report.user else None,
        report_type=report.report_type,
        severity=report.severity,
        title=report.title,
        description=report.description,
        page_path=report.page_path,
        screenshot_urls=urls,
        user_agent=report.user_agent,
        status=report.status,
        created_at=report.created_at,
    )


@router.post("/", response_model=ReportResponse, status_code=201)
async def create_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Open to anyone — the widget is mounted globally. user_id is captured
    when an auth header is present, otherwise the report is anonymous."""
    report = Report(
        user_id=current_user.id if current_user else None,
        report_type=data.report_type,
        severity=data.severity,
        title=data.title,
        description=data.description,
        page_path=data.page_path,
        screenshot_urls=json.dumps(data.screenshot_urls) if data.screenshot_urls else None,
        user_agent=data.user_agent,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return _to_response(report)


@router.post("/upload")
async def upload_report_image(
    file: UploadFile = File(...),
    _current: User | None = Depends(get_optional_user),
):
    """Per-attachment upload — the widget calls this once per file, then
    submits the resulting URLs alongside the report. Reuses the shared
    image_service so files land in the same uploads/ directory."""
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    url = await save_upload(file)
    return {"url": url}


@router.get("/", response_model=list[ReportResponse])
async def list_reports(
    status: str | None = Query(None, pattern="^(open|in_progress|closed)$"),
    report_type: str | None = Query(None, pattern="^(bug|feature|feedback|other)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    stmt = select(Report).options(selectinload(Report.user))
    if status:
        stmt = stmt.where(Report.status == status)
    if report_type:
        stmt = stmt.where(Report.report_type == report_type)
    stmt = stmt.order_by(Report.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [_to_response(r) for r in result.scalars().all()]


@router.patch("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: int,
    data: ReportStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    result = await db.execute(
        select(Report).options(selectinload(Report.user)).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = data.status
    await db.flush()
    return _to_response(report)
