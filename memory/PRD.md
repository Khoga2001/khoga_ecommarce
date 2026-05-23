# KHOGA Coffee Store — PRD

## Original Problem Statement
Build a complete standalone, production-ready eCommerce platform from scratch replicating the Shopify store at `khogaeg.com`. Project must be fully independent from Shopify with a custom scalable backend (Auth, Products, Orders, Admin panel).

### User-Locked Requirements
- **Skip Stripe / real payments** — orders use Cash on Delivery
- **Local server image storage** at `/app/uploads/{products,categories}`
- **Admin dashboard** as a separate route in the same React app (`/admin/*`)
- **Currency**: EGP (display as `LE … EGP`)
- **Email notifications** built as a decoupled module (placeholder; activate later with SMTP creds for `info@khogaeg.com`)
- **Language**: English

## Tech Stack
- **Frontend**: React (CRA) + React Router DOM v6 nested routes + Context API + Sonner (toasts) + lucide-react icons + custom CSS in `App.css`
- **Backend**: FastAPI + Motor (async MongoDB) + Pydantic + python-jose (JWT) + passlib (bcrypt) + uvicorn
- **DB**: MongoDB (single database)
- **Auth**: Custom JWT (HS256, 7-day expiry); X-Session-Id header for guest cart

## Implemented (Feb 2026)

### Backend (`/app/backend/`)
- Modular routes: `auth`, `products`, `categories`, `cart`, `orders`, `admin`, `misc` (wishlist/reviews)
- Models in `models.py` (User, Product, Category, Cart, Order, Coupon, Review, Wishlist)
- Utilities: `utils/security.py` (JWT, bcrypt, require_admin, get_optional_user), `utils/db.py`, `utils/helpers.py` (file upload)
- Startup seeds: admin user (`admin@khogaeg.com` / `Admin@123`), 7 categories, 32 products
- Static `/uploads` served by FastAPI
- 39 pytest regression tests in `/app/backend/tests/test_khoga_api.py` — 100% pass

### Frontend (`/app/frontend/src/`)
- **Storefront**: Home (live API, hero video, category marquee, 6 product sections, reviews), Collection (sorted/filtered), Product (gallery, variants, qty, add-to-cart), Search
- **Auth UI**: Login, Register, Account (profile/orders/admin link), protected routes via `ProtectedRoute.jsx`
- **Cart**: Persistent server-side cart (guest via X-Session-Id, user via Authorization), drawer with quantity controls, coupon support
- **Checkout flow**: Address form (Egyptian governorates), payment method (COD), coupon apply/remove, place order → confirmation page
- **Order Management**: `/account/orders` list + `/account/orders/:id` detail with cancel option
- **Admin Panel** (`/admin/*`, protected adminOnly):
  - Dashboard: KPIs (revenue/orders/customers/products), 7-day sales sparkline, status breakdown, recent orders, top products, low stock
  - Orders: list/search/filter by status, inline status change, view modal
  - Products: list/search/paginate, full editor (title/desc/price/stock/category/variants/images), local image upload + remove
  - Categories: grid view, create/edit, image upload
  - Inventory: stock adjustment with low-stock filter
  - Users: list/search, activate/deactivate
  - Coupons: full CRUD with percentage/fixed, min order, max uses, expiry
- Currency utility: `LE 250.00 EGP` everywhere via `utils/format.js`

## Test Credentials
See `/app/memory/test_credentials.md`. Admin: `admin@khogaeg.com` / `Admin@123`

## P0 — All Done ✅
- [x] Frontend wired to live backend (mock data deleted)
- [x] Auth UI (Login + Register + Account)
- [x] Full checkout → order → confirmation flow
- [x] Admin Dashboard with full CRUD on Products, Categories, Orders, Users, Coupons, Inventory

## P1 — Next Up
- [ ] Guest → user cart merge on login (currently MVP limitation: items added pre-login stay under session)
- [ ] Wishlist UI (backend endpoints exist)
- [ ] Product Reviews UI on product page (backend endpoints exist)
- [ ] User profile edit form (`/account/edit` — backend has PUT `/api/auth/me`)
- [ ] Multi-address management UI

## P2 — Backlog
- [ ] Email notifications module activation (decoupled service; requires SMTP creds)
- [ ] Password reset flow (forgot password) — endpoint to be added
- [ ] Order tracking timeline / shipped tracking #
- [ ] Bulk product import (CSV) in admin
- [ ] Server.py refactor: extract `_seed_*` into `utils/seeds.py`
- [ ] Make shipping threshold (LE 500) configurable via env

## File Structure
```
/app
├── backend/
│   ├── server.py            # FastAPI bootstrap + seeds
│   ├── models.py            # Pydantic models
│   ├── routes/              # auth, products, categories, cart, orders, admin, misc
│   ├── utils/               # security, db, helpers
│   └── tests/test_khoga_api.py  # 39 pytest cases
├── frontend/
│   └── src/
│       ├── App.js           # Router with nested admin routes
│       ├── api/             # axios client + grouped api modules
│       ├── context/         # AuthContext, CartContext
│       ├── components/      # Navbar, Footer, ProductCard, CartDrawer, ProtectedRoute
│       ├── pages/           # Storefront pages
│       ├── pages/admin/     # Admin panel pages
│       └── utils/format.js  # Currency + image helpers
├── uploads/                 # Locally-stored product/category images
└── memory/                  # PRD + test credentials
```

## Status
**Feb 2026 — Full-stack MVP complete and tested.** Backend 100% (39/39), Frontend critical flows verified by testing agent. Ready for further enhancements.
