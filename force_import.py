import asyncio
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime

COLLECTIONS = {
    "bundles": "bundles",
    "instant-coffee": "instant-coffee",
    "turkish-coffee": "turkish-coffee",
    "mugs": "mugs",
    "hot-chocolate": "hot-chocolate",
    "coffee-equipment": "equipment"
}

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["khoga_store"]
    
    # We will NOT drop products because we want to keep equipment and other existing logic.
    # Instead, we will fetch everything and upsert.
    
    total_upserted = 0
    total_fetched = 0
    
    for shopify_col, internal_col in COLLECTIONS.items():
        resp = requests.get(f'https://khogaeg.com/collections/{shopify_col}/products.json?limit=250')
        if not resp.ok:
            print(f"FAILED {shopify_col}: {resp.status_code}")
            continue
            
        products = resp.json().get('products', [])
        total_fetched += len(products)
        print(f"{shopify_col}: found {len(products)}")
        
        for p in products:
            handle = p['handle']
            
            # Map the weird equipment handles to our internal ones
            if shopify_col == "coffee-equipment":
                if handle == "coffee-grinder-1": handle = "moka-pot"
                elif handle == "coffee-machine-1": handle = "sabrataya-copper-spirit-burner"
                elif handle == "handcrafted-copper-coffee-pot-kanaka": handle = "kanaka-copper-coffee-pot"
                elif handle == "the-royal-turkish-brewing-set-handcrafted-copper-spirit-burner-coffee-pot": handle = "royal-turkish-brewing-set"
            
            variants = []
            if "options" in p and p["options"]:
                for opt in p["options"]:
                    if opt["name"].lower() != "title":
                        variants.append({"name": opt["name"], "options": opt["values"]})
                        
            price = 0.0
            compare_price = None
            stock = 100
            
            if p.get("variants"):
                v = p["variants"][0]
                price = float(v.get("price", 0))
                if v.get("compare_at_price"):
                    compare_price = float(v["compare_at_price"])
                if not v.get("available", True):
                    stock = 0
                    
            doc = {
                "title": p["title"],
                "handle": handle,
                "description": p.get("body_html", ""),
                "price": price,
                "compare_price": compare_price,
                "collection": internal_col,
                "images": [img["src"] for img in p.get("images", [])],
                "variants": variants,
                "stock": stock,
                "is_active": True,
                "is_featured": False,
                "tags": [f"category:{internal_col}"],
                "updated_at": datetime.utcnow()
            }
            
            existing = await db.products.find_one({"handle": handle})
            if existing:
                await db.products.update_one({"_id": existing["_id"]}, {"$set": doc})
            else:
                doc["id"] = str(uuid.uuid4())
                doc["created_at"] = datetime.utcnow()
                await db.products.insert_one(doc)
            total_upserted += 1
            
    print("Upserted:", total_upserted, "/", total_fetched)
    
asyncio.run(main())
