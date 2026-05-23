"""
KHOGA eCommerce backend pytest suite.
Tests all critical endpoints: auth, products, categories, cart, orders, admin, coupons.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://indie-commerce-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@khogaeg.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")

# Shared state across the module
STATE = {}


def _no_leak_mongo_id(obj):
    """Recursively ensure no '_id' keys are present."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"Mongo _id leaked: {list(obj.keys())}"
        for v in obj.values():
            _no_leak_mongo_id(v)
    elif isinstance(obj, list):
        for v in obj:
            _no_leak_mongo_id(v)


# ─── Health & Public ─────────────────────────────────────────────────────────
class TestHealth:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"


class TestProducts:
    def test_list_products(self):
        r = requests.get(f"{API}/products", params={"per_page": 50})
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "total" in data
        assert data["total"] >= 32, f"Expected >=32 seeded products, got {data['total']}"
        assert isinstance(data["items"], list)
        _no_leak_mongo_id(data)
        STATE["product_id"] = data["items"][0]["id"]
        STATE["product_handle"] = data["items"][0]["handle"]

    def test_list_search(self):
        r = requests.get(f"{API}/products", params={"search": "Turkish"})
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) > 0
        assert any("turkish" in i["title"].lower() for i in items)

    def test_list_filter_collection(self):
        r = requests.get(f"{API}/products", params={"collection": "turkish-coffee"})
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) > 0
        assert all(i["collection"] == "turkish-coffee" for i in items)

    def test_pagination(self):
        r = requests.get(f"{API}/products", params={"page": 1, "per_page": 5})
        assert r.status_code == 200
        data = r.json()
        assert len(data["items"]) <= 5
        assert data["page"] == 1 and data["per_page"] == 5

    def test_get_by_handle(self):
        r = requests.get(f"{API}/products/handle/turkish-coffee-200g")
        assert r.status_code == 200
        data = r.json()
        assert data["handle"] == "turkish-coffee-200g"
        _no_leak_mongo_id(data)

    def test_get_by_handle_404(self):
        r = requests.get(f"{API}/products/handle/non-existent-xyz")
        assert r.status_code == 404


class TestCategories:
    def test_list_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 7
        _no_leak_mongo_id(items)


