"""
Admin routes — dashboard analytics, order/user/coupon/inventory management
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
from typing import Optional
import math

from models import CouponCreate, CouponUpdate, CouponDB, UpdateOrderStatusRequest, OrderStatus, MessageResponse
from utils.security import require_admin
from utils.db import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(require_admin)):
    db = get_db()
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "customer"})
    total_products = await db.products.count_documents({"is_active": True})
    total_categories = await db.categories.count_documents({"is_active": True})

    rev_result = await db.orders.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    total_revenue = rev_result[0]["total"] if rev_result else 0

    month_result = await db.orders.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}, "created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    month_revenue = month_result[0]["total"] if month_result else 0
    month_orders = month_result[0]["count"] if month_result else 0

    last_month_result = await db.orders.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}, "created_at": {"$gte": last_month_start, "$lt": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    last_month_revenue = last_month_result[0]["total"] if last_month_result else 0
    revenue_change = ((month_revenue - last_month_revenue) / last_month_revenue * 100) if last_month_revenue > 0 else (100.0 if month_revenue > 0 else 0.0)

    status_result = await db.orders.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]).to_list(20)
    order_statuses = {s["_id"]: s["count"] for s in status_result}

    top_products = await db.orders.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "title": {"$first": "$items.product_title"},
                    "total_sold": {"$sum": "$items.quantity"}, "revenue": {"$sum": "$items.subtotal"}}},
        {"$sort": {"total_sold": -1}}, {"$limit": 5}
    ]).to_list(5)

    recent_orders = await db.orders.find({}).sort("created_at", -1).limit(5).to_list(5)
    for o in recent_orders:
        o.pop("_id", None)

    daily_sales = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.orders.count_documents({
            "status": {"$ne": "cancelled"}, "created_at": {"$gte": day_start, "$lt": day_end}
        })
        day_rev = await db.orders.aggregate([
            {"$match": {"status": {"$ne": "cancelled"}, "created_at": {"$gte": day_start, "$lt": day_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]).to_list(1)
        daily_sales.append({
            "date": day_start.strftime("%b %d"), "orders": count,
            "revenue": day_rev[0]["total"] if day_rev else 0
        })

    low_stock = await db.products.find({"is_active": True, "stock": {"$lt": 10}}).sort("stock", 1).limit(10).to_list(10)
    for p in low_stock:
        p.pop("_id", None)

    return {
        "stats": {
            "total_orders": total_orders, "total_users": total_users,
            "total_products": total_products, "total_categories": total_categories,
            "total_revenue": round(total_revenue, 2), "month_revenue": round(month_revenue, 2),
            "month_orders": month_orders, "revenue_change_pct": round(revenue_change, 1),
        },
        "order_statuses": order_statuses, "top_products": top_products,
        "recent_orders": recent_orders, "daily_sales": daily_sales,
        "low_stock_products": low_stock,
    }


@router.get("/orders")
async def admin_list_orders(
    status: Optional[str] = None, search: Optional[str] = None,
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"user_email": {"$regex": search, "$options": "i"}},
            {"user_name": {"$regex": search, "$options": "i"}},
        ]
    total = await db.orders.count_documents(query)
    skip = (page - 1) * per_page
    items = await db.orders.find(query).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
    for item in items:
        item.pop("_id", None)
    return {"items": items, "total": total, "page": page, "per_page": per_page,
            "pages": math.ceil(total / per_page) if total > 0 else 1}


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str, data: UpdateOrderStatusRequest,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": data.status.value, "updated_at": datetime.utcnow()}}
    )
    doc = await db.orders.find_one({"id": order_id})
    doc.pop("_id", None)
    return doc


@router.get("/users")
async def admin_list_users(
    search: Optional[str] = None, role: Optional[str] = None,
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]
    total = await db.users.count_documents(query)
    skip = (page - 1) * per_page
    items = await db.users.find(query, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
    for item in items:
        item.pop("_id", None)
    return {"items": items, "total": total, "page": page, "per_page": per_page,
            "pages": math.ceil(total / per_page) if total > 0 else 1}


@router.put("/users/{user_id}/toggle-active", response_model=MessageResponse)
async def toggle_user_active(user_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_status = not user.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_status}})
    return MessageResponse(message=f"User {'activated' if new_status else 'deactivated'}")


@router.get("/inventory")
async def get_inventory(
    low_stock_only: bool = False,
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    query = {"is_active": True}
    if low_stock_only:
        query["stock"] = {"$lt": 10}
    total = await db.products.count_documents(query)
    skip = (page - 1) * per_page
    items = await db.products.find(
        query, {"id": 1, "title": 1, "handle": 1, "stock": 1, "collection": 1, "images": 1, "price": 1}
    ).sort("stock", 1).skip(skip).limit(per_page).to_list(per_page)
    for item in items:
        item.pop("_id", None)
    return {"items": items, "total": total, "page": page, "per_page": per_page,
            "pages": math.ceil(total / per_page) if total > 0 else 1}


@router.put("/inventory/{product_id}")
async def update_inventory(product_id: str, stock: int, current_user: dict = Depends(require_admin)):
    db = get_db()
    if stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"stock": stock, "updated_at": datetime.utcnow()}}
    )
    return {"product_id": product_id, "stock": stock, "message": "Stock updated"}


@router.get("/coupons")
async def list_coupons(current_user: dict = Depends(require_admin)):
    db = get_db()
    items = await db.coupons.find({}).sort("created_at", -1).to_list(100)
    for item in items:
        item.pop("_id", None)
    return items


@router.post("/coupons", status_code=201)
async def create_coupon(data: CouponCreate, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.coupons.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    payload = data.dict()
    payload["code"] = data.code.upper()
    coupon = CouponDB(**payload)
    await db.coupons.insert_one(coupon.dict())
    result = coupon.dict()
    return result


@router.put("/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, data: CouponUpdate, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.coupons.find_one({"id": coupon_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")
    update = {k: v for k, v in data.dict().items() if v is not None}
    await db.coupons.update_one({"id": coupon_id}, {"$set": update})
    doc = await db.coupons.find_one({"id": coupon_id})
    doc.pop("_id", None)
    return doc


@router.delete("/coupons/{coupon_id}", response_model=MessageResponse)
async def delete_coupon(coupon_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    existing = await db.coupons.find_one({"id": coupon_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await db.coupons.delete_one({"id": coupon_id})
    return MessageResponse(message="Coupon deleted")
