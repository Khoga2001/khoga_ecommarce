"""
KHOGA eCommerce Platform — Production FastAPI Server v1.0
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import sys

# ─── Setup ───────────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("khoga")

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ.get('DB_NAME', 'khoga_store')

# ─── Create App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="KHOGA eCommerce API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static Files ────────────────────────────────────────────────────────────
uploads_dir = Path("./uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
(uploads_dir / "products").mkdir(exist_ok=True)
(uploads_dir / "categories").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# ─── Include Routers ─────────────────────────────────────────────────────────
from fastapi import APIRouter
from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.categories import router as categories_router
from routes.cart import router as cart_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.misc import wishlist_router, reviews_router

api = APIRouter(prefix="/api")
api.include_router(auth_router)
api.include_router(products_router)
api.include_router(categories_router)
api.include_router(cart_router)
api.include_router(orders_router)
api.include_router(admin_router)
api.include_router(wishlist_router)
api.include_router(reviews_router)


@api.get("/", tags=["health"])
async def health():
    return {"status": "ok", "service": "KHOGA eCommerce API", "version": "1.0.0"}


app.include_router(api)


# ─── Startup ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("Starting KHOGA eCommerce API...")

    # DB connection
    client = AsyncIOMotorClient(MONGO_URL)
    database = client[DB_NAME]

    # Inject db into utils
    from utils.db import set_db
    set_db(database)

    # Indexes
    await database.users.create_index("email", unique=True)
    await database.users.create_index("id", unique=True)
    await database.products.create_index("handle", unique=True)
    await database.products.create_index("id", unique=True)
    await database.products.create_index([("collection", 1), ("is_active", 1)])
    await database.categories.create_index("handle", unique=True)
    await database.categories.create_index("id", unique=True)
    await database.orders.create_index("order_number", unique=True)
    await database.coupons.create_index("code", unique=True)
    await database.wishlists.create_index("user_id", unique=True)

    logger.info("Database indexes created")

    # Seed admin
    from utils.security import hash_password
    from models import UserDB, UserRole
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@khogaeg.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")

    if not await database.users.find_one({"email": admin_email}):
        admin = UserDB(
            email=admin_email,
            password_hash=hash_password(admin_password),
            name="KHOGA Admin",
            role=UserRole.admin,
            is_verified=True,
        )
        await database.users.insert_one(admin.dict())
        logger.info(f"Admin user seeded: {admin_email}")

    # Seed categories & products
    await _seed_categories(database)
    await _seed_products(database)

    logger.info("KHOGA API ready ✓")


async def _seed_categories(db):
    if await db.categories.count_documents({}) > 0:
        return
    from models import CategoryDB
    cats = [
        {"title": "Turkish Coffee", "handle": "turkish-coffee", "sort_order": 1,
         "image": "https://khogaeg.com/cdn/shop/collections/Gemini_Generated_Image_ukfvr1ukfvr1ukfv.png?v=1773231501"},
        {"title": "Espresso", "handle": "espresso", "sort_order": 2,
         "image": "https://khogaeg.com/cdn/shop/collections/Gemini_Generated_Image_db588idb588idb58.png?v=1773230781"},
        {"title": "Instant Coffee", "handle": "instant-coffee", "sort_order": 3,
         "image": "https://khogaeg.com/cdn/shop/collections/Gemini_Generated_Image_s5z989s5z989s5z9.png?v=1773230917"},
        {"title": "Hot Chocolate", "handle": "hot-chocolate", "sort_order": 4,
         "image": "https://khogaeg.com/cdn/shop/collections/Jenta-Plan-Post-9-4k-1774187292067.png?v=1774293858"},
        {"title": "Bundles", "handle": "bundles", "sort_order": 5,
         "image": "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-3-2k-1776966217407.png?v=1776967798"},
        {"title": "Mugs", "handle": "mugs", "sort_order": 6,
         "image": "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1778161272047.png?v=1778162013"},
        {"title": "Equipment", "handle": "equipment", "sort_order": 7,
         "image": "https://khogaeg.com/cdn/shop/files/21F5988F-278C-4349-A754-5374D1C5E41A.jpg?v=1771782123"},
    ]
    for c in cats:
        cat = CategoryDB(**c, description="")
        await db.categories.insert_one(cat.dict())
    logger.info(f"Seeded {len(cats)} categories")


async def _seed_products(db):
    if await db.products.count_documents({}) > 0:
        return
    from models import ProductDB, ProductVariant

    products = [
        # BUNDLES
        {"title": "Premium Espresso Bundle", "handle": "premium-espresso-bundle",
         "price": 650, "compare_price": 850, "collection": "bundles", "stock": 50, "is_featured": True,
         "description": "The ultimate espresso experience — a curated bundle of our finest house blend espresso and premium accessories.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-1-2k-1777224699941.png?v=1777225240",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1777224710666.png?v=1777225211",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-9-2k-1777224727164.png?v=1777225450"]},
        {"title": "Premium Turkish Coffee Bundle", "handle": "premium-turkish-coffee-bundle",
         "price": 660, "compare_price": 800, "collection": "bundles", "stock": 45, "is_featured": True,
         "description": "Indulge in the authentic taste of premium Turkish coffee with this specially crafted bundle.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-7-2k-1777047555377.png?v=1777050149",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-4-2k-1777048079953.png?v=1777049840",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-2-2k-1777048741971.png?v=1777049955"]},
        {"title": "Artisanal Morning Mini Bundle", "handle": "artisanal-morning-mini-bundle",
         "price": 449, "compare_price": 550, "collection": "bundles", "stock": 60,
         "description": "A perfect morning ritual in one box — your daily coffee companion.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-3-2k-1776966217407.png?v=1776967798",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-8-2k-1776966257097.png?v=1776967703"]},
        {"title": "Ice & Bloom Premium Bundle", "handle": "ice-bloom-premium-bundle",
         "price": 499, "compare_price": 599, "collection": "bundles", "stock": 35,
         "description": "A refreshing blend for those who love iced coffee.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-2-2k-1776965824700.png?v=1776967109",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-7-2k-1776965861194.png?v=1776966887"]},
        {"title": "Instant Coffee Bundle – The Bubble Edition (V.2)", "handle": "instant-coffee-bundle-bubble-edition",
         "price": 666, "compare_price": 738, "collection": "bundles", "stock": 25,
         "description": "The Bubble Edition returns — premium instant coffee.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-5-2k-1776884199292.png?v=1776968258",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1776884195522.png?v=1776968191"]},
        {"title": "The Marshmallow Cloud Bundle", "handle": "marshmallow-cloud-bundle",
         "price": 449, "compare_price": 600, "collection": "bundles", "stock": 20,
         "description": "Soft, sweet, and dreamy — cozy coffee experience.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-5-2k-1776884199292.png?v=1776968258"]},
        # INSTANT COFFEE
        {"title": "Khoga Instant Coffee – Premium – Gold", "handle": "instant-coffee-gold",
         "price": 395, "collection": "instant-coffee", "stock": 100, "is_featured": True,
         "description": "Our finest premium Gold instant coffee.",
         "variants": [{"name": "Size", "options": ["20 Sachets", "40 Sachets"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1774358406504.png?v=1776023699",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-1-2k-1774358320308.png?v=1776023009"]},
        {"title": "Khoga Instant Coffee – Premium – Classic", "handle": "instant-coffee-classic",
         "price": 289, "collection": "instant-coffee", "stock": 120,
         "description": "Classic premium instant coffee.",
         "variants": [{"name": "Size", "options": ["20 Sachets", "40 Sachets"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1774357589669.png?v=1776023612",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-2-2k-1774357701400.png?v=1776023069"]},
        {"title": "Khoga Coffee & Cream – Premium 3-in-1", "handle": "instant-coffee-3in1",
         "price": 169, "collection": "instant-coffee", "stock": 80,
         "description": "Coffee, sugar, and cream in one perfect sachet.",
         "variants": [{"name": "Size", "options": ["10 Sachets", "20 Sachets"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-2-2k-1774526751071.png?v=1776023214"]},
        {"title": "Khoga Rich Hazelnut – Premium 3-in-1", "handle": "instant-coffee-hazelnut-3in1",
         "price": 179, "compare_price": 200, "collection": "instant-coffee", "stock": 70,
         "description": "Rich hazelnut flavor with our premium 3-in-1 instant blend.",
         "variants": [{"name": "Size", "options": ["10 Sachets", "20 Sachets"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1774527197006.png?v=1776023187"]},
        # TURKISH COFFEE
        {"title": "Premium Turkish Coffee", "handle": "turkish-coffee-200g",
         "price": 299, "collection": "turkish-coffee", "stock": 90, "is_featured": True,
         "description": "The original house blend — eight years of perfection.",
         "variants": [{"name": "Roast", "options": ["Light", "Medium"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1775407889959.png?v=1776105025",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-1-2k-1775407912635.png?v=1776105025"]},
        {"title": "Premium Turkish Coffee – Cardamom", "handle": "turkish-coffee-cardamom-200g",
         "price": 319, "collection": "turkish-coffee", "stock": 75,
         "description": "Aromatic cardamom blended with our premium Turkish coffee.",
         "variants": [{"name": "Roast", "options": ["Light", "Medium"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-1-2k-1775408438334.png?v=1776105433",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-7-2k-1775408386242.png?v=1776105433"]},
        {"title": "Premium Turkish Coffee – Greek Mastic", "handle": "turkish-coffee-mastic-200g",
         "price": 369, "collection": "turkish-coffee", "stock": 55,
         "description": "The unique flavor of Greek Mastic.",
         "variants": [{"name": "Roast", "options": ["Light", "Medium"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-1-2k-1775143365010.png?v=1776104456"]},
        {"title": "Premium Turkish Coffee – Hazelnut", "handle": "turkish-coffee-hazelnut-200g",
         "price": 319, "collection": "turkish-coffee", "stock": 65,
         "description": "Warm hazelnut notes in our premium Turkish coffee blend.",
         "variants": [{"name": "Roast", "options": ["Light", "Medium"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-9-2k-1776369525295.png?v=1776442429"]},
        # ESPRESSO
        {"title": "Premium Espresso | House Blend - 100% Arabica", "handle": "espresso-beans-200g",
         "price": 325, "collection": "espresso", "stock": 80, "is_featured": True,
         "description": "100% Arabica house blend for your espresso machine.",
         "variants": [{"name": "Grind Options", "options": ["Whole Beans", "Espresso", "Filter", "French Press", "V60"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-5-2k-1778514988015.png?v=1778515311",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-8-2k-1778514999907.png?v=1778515242",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-3-2k-1778514965537.png?v=1778515351"]},
        # MUGS
        {"title": "The Artisan Speckled Stone Mug – Earth Edition", "handle": "artisan-speckled-stone-mug-earth-edition",
         "price": 210, "compare_price": 300, "collection": "mugs", "stock": 40,
         "description": "Handcrafted artisan speckled mug with an earthy aesthetic.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-6-2k-1778161272047.png?v=1778162013",
                    "https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-3-2k-1778161292188.png?v=1778162080"]},
        {"title": "Artisan Speckled Moss Mug – The Pure Edition", "handle": "artisan-speckled-moss-mug",
         "price": 210, "compare_price": 300, "collection": "mugs", "stock": 35,
         "description": "A mossy, natural-toned artisan mug.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-1-2k-1778347512069.png?v=1778348473"]},
        {"title": "Charcoal Shadow Ribbed Mug", "handle": "charcoal-shadow-ribbed-mug",
         "price": 180, "compare_price": 250, "collection": "mugs", "stock": 50,
         "description": "Deep charcoal ribbed porcelain.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-4-2k-1778348013805.png?v=1778349237"]},
        {"title": "Ash Grey Ribbed Mug", "handle": "ash-grey-ribbed-mug",
         "price": 180, "compare_price": 250, "collection": "mugs", "stock": 45,
         "description": "Subtle ash grey porcelain with ribbed texture.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-8-2k-1778347905298.png?v=1778349761"]},
        {"title": "Creamy Custard Ribbed Mug", "handle": "creamy-custard-ribbed-mug",
         "price": 180, "compare_price": 250, "collection": "mugs", "stock": 45,
         "description": "Warm custard cream ribbed mug.",
         "images": ["https://khogaeg.com/cdn/shop/files/Jenta-Plan-Post-5-2k-1778347891741.png?v=1778349470"]},
        {"title": "Ribbed Porcelain Comfort Mug", "handle": "ribbed-porcelain-comfort-mug",
         "price": 180, "compare_price": 250, "collection": "mugs", "stock": 60,
         "description": "Classic white ribbed porcelain mug.",
         "images": ["https://khogaeg.com/cdn/shop/files/WhatsApp_Image_2026-02-24_at_2.33.01_PM.jpg?v=1771941776"]},
        # HOT CHOCOLATE
        {"title": "Luxury Hot Chocolate – Classic", "handle": "hot-chocolate-classic",
         "price": 199, "collection": "hot-chocolate", "stock": 85,
         "description": "Rich, velvety classic hot chocolate.",
         "variants": [{"name": "Size", "options": ["250g", "500g"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/IMG_3030.jpg?v=1772021591"]},
        {"title": "Luxury Hot Chocolate – Hazelnut", "handle": "hot-chocolate-hazelnut",
         "price": 199, "compare_price": 200, "collection": "hot-chocolate", "stock": 70,
         "description": "Smooth hazelnut luxury chocolate.",
         "variants": [{"name": "Size", "options": ["250g", "500g"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/IMG_3036.jpg?v=1772021589"]},
        {"title": "Luxury Hot Chocolate – Caramel", "handle": "hot-chocolate-caramel",
         "price": 199, "compare_price": 250, "collection": "hot-chocolate", "stock": 65,
         "description": "Buttery caramel hot chocolate.",
         "variants": [{"name": "Size", "options": ["250g", "500g"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/IMG_3032.jpg?v=1772021589"]},
        {"title": "Luxury Hot Chocolate – Sparkle Strawberry", "handle": "hot-chocolate-strawberry",
         "price": 199, "compare_price": 250, "collection": "hot-chocolate", "stock": 55,
         "description": "Fruity strawberry sparkle hot chocolate.",
         "variants": [{"name": "Size", "options": ["250g", "500g"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/IMG_3031.jpg?v=1772021588"]},
        {"title": "Luxury Hot Chocolate – Coconut", "handle": "hot-chocolate-coconut",
         "price": 199, "compare_price": 250, "collection": "hot-chocolate", "stock": 60,
         "description": "Tropical coconut hot chocolate.",
         "variants": [{"name": "Size", "options": ["250g", "500g"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/IMG_3037.jpg?v=1772022098"]},
        {"title": "Luxury Hot Chocolate – Sparkle Coconut", "handle": "hot-chocolate-sparkle-coconut",
         "price": 199, "compare_price": 250, "collection": "hot-chocolate", "stock": 50,
         "description": "A glittering coconut luxury hot chocolate.",
         "variants": [{"name": "Size", "options": ["250g", "500g"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/IMG_3035.jpg?v=1772021952"]},
        # EQUIPMENT
        {"title": "Moka Pot", "handle": "moka-pot",
         "price": 370, "collection": "equipment", "stock": 30,
         "description": "Classic stovetop Moka pot.",
         "variants": [{"name": "Size", "options": ["3 Cup", "6 Cup", "9 Cup"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/21F5988F-278C-4349-A754-5374D1C5E41A.jpg?v=1771782123",
                    "https://khogaeg.com/cdn/shop/files/EBEF2453-4584-4FFB-95F7-AC04D098F988.jpg?v=1771782123"]},
        {"title": "Sabrataya - Traditional Copper Spirit Burner", "handle": "sabrataya-copper-spirit-burner",
         "price": 370, "compare_price": 450, "collection": "equipment", "stock": 20,
         "description": "Handcrafted traditional copper spirit burner.",
         "images": ["https://khogaeg.com/cdn/shop/files/4CAB221E-1BD2-4CBA-90B6-DAADC74B04BB.jpg?v=1771782651"]},
        {"title": "Kanaka - Handcrafted Copper Coffee Pot", "handle": "kanaka-copper-coffee-pot",
         "price": 180, "compare_price": 220, "collection": "equipment", "stock": 40,
         "description": "A traditional copper Kanaka.",
         "variants": [{"name": "Size", "options": ["Small", "Medium", "Large"]}],
         "images": ["https://khogaeg.com/cdn/shop/files/WhatsAppImage2026-02-24at2.33.09PM_1.jpg?v=1771939060"]},
        {"title": "The Royal Turkish Brewing Set", "handle": "royal-turkish-brewing-set",
         "price": 499, "compare_price": 670, "collection": "equipment", "stock": 15,
         "description": "Complete royal brewing experience.",
         "images": ["https://khogaeg.com/cdn/shop/files/WhatsAppImage2026-02-24at2.33.10PM_2.jpg?v=1771939372"]},
        {"title": "Handheld Milk Frother", "handle": "handheld-milk-frother",
         "price": 245, "compare_price": 300, "collection": "equipment", "stock": 35,
         "description": "Handheld battery-powered milk frother.",
         "images": ["https://khogaeg.com/cdn/shop/files/WhatsAppImage2026-04-28at6.19.59PM.jpg?v=1777390361",
                    "https://khogaeg.com/cdn/shop/files/5857473001425669713.jpg?v=1777390361"]},
    ]

    for p in products:
        variants_raw = p.pop("variants", [])
        variants = [ProductVariant(**v) for v in variants_raw]
        product = ProductDB(**p, variants=variants)
        await db.products.insert_one(product.dict())

    logger.info(f"Seeded {len(products)} products")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down KHOGA API")
