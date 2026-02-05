from database import SessionLocal
from models import Product

db = SessionLocal()

cheap_product = Product(
    id="TEST-1PESO",
    name="Producto de Prueba $1",
    description="Producto para probar el flujo de pago con el mínimo valor.",
    price=1.0,
    stock=1000,
    category="Test",
    image_url="https://via.placeholder.com/150",
    # features="Prueba, Barato" # Removed as column does not exist on Model
)

# Check if exists
existing = db.query(Product).filter(Product.id == "TEST-1PESO").first()
if not existing:
    db.add(cheap_product)
    db.commit()
    print("Producto de $1 creado exitosamente.")
else:
    print("El producto de prueba ya existe.")

db.close()
