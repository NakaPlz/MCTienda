from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Force load from .env in same directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

# Obtener URL de base de datos desde variables de entorno o usar valor por defecto para docker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/tiendadb")
print(f"DEBUG: DATABASE_URL loaded: {DATABASE_URL}")

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
