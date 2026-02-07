from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from dotenv import load_dotenv
import os
from pydantic import BaseModel

# Load env vars before importing local modules that use them
load_dotenv()

import models, schemas, database, services.payment, services.shipping, services.email, services.integration
import uuid

# Crear tablas en la base de datos al inicio
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Tienda Muy Criollo API", version="0.1.0")

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
                db_product.category = item.category
                db_product.is_active = item.is_active
                if item.external_id:
                    db_product.external_id = item.external_id
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
                    category=item.category,
                    is_active=item.is_active
                )
                db.add(new_product)
                results["created"] += 1
                
        except Exception as e:
            print(f"Error syncing product {item.sku}: {e}")
            results["errors"] += 1
            continue
            
    db.commit()
    return {"message": "Sincronización completada", "details": results}

@app.post("/webhooks/products", status_code=status.HTTP_200_OK)
def webhook_update_product(payload: schemas.ProductUpdatePayload, db: Session = Depends(get_db)):
    """
    Webhook para recibir actualizaciones de un SOLO producto (y sus variantes) desde la Plataforma de Gestión.
    """
    print(f"📥 Webhook received for Product ID: {payload.id} (SKU: {payload.sku})")
    
    # 1. Upsert Product
    db_product = db.query(models.Product).filter(models.Product.id == payload.id).first()
    
    if db_product:
        # Update
        db_product.sku = payload.sku
        db_product.name = payload.name
        db_product.price = payload.price
        if payload.description:
            db_product.description = payload.description
        if payload.image_url:
            db_product.image_url = payload.image_url
        if payload.images:
            db_product.images = json.dumps(payload.images)
        if payload.category:
            db_product.category = payload.category
        
        # Don't overwrite stock if we managing it per variant, but maybe we sum it?
        # For now, let's assume Main Product Stock is sum of variants OR standalone.
        # If payload has variants, we might ignore main stock or sum it. 
        # But let's verify context. Models has Stock column on Product.
    else:
        # Create
        db_product = models.Product(
            id=payload.id,
            sku=payload.sku,
            name=payload.name,
            description=payload.description,
            price=payload.price,
            stock=0, # Will be calculated or set by variants
            image_url=payload.image_url,
            images=json.dumps(payload.images) if payload.images else "[]",
            category=payload.category,
            is_active=True
        )
        db.add(db_product)
        db.flush() # Ensure ID exists for variants
        
    # 2. Upsert Variants
    total_stock = 0
    for v in payload.variants:
        # Try to find variant by SKU (Global Unique SKU ideal)
        db_variant = db.query(models.ProductVariant).filter(models.ProductVariant.sku == v.sku).first()
        
        if db_variant:
            # Update
            db_variant.stock = v.stock
            if v.size: db_variant.size = v.size
            if v.color: db_variant.color = v.color
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
        
    # Update total stock on parent product if variants exist
    if payload.variants:
        db_product.stock = total_stock

    db.commit()
    return {"message": "Product updated successfully", "id": payload.id, "variants_processed": len(payload.variants)}

@app.get("/products", response_model=schemas.ProductListResponse)
def get_products(
    skip: int = 0, 
    limit: int = 20, 
    category: Optional[str] = None, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).filter(models.Product.is_active == True)
    
    # Filtering Logic (Pre-emptively adding for next step)
    if category:
        query = query.filter(models.Product.category == category)
    if search:
        # Simple case-insensitive search on name
        query = query.filter(models.Product.name.ilike(f"%{search}%"))

    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    # Calculate current page (1-based)
    current_page = (skip // limit) + 1
    
    return {"items": products, "total": total, "page": current_page, "limit": limit}

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

@app.post("/shipping/calculate")
def calculate_shipping(payload: ShippingCalculationRequest):
    """
    Calcula el costo de envío basado en el total y el método.
    """
    total_products = sum(item.quantity * item.unit_price for item in payload.items)
    shipping_service = services.shipping.ShippingService()
    # Assuming 'items' in payload are passed correctly. 
    # Note: schemas.OrderCreate structure changed, so we adjusted the payload expectation here.
    
    cost = shipping_service.calculate_cost(total_amount=total_products, delivery_method=payload.delivery_method)
    
    msg = "Envío Fijo"
    if payload.delivery_method == "pickup":
        msg = "Retiro en Local (Gratis)"
    elif cost == 0:
        msg = "Envío Gratis (> $35.000)"
        
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

    # 4. Create Order Items
    for item in order.items:
        # Check stock logic suppressed for now
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


@app.get("/orders/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """
    Obtiene los detalles de una orden por su ID.
    Uso: Pantalla de confirmación de compra (Success Page).
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
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



@app.delete("/admin/products/mocks", status_code=status.HTTP_200_OK)
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

@app.delete("/admin/products/all", status_code=status.HTTP_200_OK)
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

