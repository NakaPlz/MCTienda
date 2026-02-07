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

class ProductCreate(ProductBase):
    pass

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

from pydantic import BaseModel, field_validator
import json

# ... (ProductBase remains the same, or we add images there? Let's add it to Product primarily)

class Product(ProductBase):
    id: str
    updated_at: Optional[datetime] = None
    variants: List[ProductVariant] = []
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
    shipping_data: Optional[str] = None # JSON string
    billing_data: Optional[str] = None # JSON string
    class Config:
        from_attributes = True
