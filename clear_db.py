
import requests
import sys

# Configuration
BASE_URL = "https://tienda-muy-criollo-backend.npubnq.easypanel.host"

def main():
    print("---------------------------------------------------------")
    print("  LIMPIEZA DE BASE DE DATOS (PRODUCTOS)")
    print("---------------------------------------------------------")
    print(f"Target: {BASE_URL}")
    print("⚠ ESTO BORRARÁ TODOS LOS PRODUCTOS Y VARIANTES EN EL SERVIDOR.")
    
    confirm = input("¿Estás seguro? Escribe 'SI' para continuar: ")
    if confirm != "SI":
        print("Cancelado.")
        return

    print("\nEliminando productos...", end=" ")
    try:
        res = requests.delete(f"{BASE_URL}/admin/products/all", timeout=20)
        if res.status_code == 200:
            print("✅ ÉXITO")
            print(res.json())
        else:
            print(f"❌ Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"❌ Excepción de conexión: {e}")

if __name__ == "__main__":
    main()
