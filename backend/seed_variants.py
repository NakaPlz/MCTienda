from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import uuid

# Ensure tables exist (specifically for the new ProductVariant table)
models.Base.metadata.create_all(bind=engine)

def seed_variants():
    db: Session = SessionLocal()
    try:
        products = db.query(models.Product).all()
        print(f"Found {len(products)} products.")
        
        count = 0
        for product in products:
            # Check if variants already exist
            existing = db.query(models.ProductVariant).filter(models.ProductVariant.product_id == product.id).first()
            if existing:
                continue

            # Create mock variants based on category or random
            print(f"Adding variants for {product.name}...")
            
            # Variant 1: Size M / Standard
            v1 = models.ProductVariant(
                product_id=product.id,
                sku=f"{product.sku}-M",
                size="M" if "Ropa" in (product.category or "") else "Único",
                color="Original",
                stock=10
            )
            
            # Variant 2: Size L / Alternative
            v2 = models.ProductVariant(
                product_id=product.id,
                sku=f"{product.sku}-L",
                size="L" if "Ropa" in (product.category or "") else "Grande",
                color="Alternativo",
                stock=5
            )
            
            db.add(v1)
            db.add(v2)
            count += 2
        
        db.commit()
        print(f"✅ Created {count} variants.")
        
    except Exception as e:
        print(f"Error seeding variants: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_variants()
