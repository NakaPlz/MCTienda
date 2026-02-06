import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Product, ProductVariant

def add_test_product():
    session = SessionLocal()
    try:
        # Check if it exists first
        test_id = "TEST-PRICE-1"
        existing = session.query(Product).filter(Product.id == test_id).first()
        
        if existing:
            print("Test product already exists.")
            return

        print("Adding 'Test $1' product...")
        product = Product(
            id=test_id,
            external_id="TEST-PRICE-1-EXT",
            sku="TEST-SKU-1",
            name="Producto Test $1 (Pago Mínimo)",
            description="Producto para pruebas de pago con Mercado Pago.",
            price=1.0,
            stock=100,
            category="Test",
            image_url="https://via.placeholder.com/300",
            is_active=True
        )
        session.add(product)
        
        # Add a default variant for it
        variant = ProductVariant(
            product_id=test_id,
            sku="TEST-SKU-1-VAR",
            size="Único",
            color="Standard",
            stock=100
        )
        session.add(variant)
        
        session.commit()
        print("Successfully added 'Test $1' product.")
        
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    add_test_product()
