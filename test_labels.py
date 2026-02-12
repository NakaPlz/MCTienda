import requests
import json

API_URL = "http://localhost:8000"
ADMIN_KEY = "admin123" # Assuming default from .env or similar. I'll check .env if this fails.

def test_labels():
    print("1. Creating Label...")
    headers = {"x-admin-key": ADMIN_KEY}
    label_data = {"name": "TestLabel", "color": "#FF0000"}
    res = requests.post(f"{API_URL}/admin/labels/", json=label_data, headers=headers)
    if res.status_code != 201:
        print(f"Failed to create label: {res.text}")
        return
    
    label = res.json()
    label_id = label['id']
    print(f"Label Created: {label}")

    print("\n2. Fetching Products to assign label...")
    res = requests.get(f"{API_URL}/products")
    products = res.json()['items']
    if not products:
        print("No products to test with.")
        return
    
    product_id = products[0]['id']
    print(f"Testing with Product: {products[0]['name']} ({product_id})")

    print("\n3. Assigning Label to Product...")
    update_data = {"label_ids": [label_id]}
    res = requests.put(f"{API_URL}/admin/products/{product_id}/details", json=update_data, headers=headers)
    if res.status_code != 200:
        print(f"Failed to update product: {res.text}")
        return
    
    print("\n4. Verifying Label in Product Details...")
    # Fetch public product details
    res = requests.get(f"{API_URL}/products/{product_id}")
    product = res.json()
    
    labels = product.get('labels', [])
    print(f"Product Labels: {labels}")
    
    if any(l['id'] == label_id for l in labels):
        print("✅ SUCCESS: Label found on product!")
    else:
        print("❌ FAILURE: Label NOT found on product.")

    print("\n5. Cleaning up Label...")
    # Remove label from product first? (Not strictly necessary if cascade or just updating)
    # Delete label
    requests.delete(f"{API_URL}/admin/labels/{label_id}", headers=headers)
    print("Label deleted.")

if __name__ == "__main__":
    test_labels()