# ─── Auth ────────────────────────────────────────────────────────────────────
class TestAuth:
    def test_admin_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        STATE["admin_token"] = data["access_token"]
        _no_leak_mongo_id(data)

    def test_register_customer(self):
        ts = int(time.time())
        email = f"customer-{ts}@khogaeg.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "Test Customer", "email": email, "password": "Customer@123"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "customer"
        STATE["customer_token"] = data["access_token"]
        STATE["customer_email"] = email
        STATE["customer_id"] = data["user"]["id"]
        _no_leak_mongo_id(data)

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={
            "name": "Dup", "email": STATE["customer_email"], "password": "Customer@123"
        })
        assert r.status_code == 400

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nope@nope.com", "password": "wrong"})
        assert r.status_code == 401

    def test_get_me(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {STATE['customer_token']}"})
        assert r.status_code == 200
        assert r.json()["email"] == STATE["customer_email"]


# ─── Cart (guest with session id) ────────────────────────────────────────────
class TestGuestCart:
    def test_get_empty_cart(self):
        sid = str(uuid.uuid4())
        STATE["session_id"] = sid
        r = requests.get(f"{API}/cart", headers={"X-Session-Id": sid})
        assert r.status_code == 200
        data = r.json()
        assert data["items"] == []
        assert data["total"] == 0
        _no_leak_mongo_id(data)

    def test_add_to_cart(self):
        r = requests.post(
            f"{API}/cart/items",
            headers={"X-Session-Id": STATE["session_id"]},
            json={"product_id": STATE["product_id"], "quantity": 2, "selected_variants": {}}
        )
        assert r.status_code == 201, r.text
        data = r.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 2
        STATE["item_id"] = data["items"][0]["item_id"]
        _no_leak_mongo_id(data)

    def test_update_cart_item(self):
        r = requests.put(
            f"{API}/cart/items/{STATE['item_id']}",
            headers={"X-Session-Id": STATE["session_id"]},
            json={"quantity": 3}
        )
        assert r.status_code == 200
        assert r.json()["items"][0]["quantity"] == 3

    def test_persistence_same_session(self):
        r = requests.get(f"{API}/cart", headers={"X-Session-Id": STATE["session_id"]})
        assert r.status_code == 200
        assert len(r.json()["items"]) == 1

    def test_invalid_coupon(self):
        r = requests.post(f"{API}/cart/coupon",
                          headers={"X-Session-Id": STATE["session_id"]},
                          json={"code": "NONEXISTENTCODE"})
        assert r.status_code == 400

    def test_remove_item(self):
        r = requests.delete(
            f"{API}/cart/items/{STATE['item_id']}",
            headers={"X-Session-Id": STATE["session_id"]}
        )
        assert r.status_code == 200


# ─── Admin Endpoints ─────────────────────────────────────────────────────────
class TestAdminAccess:
    def test_admin_dashboard_no_auth(self):
        r = requests.get(f"{API}/admin/dashboard")
        assert r.status_code in (401, 403)

    def test_admin_dashboard_customer(self):
        r = requests.get(f"{API}/admin/dashboard",
                         headers={"Authorization": f"Bearer {STATE['customer_token']}"})
        assert r.status_code == 403

    def test_admin_dashboard(self):
        r = requests.get(f"{API}/admin/dashboard",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"})
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["stats", "recent_orders", "top_products", "daily_sales", "order_statuses"]:
            assert k in data, f"missing key {k}"
        _no_leak_mongo_id(data)

    def test_admin_list_orders(self):
        r = requests.get(f"{API}/admin/orders",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"})
        assert r.status_code == 200
        assert "items" in r.json()

    def test_admin_list_users(self):
        r = requests.get(f"{API}/admin/users",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"})
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        # ensure password_hash never leaks
        for u in data["items"]:
            assert "password_hash" not in u


# ─── Admin Coupon CRUD ───────────────────────────────────────────────────────
class TestAdminCoupons:
    def test_create_coupon(self):
        code = f"TEST{int(time.time())}"
        r = requests.post(f"{API}/admin/coupons",
                          headers={"Authorization": f"Bearer {STATE['admin_token']}"},
                          json={"code": code, "discount_type": "percentage",
                                "discount_value": 10, "min_order_amount": 0,
                                "description": "Test 10% off"})
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["code"] == code.upper()
        STATE["coupon_id"] = data["id"]
        STATE["coupon_code"] = data["code"]
        _no_leak_mongo_id(data)

    def test_list_coupons(self):
        r = requests.get(f"{API}/admin/coupons",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"})
        assert r.status_code == 200
        codes = [c["code"] for c in r.json()]
        assert STATE["coupon_code"] in codes

    def test_apply_valid_coupon_guest(self):
        # add an item first
        sid = str(uuid.uuid4())
        requests.post(f"{API}/cart/items",
                      headers={"X-Session-Id": sid},
                      json={"product_id": STATE["product_id"], "quantity": 1, "selected_variants": {}})
        r = requests.post(f"{API}/cart/coupon",
                          headers={"X-Session-Id": sid},
                          json={"code": STATE["coupon_code"]})
        assert r.status_code == 200, r.text
        assert r.json()["discount"] > 0

    def test_update_coupon(self):
        r = requests.put(f"{API}/admin/coupons/{STATE['coupon_id']}",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"},
                         json={"discount_value": 15})
        assert r.status_code == 200
        assert r.json()["discount_value"] == 15

    def test_delete_coupon(self):
        r = requests.delete(f"{API}/admin/coupons/{STATE['coupon_id']}",
                            headers={"Authorization": f"Bearer {STATE['admin_token']}"})
        assert r.status_code == 200


# ─── Admin Product CRUD ──────────────────────────────────────────────────────
class TestAdminProductCRUD:
    def test_create_product(self):
        handle = f"test-product-{int(time.time())}"
        r = requests.post(f"{API}/products",
                          headers={"Authorization": f"Bearer {STATE['admin_token']}"},
                          json={"title": "TEST Product", "handle": handle,
                                "price": 100, "collection": "turkish-coffee",
                                "stock": 10, "description": "Test product",
                                "images": []})
        assert r.status_code == 201, r.text
        data = r.json()
        STATE["test_product_id"] = data["id"]
        _no_leak_mongo_id(data)

    def test_update_product(self):
        r = requests.put(f"{API}/products/{STATE['test_product_id']}",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"},
                         json={"price": 150})
        assert r.status_code == 200
        assert r.json()["price"] == 150

    def test_admin_update_inventory(self):
        r = requests.put(f"{API}/admin/inventory/{STATE['test_product_id']}",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"},
                         params={"stock": 25})
        assert r.status_code == 200, r.text
        assert r.json()["stock"] == 25

    def test_delete_product(self):
        r = requests.delete(f"{API}/products/{STATE['test_product_id']}",
                            headers={"Authorization": f"Bearer {STATE['admin_token']}"})
        assert r.status_code == 200


# ─── Order Placement End-to-End ──────────────────────────────────────────────
class TestOrderFlow:
    def test_place_order_empty_cart(self):
        # Customer with empty user-side cart
        r = requests.post(f"{API}/orders",
                          headers={"Authorization": f"Bearer {STATE['customer_token']}"},
                          json={
                              "shipping_address": {
                                  "full_name": "John Doe", "phone": "01000000000",
                                  "address_line1": "1 Tahrir St", "city": "Cairo",
                                  "governorate": "Cairo"
                              },
                              "payment_method": "cod"
                          })
        assert r.status_code == 400

    def test_add_to_user_cart_and_checkout(self):
        # Add to authenticated user cart
        h = {"Authorization": f"Bearer {STATE['customer_token']}"}
        r = requests.post(f"{API}/cart/items", headers=h,
                          json={"product_id": STATE["product_id"], "quantity": 1, "selected_variants": {}})
        assert r.status_code == 201, r.text

        # Place order
        r = requests.post(f"{API}/orders", headers=h, json={
            "shipping_address": {
                "full_name": "John Doe", "phone": "01000000000",
                "address_line1": "1 Tahrir St", "city": "Cairo",
                "governorate": "Cairo"
            },
            "payment_method": "cod"
        })
        assert r.status_code == 201, r.text
        order = r.json()
        assert order["status"] == "pending"
        assert order["total"] > 0
        STATE["order_id"] = order["id"]
        STATE["order_number"] = order["order_number"]
        _no_leak_mongo_id(order)

    def test_get_my_orders(self):
        r = requests.get(f"{API}/orders",
                         headers={"Authorization": f"Bearer {STATE['customer_token']}"})
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(o["id"] == STATE["order_id"] for o in items)

    def test_get_order_detail(self):
        r = requests.get(f"{API}/orders/{STATE['order_id']}",
                         headers={"Authorization": f"Bearer {STATE['customer_token']}"})
        assert r.status_code == 200
        assert r.json()["id"] == STATE["order_id"]

    def test_admin_update_order_status(self):
        r = requests.put(f"{API}/admin/orders/{STATE['order_id']}/status",
                         headers={"Authorization": f"Bearer {STATE['admin_token']}"},
                         json={"status": "processing"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "processing"

    def test_cancel_order_restores_stock(self):
        # Read pre-cancel stock
        pr = requests.get(f"{API}/products/handle/{STATE['product_handle']}")
        pre_stock = pr.json()["stock"]

        r = requests.post(f"{API}/orders/{STATE['order_id']}/cancel",
                          headers={"Authorization": f"Bearer {STATE['customer_token']}"})
        assert r.status_code == 200, r.text

        post = requests.get(f"{API}/products/handle/{STATE['product_handle']}").json()
        assert post["stock"] == pre_stock + 1, "Stock not restored after cancel"
