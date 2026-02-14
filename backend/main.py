from fastapi import FastAPI, Depends, HTTPException, status, Security, Query
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from dotenv import load_dotenv
import os
from pydantic import BaseModel

# Load env vars before importing local modules that use them
load_dotenv()

import models, schemas, database, services.payment, services.shipping, services.email, services.integration
import services.integration
import uuid
import unicodedata
from routers import admin, auth, labels

# Crear tablas en la base de datos al inicio
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Tienda Muy Criollo API", version="0.1.0")
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(labels.router)

@app.on_event("startup")
def startup_event():
    # Automatic Migration for SQLite
    import sqlite3
    try:
        # Assuming database.sqlite is the file or getting from env
        db_url = os.getenv("DATABASE_URL", "sqlite:///./tienda.db")
        if "sqlite" in db_url:
            db_path = db_url.replace("sqlite:///", "")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            try:
                # 1. Products Migration (images)
                cursor.execute("PRAGMA table_info(products)")
                columns_products = [info[1] for info in cursor.fetchall()]
                if "images" not in columns_products:
                    print("⚠️ Migrating DB: Adding 'images' column to products table...")
                    cursor.execute("ALTER TABLE products ADD COLUMN images TEXT")
                    conn.commit()
                
                # 2. Order Items Migration (variant_id)
                cursor.execute("PRAGMA table_info(order_items)")
                columns_order_items = [info[1] for info in cursor.fetchall()]
                if "variant_id" not in columns_order_items:
                    print("⚠️ Migrating DB: Adding 'variant_id' column to order_items table...")
                    cursor.execute("ALTER TABLE order_items ADD COLUMN variant_id INTEGER")
                    conn.commit()

                # 3. Order Migration (payment_id)
                cursor.execute("PRAGMA table_info(orders)")
                columns_orders = [info[1] for info in cursor.fetchall()]
                if "payment_id" not in columns_orders:
                    print("⚠️ Migrating DB: Adding 'payment_id' column to orders table...")
                    cursor.execute("ALTER TABLE orders ADD COLUMN payment_id TEXT")
                    conn.commit()

                # 4. Products Migration (price_override, discount_percentage)
                cursor.execute("PRAGMA table_info(products)")
                columns_products = [info[1] for info in cursor.fetchall()]
                if "price_override" not in columns_products:
                     print("⚠️ Migrating DB: Adding 'price_override' to products...")
                     cursor.execute("ALTER TABLE products ADD COLUMN price_override REAL")
                     conn.commit()
                if "discount_percentage" not in columns_products:
                     print("⚠️ Migrating DB: Adding 'discount_percentage' to products...")
                     cursor.execute("ALTER TABLE products ADD COLUMN discount_percentage INTEGER DEFAULT 0")
                     conn.commit()
                
                # 5. Labels Migration (Create Table if not exists - Fallback)
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='labels'")
                if not cursor.fetchone():
                    print("⚠️ Migrating DB: Creating 'labels' table...")
                    cursor.execute("""
                        CREATE TABLE labels (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name VARCHAR,
                            color VARCHAR DEFAULT '#000000'
                        )
                    """)
                    cursor.execute("CREATE UNIQUE INDEX ix_labels_id ON labels (id)")
                    cursor.execute("CREATE UNIQUE INDEX ix_labels_name ON labels (name)")
                    conn.commit()

                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product_labels'")
                if not cursor.fetchone():
                    print("⚠️ Migrating DB: Creating 'product_labels' table...")
                    cursor.execute("""
                        CREATE TABLE product_labels (
                            product_id VARCHAR,
                            label_id INTEGER,
                            PRIMARY KEY (product_id, label_id),
                            FOREIGN KEY(product_id) REFERENCES products(id),
                            FOREIGN KEY(label_id) REFERENCES labels(id)
                        )
                    """)
                    conn.commit()

                print("✅ Migrations successful.")
            except Exception as e:
                print(f"❌ Migration error: {e}")
            finally:
                conn.close()
    except Exception as e:
        print(f"Startup migration check failed: {e}")

