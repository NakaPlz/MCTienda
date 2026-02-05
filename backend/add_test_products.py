import requests
import json

url = "http://localhost:8000/integration/products/sync"

products = [
    {
        "sku": "TEST-10K",
        "name": "Producto Prueba $10.000",
        "price": 10000,
        "stock": 100,
        "description": "Producto para probar costo de envío ($100)",
        "image_url": "https://placehold.co/400x400?text=10k",
        "category": "Testing",
        "is_active": True
    },
    {
        "sku": "TEST-100K",
        "name": "Producto Prueba $100.000",
        "price": 100000,
        "stock": 100,
        "description": "Producto para probar envío gratis (supera 35k)",
        "image_url": "https://placehold.co/400x400?text=100k",
        "category": "Testing",
        "is_active": True
    },
    {
        "sku": "TEST-200K",
        "name": "Producto Prueba $200.000",
        "price": 200000,
        "stock": 100,
        "description": "Producto de alto valor",
        "image_url": "https://placehold.co/400x400?text=200k",
        "category": "Testing",
        "is_active": True
    },
    {
        "sku": "TEST-500K",
        "name": "Producto Prueba $500.000",
        "price": 500000,
        "stock": 100,
        "description": "Producto VIP",
        "image_url": "https://placehold.co/400x400?text=500k",
        "category": "Testing",
        "is_active": True
    }
]

payload = {"products": products}

try:
    print("Enviando productos de prueba...")
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
