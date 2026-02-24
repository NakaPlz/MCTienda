from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

from sqlalchemy import Table

# Association Table for Many-to-Many
# Association Table for Many-to-Many Categories
product_categories = Table('product_categories', Base.metadata,
    Column('product_id', String, ForeignKey('products.id'), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True)
)

# Association Table for Many-to-Many Labels
product_labels = Table('product_labels', Base.metadata,
    Column('product_id', String, ForeignKey('products.id'), primary_key=True),
    Column('label_id', Integer, ForeignKey('labels.id'), primary_key=True)
)

class SizeGuide(Base):
    __tablename__ = "size_guides"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    image_url = Column(String, nullable=True)
    content = Column(Text, nullable=True)

    products = relationship("Product", back_populates="size_guide")


class Label(Base):
    __tablename__ = "labels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    color = Column(String, default="#000000") # Hex Code

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

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
    images = Column(Text, nullable=True) # JSON list of strings
    category = Column(String, index=True, nullable=True) # DEPRECATED: Use categories relationship
    is_active = Column(Boolean, default=True)
    
    # Admin Controls
    price_override = Column(Float, nullable=True)
    discount_percentage = Column(Integer, default=0)
    
    # Size Guide Reference
    size_guide_id = Column(Integer, ForeignKey('size_guides.id'), nullable=True)
    size_guide = relationship("SizeGuide", back_populates="products")
    
    variants = relationship("ProductVariant", back_populates="product")
    product_images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    categories = relationship("Category", secondary=product_categories, backref="products")
    labels = relationship("Label", secondary=product_labels, backref="products")

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"))
    url = Column(String)
    display_order = Column(Integer, default=0)
    color_variant = Column(String, nullable=True) # If null, shows for all. If set, only for that color.
    
    product = relationship("Product", back_populates="product_images")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"))
    sku = Column(String, unique=True, index=True)
    size = Column(String, nullable=True) # Deprecated soon
    color = Column(String, nullable=True) # Deprecated soon
    attributes = Column(Text, nullable=True) # JSON dictionary of dynamic attributes
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
    payment_id = Column(String, nullable=True) # MercadoPago Payment ID for verification
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(String, ForeignKey("products.id"))
    variant_id = Column(Integer, nullable=True) # Link to specific variant if applicable
    quantity = Column(Integer)
    unit_price = Column(Float)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
