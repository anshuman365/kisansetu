from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class SubscriptionObj(BaseModel):
    plan: str
    expiry_date: datetime
    is_active: bool

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str
    location: str
    is_verified: bool
    is_blocked: bool
    kyc_status: str
    trust_score: float
    subscription: SubscriptionObj
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
