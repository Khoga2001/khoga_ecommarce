from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017")
db = client["khoga_store"]

prods = list(db.products.find({}))
for p in prods:
    handle = p["handle"]
    col = p["collection"]
    new_col = col
    
    # Bundle fixes
    if "bundle" in handle or "trio" in handle or "gift" in handle:
        new_col = "bundles"
    
    # Mugs
    if "mug" in handle or "cup" in handle:
        new_col = "mugs"
        
    # Equipment
    if handle in ["moka-pot", "sabrataya-copper-spirit-burner", "kanaka-copper-coffee-pot", "royal-turkish-brewing-set", "handheld-milk-frother", "coffee-grinder-1", "coffee-machine-1"]:
        new_col = "equipment"
        
    # Hot Chocolate
    if "hot-chocolate" in handle:
        new_col = "hot-chocolate"
        
    # Turkish coffee
    if "turkish" in handle or handle in ["hazelnut-coffee"]:
        new_col = "turkish-coffee"
        
    # Instant
    if "instant" in handle or "3in1" in handle or "3x1" in handle or "creamer" in handle:
        if "bundle" not in handle:
            new_col = "instant-coffee"
            
    if "espresso" in handle and "bundle" not in handle and "cup" not in handle:
        new_col = "espresso"

    if new_col != col:
        db.products.update_one({"_id": p["_id"]}, {"$set": {"collection": new_col}})
        print(f"Moved {handle} to {new_col}")

print("Fixed collections!")
