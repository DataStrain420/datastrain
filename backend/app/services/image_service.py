import os
import uuid

from fastapi import UploadFile

from app.config import settings

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


async def save_upload(file: UploadFile) -> str:
    """Save uploaded file and return a URL path.

    In dev mode: saves to local uploads/ directory.
    In prod: would upload to GCS (stub for now).
    """
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Return URL path — served by StaticFiles mount in main.py
    return f"/uploads/{filename}"
