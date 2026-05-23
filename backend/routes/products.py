"""
Products routes: public listing + admin CRUD + image upload
"""
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from datetime import datetime
from typing import Optional
import math

from models import ProductDB, ProductCreate, ProductUpdate, MessageResponse, ProductVariant
from utils.security import require_admin
from utils.helpers import save_upload_file, delete_upload_file
from utils.db import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products(
    collection: Optional[str] = None,
    search: Optional[str] = None,
    is_featured: Optional[bool] = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    db = get_db()
    query = {"is_active": True}
    if collection:
        query["collection"] = collection
    if is_featured is not None:
        query["is_featured"] = is_featured
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search]}},
        ]

    sort_dir = -1 if order == "desc" else 1
    sort_field = sort if sort in ["price", "created_at", "title"] else "created_at"

    total = await db.products.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.products.find(query).sort(sort_field, sort_dir).skip(skip).limit(per_page)
    items = await cursor.to_list(per_page)
    for item in items:
        item.pop("_id", None)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 1
    }


@router.get("/handle/{handle}")
async def get_product_by_handle(handle: str):
    db = get_db()
    doc = await db.products.find_one({"handle": handle, "is_active": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    doc.pop("_id", None)
    return doc


@router.get("/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    doc = await db.products.find_one({
        "$or": [{"id": product_id}, {"handle": product_id}],
        "is_active": True
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    doc.pop("_id", None)
    return doc


@router.post("", status_code=201)
async def create_product(data: ProductCreate, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.products.find_one({"handle": data.handle})
    if existing:
        raise HTTPException(status_code=400, detail="Handle already exists")
    d = data.dict()
    d["variants"] = [v.dict() if hasattr(v, 'dict') else v for v in d.get("variants", [])]
    product = ProductDB(**d)
    await db.products.insert_one(product.dict())
    result = product.dict()
    return result


@router.put("/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.utcnow()
    if "variants" in update:
        update["variants"] = [v.dict() if hasattr(v, 'dict') else v for v in update["variants"]]
    await db.products.update_one({"id": product_id}, {"$set": update})
    doc = await db.products.find_one({"id": product_id})
    doc.pop("_id", None)
    return doc


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(product_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    return MessageResponse(message="Product deleted successfully")


@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    url = await save_upload_file(file, "products")
    await db.products.update_one(
        {"id": product_id},
        {"$push": {"images": url}, "$set": {"updated_at": datetime.utcnow()}}
    )
    doc = await db.products.find_one({"id": product_id})
    doc.pop("_id", None)
    return {"url": url, "images": doc.get("images", [])}


@router.delete("/{product_id}/images/{image_index}")
async def remove_product_image(
    product_id: str,
    image_index: int,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    images = existing.get("images", [])
    if image_index < 0 or image_index >= len(images):
        raise HTTPException(status_code=400, detail="Invalid image index")
    removed_url = images.pop(image_index)
    if removed_url.startswith("/uploads/"):
        delete_upload_file(removed_url)
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"images": images, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Image removed", "images": images}
