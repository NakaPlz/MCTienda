from services.email import EmailService
from dotenv import load_dotenv

load_dotenv()

class MockItem:
    def __init__(self, qty, pid, price):
        self.quantity = qty
        self.product_id = pid
        self.unit_price = price

def test_email():
    print("Testing Email Service...")
    service = EmailService()
    
    mock_items = [
        MockItem(1, "TEST-PRODUCT", 100.0),
        MockItem(2, "ANOTHER-ITEM", 50.0)
    ]
    
    service.send_order_notification(
        order_id=999, 
        total=200.0, 
        customer_name="Test User", 
        items=mock_items
    )

if __name__ == "__main__":
    test_email()
