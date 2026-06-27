"""
Categories routes
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime

from models import CategoryDB, CategoryCreate, CategoryUpdate, MessageResponse
from utils.security import require_admin
from utils.helpers import save_upload_file
from utils.db import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
async def list_categories():
    db = get_db()
    cursor = db.categories.find({"is_active": True}).sort("sort_order", 1)
    items = await cursor.to_list(100)
    for item in items:
        item.pop("_id", None)
    return items


@router.get("/{handle}")
async def get_category(handle: str):
    db = get_db()
    doc = await db.categories.find_one({"$or": [{"handle": handle}, {"id": handle}], "is_active": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    doc.pop("_id", None)
    return doc


@router.post("", status_code=201)
async def create_category(data: CategoryCreate, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.categories.find_one({"handle": data.handle})
    if existing:
        raise HTTPException(status_code=400, detail="Handle already exists")
    cat = CategoryDB(**data.dict())
    await db.categories.insert_one(cat.dict())
    result = cat.dict()
    return result


@router.put("/{cat_id}")
async def update_category(cat_id: str, data: CategoryUpdate, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.categories.find_one({"id": cat_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    update = {k: v for k, v in data.dict().items() if v is not None}
    await db.categories.update_one({"id": cat_id}, {"$set": update})
    doc = await db.categories.find_one({"id": cat_id})
    doc.pop("_id", None)
    return doc


@router.post("/{cat_id}/image")
async def upload_category_image(cat_id: str, file: UploadFile = File(...), current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.categories.find_one({"id": cat_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    url = await save_upload_file(file, "categories")
    await db.categories.update_one({"id": cat_id}, {"$set": {"image": url}})
    return {"url": url}


@router.delete("/{cat_id}", response_model=MessageResponse)
async def delete_category(cat_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.categories.find_one({"id": cat_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.categories.update_one({"id": cat_id}, {"$set": {"is_active": False}})
    return MessageResponse(message="Category deleted")
