from database import SessionLocal
from models import Product

db = SessionLocal()

# Delete existing bad product
existing = db.query(Product).filter(Product.id == "TEST-1PESO").first()
if existing:
    db.delete(existing)
    db.commit()
    print("Producto defectuoso eliminado.")

cheap_product = Product(
    id="TEST-1PESO",
    name="Producto de Prueba $1",
    sku="TEST-001",
    description="Producto para probar el flujo de pago con el mínimo valor.",
    price=1.0,
    stock=1000,
    category="Test",
    image_url="https://via.placeholder.com/150"
)

db.add(cheap_product)
db.commit()
print("Producto de $1 creado con SKU exitosamente.")
db.close()
