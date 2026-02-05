from services.email import EmailService
from dotenv import load_dotenv

load_dotenv()

def test_status_email():
    print("🚀 Probando email de cambio de estado...")
    service = EmailService()
    
    # Test Data
    order_id = 999
    customer_email = "muycriolloarg@gmail.com"
    customer_name = "Juan Tester"
    
    # 1. Test "Shipped" Status
    print(f"🚚 Enviando estado 'Shipped' a {customer_email}...")
    service.send_status_update(order_id, "shipped", customer_email, customer_name)
    
    # 2. Test "Ready for Pickup" Status (Optional, just to be sure)
    # print(f"🛍️ Enviando estado 'Ready for Pickup' a {customer_email}...")
    # service.send_status_update(order_id, "ready_for_pickup", customer_email, customer_name)
    
    print("✅ ¡Simulación enviada! Revisa tu correo.")

if __name__ == "__main__":
    test_status_email()
