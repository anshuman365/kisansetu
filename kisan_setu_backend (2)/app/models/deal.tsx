from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from .common import Base

class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    final_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False) # Base Crop Cost
    
    # Fulfillment
    status = Column(String, default="LOCKED") 
    transport_mode = Column(String, nullable=True) # KISAN_SETU, SELF, DIRECT_DEAL
    
    # Logistics Logic
    pickup_address = Column(String, nullable=True)
    drop_address = Column(String, nullable=True)
    distance_km = Column(Float, default=0.0)
    transport_cost = Column(Float, default=0.0)
    
    # Financials (Advance + Final)
    advance_amount = Column(Float, default=0.0) # Transport + 5% Crop
    remaining_amount = Column(Float, default=0.0) # 95% Crop
    
    payment_status = Column(String, default="PENDING") # PENDING, ADVANCE_PAID, FULLY_PAID
    razorpay_order_id = Column(String, nullable=True)
    
    tracking_status = Column(String, default="PENDING") # PENDING, ASSIGNED, TRANSIT, DELIVERED
    tracking_id = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
