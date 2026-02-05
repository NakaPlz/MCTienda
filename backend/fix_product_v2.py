from database import SessionLocal
from models import Product

db = SessionLocal()

# 1. Try to find and delete any partial/broken records for TEST-1PESO
existing = db.query(Product).filter(Product.id == "TEST-1PESO").first()
if existing:
    db.delete(existing)
    db.commit()
    print("Limpiando intento anterior...")

# 2. Check if SKU exists to avoid crash
sku_check = db.query(Product).filter(Product.sku == "TEST-1PESO-SKU").first()
if sku_check:
    db.delete(sku_check)
    db.commit()
    print("Liberando SKU...")

# 3. Create the product with a UNIQUE SKU
cheap_product = Product(
    id="TEST-1PESO",
    name="Producto de Prueba $1",
    sku="TEST-1PESO-SKU", # UNIQUE SKU
    description="Producto para probar el flujo con $1.",
    price=1.0,
    stock=999,
    category="Test",
    image_url="https://via.placeholder.com/150"
)

db.add(cheap_product)
db.commit()
print("¡Producto de $1 creado exitosamente!")
db.close()
