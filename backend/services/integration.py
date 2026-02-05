import requests
import os
import json
from typing import Any
from datetime import datetime

class IntegrationService:
    def __init__(self):
        self.webhook_url = os.getenv("MANAGEMENT_WEBHOOK_URL", "")
        self.api_token = os.getenv("MANAGEMENT_API_TOKEN", "") # Optional security header

    def notify_new_sale(self, order: Any, payment_id: str):
        """
        Notifica una nueva venta a la plataforma de gestión externa.
        """
        if not self.webhook_url:
            print("⚠️ MANAGEMENT_WEBHOOK_URL not set. Skipping integration.")
            return

        try:
            # 1. Parse JSON fields (Stored as text in DB)
            shipping_data = {}
            billing_data = {}
            try:
                if order.shipping_data:
                    shipping_data = json.loads(order.shipping_data)
                if order.billing_data:
                    billing_data = json.loads(order.billing_data)
            except Exception as e:
                print(f"Error parsing order JSON data for webhook: {e}")

            # 2. Build Customer Block
            customer_payload = {
                "name": order.customer.full_name,
                "email": order.customer.email,
                "phone": order.customer.phone or "",
                # Fallback to billing data for Doc Type/Number if available
                "doc_type": billing_data.get("invoice_type", "Consumer"), 
                "doc_number": billing_data.get("dni") or billing_data.get("cuit") or ""
            }

            # 3. Build Shipping Block
            shipping_payload = {
                "type": order.delivery_method, # "shipping" or "pickup"
                "cost": 0, # Todo: logic for shipping cost if stored separately. For now assumed calculated in total or 0 if free.
            }
            
            if order.delivery_method == 'shipping':
                shipping_payload["address"] = {
                    "street": shipping_data.get("address", ""),
                    "number": "", # Address field usually contains full string, might need parsing or just send full line
                    "city": shipping_data.get("city", ""),
                    "state": shipping_data.get("province", ""),
                    "zip": shipping_data.get("zip_code", ""),
                    "full_address": f"{shipping_data.get('address', '')} {shipping_data.get('floor_apt', '')}" # Helper
                }
            elif order.delivery_method == 'pickup':
                 shipping_payload["pickup_details"] = {
                     "name": shipping_data.get("pickup_name", ""),
                     "dni": shipping_data.get("pickup_dni", "")
                 }

            # 4. Build Items Block
            items_payload = []
            for item in order.items:
                 # Fetch product SKU/Name safely
                sku = getattr(item.product, 'sku', f"ID-{item.product_id}") if hasattr(item, 'product') else f"ID-{item.product_id}"
                
                items_payload.append({
                    "sku": sku,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price
                })

            # 5. Construct Final Payload
            payload = {
                "external_order_id": f"#{order.id}",
                "payment_id": payment_id,
                "date": order.created_at.isoformat() if order.created_at else datetime.now().isoformat(),
                "customer": customer_payload,
                "shipping": shipping_payload,
                "billing": billing_data, # Send full billing object
                "items": items_payload,
                "total": order.total_amount,
                "payment_method": "mercadopago"
            }

            # 6. Send Request
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_token}"
            }
            
            response = requests.post(self.webhook_url, json=payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                print(f"✅ Notificación enviada a plataforma de gestión (Orden #{order.id})")
            else:
                print(f"❌ Error notificando a plataforma: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"❌ Exception in IntegrationService: {e}")