# Configuración de CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://muycriollo.com.ar",
    "https://www.muycriollo.com.ar",
    os.getenv("FRONTEND_URL", ""), 
    "*" # Mantener fallback por si acaso, o quitar para mayor seguridad
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para obtener la sesión de BD
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency for Admin Security
# Moved to routers.admin to avoid circular imports
from routers.admin import verify_admin_key

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Tienda Muy Criollo"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/integration/products/sync", status_code=status.HTTP_200_OK)
def sync_products(payload: schemas.ProductSyncRequest, db: Session = Depends(get_db)):
    """
    Endpoint para recibir productos desde la Plataforma de Gestión.
    Actualiza (upsert) productos basados en SKU o External ID.
    """
    results = {"created": 0, "updated": 0, "errors": 0}
    
    for item in payload.products:
        try:
            # Buscar producto existente por SKU (unico)
            # Priorizamos SKU como llave de negocio
            db_product = db.query(models.Product).filter(models.Product.sku == item.sku).first()
            
            if db_product:
                # Update
                db_product.name = item.name
                db_product.description = item.description
                db_product.price = item.price
                db_product.stock = item.stock
                db_product.image_url = item.image_url
                if item.images:
                    db_product.images = json.dumps(item.images)
                db_product.category = item.category
                db_product.is_active = item.is_active
                if item.external_id:
                    db_product.external_id = item.external_id
                
                # Update M2M Category (Additive)
                if item.category:
                    cat_name = item.category.strip()
                    if cat_name:
                        category = db.query(models.Category).filter(models.Category.name == cat_name).first()
                        if not category:
                            category = models.Category(name=cat_name)
                            db.add(category)
                            db.flush() # Ensure ID
                        
                        if category not in db_product.categories:
                            db_product.categories.append(category)

                results["updated"] += 1
            else:
                # Create
                new_product = models.Product(
                    id=str(uuid.uuid4()),
                    external_id=item.external_id,
                    sku=item.sku,
                    name=item.name,
                    description=item.description,
                    price=item.price,
                    stock=item.stock,
                    image_url=item.image_url,
                    images=json.dumps(item.images) if item.images else "[]",
                    category=item.category,
                    is_active=item.is_active
                )
                
                # Handle M2M for new product
                if item.category:
                    cat_name = item.category.strip()
                    if cat_name:
                        category = db.query(models.Category).filter(models.Category.name == cat_name).first()
                        if not category:
                            category = models.Category(name=cat_name)
                            db.add(category)
                            db.flush()
                        new_product.categories.append(category)
                db.add(new_product)
                db.flush()
                db_product = new_product
                results["created"] += 1
            
            # --- Sync Variants (if provided) ---
            if item.variants:
                current_variant_skus = [v.sku for v in item.variants]
                
                # Delete variants not in payload
                db.query(models.ProductVariant).filter(
                    models.ProductVariant.product_id == db_product.id,
                    models.ProductVariant.sku.notin_(current_variant_skus)
                ).delete(synchronize_session=False)
                
                total_stock = 0
                for v in item.variants:
                    db_variant = db.query(models.ProductVariant).filter(
                        models.ProductVariant.sku == v.sku
                    ).first()
                    
                    if db_variant:
                        db_variant.stock = v.stock
                        db_variant.size = v.size
                        db_variant.color = v.color
                        db_variant.product_id = db_product.id
                    else:
                        db_variant = models.ProductVariant(
                            product_id=db_product.id,
                            sku=v.sku,
                            stock=v.stock,
                            size=v.size,
                            color=v.color
                        )
                        db.add(db_variant)
                    
                    total_stock += v.stock
                
                # Recalculate total product stock from variants
                db_product.stock = total_stock
                
        except Exception as e:
            print(f"Error syncing product {item.sku}: {e}")
            results["errors"] += 1
            continue
            
    db.commit()
    return {"message": "Sincronización completada", "details": results}

# Security for Store API (Management Platform)
store_api_key_header = APIKeyHeader(name="x-store-api-key", auto_error=False)

async def verify_store_key(api_key: str = Security(store_api_key_header)):
    correct_key = os.getenv("STORE_API_KEY")
    # If not set, maybe fallback to ADMIN_API_KEY or block
    if not correct_key:
         print("⚠️ STORE_API_KEY not configured in .env")
         raise HTTPException(status_code=500, detail="Store security not configured")
         
    if api_key != correct_key:
        raise HTTPException(status_code=403, detail="Invalid Store API Key")
    return api_key

