"""
Fix ALL products where variant stock total doesn't match product stock.
Strategy: Scale variant stocks DOWN proportionally so total matches product.stock.
Variants with 0 stock stay at 0.
"""
import requests
import math

BASE_URL = "https://tienda-muy-criollo-backend.npubnq.easypanel.host"
STORE_KEY = "nKPZJGG13mc"

# Get ALL products
print("Obteniendo todos los productos...\n")
r = requests.get(f"{BASE_URL}/products", params={"limit": 200})
data = r.json()
items = data.get("items", [])
print(f"Total productos: {len(items)}\n")

fixed = 0
errors = 0

for p in items:
    pid = p["id"]
    r2 = requests.get(f"{BASE_URL}/products/{pid}")
    d = r2.json()
    
    variants = d.get("variants", [])
    if not variants:
        continue
    
    product_stock = d["stock"]
    variant_total = sum(v["stock"] for v in variants)
    
    if variant_total == product_stock:
        continue  # Already in sync
    
    print(f"{'='*60}")
    print(f"FIXING: {d['name']}")
    print(f"  Product stock: {product_stock}, Variant total: {variant_total}")
    
    # Strategy: scale proportionally
    corrected_variants = []
    if variant_total > 0:
        # Scale down proportionally
        remaining = product_stock
        variants_with_stock = [(i, v) for i, v in enumerate(variants) if v["stock"] > 0]
        
        for idx, (i, v) in enumerate(variants_with_stock):
            if idx == len(variants_with_stock) - 1:
                # Last variant gets the remainder
                new_stock = remaining
            else:
                # Proportional allocation
                ratio = v["stock"] / variant_total
                new_stock = max(0, round(product_stock * ratio))
                remaining -= new_stock
            
            corrected_variants.append({
                "sku": v["sku"],
                "color": v.get("color", ""),
                "size": v.get("size", ""),
                "stock": max(0, new_stock)
            })
        
        # Add variants with 0 stock
        for v in variants:
            if v["stock"] == 0:
                corrected_variants.append({
                    "sku": v["sku"],
                    "color": v.get("color", ""),
                    "size": v.get("size", ""),
                    "stock": 0
                })
    else:
        # All variants at 0, product stock > 0: leave as is
        for v in variants:
            corrected_variants.append({
                "sku": v["sku"],
                "color": v.get("color", ""),
                "size": v.get("size", ""),
                "stock": v["stock"]
            })
    
    new_total = sum(v["stock"] for v in corrected_variants)
    print(f"  New variant total: {new_total}")
    for v in corrected_variants:
        if v["stock"] > 0:
            print(f"    {v['color']} {v['size']} -> {v['stock']}")
    
    # Send fix via webhook
    payload = {
        "id": pid,
        "sku": d["sku"],
        "name": d["name"],
        "description": d.get("description", ""),
        "price": d["price"],
        "image_url": d.get("image_url", ""),
        "images": d.get("images", []),
        "category": d.get("category", ""),
        "variants": corrected_variants
    }
    
    r3 = requests.post(
        f"{BASE_URL}/api/webhooks/products",
        json=payload,
        headers={"Content-Type": "application/json", "x-store-api-key": STORE_KEY}
    )
    
    if r3.status_code == 200:
        print(f"  ✅ Fixed!")
        fixed += 1
    else:
        print(f"  ❌ Error: {r3.status_code} - {r3.text[:100]}")
        errors += 1

print(f"\n{'='*60}")
print(f"RESUMEN: {fixed} corregidos, {errors} errores")
