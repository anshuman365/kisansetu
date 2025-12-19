from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from .common import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop = Column(String, nullable=False)
    variety = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    quantity_unit = Column(String, nullable=False)
    moisture = Column(Float, nullable=True)
    min_price = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    status = Column(String, default="OPEN")
    current_high_bid = Column(Float, default=0)
    bids_count = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def coordinates(self):
        return {"lat": self.lat, "lng": self.lng} if self.lat and self.lng else None

class Bid(Base):
    __tablename__ = "bids"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
