from services.integration import IntegrationService
from datetime import datetime
from dotenv import load_dotenv
import uuid

load_dotenv()

# Mock Objects (Reusing similar structure to email test)
class MockProduct:
    def __init__(self, sku, name):
        self.sku = sku
        self.name = name

class MockItem:
    def __init__(self, sku, qty, price):
        self.product = MockProduct(sku, "Producto Test")
        self.quantity = qty
        self.unit_price = price
        self.product_id = "999" # Fix for eager evaluation in IntegrationService

class MockCustomer:
    def __init__(self):
        self.full_name = "Juan Perez Integration Test"
        self.email = "juan.test@example.com"
        self.phone = "1122334455"

class MockOrder:
    def __init__(self):
        self.id = 9999
        self.created_at = datetime.now()
        self.total_amount = 6500.0
        self.customer = MockCustomer()
        self.delivery_method = "shipping"
        self.shipping_data = '{"address": "Av. Corrientes 1234", "city": "CABA", "zip_code": "1041", "province": "CABA"}'
        self.billing_data = '{"invoice_type": "B", "dni": "12345678"}'
        self.items = [
            MockItem("TEST-SKU-1", 1, 5000.0),
            MockItem("TEST-SKU-2", 1, 1500.0)
        ]

def test_integration():
    print("🚀 Probando Integración con CRM...")
    service = IntegrationService()
    
    mock_order = MockOrder()
    payment_id = "TEST-PAY-12345"
    
    print(f"📡 Enviando Webhook a: {service.webhook_url}")
    service.notify_new_sale(mock_order, payment_id)

if __name__ == "__main__":
    test_integration()
