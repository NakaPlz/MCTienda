import requests
import json
import time

# --- CONFIGURATION ---
# Default to Easypanel URL if known, otherwise ask user
print("---------------------------------------------------------")
print("  Poblador de Datos de Producción (con Variantes)")
print("---------------------------------------------------------")
print("Este script cargará productos reales y de prueba")
print("simulando ser la Plataforma de Gestión (Webhooks).")
print("---------------------------------------------------------")

base_url = input("Ingresa la URL de tu Backend (ej: https://api.tutienda.com): ").strip()

if not base_url:
    print("❌ Debes ingresar una URL válida.")
    exit()

# Ensure no trailing slash
if base_url.endswith("/"):
    base_url = base_url[:-1]

WEBHOOK_URL = f"{base_url}/webhooks/products"
print(f"📡 Target: {WEBHOOK_URL}")

# --- DATA ---
products_to_seed = [
    {
        "id": "prod_001",
        "sku": "MC-SOM-PAMPA",
        "name": "Sombrero Pampa Fieltro",
        "description": "Sombrero de fieltro de lana 100% legítimo. Ala de 8cm y copa de 10cm. Ideal para tareas de campo o uso urbano elegante.",
        "price": 279999,
        "image_url": "https://http2.mlstatic.com/D_784440-MLA88199385639_072025-O.jpg",
        "category": "Sombreros",
        "variants": [
            {"sku": "MC-SOM-PAMPA-M-NG", "stock": 5, "size": "M", "color": "Negro"},
            {"sku": "MC-SOM-PAMPA-L-NG", "stock": 3, "size": "L", "color": "Negro"},
            {"sku": "MC-SOM-PAMPA-M-MR", "stock": 2, "size": "M", "color": "Marrón"}
        ]
    },
    {
        "id": "prod_002",
        "sku": "MC-BOI-VENTO",
        "name": "Boina Vento Lagomarsino",
        "description": "La clásica boina vasca. Vuelo de 32cm, sin badana. Lana merino extrafina.",
        "price": 79999,
        "image_url": "https://http2.mlstatic.com/D_722878-MLA73802540927_012024-O.jpg",
        "category": "Boinas",
        "variants": [
            {"sku": "MC-BOI-VENTO-UNICO-NG", "stock": 20, "size": "Único", "color": "Negro"},
            {"sku": "MC-BOI-VENTO-UNICO-AZ", "stock": 15, "size": "Único", "color": "Azul Marino"}
        ]
    },
    {
        "id": "prod_003",
        "sku": "MC-CUCH-ART",
        "name": "Cuchillo Artesanal Mission",
        "description": "Hoja de acero al carbono 1070 de 14cm. Cabo de ciervo y madera de guayubira. Incluye vaina de cuero crudo.",
        "price": 45000,
        "image_url": "https://http2.mlstatic.com/D_888000-MLA69389322337_052023-O.jpg",
        "category": "Cuchilleria",
        "variants": [
            {"sku": "MC-CUCH-ART-14", "stock": 8, "size": "14cm", "color": "Ciervo"}
        ]
    },
    # --- PRODUCTOS DE PRUEBA ---
    {
        "id": "prod_test_1",
        "sku": "TEST-PRICE-1",
        "name": "Producto Test $1 (Pago Mínimo)",
        "description": "Producto para verificar pasarela de pagos.",
        "price": 1,
        "image_url": "https://placehold.co/600x400/EEE/31343C?text=Test+$1",
        "category": "Test",
        "variants": [
            {"sku": "TEST-1-STD", "stock": 100, "size": "Único", "color": "Neutro"}
        ]
    },
    {
        "id": "prod_test_10k",
        "sku": "TEST-PRICE-10K",
        "name": "Producto Test $10.000 (Envío Gratis)",
        "description": "Producto para verificar reglas de envío gratis.",
        "price": 10000,
        "image_url": "https://placehold.co/600x400/EEE/31343C?text=Test+$10k",
        "category": "Test",
        "variants": [
            {"sku": "TEST-10K-STD", "stock": 100, "size": "Único", "color": "Neutro"}
        ]
    }
]

# --- EXECUTION ---
print("\n🚀 Iniciando carga...")

for prod in products_to_seed:
    print(f" > Enviando: {prod['name']}...", end=" ")
    try:
        response = requests.post(WEBHOOK_URL, json=prod, timeout=10)
        if response.status_code == 200:
            print("✅ OK")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Excepción: {e}")
    
    time.sleep(0.5) # Be gentle

print("\n✨ Carga finalizada.")
print("Ahora revisa tu Frontend, deberían aparecer los productos reales con sus talles/colores.")
