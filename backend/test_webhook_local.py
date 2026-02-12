import requests
import json

# URL Ngrok (Public Tunnel)
url = "https://cyanopathic-diamagnetically-gisela.ngrok-free.dev/api/webhooks/products"

# API Key Mock (Must match .env STORE_API_KEY)
# We will assume user has set STORE_API_KEY=tu_clave_secreta_aqui locally for testing
# typically developers set this in .env. 
# I will try to read .env first to be helpful? No, I'll just use a header.
headers = {
    "Content-Type": "application/json",
    "x-store-api-key": "nKPZJGG13$$mc" 
}

# Payload de Ejemplo (Como lo envía la plataforma)
payload = {
  "id": "PROD-TEST-WEBHOOK-001",
  "name": "Producto Test Webhook",
  "description": "Producto creado automáticamente por test de webhook",
  "price": 15500.0,
  "sku": "SKU-WEBHOOK-001",
  "image_url": "https://via.placeholder.com/500",
  "images": [
      "https://via.placeholder.com/500",
      "https://via.placeholder.com/500/0000FF"
  ],
  "category": "Tests",
  "variants": [
    { "color": "Rojo", "size": "M", "stock": 50, "sku": "SKU-WEBHOOK-001-R-M" },
    { "color": "Azul", "size": "L", "stock": 30, "sku": "SKU-WEBHOOK-001-A-L" }
  ]
}

try:
    print(f"📡 Enviando POST a {url}...")
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    try:
        print("Respuesta JSON:", response.json())
    except:
        print("Respuesta Texto:", response.text)
        
    if response.status_code == 200:
        print("\n✅ Test Exitoso! El producto debería haberse creado/actualizado.")
    elif response.status_code == 403:
        print("\n❌ Error de Autenticación. Revisa que STORE_API_KEY coincida en .env y el script.")
    else:
        print("\n❌ Error en el request.")
        
except Exception as e:
    print(f"❌ Error conectando: {e}")
