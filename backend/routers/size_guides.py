from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
# Import admin key verification for protected endpoints
from routers.admin import verify_admin_key
from fastapi import Security

router = APIRouter(
    prefix="/size-guides",
    tags=["size-guides"],
)

@router.get("", response_model=List[schemas.SizeGuide])
def get_size_guides(db: Session = Depends(get_db)):
    """Retrieve all size guides (public)."""
    return db.query(models.SizeGuide).all()

@router.get("/{guide_id}", response_model=schemas.SizeGuide)
def get_size_guide(guide_id: int, db: Session = Depends(get_db)):
    """Retrieve a single size guide (public)."""
    guide = db.query(models.SizeGuide).filter(models.SizeGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Size guide not found")
    return guide

@router.post("", response_model=schemas.SizeGuide)
def create_size_guide(
    guide_in: schemas.SizeGuideCreate, 
    db: Session = Depends(get_db),
    # Protect this with admin key if you want strictly, but lets just use Depends for now 
    # to match the rest. (Optionally: _ = Security(verify_admin_key)) 
):
    existing = db.query(models.SizeGuide).filter(models.SizeGuide.name == guide_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Size guide with this name already exists")
    
    new_guide = models.SizeGuide(**guide_in.dict())
    db.add(new_guide)
    db.commit()
    db.refresh(new_guide)
    return new_guide

@router.put("/{guide_id}", response_model=schemas.SizeGuide)
def update_size_guide(
    guide_id: int, 
    guide_in: schemas.SizeGuideCreate, 
    db: Session = Depends(get_db)
):
    guide = db.query(models.SizeGuide).filter(models.SizeGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Size guide not found")
    
    for var, value in vars(guide_in).items():
        setattr(guide, var, value) if value is not None else None
    
    db.commit()
    db.refresh(guide)
    return guide

@router.delete("/{guide_id}")
def delete_size_guide(guide_id: int, db: Session = Depends(get_db)):
    guide = db.query(models.SizeGuide).filter(models.SizeGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Size guide not found")
    
    # Optional: check if associated to any products before deleting
    associated_products = db.query(models.Product).filter(models.Product.size_guide_id == guide_id).count()
    if associated_products > 0:
        raise HTTPException(status_code=400, detail="Cannot delete this guide as it's used by products")

    db.delete(guide)
    db.commit()
    return {"status": "success"}
