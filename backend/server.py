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
        {
        "title": 'Moka pot',
        "handle": 'moka-pot',
        "price": 370.0, "compare_price": None, "collection": "equipment", "stock": 50,
        "description": """<p><span>Classic 2-Cup Moka Pot - Compact Aluminum Espresso Maker</span></p>
<p><span>Product Description:</span></p>
<p><span>Brew the perfect Italian-style espresso at home with this classic 2-cup Moka Pot. Made from high-quality aluminum for even heating, it delivers a rich, bold coffee in minutes—perfect for your daily caffeine fix.</span></p>
<p><span>• </span><span>Capacity:</span><span> 2 Espresso Cups (approx. 100ml).</span></p>
<p><span>• </span><span>Material:</span><span> Durable, food-grade aluminum with a heat-resistant handle.</span></p>
<p><span>• </span><span>Compatibility:</span><span> Works on gas, electric, and ceramic stovetops.</span></p>""",
        "images": ['https://cdn.shopify.com/s/files/1/0774/5067/4212/files/21F5988F-278C-4349-A754-5374D1C5E41A.jpg', 'https://cdn.shopify.com/s/files/1/0774/5067/4212/files/EBEF2453-4584-4FFB-95F7-AC04D098F988.jpg', 'https://cdn.shopify.com/s/files/1/0774/5067/4212/files/D1A6B222-A879-463C-8DAA-2A6ADEB3A0C4.jpg']
    },
        {
        "title": 'Sabrataya - Traditional Copper Spirit Burner',
        "handle": 'sabrataya-copper-spirit-burner',
        "price": 370.0, "compare_price": 450.0, "collection": "equipment", "stock": 50,
        "description": """<p data-path-to-node="4">Experience the true art of slow-brewed coffee with our handcrafted <b data-path-to-node="4" data-index-in-node="85">Copper Spirit Burner</b>. Designed for coffee purists, this "Sertaya" brings a vintage charm to your brewing ritual, allowing the coffee to cook slowly over a gentle flame for that perfect, rich crema.</p>
<p data-path-to-node="5"><b data-path-to-node="5" data-index-in-node="0">Why It’s Special:</b></p>
<ul data-path-to-node="6">
<li>
<p data-path-to-node="6,0,0"><b data-path-to-node="6,0,0" data-index-in-node="0">Handcrafted Excellence:</b> Made from high-quality polished copper for durability and a classic look.</p>
</li>
<li>
<p data-path-to-node="6,1,0"><b data-path-to-node="6,1,0" data-index-in-node="0">Slow Brewing Ritual:</b> Perfect for use with our copper "Kanaka" to achieve the authentic Turkish coffee taste.</p>
</li>
<li>
<p data-path-to-node="6,2,0"><b data-path-to-node="6,2,0" data-index-in-node="0">Decorative Piece:</b> A stunning addition to any coffee corner, blending heritage with elegance.</p>
</li>
<li>
<p data-path-to-node="6,3,0"><b data-path-to-node="6,3,0" data-index-in-node="0">Portable &amp; Functional:</b> Compact design that works anywhere, anytime.</p>
</li>
</ul>
<p data-path-to-node="7"><b data-path-to-node="7" data-index-in-node="0">Technical Details:</b></p>
<ul data-path-to-node="8">
<li>
<p data-path-to-node="8,0,0"><b data-path-to-node="8,0,0" data-index-in-node="0">Material:</b> 100% Solid Copper.</p>
</li>
<li>
<p data-path-to-node="8,1,0"><b data-path-to-node="8,1,0" data-index-in-node="0">Fuel Type:</b> Liquid Alcohol (Spirit).</p>
</li>
<li>
<p data-path-to-node="8,2,0"><b data-path-to-node="8,2,0" data-index-in-node="0">Included:</b> Burner base, wick, and protective cap.</p>
</li>
</ul>""",
        "images": ['https://cdn.shopify.com/s/files/1/0774/5067/4212/files/4CAB221E-1BD2-4CBA-90B6-DAADC74B04BB.jpg']
    },
        {
        "title": 'Kanaka - Handcrafted Copper Coffee Pot',
        "handle": 'kanaka-copper-coffee-pot',
        "price": 180.0, "compare_price": 220.0, "collection": "equipment", "stock": 50,
        "description": """<p data-path-to-node="4">Master the art of Turkish coffee with our <b data-path-to-node="4" data-index-in-node="60">Premium Copper Kanaka</b>. Hand-forged with high-quality copper and featuring a sturdy wooden handle, this pot is designed to distribute heat evenly. This ensures your coffee brews at the perfect pace, resulting in that thick, rich "Wesh" (crema) that every coffee lover craves.</p>
<p data-path-to-node="5"><b data-path-to-node="5" data-index-in-node="0">Key Features:</b></p>
<ul data-path-to-node="6">
<li>
<p data-path-to-node="6,0,0"><b data-path-to-node="6,0,0" data-index-in-node="0">Authentic Craftsmanship:</b> Made from solid, high-grade copper for a timeless vintage look and exceptional durability.</p>
</li>
<li>
<p data-path-to-node="6,1,0"><b data-path-to-node="6,1,0" data-index-in-node="0">Heat Distribution:</b> Copper is the best conductor of heat, allowing for the gentle, slow brewing essential for Turkish coffee.</p>
</li>
<li>
<p data-path-to-node="6,2,0"><b data-path-to-node="6,2,0" data-index-in-node="0">Ergonomic Wooden Handle:</b> Stay-cool wooden handle provides a comfortable and safe grip while brewing over the spirit burner.</p>
</li>
<li>
<p data-path-to-node="6,3,0"><b data-path-to-node="6,3,0" data-index-in-node="0">Precision Pouring:</b> Specially designed spout for a clean, drip-free pour into your favorite cups.</p>
</li>
</ul>
<p data-path-to-node="7"><b data-path-to-node="7" data-index-in-node="0">Specifications:</b></p>
<ul data-path-to-node="8">
<li>
<p data-path-to-node="8,0,0"><b data-path-to-node="8,0,0" data-index-in-node="0">Material:</b> 100% Solid Copper with a Natural Wood Handle.</p>
</li>
<li>
<p data-path-to-node="8,1,0"><b data-path-to-node="8,1,0" data-index-in-node="0">Compatibility:</b> Ideal for use with our Copper Spirit Burner (Sertaya).</p>
</li>
<li>
<p data-path-to-node="8,2,0"><b data-path-to-node="8,2,0" data-index-in-node="0">Care:</b> Hand wash recommended to maintain its brilliant luster.</p>
</li>
</ul>""",
        "images": ['https://cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.09PM_1.jpg']
    },
        {
        "title": 'The Royal Turkish Brewing Set Handcrafted Copper Spirit Burner & Coffee Pot',
        "handle": 'royal-turkish-brewing-set',
        "price": 499.0, "compare_price": 670.0, "collection": "equipment", "stock": 50,
        "description": """<p data-path-to-node="5"><b data-path-to-node="5" data-index-in-node="0">Overview:</b> Master the traditional art of slow-brewing with the <b data-path-to-node="5" data-index-in-node="62">Royal Turkish Brewing Set</b>. This premium bundle brings together our handcrafted Copper Spirit Burner (Sertaya) and the matching Copper Coffee Pot (Kanaka). Designed for those who seek the ultimate coffee ritual, this set ensures a rich, flavorful cup with a perfect crema every single time.</p>
<h3 data-path-to-node="6"><b data-path-to-node="6" data-index-in-node="0">What’s Included:</b></h3>
<ul data-path-to-node="7">
<li>
<p data-path-to-node="7,0,0"><b data-path-to-node="7,0,0" data-index-in-node="0">Handcrafted Copper Spirit Burner (Sertaya):</b> * A vintage-inspired piece made from solid copper, providing a gentle flame for slow brewing.</p>
</li>
<li>
<p data-path-to-node="7,1,0"><b data-path-to-node="7,1,0" data-index-in-node="0">Premium Copper Coffee Pot (Kanaka):</b> * Expertly forged with a stay-cool wooden handle and a precision-pour spout.</p>
</li>
<li>
<p data-path-to-node="7,2,0"><b data-path-to-node="7,2,0" data-index-in-node="0">Essential Accessories:</b> * Includes a protective cap and a custom funnel for easy fuel refilling.</p>
</li>
</ul>
<hr data-path-to-node="8">
<h3 data-path-to-node="9"><b data-path-to-node="9" data-index-in-node="0">Why Buy the Set?</b></h3>
<ul data-path-to-node="10">
<li>
<p data-path-to-node="10,0,0"><b data-path-to-node="10,0,0" data-index-in-node="0">Perfectly Paired:</b> The burner and pot are designed to work in harmony, distributing heat evenly for the best taste.</p>
</li>
<li>
<p data-path-to-node="10,1,0"><b data-path-to-node="10,1,0" data-index-in-node="0">Timeless Aesthetic:</b> Adds a touch of luxury and heritage to your coffee station or kitchen.</p>
</li>
<li>
<p data-path-to-node="10,2,0"><b data-path-to-node="10,2,0" data-index-in-node="0">The Ultimate Gift:</b> An ideal choice for coffee connoisseurs who appreciate craftsmanship and tradition.</p>
</li>
<li>
<p data-path-to-node="10,3,0"><b data-path-to-node="10,3,0" data-index-in-node="0">Durability:</b> Made from 100% solid, high-grade copper to last a lifetime.</p>
</li>
</ul>
<hr data-path-to-node="11">
<h3 data-path-to-node="12"><b data-path-to-node="12" data-index-in-node="0">Care Instructions:</b></h3>
<p data-path-to-node="13">To maintain the brilliant shine of your copper set, we recommend hand washing only and drying immediately with a soft cloth.</p>""",
        "images": ['https://cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.10PM_2.jpg', 'https://cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.09PM_1_116a3ab8-e55d-49d7-af3c-076867fe25aa.jpg', 'https://cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.09PM.jpg']
    },
        {
        "title": 'Handheld Milk Frother',
        "handle": 'handheld-milk-frother',
        "price": 245.0, "compare_price": 300.0, "collection": "equipment", "stock": 50,
        "description": """<p data-path-to-node="7"><b data-path-to-node="7" data-index-in-node="0" class="">The Ultimate Tool for a Perfect Creamy Foam</b></p>
<p data-path-to-node="8"><span class="">Upgrade your daily coffee routine with the </span><b data-path-to-node="8" data-index-in-node="43" class="">Elite Handheld Milk Frother</b><span class="">.</span><span class=""> Engineered for performance and convenience,</span><span class=""> this powerful tool creates a café-quality micro-foam in seconds,</span><span class=""> giving your home-brewed coffee a professional barista touch.</span></p>
<p data-path-to-node="9"><b data-path-to-node="9" data-index-in-node="0" class="">Key Features:</b></p>
<ul data-path-to-node="10">
<li>
<p data-path-to-node="10,0,0"><b data-path-to-node="10,0,0" data-index-in-node="0" class="">USB Rechargeable:</b><span class=""> No more batteries.</span><span class=""> Equipped with a built-in rechargeable battery for long-lasting use and eco-friendly power.</span></p>
</li>
<li>
<p data-path-to-node="10,1,0"><b data-path-to-node="10,1,0" data-index-in-node="0" class="">High-Speed Motor:</b><span class=""> Delivers powerful rotation for instant,</span><span class=""> thick foam.</span></p>
</li>
<li>
<p data-path-to-node="10,2,0"><b data-path-to-node="10,2,0" data-index-in-node="0" class="">Interchangeable Whisks:</b><span class=""> Includes two stainless steel heads (Spring &amp; Balloon) for frothing milk or whisking light ingredients.</span></p>
</li>
<li>
<p data-path-to-node="10,3,0"><b data-path-to-node="10,3,0" data-index-in-node="0" class="">Three Speed Settings:</b><span class=""> Full control over your foam texture with adjustable speed levels.</span></p>
</li>
<li>
<p data-path-to-node="10,4,0"><b data-path-to-node="10,4,0" data-index-in-node="0" class="">Sleek &amp; Durable:</b><span class=""> Premium matte finish with a lightweight,</span><span class=""> ergonomic design for comfortable handling.</span></p>
</li>
</ul>
<p data-path-to-node="11"><b data-path-to-node="11" data-index-in-node="0" class="">Clean &amp; Store:</b><span class=""> Simply rinse the whisk under water.</span><span class=""> Compact enough to fit in any kitchen drawer or coffee station.</span></p>
<hr data-path-to-node="12" class="">
<h3 data-path-to-node="13" class=""><b data-path-to-node="13" data-index-in-node="0">Specifications</b></h3>
<ul data-path-to-node="14">
<li>
<p data-path-to-node="14,0,0"><b data-path-to-node="14,0,0" data-index-in-node="0" class="">Charging:</b><span class=""> USB Cable (Included)</span></p>
</li>
<li>
<p data-path-to-node="14,1,0"><b data-path-to-node="14,1,0" data-index-in-node="0" class="">Speeds:</b><span class=""> Low / Medium / High</span></p>
</li>
<li>
<p data-path-to-node="14,2,0"><b data-path-to-node="14,2,0" data-index-in-node="0" class="">Best For:</b><span class=""> Lattes,</span><span class=""> Cappuccinos,</span><span class=""> Matcha,</span><span class=""> and Hot Chocolate.</span></p>
</li>
</ul>""",
        "images": ['https://cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-04-28at6.19.59PM.jpg', 'https://cdn.shopify.com/s/files/1/0774/5067/4212/files/5857473001425669713.jpg', 'https://cdn.shopify.com/s/files/1/0774/5067/4212/files/5978708044017241045.jpg', 'https://cdn.shopify.com/s/files/1/0774/5067/4212/files/5843477790358353986.jpg']
    },
    {
        "title": 'Sabrataya - Traditional Copper Spirit Burner',
        "handle": 'sabrataya-copper-spirit-burner',
        "price": 370.0, "compare_price": 450.0, "collection": "equipment", "stock": 50,
        "description": '''<p data-path-to-node="4">Experience the true art of slow-brewed coffee with our handcrafted <b data-path-to-node="4" data-index-in-node="85">Copper Spirit Burner</b>. Designed for coffee purists, this "Sertaya" brings a vintage charm to your brewing ritual, allowing the coffee to cook slowly over a gentle flame for that perfect, rich crema.</p>
<p data-path-to-node="5"><b data-path-to-node="5" data-index-in-node="0">Why It’s Special:</b></p>
<ul data-path-to-node="6">
<li>
<p data-path-to-node="6,0,0"><b data-path-to-node="6,0,0" data-index-in-node="0">Handcrafted Excellence:</b> Made from high-quality polished copper for durability and a classic look.</p>
</li>
<li>
<p data-path-to-node="6,1,0"><b data-path-to-node="6,1,0" data-index-in-node="0">Slow Brewing Ritual:</b> Perfect for use with our copper "Kanaka" to achieve the authentic Turkish coffee taste.</p>
</li>
<li>
<p data-path-to-node="6,2,0"><b data-path-to-node="6,2,0" data-index-in-node="0">Decorative Piece:</b> A stunning addition to any coffee corner, blending heritage with elegance.</p>
</li>
<li>
<p data-path-to-node="6,3,0"><b data-path-to-node="6,3,0" data-index-in-node="0">Portable &amp; Functional:</b> Compact design that works anywhere, anytime.</p>
</li>
</ul>
<p data-path-to-node="7"><b data-path-to-node="7" data-index-in-node="0">Technical Details:</b></p>
<ul data-path-to-node="8">
<li>
<p data-path-to-node="8,0,0"><b data-path-to-node="8,0,0" data-index-in-node="0">Material:</b> 100% Solid Copper.</p>
</li>
<li>
<p data-path-to-node="8,1,0"><b data-path-to-node="8,1,0" data-index-in-node="0">Fuel Type:</b> Liquid Alcohol (Spirit).</p>
</li>
<li>
<p data-path-to-node="8,2,0"><b data-path-to-node="8,2,0" data-index-in-node="0">Included:</b> Burner base, wick, and protective cap.</p>
</li>
</ul>''',
        "images": ['//cdn.shopify.com/s/files/1/0774/5067/4212/files/4CAB221E-1BD2-4CBA-90B6-DAADC74B04BB.jpg?v=1771782651']
    },
    {
        "title": 'Kanaka - Handcrafted Copper Coffee Pot',
        "handle": 'kanaka-copper-coffee-pot',
        "price": 180.0, "compare_price": 220.0, "collection": "equipment", "stock": 50,
        "description": '''<p data-path-to-node="4">Master the art of Turkish coffee with our <b data-path-to-node="4" data-index-in-node="60">Premium Copper Kanaka</b>. Hand-forged with high-quality copper and featuring a sturdy wooden handle, this pot is designed to distribute heat evenly. This ensures your coffee brews at the perfect pace, resulting in that thick, rich "Wesh" (crema) that every coffee lover craves.</p>
<p data-path-to-node="5"><b data-path-to-node="5" data-index-in-node="0">Key Features:</b></p>
<ul data-path-to-node="6">
<li>
<p data-path-to-node="6,0,0"><b data-path-to-node="6,0,0" data-index-in-node="0">Authentic Craftsmanship:</b> Made from solid, high-grade copper for a timeless vintage look and exceptional durability.</p>
</li>
<li>
<p data-path-to-node="6,1,0"><b data-path-to-node="6,1,0" data-index-in-node="0">Heat Distribution:</b> Copper is the best conductor of heat, allowing for the gentle, slow brewing essential for Turkish coffee.</p>
</li>
<li>
<p data-path-to-node="6,2,0"><b data-path-to-node="6,2,0" data-index-in-node="0">Ergonomic Wooden Handle:</b> Stay-cool wooden handle provides a comfortable and safe grip while brewing over the spirit burner.</p>
</li>
<li>
<p data-path-to-node="6,3,0"><b data-path-to-node="6,3,0" data-index-in-node="0">Precision Pouring:</b> Specially designed spout for a clean, drip-free pour into your favorite cups.</p>
</li>
</ul>
<p data-path-to-node="7"><b data-path-to-node="7" data-index-in-node="0">Specifications:</b></p>
<ul data-path-to-node="8">
<li>
<p data-path-to-node="8,0,0"><b data-path-to-node="8,0,0" data-index-in-node="0">Material:</b> 100% Solid Copper with a Natural Wood Handle.</p>
</li>
<li>
<p data-path-to-node="8,1,0"><b data-path-to-node="8,1,0" data-index-in-node="0">Compatibility:</b> Ideal for use with our Copper Spirit Burner (Sertaya).</p>
</li>
<li>
<p data-path-to-node="8,2,0"><b data-path-to-node="8,2,0" data-index-in-node="0">Care:</b> Hand wash recommended to maintain its brilliant luster.</p>
</li>
</ul>''',
        "images": ['//cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.09PM_1.jpg?v=1771939060']
    },
    {
        "title": 'The Royal Turkish Brewing Set Handcrafted Copper Spirit Burner & Coffee Pot',
        "handle": 'royal-turkish-brewing-set',
        "price": 499.0, "compare_price": 670.0, "collection": "equipment", "stock": 50,
        "description": '''<p data-path-to-node="5"><b data-path-to-node="5" data-index-in-node="0">Overview:</b> Master the traditional art of slow-brewing with the <b data-path-to-node="5" data-index-in-node="62">Royal Turkish Brewing Set</b>. This premium bundle brings together our handcrafted Copper Spirit Burner (Sertaya) and the matching Copper Coffee Pot (Kanaka). Designed for those who seek the ultimate coffee ritual, this set ensures a rich, flavorful cup with a perfect crema every single time.</p>
<h3 data-path-to-node="6"><b data-path-to-node="6" data-index-in-node="0">What’s Included:</b></h3>
<ul data-path-to-node="7">
<li>
<p data-path-to-node="7,0,0"><b data-path-to-node="7,0,0" data-index-in-node="0">Handcrafted Copper Spirit Burner (Sertaya):</b> * A vintage-inspired piece made from solid copper, providing a gentle flame for slow brewing.</p>
</li>
<li>
<p data-path-to-node="7,1,0"><b data-path-to-node="7,1,0" data-index-in-node="0">Premium Copper Coffee Pot (Kanaka):</b> * Expertly forged with a stay-cool wooden handle and a precision-pour spout.</p>
</li>
<li>
<p data-path-to-node="7,2,0"><b data-path-to-node="7,2,0" data-index-in-node="0">Essential Accessories:</b> * Includes a protective cap and a custom funnel for easy fuel refilling.</p>
</li>
</ul>
<hr data-path-to-node="8">
<h3 data-path-to-node="9"><b data-path-to-node="9" data-index-in-node="0">Why Buy the Set?</b></h3>
<ul data-path-to-node="10">
<li>
<p data-path-to-node="10,0,0"><b data-path-to-node="10,0,0" data-index-in-node="0">Perfectly Paired:</b> The burner and pot are designed to work in harmony, distributing heat evenly for the best taste.</p>
</li>
<li>
<p data-path-to-node="10,1,0"><b data-path-to-node="10,1,0" data-index-in-node="0">Timeless Aesthetic:</b> Adds a touch of luxury and heritage to your coffee station or kitchen.</p>
</li>
<li>
<p data-path-to-node="10,2,0"><b data-path-to-node="10,2,0" data-index-in-node="0">The Ultimate Gift:</b> An ideal choice for coffee connoisseurs who appreciate craftsmanship and tradition.</p>
</li>
<li>
<p data-path-to-node="10,3,0"><b data-path-to-node="10,3,0" data-index-in-node="0">Durability:</b> Made from 100% solid, high-grade copper to last a lifetime.</p>
</li>
</ul>
<hr data-path-to-node="11">
<h3 data-path-to-node="12"><b data-path-to-node="12" data-index-in-node="0">Care Instructions:</b></h3>
<p data-path-to-node="13">To maintain the brilliant shine of your copper set, we recommend hand washing only and drying immediately with a soft cloth.</p>''',
        "images": ['//cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.10PM_2.jpg?v=1771939372', '//cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.09PM_1_116a3ab8-e55d-49d7-af3c-076867fe25aa.jpg?v=1771939372', '//cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-02-24at2.33.09PM.jpg?v=1771939372']
    },
    {
        "title": 'Handheld Milk Frother',
        "handle": 'handheld-milk-frother',
        "price": 245.0, "compare_price": 300.0, "collection": "equipment", "stock": 50,
        "description": '''<p data-path-to-node="7"><b data-path-to-node="7" data-index-in-node="0" class="">The Ultimate Tool for a Perfect Creamy Foam</b></p>
<p data-path-to-node="8"><span class="">Upgrade your daily coffee routine with the </span><b data-path-to-node="8" data-index-in-node="43" class="">Elite Handheld Milk Frother</b><span class="">.</span><span class=""> Engineered for performance and convenience,</span><span class=""> this powerful tool creates a café-quality micro-foam in seconds,</span><span class=""> giving your home-brewed coffee a professional barista touch.</span></p>
<p data-path-to-node="9"><b data-path-to-node="9" data-index-in-node="0" class="">Key Features:</b></p>
<ul data-path-to-node="10">
<li>
<p data-path-to-node="10,0,0"><b data-path-to-node="10,0,0" data-index-in-node="0" class="">USB Rechargeable:</b><span class=""> No more batteries.</span><span class=""> Equipped with a built-in rechargeable battery for long-lasting use and eco-friendly power.</span></p>
</li>
<li>
<p data-path-to-node="10,1,0"><b data-path-to-node="10,1,0" data-index-in-node="0" class="">High-Speed Motor:</b><span class=""> Delivers powerful rotation for instant,</span><span class=""> thick foam.</span></p>
</li>
<li>
<p data-path-to-node="10,2,0"><b data-path-to-node="10,2,0" data-index-in-node="0" class="">Interchangeable Whisks:</b><span class=""> Includes two stainless steel heads (Spring &amp; Balloon) for frothing milk or whisking light ingredients.</span></p>
</li>
<li>
<p data-path-to-node="10,3,0"><b data-path-to-node="10,3,0" data-index-in-node="0" class="">Three Speed Settings:</b><span class=""> Full control over your foam texture with adjustable speed levels.</span></p>
</li>
<li>
<p data-path-to-node="10,4,0"><b data-path-to-node="10,4,0" data-index-in-node="0" class="">Sleek &amp; Durable:</b><span class=""> Premium matte finish with a lightweight,</span><span class=""> ergonomic design for comfortable handling.</span></p>
</li>
</ul>
<p data-path-to-node="11"><b data-path-to-node="11" data-index-in-node="0" class="">Clean &amp; Store:</b><span class=""> Simply rinse the whisk under water.</span><span class=""> Compact enough to fit in any kitchen drawer or coffee station.</span></p>
<hr data-path-to-node="12" class="">
<h3 data-path-to-node="13" class=""><b data-path-to-node="13" data-index-in-node="0">Specifications</b></h3>
<ul data-path-to-node="14">
<li>
<p data-path-to-node="14,0,0"><b data-path-to-node="14,0,0" data-index-in-node="0" class="">Charging:</b><span class=""> USB Cable (Included)</span></p>
</li>
<li>
<p data-path-to-node="14,1,0"><b data-path-to-node="14,1,0" data-index-in-node="0" class="">Speeds:</b><span class=""> Low / Medium / High</span></p>
</li>
<li>
<p data-path-to-node="14,2,0"><b data-path-to-node="14,2,0" data-index-in-node="0" class="">Best For:</b><span class=""> Lattes,</span><span class=""> Cappuccinos,</span><span class=""> Matcha,</span><span class=""> and Hot Chocolate.</span></p>
</li>
</ul>''',
        "images": ['//cdn.shopify.com/s/files/1/0774/5067/4212/files/WhatsAppImage2026-04-28at6.19.59PM.jpg?v=1777390361', '//cdn.shopify.com/s/files/1/0774/5067/4212/files/5857473001425669713.jpg?v=1777390361', '//cdn.shopify.com/s/files/1/0774/5067/4212/files/5978708044017241045.jpg?v=1777390361', '//cdn.shopify.com/s/files/1/0774/5067/4212/files/5843477790358353986.jpg?v=1777390361']
    },

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
