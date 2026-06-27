"""
Wishlist & Reviews routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from models import WishlistDB, ReviewDB, ReviewCreate, MessageResponse
from utils.security import get_current_user
from utils.db import get_db

wishlist_router = APIRouter(prefix="/wishlist", tags=["wishlist"])
reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])


@wishlist_router.get("")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    db = get_db()
    wishlist = await db.wishlists.find_one({"user_id": current_user["user_id"]})
    if not wishlist:
        return {"product_ids": [], "products": []}
    product_ids = wishlist.get("product_ids", [])
    products = []
    for pid in product_ids:
        product = await db.products.find_one({"id": pid, "is_active": True})
        if product:
            product.pop("_id", None)
            products.append(product)
    return {"product_ids": product_ids, "products": products}


@wishlist_router.post("/{product_id}")
async def toggle_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    product = await db.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    wishlist = await db.wishlists.find_one({"user_id": current_user["user_id"]})
    if not wishlist:
        wl = WishlistDB(user_id=current_user["user_id"], product_ids=[product_id])
        await db.wishlists.insert_one(wl.dict())
        return {"added": True, "product_id": product_id}

    product_ids = wishlist.get("product_ids", [])
    if product_id in product_ids:
        product_ids.remove(product_id)
        await db.wishlists.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {"product_ids": product_ids, "updated_at": datetime.utcnow()}}
        )
        return {"added": False, "product_id": product_id}
    else:
        await db.wishlists.update_one(
            {"user_id": current_user["user_id"]},
            {"$push": {"product_ids": product_id}, "$set": {"updated_at": datetime.utcnow()}}
        )
        return {"added": True, "product_id": product_id}


@reviews_router.get("/product/{product_id}")
async def get_product_reviews(product_id: str):
    db = get_db()
    reviews = await db.reviews.find({"product_id": product_id, "is_approved": True}).sort("created_at", -1).to_list(50)
    for r in reviews:
        r.pop("_id", None)
    avg = (sum(r["rating"] for r in reviews) / len(reviews)) if reviews else 0
    return {"reviews": reviews, "average_rating": round(avg, 1), "total": len(reviews)}


@reviews_router.post("/product/{product_id}", status_code=201)
async def create_review(product_id: str, data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    product = await db.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": current_user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    user = await db.users.find_one({"id": current_user["user_id"]})
    review = ReviewDB(
        product_id=product_id, user_id=current_user["user_id"],
        user_name=user["name"] if user else "Anonymous",
        rating=data.rating, comment=data.comment,
    )
    await db.reviews.insert_one(review.dict())
    return review.dict()