@app.post("/api/webhooks/products", status_code=status.HTTP_200_OK, dependencies=[Depends(verify_store_key)])
def receive_store_product_update(payload: schemas.ProductUpdatePayload, db: Session = Depends(get_db)):
    """
    Endpoint EXACTO para recibir actualizaciones desde la Plataforma de Gestión (Webhook).
    - URL: /api/webhooks/products
    - Recibe producto, variantes e imágenes.
    - Actualiza base de datos local (upsert).
    """
    print(f"📥 Store Webhook received for {payload.name} (SKU: {payload.sku})")
    
    # 1. Upsert Product
    db_product = db.query(models.Product).filter(models.Product.id == payload.id).first()
    
    images_json = json.dumps(payload.images) if payload.images else "[]"
    
    if db_product:
        # Update
        db_product.sku = payload.sku
        db_product.name = payload.name
        # db_product.price = payload.price # Comentado si queremos mantener precio manual? 
        # User implies Management Platform is source of truth for BASE price.
        db_product.price = payload.price 
        
        if payload.description:
            db_product.description = payload.description
        if payload.image_url:
            db_product.image_url = payload.image_url
        
        db_product.images = images_json # Legacy JSON sync
        
        if payload.category:
            db_product.category = payload.category
            
            # Update M2M Category (Additive)
            cat_name = payload.category.strip()
            if cat_name:
                category = db.query(models.Category).filter(models.Category.name == cat_name).first()
                if not category:
                    category = models.Category(name=cat_name)
                    db.add(category)
                    db.flush()
                
                if category not in db_product.categories:
                    db_product.categories.append(category)
        
        # Note: Stock will be recalculated from variants below
    else:
        # Create
        db_product = models.Product(
            id=payload.id,
            sku=payload.sku,
            name=payload.name,
            description=payload.description,
            price=payload.price,
            stock=0, 
            image_url=payload.image_url,
            images=images_json,
            category=payload.category,
            is_active=True
        )
        
        # Handle M2M
        if payload.category:
            cat_name = payload.category.strip()
            if cat_name:
                category = db.query(models.Category).filter(models.Category.name == cat_name).first()
                if not category:
                    category = models.Category(name=cat_name)
                    db.add(category)
                    db.flush()
                db_product.categories.append(category)
        db.add(db_product)
        db.flush() 
        
    # 2. Sync Product Images Table (New Admin System)
    # Strategy: Delete all existing images for this product and re-insert from payload list
    # Payload 'images' is list of URLs. Index 0 is Main.
    
    # Delete existing
    db.query(models.ProductImage).filter(models.ProductImage.product_id == db_product.id).delete()
    
    # Insert new
    if payload.images:
        for idx, img_url in enumerate(payload.images):
            new_img = models.ProductImage(
                product_id=db_product.id,
                url=img_url,
                display_order=idx,
                color_variant=None # We don't have color info in simple image list. 
                # If management platform sends variants with images, we'd need that info. 
                # For now, simplistic list mapping.
            )
            db.add(new_img)
            
    # 3. Upsert Variants
    # We will assume payload variants are the ACTIVE variants. 
    # Should we delete variants not in payload? Ideally yes to handle deletions.
    # User says: "Envía... variants: [ { ... } ]"
    
    current_variant_skus = [v.sku for v in payload.variants]
    
    # Delete local variants that are NOT in payload (if any existed)
    # Only if payload provides variants. If empty list, maybe don't delete everything? 
    # Assume empty list means no variants (simple product).
    
    db.query(models.ProductVariant).filter(
        models.ProductVariant.product_id == db_product.id,
        models.ProductVariant.sku.notin_(current_variant_skus)
    ).delete(synchronize_session=False)

    total_stock = 0
    for v in payload.variants:
        db_variant = db.query(models.ProductVariant).filter(models.ProductVariant.sku == v.sku).first()
        
        if db_variant:
            # Update
            db_variant.stock = v.stock
            db_variant.size = v.size
            db_variant.color = v.color
            # Ensure it is linked to this product (fix if sku moved?)
            db_variant.product_id = db_product.id 
        else:
            # Create
            db_variant = models.ProductVariant(
                product_id=db_product.id,
                sku=v.sku,
                stock=v.stock,
                size=v.size,
                color=v.color
            )
            db.add(db_variant)
        
        total_stock += v.stock
        
    # Update total stock on parent product
    if payload.variants:
        db_product.stock = total_stock

    db.commit()
    return {"message": "Product synced successfully", "id": payload.id}

