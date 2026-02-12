
import requests
import json
import uuid

BASE_URL = "https://tienda-muy-criollo-backend.npubnq.easypanel.host"

def main():
    print("---------------------------------------------------------")
    print("  CREAR PRODUCTO DE PRUEBA ($1)")
    print("---------------------------------------------------------")
    print(f"Target: {BASE_URL}")

    test_prod = {
        "id": "TEST-PRICE-1",
        "external_id": "TEST-PRICE-1-EXT",
        "sku": "TEST-SKU-1",
        "name": "Producto Test $1 (Pago Mínimo)",
        "description": "Producto para pruebas de pago y flujo de compra.",
        "price": 1.0,
        "stock": 100,
        "image_url": "https://http2.mlstatic.com/D_810728-MLA85121851565_052025-O.jpg",
        "images": [
            "https://http2.mlstatic.com/D_646192-MLA84821969322_052025-O.jpg",
            "https://http2.mlstatic.com/D_810728-MLA85121851565_052025-O.jpg"
        ],
        "category": "Test",
        "is_active": True,
        "variants": [
            {"sku": "TEST-SKU-1-VAR", "size": "Único", "color": "Standard", "stock": 100}
        ]
    }

    print(f"\nEnviando {test_prod['name']}...", end=" ")
    
    webhook_url = f"{BASE_URL}/webhooks/products"
    
    try:
        res = requests.post(webhook_url, json=test_prod, timeout=10)
        if res.status_code == 200:
            print("✅ OK")
            print("Producto creado exitosamente.")
        else:
            print(f"❌ Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"❌ Excepción: {e}")

if __name__ == "__main__":
    main()
