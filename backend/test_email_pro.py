from services.email import EmailService
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Mock Objects for Testing
class MockCustomer:
    def __init__(self, first_name, email):
        self.first_name = first_name
        self.email = email
        self.full_name = first_name + " Tester"

class MockItem:
    def __init__(self, name, qty, price, pid):
        self.name = name
        self.quantity = qty
        self.unit_price = price
        self.product_id = pid

class MockOrder:
    def __init__(self):
        self.id = 12345
        self.created_at = datetime.now()
        self.total_amount = 35100.0
        self.customer = MockCustomer("Juan", "muycriolloarg@gmail.com")
        self.items = [
            MockItem("Sombrero Pampa", 1, 25000.0, "MC-001"),
            MockItem("Cuchillo Verijero", 1, 10100.0, "MC-005")
        ]

def test_emails():
    print("🚀 Iniciando prueba de emails...")
    service = EmailService()
    
    mock_order = MockOrder()
    
    # 1. Test Client HTML Email
    print(f"📧 Enviando Template HTML a cliente ({mock_order.customer.email})...")
    service.send_order_confirmation_client(mock_order)
    
    # 2. Test Admin Alert Email
    print(f"🔔 Enviando Alerta Admin a {service.sender_email}...")
    service.send_order_notification_admin(
        order_id=mock_order.id,
        total=mock_order.total_amount,
        customer_name=mock_order.customer.full_name,
        items=mock_order.items
    )
    
    print("✅ ¡Correos enviados! Revisa la bandeja de entrada.")

if __name__ == "__main__":
    test_emails()
