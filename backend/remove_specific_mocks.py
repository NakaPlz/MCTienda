import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Product, ProductVariant

def remove_mocks():
    session = SessionLocal()
    try:
        # List of IDs provided by user to remove
        ids_to_remove = [
            "MC-SOM-PAMPA", 
            "MC-BOI-VENTO", 
            "MC-CUCH-ART", 
            "TEST-PRICE-10K"
        ]
        
        print(f"Attempting to remove: {ids_to_remove}")
        
        # Remove variants first (foreign key constraint)
        session.query(ProductVariant).filter(ProductVariant.product_id.in_(ids_to_remove)).delete(synchronize_session=False)
        
        # Remove products
        deleted_count = session.query(Product).filter(Product.id.in_(ids_to_remove)).delete(synchronize_session=False)
        
        session.commit()
        print(f"Successfully removed {deleted_count} products.")
        
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    remove_mocks()
