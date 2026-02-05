import requests
import json

url = "http://localhost:8000/integration/products/sync"
payload = {
    "products": [
        {
            "sku": "TEST-001",
            "name": "Producto Test",
            "price": 100,
            "stock": 10,
            "description": "Desc",
            "image_url": "",
            "category": "General",
            "is_active": True
        }
    ]
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(response.text)
except Exception as e:
    print(e)
