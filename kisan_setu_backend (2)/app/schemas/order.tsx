from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict
from datetime import datetime

class OrderResponse(BaseModel):
    id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    crop: str
    variety: str
    quantity: float
    quantity_unit: str
    moisture: float
    min_price: float
    current_high_bid: float
    bids_count: int
    location: str
    pincode: str
    coordinates: Optional[Dict[str, float]] = None
    status: str
    created_at: datetime
    expires_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BidResponse(BaseModel):
    id: int
    order_id: int
    bidder_id: int
    bidder_name: Optional[str] = None
    amount: float
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
