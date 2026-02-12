from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from routers.admin import verify_admin_key

router = APIRouter(
    prefix="/admin/labels",
    tags=["labels"],
    dependencies=[Depends(verify_admin_key)]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.Label])
def get_labels(db: Session = Depends(get_db)):
    return db.query(models.Label).all()

@router.post("/", response_model=schemas.Label, status_code=status.HTTP_201_CREATED)
def create_label(label: schemas.LabelCreate, db: Session = Depends(get_db)):
    db_label = models.Label(name=label.name, color=label.color)
    db.add(db_label)
    db.commit()
    db.refresh(db_label)
    return db_label

@router.put("/{label_id}", response_model=schemas.Label)
def update_label(label_id: int, label_update: schemas.LabelCreate, db: Session = Depends(get_db)):
    db_label = db.query(models.Label).filter(models.Label.id == label_id).first()
    if not db_label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    db_label.name = label_update.name
    db_label.color = label_update.color
    db.commit()
    db.refresh(db_label)
    return db_label

@router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(label_id: int, db: Session = Depends(get_db)):
    db_label = db.query(models.Label).filter(models.Label.id == label_id).first()
    if not db_label:
        raise HTTPException(status_code=404, detail="Label not found")
        
    db.delete(db_label)
    db.commit()
    return None
