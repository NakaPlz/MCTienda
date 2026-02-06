import csv
import sys
import os

# Add backend directory to path to import models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import Product, ProductVariant
from sqlalchemy.orm import Session

# Recreate tables to ensure schema matches (optional, but good for clean slate)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def parse_variant_option(option_value):
    """
    Parses 'Color / Size' string into (color, size).
    Examples:
    - "Marrón / S" -> ("Marrón", "S")
    - "Principal" -> ("Unico", "Unico") ?? Or just Color="Principal", Size=None
    - "Natural / Unico" -> ("Natural", "Unico")
    """
    if not option_value:
        return None, None
    
    if " / " in option_value:
        parts = option_value.split(" / ")
        if len(parts) == 2:
            return parts[0], parts[1]
    
    if option_value == "Principal":
        return "Único", "Único"
        
    return option_value, "Único" # Fallback

def import_products(csv_path: str):
    session: Session = SessionLocal()
    
    try:
        # Clear existing data?
        print("Clearing existing products and variants...")
        session.query(ProductVariant).delete()
        session.query(Product).delete()
        session.commit()
        
        products_map = {}
        
        with open(csv_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                handle = row['Handle']
                
                # Check if product already processed in this batch
                if handle not in products_map:
                    # Create new Product
                    product = Product(
                        id=handle, # Use Handle as ID for stability
                        external_id=handle,
                        name=row['Name'],
                        description=row['Description'],
                        category=row['Category'],
                        image_url=row['Image Src'],
                        price=float(row['Price']) if row['Price'] else 0.0,
                        stock=0, # Will sum up
                        is_active=True
                    )
                    session.add(product)
                    products_map[handle] = product
                
                # Update product stock and ensure price consistency (optional)
                product = products_map[handle]
                variant_stock = int(row['Stock']) if row['Stock'] else 0
                product.stock += variant_stock
                
                # Parse Variant
                color, size = parse_variant_option(row['Option1 Value'])
                
                variant = ProductVariant(
                    product_id=handle,
                    sku=row['SKU'],
                    size=size,
                    color=color,
                    stock=variant_stock
                )
                session.add(variant)
                
        session.commit()
        print(f"Successfully imported {len(products_map)} products.")
        
    except Exception as e:
        session.rollback()
        print(f"Error importing products: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    # Path relative to where script is run, or absolute
    # Assuming script is in backend/ and CSV is in ../products_export_2026-02-06.csv
    # But for safety, let's use the absolute path provided earlier
    csv_file_path = r"C:\Users\Juan\Desktop\Codigo\TiendaMuyCriollo\products_export_2026-02-06.csv"
    
    if not os.path.exists(csv_file_path):
        print(f"CSV file not found at: {csv_file_path}")
    else:
        import_products(csv_file_path)
