import requests
import json

API_URL = "http://localhost:8000"

products = [
    {
        "sku": "MC-001",
        "name": "Sombrero Pampa Fieltro",
        "description": "Sombrero clásico de fieltro, ideal para campo.",
        "price": 279999,
        "stock": 5,
        "image_url": "https://http2.mlstatic.com/D_784440-MLA88199385639_072025-O.jpg",
        "category": "Sombreros",
        "external_id": "1"
    },
    {
        "sku": "MC-002",
        "name": "Boina Vento Lagomarsino",
        "description": "Boina tradicional vasca.",
        "price": 79999,
        "stock": 12,
        "image_url": "https://http2.mlstatic.com/D_722878-MLA73802540927_012024-O.jpg",
        "category": "Boinas",
        "external_id": "2"
    },
    {
        "sku": "MC-003",
        "name": "Cuchillo Artesanal Mission",
        "description": "Hoja de acero al carbono con cabo de ciervo.",
        "price": 45000,
        "stock": 3,
        "image_url": "https://http2.mlstatic.com/D_888000-MLA69389322337_052023-O.jpg",
        "category": "Cuchilleria",
        "external_id": "3"
    }
]

payload = {"products": products}

try:
    print("Enviando datos a:", f"{API_URL}/integration/products/sync")
    response = requests.post(f"{API_URL}/integration/products/sync", json=payload)
    if response.status_code == 200:
        print("✅ Base de datos poblada exitosamente!")
        print(response.json())
    else:
        print(f"❌ Error al poblar BD: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Error de conexión: {e}")
