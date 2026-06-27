# KHOGA eCommerce Platform — System Contracts

## API Base URL
All endpoints prefixed with `/api`

## Authentication
- JWT Bearer Token in `Authorization: Bearer <token>` header
- Token expiry: 7 days (access), 30 days (refresh)
- Roles: `customer` | `admin`

---

## Auth Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | None | Register new user |
| POST | /api/auth/login | None | Login, returns JWT |
| GET | /api/auth/me | JWT | Get current user |
| PUT | /api/auth/me | JWT | Update profile |
| POST | /api/auth/change-password | JWT | Change password |

---

## Products Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/products | None | List with filters/pagination |
| GET | /api/products/:id | None | Get product by id |
| GET | /api/products/handle/:handle | None | Get product by handle |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Soft delete |
| POST | /api/products/:id/images | Admin | Upload image |
| DELETE | /api/products/:id/images/:idx | Admin | Remove image |

---

## Categories Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/categories | None | List all categories |
| GET | /api/categories/:handle | None | Get by handle |
| POST | /api/categories | Admin | Create |
| PUT | /api/categories/:id | Admin | Update |
| DELETE | /api/categories/:id | Admin | Delete |

---

## Cart Endpoints (Persistent, Server-side)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/cart | JWT/Session | Get cart |
| POST | /api/cart/items | JWT/Session | Add item |
| PUT | /api/cart/items/:item_id | JWT/Session | Update qty |
| DELETE | /api/cart/items/:item_id | JWT/Session | Remove item |
| DELETE | /api/cart | JWT/Session | Clear cart |
| POST | /api/cart/coupon | JWT | Apply coupon |
| DELETE | /api/cart/coupon | JWT | Remove coupon |

---

## Orders Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/orders | JWT | My orders |
| GET | /api/orders/:id | JWT | Get order |
| POST | /api/orders | JWT | Place order (checkout) |
| POST | /api/orders/:id/cancel | JWT | Cancel order |

---

## Wishlist Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/wishlist | JWT | Get wishlist |
| POST | /api/wishlist/:product_id | JWT | Toggle wishlist |

---

## Admin Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/dashboard | Admin | Analytics overview |
| GET | /api/admin/orders | Admin | All orders + filters |
| PUT | /api/admin/orders/:id/status | Admin | Update order status |
| GET | /api/admin/users | Admin | All users |
| GET | /api/admin/inventory | Admin | Stock levels |
| PUT | /api/admin/inventory/:id | Admin | Update stock |
| GET | /api/admin/coupons | Admin | All coupons |
| POST | /api/admin/coupons | Admin | Create coupon |
| PUT | /api/admin/coupons/:id | Admin | Update coupon |
| DELETE | /api/admin/coupons/:id | Admin | Delete coupon |

---

## MongoDB Collections
- `users` — indexed on email
- `products` — indexed on handle, collection, is_active
- `categories` — indexed on handle
- `carts` — indexed on user_id, session_id
- `orders` — indexed on user_id, status
- `coupons` — indexed on code
- `reviews` — indexed on product_id, user_id

---

## Frontend Integration Mapping
| Mock Data | Real API |
|-----------|----------|
| mock/data.js products | GET /api/products |
| mock/data.js collections | GET /api/categories |
| CartContext (local) | GET/POST /api/cart |
| No auth | POST /api/auth/login + /register |
| No orders | POST /api/orders |
| No admin | /admin route + admin API |

---

## Image Storage
- Upload to `/uploads/products/` and `/uploads/categories/`
- Served via static `/uploads/` route
- Max file size: 5MB per image
- Formats: JPG, PNG, WEBP

---

## Error Response Format
```json
{ "detail": "Error message" }
```

## Success Response Format
```json
{ "data": {...}, "message": "Success" }
```
