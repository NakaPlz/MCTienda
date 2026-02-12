
import sys
import os

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine
import models
from sqlalchemy import text

def migrate_categories():
    db = SessionLocal()
    try:
        print("Starting Category Migration (String -> M2M)...")
        
        # 1. Get all products with a category string
        products = db.query(models.Product).filter(models.Product.category.isnot(None), models.Product.category != "").all()
        print(f"Found {len(products)} products with legacy category.")

        for product in products:
            cat_name = product.category.strip()
            if not cat_name:
                continue

            # 2. Find or Create Category
            category = db.query(models.Category).filter(models.Category.name == cat_name).first()
            if not category:
                print(f"Creating new category: {cat_name}")
                category = models.Category(name=cat_name)
                db.add(category)
                db.commit()
                db.refresh(category)
            
            # 3. Associate if not already associated
            if category not in product.categories:
                print(f"Linking product {product.name} to category {category.name}")
                product.categories.append(category)
        
        db.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_categories()
