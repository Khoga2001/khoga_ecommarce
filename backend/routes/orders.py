"""
Orders routes — checkout, order history, order status
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
import math

from models import OrderDB, OrderItem, CheckoutRequest, OrderStatus, MessageResponse
from utils.security import get_current_user
from utils.db import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
async def get_my_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["user_id"]}
    total = await db.orders.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(per_page)
    items = await cursor.to_list(per_page)
    for item in items:
        item.pop("_id", None)
    return {
        "items": items, "total": total, "page": page, "per_page": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 1
    }


@router.get("/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"$or": [{"id": order_id}, {"order_number": order_id}]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["user_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    order.pop("_id", None)
    return order


@router.post("", status_code=201)
async def place_order(data: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["user_id"]

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cart = await db.carts.find_one({"user_id": user_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_items = []
    subtotal = 0.0

    for ci in cart["items"]:
        product = await db.products.find_one({"id": ci["product_id"], "is_active": True})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product '{ci['product_title']}' is no longer available")
        if product.get("stock", 0) < ci["quantity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{ci['product_title']}' (available: {product.get('stock', 0)})"
            )
        item_subtotal = ci["price"] * ci["quantity"]
        order_items.append(OrderItem(
            product_id=ci["product_id"],
            product_title=ci["product_title"],
            product_handle=ci["product_handle"],
            product_image=ci.get("product_image"),
            price=ci["price"],
            quantity=ci["quantity"],
            selected_variants=ci.get("selected_variants", {}),
            subtotal=item_subtotal,
        ))
        subtotal += item_subtotal

    shipping_cost = 0.0 if subtotal >= 500 else 60.0
    coupon_discount = cart.get("coupon_discount", 0.0)
    coupon_code = cart.get("coupon_code")
    total = max(0, subtotal + shipping_cost - coupon_discount)

    order = OrderDB(
        user_id=user_id,
        user_email=user["email"],
        user_name=user["name"],
        items=[i.dict() for i in order_items],
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        discount=coupon_discount,
        total=total,
        coupon_code=coupon_code,
        shipping_address=data.shipping_address,
        payment_method=data.payment_method,
        notes=data.notes,
    )

    await db.orders.insert_one(order.dict())

    for ci in cart["items"]:
        await db.products.update_one(
            {"id": ci["product_id"]},
            {"$inc": {"stock": -ci["quantity"]}, "$set": {"updated_at": datetime.utcnow()}}
        )

    if coupon_code:
        await db.coupons.update_one({"code": coupon_code}, {"$inc": {"used_count": 1}})

    await db.carts.update_one(
        {"id": cart["id"]},
        {"$set": {"items": [], "coupon_code": None, "coupon_discount": 0.0, "updated_at": datetime.utcnow()}}
    )

    result = order.dict()
    return result


@router.post("/{order_id}/cancel", response_model=MessageResponse)
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["user_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    if order["status"] in [OrderStatus.shipped.value, OrderStatus.delivered.value]:
        raise HTTPException(status_code=400, detail="Cannot cancel a shipped or delivered order")
    if order["status"] == OrderStatus.cancelled.value:
        raise HTTPException(status_code=400, detail="Order already cancelled")

    for item in order.get("items", []):
        await db.products.update_one(
            {"id": item["product_id"]},
            {"$inc": {"stock": item["quantity"]}, "$set": {"updated_at": datetime.utcnow()}}
        )

    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": OrderStatus.cancelled.value, "updated_at": datetime.utcnow()}}
    )
    return MessageResponse(message="Order cancelled successfully")
