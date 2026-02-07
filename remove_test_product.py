
import requests
import sys

BASE_URL = "https://tienda-muy-criollo-backend.npubnq.easypanel.host"
PRODUCT_ID = "TEST-PRICE-1"

def main():
    print("---------------------------------------------------------")
    print("  ELIMINAR PRODUCTO DE PRUEBA")
    print("---------------------------------------------------------")
    print(f"Target: {BASE_URL}")
    print(f"Product ID: {PRODUCT_ID}")

    # Check if delete endpoint exists or we need to use a different method.
    # Assuming standard REST or Admin endpoint.
    # restore_remote_db uses /admin/products/all
    # Let's try /admin/products/{id} or /products/{id} with DELETE.
    
    url = f"{BASE_URL}/admin/products/{PRODUCT_ID}"
    
    print(f"Intentando DELETE en {url}...", end=" ")
    try:
        res = requests.delete(url)
        if res.status_code == 200:
            print("✅ OK")
            print("Producto eliminado.")
        elif res.status_code == 404:
            print("❌ 404 Not Found (Tal vez ya fue borrado o el endpoint es distinto)")
        else:
            print(f"❌ Error {res.status_code}: {res.text}")
            
            # Fallback: Try disabling it via Webhook/Sync if DELETE fails
            print("\nIntentando desactivar via Webhook Update...", end=" ")
            webhook_url = f"{BASE_URL}/webhooks/products"
            payload = {
                "id": PRODUCT_ID,
                "sku": "TEST-SKU-1", # Required?
                "name": "Producto Test (ELIMINADO)",
                "price": 0,
                "stock": 0,
                "is_active": False,
                "variants": []
            }
            res2 = requests.post(webhook_url, json=payload)
            if res2.status_code == 200:
                print("✅ Desactivado (Soft Delete)")
            else:
                print(f"❌ Error {res2.status_code}: {res2.text}")

    except Exception as e:
        print(f"❌ Excepción: {e}")

if __name__ == "__main__":
    main()
