from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import json

class ProductBase(BaseModel):
    external_id: Optional[str] = None
    sku: str
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    image_url: Optional[str] = None
    images: Optional[List[str]] = []
    category: Optional[str] = None
    is_active: bool = True
    
    # Admin Fields
    price_override: Optional[float] = None
    discount_percentage: int = 0

class ProductCreate(ProductBase):
    variants: Optional[List["VariantUpdate"]] = []

class ProductUpdate(ProductBase):
    pass

class ProductSyncRequest(BaseModel):
    products: List[ProductCreate]

class ProductVariantBase(BaseModel):
    sku: str
    size: Optional[str] = None
    color: Optional[str] = None
    stock: int

class ProductVariant(ProductVariantBase):
    id: int
    class Config:
        from_attributes = True

class ProductImageBase(BaseModel):
    url: str
    display_order: int = 0
    color_variant: Optional[str] = None

class ProductImage(ProductImageBase):
    id: int
    product_id: str
    class Config:
        from_attributes = True

class Category(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class LabelCreate(BaseModel):
    name: str
    color: str

class Label(BaseModel):
    id: int
    name: str
    color: str
    class Config:
        from_attributes = True

class SizeGuideBase(BaseModel):
    name: str
    image_url: Optional[str] = None
    content: Optional[str] = None

class SizeGuideCreate(SizeGuideBase):
    pass

class SizeGuide(SizeGuideBase):
    id: int
    class Config:
        from_attributes = True

class Product(ProductBase):
    id: str
    updated_at: Optional[datetime] = None
    size_guide_id: Optional[int] = None
    size_guide: Optional[SizeGuide] = None
    variants: List[ProductVariant] = []
    product_images: List[ProductImage] = [] # New relationship
    categories: List[Category] = [] # Many-to-Many
    labels: List[Label] = [] # Many-to-Many
    images: Optional[List[str]] = []

    @field_validator('images', mode='before')
    def parse_images(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v if v else []

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    items: List[Product]
    total: int
    page: int
    limit: int
class VariantUpdate(BaseModel):
    sku: str
    size: Optional[str] = None
    color: Optional[str] = None
    stock: int

class ProductUpdatePayload(BaseModel):
    id: str # UUID from external system
    sku: str
    name: str # Might be updated
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    images: Optional[List[str]] = []
    category: Optional[str] = None
    variants: List[VariantUpdate] = []

class ProductDetailUpdate(BaseModel):
    category_names: Optional[List[str]] = None
    label_ids: Optional[List[int]] = None
    description: Optional[str] = None
    size_guide_id: Optional[int] = None
    # Add other fields here if needed (e.g. name)

# Customer Schemas
class CustomerBase(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Order Schemas
class OrderItemBase(BaseModel):
    product_id: str
    variant_id: Optional[int] = None
    quantity: int
    unit_price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    class Config:
        from_attributes = True

# --- New Detailed Checkout Schemas ---

class BuyerData(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None

class ShippingOption(BaseModel):
    method: str # "shipping" | "pickup"
    # Shipping Address (if method == shipping)
    address: Optional[str] = None
    floor_apt: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    zip_code: Optional[str] = None
    # Pickup Info (if method == pickup)
    pickup_name: Optional[str] = None
    pickup_dni: Optional[str] = None

class BillingData(BaseModel):
    invoice_type: str # "A" | "B"
    name: Optional[str] = None # Name or Business Name
    dni: Optional[str] = None # For B
    cuit: Optional[str] = None # For A
    fiscal_address: Optional[str] = None # For A
    email: Optional[str] = None # Explicit email for billing

class OrderCreate(BaseModel):
    buyer: BuyerData
    shipping: ShippingOption
    billing: BillingData
    items: List[OrderItemCreate]

class Order(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    status: str
    delivery_method: Optional[str] = None
    created_at: datetime
    customer: Customer
    items: List[OrderItem]
    payment_url: Optional[str] = None
    payment_id: Optional[str] = None
    shipping_data: Optional[str] = None # JSON string
    billing_data: Optional[str] = None # JSON string
    class Config:
        from_attributes = True

class OrderTrackRequest(BaseModel):
    order_id: int
    email: str
