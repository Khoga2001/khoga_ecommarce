"""
Cart routes — persistent server-side cart (by user or session)
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime
from typing import Optional
import uuid

from models import CartDB, CartItem, AddCartItemRequest, UpdateCartItemRequest, ApplyCouponRequest, MessageResponse
from utils.security import get_optional_user, get_current_user
from utils.db import get_db

router = APIRouter(prefix="/cart", tags=["cart"])


async def _get_or_create_cart(db, user_id: Optional[str], session_id: Optional[str]) -> dict:
    if user_id:
        cart = await db.carts.find_one({"user_id": user_id})
    elif session_id:
        cart = await db.carts.find_one({"session_id": session_id})
    else:
        cart = None

    if not cart:
        new_cart = CartDB(user_id=user_id, session_id=session_id if not user_id else None)
        await db.carts.insert_one(new_cart.dict())
        cart = new_cart.dict()
    cart.pop("_id", None)
    return cart


def _calc_totals(cart: dict) -> dict:
    items = cart.get("items", [])
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    discount = cart.get("coupon_discount", 0.0)
    shipping_cost = 0.0 if subtotal >= 500 else (60.0 if items else 0.0)
    total = max(0, subtotal + shipping_cost - discount)
    return {**cart, "subtotal": round(subtotal, 2), "discount": round(discount, 2),
            "shipping_cost": shipping_cost, "total": round(total, 2)}


@router.get("")
async def get_cart(
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    db = get_db()
    user_id = current_user["user_id"] if current_user else None
    session_id = x_session_id
    cart = await _get_or_create_cart(db, user_id, session_id)
    return _calc_totals(cart)


@router.post("/items", status_code=201)
async def add_to_cart(
    data: AddCartItemRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    db = get_db()
    user_id = current_user["user_id"] if current_user else None
    session_id = x_session_id

    product = await db.products.find_one({"id": data.product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.get("stock", 0) < data.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.get('stock', 0)} items in stock")

    cart = await _get_or_create_cart(db, user_id, session_id)

    variant_key = str(sorted(data.selected_variants.items()))
    existing_item = next(
        (i for i in cart["items"]
         if i["product_id"] == data.product_id and str(sorted(i.get("selected_variants", {}).items())) == variant_key),
        None
    )

    if existing_item:
        new_qty = existing_item["quantity"] + data.quantity
        if product.get("stock", 0) < new_qty:
            raise HTTPException(status_code=400, detail=f"Only {product.get('stock', 0)} items in stock")
        await db.carts.update_one(
            {"id": cart["id"], "items.item_id": existing_item["item_id"]},
            {"$set": {"items.$.quantity": new_qty, "updated_at": datetime.utcnow()}}
        )
    else:
        images = product.get("images", [])
        new_item = CartItem(
            product_id=data.product_id,
            product_title=product["title"],
            product_image=images[0] if images else None,
            product_handle=product["handle"],
            price=product["price"],
            quantity=data.quantity,
            selected_variants=data.selected_variants,
        )
        await db.carts.update_one(
            {"id": cart["id"]},
            {"$push": {"items": new_item.dict()}, "$set": {"updated_at": datetime.utcnow()}}
        )

    updated = await db.carts.find_one({"id": cart["id"]})
    updated.pop("_id", None)
    return _calc_totals(updated)


@router.put("/items/{item_id}")
async def update_cart_item(
    item_id: str,
    data: UpdateCartItemRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    db = get_db()
    user_id = current_user["user_id"] if current_user else None
    cart = await _get_or_create_cart(db, user_id, x_session_id)

    if data.quantity <= 0:
        await db.carts.update_one(
            {"id": cart["id"]},
            {"$pull": {"items": {"item_id": item_id}}, "$set": {"updated_at": datetime.utcnow()}}
        )
    else:
        await db.carts.update_one(
            {"id": cart["id"], "items.item_id": item_id},
            {"$set": {"items.$.quantity": data.quantity, "updated_at": datetime.utcnow()}}
        )

    updated = await db.carts.find_one({"id": cart["id"]})
    updated.pop("_id", None)
    return _calc_totals(updated)


@router.delete("/items/{item_id}", response_model=MessageResponse)
async def remove_cart_item(
    item_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    db = get_db()
    user_id = current_user["user_id"] if current_user else None
    cart = await _get_or_create_cart(db, user_id, x_session_id)
    await db.carts.update_one(
        {"id": cart["id"]},
        {"$pull": {"items": {"item_id": item_id}}, "$set": {"updated_at": datetime.utcnow()}}
    )
    return MessageResponse(message="Item removed from cart")


@router.delete("", response_model=MessageResponse)
async def clear_cart(
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    db = get_db()
    user_id = current_user["user_id"] if current_user else None
    cart = await _get_or_create_cart(db, user_id, x_session_id)
    await db.carts.update_one(
        {"id": cart["id"]},
        {"$set": {"items": [], "coupon_code": None, "coupon_discount": 0.0, "updated_at": datetime.utcnow()}}
    )
    return MessageResponse(message="Cart cleared")


@router.post("/coupon")
async def apply_coupon(
    data: ApplyCouponRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    db = get_db()
    user_id = current_user["user_id"] if current_user else None
    cart = await _get_or_create_cart(db, user_id, x_session_id)

    coupon = await db.coupons.find_one({"code": data.code.upper(), "is_active": True})
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon code")
    if coupon.get("expires_at") and coupon["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Coupon has expired")
    if coupon.get("max_uses") and coupon.get("used_count", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")

    items = cart.get("items", [])
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    if subtotal < coupon.get("min_order_amount", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount is LE {coupon['min_order_amount']:.0f} EGP"
        )

    discount = (subtotal * coupon["discount_value"] / 100) if coupon["discount_type"] == "percentage" else min(coupon["discount_value"], subtotal)

    await db.carts.update_one(
        {"id": cart["id"]},
        {"$set": {"coupon_code": coupon["code"], "coupon_discount": round(discount, 2), "updated_at": datetime.utcnow()}}
    )
    updated = await db.carts.find_one({"id": cart["id"]})
    updated.pop("_id", None)
    result = _calc_totals(updated)
    result["coupon_message"] = f"Coupon applied: {coupon.get('description') or coupon['code']}"
    return result


@router.post("/merge")
async def merge_guest_cart(
    current_user: dict = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id"),
):
    """Merge guest session cart into the authenticated user's cart on login."""
    db = get_db()
    user_id = current_user["user_id"]
    user_cart = await _get_or_create_cart(db, user_id, None)

    if not x_session_id:
        return _calc_totals(user_cart)

    session_cart = await db.carts.find_one({"session_id": x_session_id})
    if not session_cart or not session_cart.get("items"):
        return _calc_totals(user_cart)

    for item in session_cart["items"]:
        variant_key = str(sorted(item.get("selected_variants", {}).items()))
        existing_item = next(
            (i for i in user_cart["items"]
             if i["product_id"] == item["product_id"]
             and str(sorted(i.get("selected_variants", {}).items())) == variant_key),
            None,
        )
        if existing_item:
            new_qty = existing_item["quantity"] + item["quantity"]
            await db.carts.update_one(
                {"id": user_cart["id"], "items.item_id": existing_item["item_id"]},
                {"$set": {"items.$.quantity": new_qty, "updated_at": datetime.utcnow()}},
            )
        else:
            await db.carts.update_one(
                {"id": user_cart["id"]},
                {"$push": {"items": item}, "$set": {"updated_at": datetime.utcnow()}},
            )

    await db.carts.delete_one({"id": session_cart["id"]})
    updated = await db.carts.find_one({"id": user_cart["id"]})
    updated.pop("_id", None)
    return _calc_totals(updated)


@router.delete("/coupon", response_model=MessageResponse)
async def remove_coupon(
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    db = get_db()
    user_id = current_user["user_id"] if current_user else None
    cart = await _get_or_create_cart(db, user_id, x_session_id)
    await db.carts.update_one(
        {"id": cart["id"]},
        {"$set": {"coupon_code": None, "coupon_discount": 0.0, "updated_at": datetime.utcnow()}}
    )
    return MessageResponse(message="Coupon removed")
