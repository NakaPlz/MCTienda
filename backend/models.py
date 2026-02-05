from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True) # UUID from Management Platform or local
    external_id = Column(String, unique=True, index=True, nullable=True) # ID in Management Platform
    sku = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float)
    stock = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    category = Column(String, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    variants = relationship("ProductVariant", back_populates="product")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"))
    sku = Column(String, unique=True, index=True)
    size = Column(String, nullable=True)
    color = Column(String, nullable=True)
    stock = Column(Integer, default=0)

    product = relationship("Product", back_populates="variants")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total_amount = Column(Float)
    status = Column(String, default="pending") # pending, paid, shipped, cancelled
    
    # New fields for detailed checkout
    delivery_method = Column(String, default="shipping") # shipping, pickup
    shipping_data = Column(Text, nullable=True) # JSON with address or pickup info
    billing_data = Column(Text, nullable=True) # JSON with A/B invoice details
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
