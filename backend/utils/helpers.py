"""
Helper utilities
"""
import math
import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_BASE = Path("/app/uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def paginate(total: int, page: int, per_page: int) -> dict:
    pages = math.ceil(total / per_page) if total > 0 else 1
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }


def slugify(text: str) -> str:
    import re
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text


async def save_upload_file(upload_file: UploadFile, folder: str) -> str:
    """Save uploaded file and return relative URL path"""
    # Validate extension
    suffix = Path(upload_file.filename or "file.jpg").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {suffix} not allowed")
    
    # Validate size
    content = await upload_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Save file
    save_dir = UPLOAD_BASE / folder
    save_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{suffix}"
    filepath = save_dir / filename
    
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    
    return f"/uploads/{folder}/{filename}"


def delete_upload_file(url_path: str):
    """Delete an uploaded file by URL path"""
    try:
        file_path = Path("/app") / url_path.lstrip("/")
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass  # non-critical
