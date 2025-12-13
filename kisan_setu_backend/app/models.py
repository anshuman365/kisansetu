# app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.database import Base
import enum

# Enums
class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    BUYER = "BUYER"
    TRADER = "TRADER"
    ADMIN = "ADMIN"

class CropType(str, enum.Enum):
    DHAN = "Dhan (Paddy)"
    RICE = "Rice"
    WHEAT = "Wheat"
    MAIZE = "Maize"

class QuantityUnit(str, enum.Enum):
    QUINTAL = "quintal"
    TON = "ton"

class OrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    LOCKED = "LOCKED"
    DELIVERED = "DELIVERED"

class DealStatus(str, enum.Enum):
    LOCKED = "LOCKED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone = Column(String(10), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    location = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    trust_score = Column(Float, default=3.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="farmer", foreign_keys="Order.farmer_id")
    bids = relationship("Bid", back_populates="bidder")
    seller_deals = relationship("Deal", back_populates="seller", foreign_keys="Deal.seller_id")
    buyer_deals = relationship("Deal", back_populates="buyer", foreign_keys="Deal.buyer_id")
    
    __table_args__ = (
        CheckConstraint('trust_score >= 0 AND trust_score <= 5', name='trust_score_range'),
    )

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop = Column(Enum(CropType), nullable=False)
    variety = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    quantity_unit = Column(Enum(QuantityUnit), nullable=False)
    moisture = Column(Float, nullable=True)
    min_price = Column(Float, nullable=False)
    current_high_bid = Column(Float, default=0)
    bids_count = Column(Integer, default=0)
    location = Column(String, nullable=False)
    pincode = Column(String(6), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.OPEN)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    farmer = relationship("User", back_populates="orders", foreign_keys=[farmer_id])
    bids = relationship("Bid", back_populates="order", cascade="all, delete-orphan")
    deal = relationship("Deal", back_populates="order", uselist=False)

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="bids")
    bidder = relationship("User", back_populates="bids")

class Deal(Base):
    __tablename__ = "deals"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    final_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(DealStatus), default=DealStatus.LOCKED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="deal")
    seller = relationship("User", back_populates="seller_deals", foreign_keys=[seller_id])
    buyer = relationship("User", back_populates="buyer_deals", foreign_keys=[buyer_id])