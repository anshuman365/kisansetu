# app/schemas.py
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum

# Enums for schemas
class UserRole(str, Enum):
    FARMER = "FARMER"
    BUYER = "BUYER"
    TRADER = "TRADER"
    ADMIN = "ADMIN"

class CropType(str, Enum):
    DHAN = "Dhan (Paddy)"
    RICE = "Rice"
    WHEAT = "Wheat"
    MAIZE = "Maize"

class QuantityUnit(str, Enum):
    QUINTAL = "quintal"
    TON = "ton"

class OrderStatus(str, Enum):
    OPEN = "OPEN"
    LOCKED = "LOCKED"
    DELIVERED = "DELIVERED"

class DealStatus(str, Enum):
    LOCKED = "LOCKED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

# Base schemas
class UserBase(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10, pattern=r'^[0-9]+$')
    name: str
    role: UserRole
    location: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    phone: str
    password: str

class UserResponse(UserBase):
    id: int
    is_verified: bool
    trust_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int
    role: str

# Order schemas
class OrderBase(BaseModel):
    crop: CropType
    variety: str
    quantity: float = Field(..., gt=0)
    quantity_unit: QuantityUnit
    moisture: Optional[float] = Field(None, ge=0, le=100)
    min_price: float = Field(..., gt=0)
    location: str
    pincode: str = Field(..., min_length=6, max_length=6, pattern=r'^[0-9]+$')

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    farmer_id: int
    current_high_bid: float
    bids_count: int
    status: OrderStatus
    expires_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# Bid schemas
class BidBase(BaseModel):
    amount: float = Field(..., gt=0)

class BidCreate(BidBase):
    pass

class BidResponse(BidBase):
    id: int
    order_id: int
    bidder_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Deal schemas
class DealBase(BaseModel):
    status: Optional[DealStatus] = None

class DealCreate(BaseModel):
    bid_id: int

class DealResponse(BaseModel):
    id: int
    order_id: int
    seller_id: int
    buyer_id: int
    final_price: float
    total_amount: float
    status: DealStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class DealStatusUpdate(BaseModel):
    status: DealStatus

# Admin schemas
class UserVerify(BaseModel):
    is_verified: bool = True