from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, func
from datetime import datetime, timedelta, timezone
from .common import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=False)
    
    is_verified = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)
    kyc_status = Column(String, default="NOT_SUBMITTED") 
    kyc_data = Column(String, nullable=True) # JSON String for URLs
    bank_details = Column(String, nullable=True) # JSON String
    trust_score = Column(Float, default=3.5)
    
    subscription_plan = Column(String, default="FREE") 
    subscription_expiry = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(days=15))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def subscription(self):
        return {
            "plan": self.subscription_plan,
            "expiry_date": self.subscription_expiry,
            "is_active": self.subscription_expiry > datetime.now(timezone.utc)
        }

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="SYSTEM") 
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
