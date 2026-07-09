from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class WalletResponse(BaseModel):
    user_id: UUID
    balance: float
    currency: str
    bonus_coins: int
    stripe_connected: bool
    paypal_connected: bool


class TransactionResponse(BaseModel):
    id: UUID
    type: str
    label: str
    amount: float
    currency: str
    order_id: UUID | None = None
    created_at: datetime


class ProductResponse(BaseModel):
    id: UUID
    seller_id: UUID
    seller_name: str
    title: str
    description: str
    price: float
    currency: str
    category: str
    image_emoji: str
    media_url: str | None = None
    media_type: str | None = None
    stock: int
    status: str
    is_digital: bool
    created_at: datetime


class CreateProductRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=128)
    description: str = Field(default="", max_length=2000)
    price: float = Field(..., gt=0)
    category: str = Field(default="general", max_length=64)
    image_emoji: str = Field(default="🛍", max_length=8)
    stock: int = Field(default=1, ge=0)
    is_digital: bool = False
    media_url: str | None = Field(default=None, max_length=2048)
    media_type: str | None = Field(default=None, max_length=16)


class CartItemResponse(BaseModel):
    product_id: UUID
    title: str
    price: float
    currency: str
    quantity: int
    image_emoji: str
    seller_name: str
    line_total: float


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    subtotal: float
    currency: str
    item_count: int


class AddToCartRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(default=1, ge=1, le=99)


class OrderItemResponse(BaseModel):
    product_id: UUID
    title: str
    price: float
    quantity: int


class OrderResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    buyer_name: str
    seller_id: UUID
    seller_name: str
    status: str
    total: float
    currency: str
    items: list[OrderItemResponse]
    created_at: datetime


class CheckoutResponse(BaseModel):
    orders: list[OrderResponse]
    total_paid: float
    currency: str


class MarketplaceDashboard(BaseModel):
    active_listings: int
    total_sales: float
    orders_to_fulfill: int
    currency: str


class PaymentProviderRequest(BaseModel):
    provider: str = Field(..., pattern=r"^(stripe|paypal)$")
    connected: bool