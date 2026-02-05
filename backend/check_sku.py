from database import SessionLocal
from models import Product

db = SessionLocal()
products = db.query(Product).all()

print(f"Total Products: {len(products)}")
for p in products:
    print(f"ID: {p.id} | Name: {p.name} | SKU: {p.sku}")

db.close()
