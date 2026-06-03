"""
KHOGA eCommerce Platform - All Pydantic Models & MongoDB Schemas
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum
import uuid


def gen_id():
    return str(uuid.uuid4())


# ─────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────

class UserRole(str, Enum):
    customer = "customer"
    admin = "admin"


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class DiscountType(str, Enum):
    percentage = "percentage"
    fixed = "fixed"


# ─────────────────────────────────────────
# USER MODELS
# ─────────────────────────────────────────

class AddressSchema(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    governorate: str
    country: str = "Egypt"
    postal_code: Optional[str] = None
    is_hearing_impaired: Optional[bool] = False


class UserDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    email: EmailStr
    password_hash: str
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.customer
    addresses: List[AddressSchema] = []
    default_address_idx: int = 0
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole
    addresses: List[AddressSchema] = []
    default_address_idx: int = 0
    is_active: bool
    created_at: datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class SetDefaultAddressRequest(BaseModel):
    index: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[AddressSchema] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ─────────────────────────────────────────
# PRODUCT MODELS
# ─────────────────────────────────────────

class ProductVariant(BaseModel):
    name: str
    options: List[str]


class ProductDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    title: str
    handle: str
    description: str = ""
    price: float
    compare_price: Optional[float] = None
    collection: str  # category handle
    images: List[str] = []  # file paths or URLs
    variants: List[ProductVariant] = []
    stock: int = 0
    is_active: bool = True
    is_featured: bool = False
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProductCreate(BaseModel):
    title: str
    handle: str
    description: str = ""
    price: float
    compare_price: Optional[float] = None
    collection: str
    variants: List[ProductVariant] = []
    stock: int = 0
    is_featured: bool = False
    tags: List[str] = []


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    collection: Optional[str] = None
    variants: Optional[List[ProductVariant]] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None


# ─────────────────────────────────────────
# CATEGORY MODELS
# ─────────────────────────────────────────

class CategoryDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    title: str
    handle: str
    description: str = ""
    image: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CategoryCreate(BaseModel):
    title: str
    handle: str
    description: str = ""
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


# ─────────────────────────────────────────
# CART MODELS
# ─────────────────────────────────────────

class CartItem(BaseModel):
    item_id: str = Field(default_factory=gen_id)
    product_id: str
    product_title: str
    product_image: Optional[str] = None
    product_handle: str
    price: float
    quantity: int = 1
    selected_variants: dict = {}


class CartDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[CartItem] = []
    coupon_code: Optional[str] = None
    coupon_discount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AddCartItemRequest(BaseModel):
    product_id: str
    quantity: int = 1
    selected_variants: dict = {}


class UpdateCartItemRequest(BaseModel):
    quantity: int


class ApplyCouponRequest(BaseModel):
    code: str


# ─────────────────────────────────────────
# ORDER MODELS
# ─────────────────────────────────────────

class OrderItem(BaseModel):
    product_id: str
    product_title: str
    product_handle: str
    product_image: Optional[str] = None
    price: float
    quantity: int
    selected_variants: dict = {}
    subtotal: float


class OrderDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    order_number: str = Field(default_factory=lambda: f"KHG-{str(uuid.uuid4())[:8].upper()}")
    user_id: str
    user_email: str
    user_name: str
    items: List[OrderItem] = []
    subtotal: float
    shipping_cost: float = 0.0
    discount: float = 0.0
    total: float
    coupon_code: Optional[str] = None
    shipping_address: AddressSchema
    status: OrderStatus = OrderStatus.pending
    payment_method: str = "cash_on_delivery"
    payment_status: str = "pending"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CheckoutRequest(BaseModel):
    shipping_address: AddressSchema
    payment_method: str = "cash_on_delivery"
    notes: Optional[str] = None


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus


# ─────────────────────────────────────────
# COUPON MODELS
# ─────────────────────────────────────────

class CouponDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    code: str
    description: str = ""
    discount_type: DiscountType
    discount_value: float
    min_order_amount: float = 0.0
    max_uses: Optional[int] = None
    used_count: int = 0
    expires_at: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CouponCreate(BaseModel):
    code: str
    description: str = ""
    discount_type: DiscountType
    discount_value: float
    min_order_amount: float = 0.0
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None


class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


# ─────────────────────────────────────────
# REVIEW MODELS
# ─────────────────────────────────────────

class ReviewDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    product_id: str
    user_id: str
    user_name: str
    rating: int  # 1-5
    comment: str = ""
    is_approved: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReviewCreate(BaseModel):
    rating: int
    comment: str = ""


# ─────────────────────────────────────────
# WISHLIST MODEL
# ─────────────────────────────────────────

class WishlistDB(BaseModel):
    id: str = Field(default_factory=gen_id)
    user_id: str
    product_ids: List[str] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────
# RESPONSE MODELS
# ─────────────────────────────────────────

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int


class MessageResponse(BaseModel):
    message: str
