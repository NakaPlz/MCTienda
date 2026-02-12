from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import json

def inspect_data():
    db = SessionLocal()
    try:
        products = db.query(models.Product).all()
        print(f"Found {len(products)} products.")
        for p in products:
            print(f"Product: {p.sku} (ID: {p.id})")
            print(f"  Price: {p.price} (Type: {type(p.price)})")
            print(f"  Stock: {p.stock} (Type: {type(p.stock)})")
            print(f"  Images (Raw): {p.images}")
            try:
                if p.images:
                    loaded = json.loads(p.images)
                    print(f"  Images (Parsed): {loaded}")
                else:
                    print("  Images: None/Empty")
            except Exception as e:
                print(f"  Images Error: {e}")
            
            for v in p.variants:
                print(f"    Variant: {v.sku} - Stock: {v.stock}")
            print("-" * 20)
    except Exception as e:
        print(f"Error querying DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_data()