def normalize_text(text: str) -> str:
    if not text: return ""
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()

@app.get("/products/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """
    Obtiene lista de categorías únicas de productos activos.
    """
    categories = db.query(models.Category.name).join(models.Product.categories).filter(
        models.Product.is_active == True
    ).distinct().all()
    # categories is list of tuples
    return sorted([c[0] for c in categories if c[0]])

@app.get("/products", response_model=schemas.ProductListResponse)
def get_products(
    skip: int = 0, 
    limit: int = 20, 
    categories: Optional[List[str]] = Query(None, alias="category"), 
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).filter(models.Product.is_active == True).options(
        joinedload(models.Product.categories),
        joinedload(models.Product.labels)
    )
    
    # Database Filters (Fast)
    if categories:
        query = query.join(models.Product.categories).filter(models.Category.name.in_(categories)).distinct()
    
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
        
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)

    # Search Logic
    if search:
        # Fetch candidates to filter in Python (needed for Smart/Fuzzy/Accent-insensitive in SQLite)
        candidates = query.all()
        normalized_query = normalize_text(search)
        
        results = []
        for product in candidates:
            # Normalize product fields
            p_text = normalize_text(f"{product.name} {product.category or ''} {product.description or ''}")
            
            # 1. Direct containment (normalized)
            if normalized_query in p_text:
                results.append(product)
                continue
                
            # 2. Fuzzy-ish (Token containment) - "cuchillo verijero" matches "cuchillo"
            query_tokens = normalized_query.split()
            if all(token in p_text for token in query_tokens):
                results.append(product)
                continue
                
        total = len(results)
        # In-memory Pagination
        products_page = results[skip : skip + limit]
    else:
        # Standard DB Pagination
        total = query.count()
        products_page = query.offset(skip).limit(limit).all()
    
    current_page = (skip // limit) + 1
    
    return {"items": products_page, "total": total, "page": current_page, "limit": limit}

@app.get("/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/customers", response_model=schemas.Customer, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if db_customer:
        # Update existing customer info
        db_customer.full_name = customer.full_name
        db_customer.phone = customer.phone
        db.commit()
        db.refresh(db_customer)
        return db_customer
    
    new_customer = models.Customer(**customer.dict())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


import json

# --- SHIPPING INTEGRATION ---
class ShippingCalculationRequest(BaseModel):
    items: List[schemas.OrderItemCreate]
    delivery_method: str

@app.get("/config")
def get_config():
    """
    Retorna configuración pública para el frontend.
    """
    return {
        "free_shipping_threshold": float(os.getenv("FREE_SHIPPING_THRESHOLD", 55000))
    }

@app.post("/shipping/calculate")
def calculate_shipping(payload: ShippingCalculationRequest):
    """
    Calcula el costo de envío basado en el total y el método.
    """
    total_products = sum(item.quantity * item.unit_price for item in payload.items)
    shipping_service = services.shipping.ShippingService()
    
    cost = shipping_service.calculate_cost(total_amount=total_products, delivery_method=payload.delivery_method)
    
    threshold = float(os.getenv("FREE_SHIPPING_THRESHOLD", 55000))
    
    msg = "Envío Fijo"
    if payload.delivery_method == "pickup":
        msg = "Retiro en Local (Gratis)"
    elif cost == 0:
        msg = f"Envío Gratis (> ${threshold:,.0f})"
        
    return {"cost": cost, "message": msg}

@app.post("/orders", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Handle Customer (Buyer)
    # Extract buyer info from the new 'buyer' schema
    buyer_email = order.buyer.email
    buyer_name = f"{order.buyer.first_name} {order.buyer.last_name}"
    
    existing_cust = db.query(models.Customer).filter(models.Customer.email == buyer_email).first()
    if existing_cust:
        customer_id = existing_cust.id
        # Optional: Update phone if provided
        if order.buyer.phone:
            existing_cust.phone = order.buyer.phone
            existing_cust.full_name = buyer_name # Update name too
            db.commit()
    else:
        new_cust = models.Customer(
            full_name=buyer_name,
            email=buyer_email,
            phone=order.buyer.phone
        )
        db.add(new_cust)
        db.flush() # Get ID
        customer_id = new_cust.id
            
    # 2. Calculate Totals (Product + Shipping)
    products_total = sum(item.quantity * item.unit_price for item in order.items)
    
    # Calculate Shipping Cost
    shipping_service = services.shipping.ShippingService()
    shipping_cost = shipping_service.calculate_cost(
        total_amount=products_total, 
        delivery_method=order.shipping.method
    )
    
    total_with_shipping = products_total + shipping_cost

    # 3. Create Order with detailed JSON data
    new_order = models.Order(
        customer_id=customer_id, 
        total_amount=total_with_shipping, 
        status="pending",
        delivery_method=order.shipping.method,
        shipping_data=json.dumps(order.shipping.dict()),
        billing_data=json.dumps(order.billing.dict())
    )
    db.add(new_order)
    db.flush() # Get Order ID

    # 4. Create Order Items & VALIDATE STOCK
    for item in order.items:
        # Fetch Product
        db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not db_product:
             raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")

        # Variant Logic
        if item.variant_id:
            db_variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.variant_id).first()
            if not db_variant:
                raise HTTPException(status_code=400, detail=f"Variant {item.variant_id} not found for product {db_product.name}")
            
            if db_variant.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Sin stock suficiente para {db_product.name} (Variante: {db_variant.color or ''} {db_variant.size or ''}). Disponible: {db_variant.stock}")
            
            # Decrement Variant Stock
            db_variant.stock -= item.quantity
            
            # Also decrement logic for parent product? 
            # If parent stock is sum of variants, we should update it too to keep consistency.
            if db_product.stock >= item.quantity:
                 db_product.stock -= item.quantity
            else:
                # If parent stock is improperly synced, we just ensure it doesn't go negative, or ignore.
                db_product.stock = max(0, db_product.stock - item.quantity)

        else:
            # Main Product Logic (No variant)
            if db_product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Sin stock suficiente para {db_product.name}. Disponible: {db_product.stock}")
            
            # Decrement Product Stock
            db_product.stock -= item.quantity

        # Create Order Item
        db_item = models.OrderItem(order_id=new_order.id, **item.dict())
        db.add(db_item)
    
    db.commit()
    db.refresh(new_order)
    
    # 5. Generate Payment Preference
    try:
        payment_service = services.payment.PaymentService()
        
        preference_items = []
        for item in order.items: # item is OrderItemCreate schema
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            preference_items.append({
                "product_id": item.product_id,
                "name": product.name if product else "Producto",
                "quantity": item.quantity,
                "unit_price": item.unit_price
            })

        # Add Shipping Cost to Preference
        if shipping_cost > 0:
            preference_items.append({
                "product_id": "SHIPPING",
                "name": "Costo de Envío",
                "quantity": 1,
                "unit_price": shipping_cost
            })

        payment_url = payment_service.create_preference(
            order_id=new_order.id,
            items=preference_items, 
            payer_email=buyer_email
        )

        response_data = schemas.Order.from_orm(new_order)
        response_data.payment_url = payment_url
        return response_data
        
    except Exception as e:
        print(f"Error creating payment preference: {e}")
        # Return order without payment url if fails
        new_order.payment_url = payment_url
        db.commit() # Save update with Payment URL

        # Email notification moved to payment confirmation
        
        return new_order


@app.post("/orders/track", response_model=schemas.Order)
def track_order(payload: schemas.OrderTrackRequest, db: Session = Depends(get_db)):
    """
    Endpoint SEGURO para tracking. Requiere ID y Email.
    """
    order = db.query(models.Order).filter(models.Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify Email (Case insensitive)
    if not order.customer or order.customer.email.lower() != payload.email.lower():
        # Generic error to avoid enumerating valid IDs
        raise HTTPException(status_code=404, detail="Order not found with provided details")
        
    return order


@app.get("/orders/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, payment_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Obtiene los detalles de una orden por su ID.
    SECURED: Requiere 'payment_id' que coincida con la orden (para Checkout Success).
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Security Check: Must provide valid payment_id associated with order
    if not payment_id:
         raise HTTPException(status_code=403, detail="Access denied. Payment ID required.")
    
    # Verify Payment ID match (if order has one)
    if order.payment_id and order.payment_id != payment_id:
         raise HTTPException(status_code=403, detail="Invalid Payment Token")
         
    return order


@app.post("/orders/{order_id}/confirm")
def confirm_order(order_id: int, payment_id: str, db: Session = Depends(get_db)):
    """
    Verifica el pago en Mercado Pago y, si es exitoso:
    1. Actualiza el estado de la orden a 'paid'.
    2. Envía el email de notificación.
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Save Payment ID regardless of status (for tracking/audit/access)
    if not order.payment_id:
        order.payment_id = payment_id
        db.commit()

    # 1. Verify Payment with MP (Security Check)
    payment_service = services.payment.PaymentService()
    status = payment_service.get_payment_status(payment_id)
    
    if status == "approved":
        if order.status != "paid":
            order.status = "paid"
            db.commit()
            
            # 2. Send Email Notification
            try:
                email_service = services.email.EmailService()
                
                # Reconstruct items list for email (from DB items)
                # Need to join with Product table to get names/prices if needed, 
                # but OrderItem has product_id and unit_price.
                # For basic notification, we use what we have.
                email_items = [] 
                # Note: This list reconstruction is basic. ideally we fetch product names properly
                # But our OrderItem is defined in models.py
                
                # 1. Email to Client (HTML Pro)
                email_service.send_order_confirmation_client(order)

                # 2. Email to Admin (Simple Alert)
                email_service.send_order_notification_admin(order)
            except Exception as e:
                print(f"Error sending confirmation email: {e}")
            
            # 3. Notify Management Platform (Webhook)
            try:
                integration_service = services.integration.IntegrationService()
                integration_service.notify_new_sale(order, payment_id)
            except Exception as e:
                print(f"Error calling integration webhook: {e}")
        
        return {"message": "Order confirmed and email sent", "status": "paid"}
    else:
        print(f"Payment verification failed for Order #{order_id}. Status: {status}")
        return {"message": "Payment not approved yet", "status": status}



@app.delete("/admin/products/mocks", status_code=status.HTTP_200_OK, dependencies=[Depends(verify_admin_key)])
def delete_mock_products(db: Session = Depends(get_db)):
    """
    Endpoint temporal para eliminar productos mock remanentes en producción.
    Elimina: MC-SOM-PAMPA, MC-BOI-VENTO, MC-CUCH-ART, TEST-PRICE-10K
    """
    ids_to_remove = [
        "MC-SOM-PAMPA", 
        "MC-BOI-VENTO", 
        "MC-CUCH-ART", 
        "TEST-PRICE-10K"
    ]
    
    # 1. Delete Variants
    db.query(models.ProductVariant).filter(models.ProductVariant.product_id.in_(ids_to_remove)).delete(synchronize_session=False)
    
    # 2. Delete Products
    deleted_count = db.query(models.Product).filter(models.Product.id.in_(ids_to_remove)).delete(synchronize_session=False)
    
    db.commit()
    
    return {"message": "Mock products deleted", "count": deleted_count, "ids": ids_to_remove}

@app.delete("/admin/products/{product_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(verify_admin_key)])
def delete_product(product_id: str, db: Session = Depends(get_db)):
    """
    Elimina un producto específico y sus variantes.
    """
    # 1. Delete Variants
    db.query(models.ProductVariant).filter(models.ProductVariant.product_id == product_id).delete(synchronize_session=False)
    
    # 2. Delete Product
    deleted_count = db.query(models.Product).filter(models.Product.id == product_id).delete(synchronize_session=False)
    
    db.commit()
    
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return {"message": "Product deleted", "id": product_id}

@app.delete("/admin/products/all", status_code=status.HTTP_200_OK, dependencies=[Depends(verify_admin_key)])
def delete_all_products(db: Session = Depends(get_db)):
    """
    🔥 PELIGRO: Elimina TODOS los productos y variantes.
    """
    try:
        num_variants = db.query(models.ProductVariant).delete()
        num_products = db.query(models.Product).delete()
        db.commit()
        return {"message": "All products deleted", "products_deleted": num_products, "variants_deleted": num_variants}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting data: {str(e)}")

