import mercadopago
import os
from typing import List, Dict, Any

class PaymentService:
    def __init__(self):
        # Initialize SDK with Access Token from env
        access_token = os.getenv("MP_ACCESS_TOKEN")
        if not access_token:
            print("WARNING: MP_ACCESS_TOKEN not found in environment variables")
        self.sdk = mercadopago.SDK(access_token or "TEST-0000000000") # Fallback to avoid crash on init, but calls will fail

    def create_preference(self, order_id: int, items: List[Dict[str, Any]], payer_email: str) -> str:
        """
        Creates a Mercado Pago Preference and returns the init_point URL.
        """
        
        # Transform items to MP format
        mp_items = []
        for item in items:
            mp_items.append({
                "id": str(item["product_id"]),
                "title": item["name"],  # Using 'name' from item dict passed from order payload/db
                "quantity": item["quantity"],
                "currency_id": "ARS",
                "unit_price": float(item["unit_price"])
            })

        preference_data = {
            "items": mp_items,
            # "payer": {
            #     "email": payer_email
            # },
            "back_urls": {
                "success": "http://127.0.0.1:3000/checkout/success",
                "failure": "http://127.0.0.1:3000/checkout/failure",
                "pending": "http://127.0.0.1:3000/checkout/pending"
            },
            "external_reference": str(order_id),
            "statement_descriptor": "MUY CRIOLLO"
        }

        preference_response = self.sdk.preference().create(preference_data)
        
        # Validate response
        response = preference_response["response"]
        
        with open("debug_mp_response.log", "w") as f:
            f.write(f"Status: {preference_response.get('status')}\n")
            f.write(f"Response: {response}\n")

        # Use init_point for PRODUCTION (User Request)
        # This will lead to the real payment gateway.
        return response.get("init_point")

    def get_payment_status(self, payment_id: str) -> str:
        """
        Verifica el estado de un pago específico en Mercado Pago.
        Retorna: 'approved', 'pending', 'rejected', etc.
        """
        try:
            payment_info = self.sdk.payment().get(payment_id)
            status = payment_info["response"]["status"]
            return status
        except Exception as e:
            print(f"Error fetching payment {payment_id}: {e}")
            return "unknown"
