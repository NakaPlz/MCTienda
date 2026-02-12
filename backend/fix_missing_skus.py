from sqlalchemy.orm import Session
from database import SessionLocal
import models

def fix_skus():
    db = SessionLocal()
    try:
        products = db.query(models.Product).filter(models.Product.sku == None).all()
        print(f"Found {len(products)} products with missing SKU.")
        
        for p in products:
            print(f"Fixing Product ID: {p.id}")
            # Use ID as fallback SKU
            p.sku = p.id
            
        db.commit()
        print("✅ Fixed all missing SKUs.")
    except Exception as e:
        print(f"❌ Error fixing SKUs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_skus()
