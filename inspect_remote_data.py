
import requests
import json

BASE_URL = "https://tienda-muy-criollo-backend.npubnq.easypanel.host"

def inspect():
    print(f"Fetching products from {BASE_URL}...")
    try:
        res = requests.get(f"{BASE_URL}/products?limit=100")
        if res.status_code != 200:
            print(f"Error {res.status_code}: {res.text}")
            return

        data = res.json()
        items = data.get("items", [])
        print(f"Total products found: {len(items)}")
        
        count_with_images = 0
        for p in items:
            images = p.get("images", [])
            if images and len(images) > 0:
                count_with_images += 1
                print(f"✅ Product: {p['name']}")
                print(f"   ID: {p['id']}")
                print(f"   Images ({len(images)}): {images}")
                print("-" * 40)
        
        if count_with_images == 0:
            print("❌ No products found with 'images' populated (all are empty or null).")
            # Print a raw sample to be sure
            if items:
                print("Sample Raw Product Data:")
                print(json.dumps(items[0], indent=2))

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    inspect()
