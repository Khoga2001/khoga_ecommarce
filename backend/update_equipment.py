import urllib.request
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

HANDLE_MAP = {
    "moka-pot": "coffee-grinder-1",
    "sabrataya-copper-spirit-burner": "coffee-machine-1",
    "kanaka-copper-coffee-pot": "handcrafted-copper-coffee-pot-kanaka",
    "royal-turkish-brewing-set": "the-royal-turkish-brewing-set-handcrafted-copper-spirit-burner-coffee-pot",
    "handheld-milk-frother": "handheld-milk-frother"
}

server_dicts = []

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["khoga"]
    
    for local_handle, remote_handle in HANDLE_MAP.items():
        url = f"https://khogaeg.com/products/{remote_handle}.js"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
        
        # Build variants
        variants = []
        if "options" in data and len(data["options"]) > 0:
            for opt in data["options"]:
                if opt["name"] and opt["name"].lower() != "title":
                    variants.append({
                        "name": opt["name"],
                        "options": opt["values"]
                    })
        
        # Build document
        doc = {
            "title": data["title"],
            "price": data["price"] / 100,  # shopify returns cents
            "compare_price": (data["compare_at_price"] / 100) if data.get("compare_at_price") else None,
            "description": data["description"],
            "variants": variants,
            "images": [img for img in data["images"]],
            "collection": "equipment"
        }
        
        # Update MongoDB
        result = await db.products.update_one(
            {"handle": local_handle},
            {"$set": doc}
        )
        print(f"Updated MongoDB for {local_handle}: Matched {result.matched_count}, Modified {result.modified_count}")
        
        # Add local handle
        doc["handle"] = local_handle
        doc["stock"] = 50 # Default stock
        
        server_dicts.append(doc)
    
    # Write to a txt file to inject later into server.py
    with open("new_equipment.py", "w") as f:
        f.write("[\n")
        for d in server_dicts:
            f.write("    {\n")
            f.write(f'        "title": {repr(d["title"])},\n')
            f.write(f'        "handle": {repr(d["handle"])},\n')
            f.write(f'        "price": {d["price"]}, "compare_price": {d["compare_price"]}, "collection": "equipment", "stock": {d["stock"]},\n')
            f.write(f'        "description": \'\'\'{d["description"]}\'\'\',\n')
            if d["variants"]:
                f.write(f'        "variants": {repr(d["variants"])},\n')
            f.write(f'        "images": {repr(d["images"])}\n')
            f.write("    },\n")
        f.write("]\n")
        
asyncio.run(main())
