from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
import models, schemas
import os
from database import get_db

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    # dependencies=[Depends(get_current_active_user)], # TODO: Add Auth
)

from jose import jwt, JWTError

# Config matching auth.py
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_fallback_key_change_me")
ALGORITHM = "HS256"

# Admin Security Dependency
admin_header = APIKeyHeader(name="x-admin-key", auto_error=False)

async def verify_admin_key(api_key: str = Security(admin_header)):
    # 1. Check for Static API Key (for Scripts/Integrations)
    static_key = os.getenv("ADMIN_API_KEY")
    if static_key and api_key == static_key:
        return api_key

    # 2. Check for JWT Token (for Admin Panel)
    if api_key:
        try:
            payload = jwt.decode(api_key, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            role: str = payload.get("role")
            if username and role == "admin":
                return api_key
        except JWTError:
            pass # Fallthrough to error

    # 3. Fail if neither passed
    if not static_key:
         # Only raise 500 if we absolutely can't validate anything (no key set and invalid JWT)
         # However, for clearer DX, we just say access denied if JWT fails.
         # But if the user meant to use static key and forgot to set it, we might warn.
         pass 

    raise HTTPException(status_code=403, detail="Admin access denied")

class PriceUpdate(BaseModel):
    price_override: Optional[float] = None
    discount_percentage: Optional[int] = 0

class ImageReorder(BaseModel):
    new_order: int

class ImageUpload(BaseModel):
    url: str
    display_order: int = 0
    color_variant: Optional[str] = None

# --- Product Management ---

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """
    Retorna estadísticas para el Dashboard.
    """
    # 1. Active Products
    active_products = db.query(models.Product).filter(models.Product.is_active == True).count()
    
    # 2. Low Stock (Simple logic: Product stock < 5 OR Variant stock < 5)
    # Checking Variants first
    low_stock_variants = db.query(models.ProductVariant).filter(models.ProductVariant.stock < 5).count()
    # Checking Products without variants (or where stock is managed at product level)
    # This might be tricky if mixed, but let's just count products with stock < 5 
    low_stock_products = db.query(models.Product).filter(models.Product.stock < 5).count()
    
    # A bit redundant if we sum them, but gives an idea.
    # Let's just return "Low Stock Items" as a heuristic
    low_stock_count = low_stock_products 
    
    # 3. Sales Today
    from datetime import datetime, time
    today_start = datetime.combine(datetime.now().date(), time.min)
    
    sales_today = db.query(func.sum(models.Order.total_amount)).filter(
        models.Order.created_at >= today_start,
        models.Order.status == "paid"
    ).scalar() or 0.0
    
    return {
        "active_products": active_products,
        "low_stock": low_stock_count,
        "sales_today": sales_today
    }

# --- Category Management ---

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(CategoryCreate):
    id: int

    class Config:
        orm_mode = True

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories_admin(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    new_cat = models.Category(name=category.name, description=category.description)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(cat)
    db.commit()
    return {"status": "success"}

# --- Product Management ---

@router.put("/products/{product_id}/details")
def update_product_details(
    product_id: str,
    details: schemas.ProductDetailUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
         raise HTTPException(status_code=404, detail="Product not found")
         
    if details.description is not None:
        product.description = details.description
        
    if details.size_guide_id is not None:
        if details.size_guide_id == 0:
            product.size_guide_id = None
        else:
            product.size_guide_id = details.size_guide_id
         
    if details.category_names is not None:
        # Clear current categories
        product.categories = []
        
        for cat_name in details.category_names:
            cat_name = cat_name.strip()
            if not cat_name: continue
            
            # Find or create
            category = db.query(models.Category).filter(models.Category.name == cat_name).first()
            if not category:
                category = models.Category(name=cat_name)
                db.add(category)
            
            product.categories.append(category)
            
        # Update legacy field for backward compatibility (set to first category)
        if product.categories:
            product.category = product.categories[0].name
        else:
            product.category = None

    if details.label_ids is not None:
        # Update Labels
        product.labels = [] # Clear existing
        if details.label_ids:
            labels = db.query(models.Label).filter(models.Label.id.in_(details.label_ids)).all()
            product.labels = labels
        
    db.commit()
    db.refresh(product)
    return product

@router.get("/products", response_model=List[schemas.Product])
def get_admin_products(
    skip: int = 0, 
    limit: int = 500, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if search:
        query = query.filter(models.Product.name.contains(search))
    return query.offset(skip).limit(limit).all()

@router.put("/products/{product_id}/price", response_model=schemas.Product)
def update_product_price(
    product_id: str, 
    price_data: PriceUpdate, 
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if price_data.price_override is not None:
        product.price_override = price_data.price_override
    if price_data.discount_percentage is not None:
        product.discount_percentage = price_data.discount_percentage
    
    db.commit()
    db.refresh(product)
    return product

class BatchPriceUpdate(BaseModel):
    category: Optional[str] = None
    discount_percentage: int

@router.put("/products/prices/batch")
def update_batch_prices(
    batch_data: BatchPriceUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza masivamente el porcentaje de descuento por categoría.
    Si category es None, aplica a todos.
    """
    query = db.query(models.Product).filter(models.Product.is_active == True)
    
    if batch_data.category:
        # Filter by M2M Relationship
        query = query.filter(models.Product.categories.any(models.Category.name == batch_data.category))
        
    updated_count = query.update(
        {models.Product.discount_percentage: batch_data.discount_percentage}, 
        synchronize_session=False
    )
    
    db.commit()
    return {"status": "success", "updated_count": updated_count}

@router.post("/products/{product_id}/images", response_model=schemas.ProductImage)
def add_product_image(
    product_id: str, 
    image_data: ImageUpload, 
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_image = models.ProductImage(
        product_id=product_id,
        url=image_data.url,
        display_order=image_data.display_order,
        color_variant=image_data.color_variant
    )
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    return new_image

# --- Image Management ---

@router.delete("/images/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.ProductImage).filter(models.ProductImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    db.delete(image)
    db.commit()
    return {"status": "success"}

@router.put("/images/{image_id}/reorder")
def reorder_image(image_id: int, reorder_data: ImageReorder, db: Session = Depends(get_db)):
    image = db.query(models.ProductImage).filter(models.ProductImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    image.display_order = reorder_data.new_order
    db.commit()
    return {"status": "success"}

# --- Stock Sync ---

@router.post("/sync-stock")
def sync_stock(db: Session = Depends(get_db)):
    # Placeholder for integration with Management Platform
    # Logic to fetch stock from external API and update local DB
    return {"status": "sync_initiated", "message": "Stock sync logic to be implemented"}
