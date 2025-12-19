from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class DealResponse(BaseModel):
    id: int
    order_id: int
    seller_id: int
    seller_name: Optional[str] = None
    seller_phone: Optional[str] = None
    buyer_id: int
    buyer_name: Optional[str] = None
    buyer_phone: Optional[str] = None
    crop: Optional[str] = None
    variety: Optional[str] = None
    quantity: Optional[float] = None
    quantity_unit: Optional[str] = None
    final_price: float
    total_amount: float
    status: str
    transport_mode: Optional[str] = None
    payment_status: str
    tracking_status: str
    tracking_id: Optional[str] = None
    created_at: datetime
    
    # Logistics
    distance_km: float = 0
    transport_cost: float = 0
    advance_amount: float = 0
    remaining_amount: float = 0

    model_config = ConfigDict(from_attributes=True)
