# app/main_fixed_v3.py - COMPLETE WORKING VERSION WITH ALL ENDPOINTS
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, select, func
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import enum
import os
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, validator
import json

# ========== CONFIG ==========
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./kisansetu.db")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ========== DATABASE ==========
engine = create_async_engine(DATABASE_URL, echo=True)
Base = declarative_base()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# ========== MODELS ==========
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(10), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    trust_score = Column(Float, default=3.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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
    current_high_bid = Column(Float, default=0)
    bids_count = Column(Integer, default=0)
    location = Column(String, nullable=False)
    pincode = Column(String(6), nullable=False)
    status = Column(String, default="OPEN")  # OPEN, LOCKED, DELIVERED
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])
    bids = relationship("Bid", back_populates="order", cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="bids")
    bidder = relationship("User", foreign_keys=[bidder_id])

class Deal(Base):
    __tablename__ = "deals"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    final_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="LOCKED")  # LOCKED, IN_TRANSIT, DELIVERED, CANCELLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order")
    seller = relationship("User", foreign_keys=[seller_id])
    buyer = relationship("User", foreign_keys=[buyer_id])

# ========== PYDANTIC SCHEMAS ==========
class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str
    location: str
    is_verified: bool = False
    trust_score: float = 3.0
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserCreate(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=4, max_length=20)
    name: str = Field(..., min_length=2, max_length=50)
    role: str
    location: str = Field(..., min_length=2, max_length=100)
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = ["FARMER", "BUYER", "TRADER", "ADMIN"]
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if not v.isdigit():
            raise ValueError('Phone number must contain only digits')
        return v

class UserLogin(BaseModel):
    phone: str
    password: str

class OrderCreate(BaseModel):
    crop: str
    variety: str = Field(..., min_length=1, max_length=50)
    quantity: float = Field(..., gt=0)
    quantity_unit: str
    moisture: Optional[float] = Field(None, ge=0, le=100)
    min_price: float = Field(..., gt=0)
    location: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=6)

class OrderResponse(BaseModel):
    id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    crop: str
    variety: str
    quantity: float
    quantity_unit: str
    moisture: Optional[float]
    min_price: float
    current_high_bid: float
    bids_count: int
    location: str
    pincode: str
    status: str
    expires_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class BidCreate(BaseModel):
    amount: float = Field(..., gt=0)

class BidResponse(BaseModel):
    id: int
    order_id: int
    bidder_id: int
    bidder_name: Optional[str] = None
    amount: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class DealCreate(BaseModel):
    bid_id: int

class DealResponse(BaseModel):
    id: int
    order_id: int
    seller_id: int
    seller_name: Optional[str] = None
    buyer_id: int
    buyer_name: Optional[str] = None
    final_price: float
    total_amount: float
    status: str
    created_at: datetime
    crop: Optional[str] = None
    variety: Optional[str] = None
    quantity: Optional[float] = None
    quantity_unit: Optional[str] = None
    
    class Config:
        from_attributes = True

class DealStatusUpdate(BaseModel):
    status: str

# ========== AUTH UTILITIES ==========
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} role required"
            )
        return current_user
    return role_checker

require_farmer = require_role("FARMER")
require_buyer = require_role("BUYER")
require_admin = require_role("ADMIN")

# ========== LIFESPAN ==========
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

# ========== APP ==========
app = FastAPI(title="KisanSetu API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== ENDPOINTS ==========
@app.get("/")
async def root():
    return {
        "message": "Welcome to KisanSetu API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ========== AUTH ENDPOINTS ==========
@app.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    user = User(
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role,
        location=user_data.location
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@app.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password"
        )
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

# ========== ORDER ENDPOINTS ==========
@app.get("/orders", response_model=List[OrderResponse])
async def get_all_orders(
    crop: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Order, User.name).join(User, Order.farmer_id == User.id).where(
        Order.status == "OPEN",
        Order.expires_at > datetime.now(timezone.utc)
    )
    
    if crop:
        query = query.where(Order.crop == crop)
    if min_price:
        query = query.where(Order.min_price >= min_price)
    if location:
        query = query.where(Order.location.ilike(f"%{location}%"))
    
    query = query.order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    orders = []
    for order, farmer_name in rows:
        order_dict = OrderResponse.from_orm(order).dict()
        order_dict["farmer_name"] = farmer_name
        orders.append(order_dict)
    
    return orders

@app.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_farmer)
):
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    order = Order(
        **order_data.dict(),
        farmer_id=current_user.id,
        expires_at=expires_at
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    # Get farmer name
    order_dict = OrderResponse.from_orm(order).dict()
    order_dict["farmer_name"] = current_user.name
    
    return order_dict

@app.get("/orders/my", response_model=List[OrderResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_farmer)
):
    result = await db.execute(
        select(Order)
        .where(Order.farmer_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    order_list = []
    for order in orders:
        order_dict = OrderResponse.from_orm(order).dict()
        order_dict["farmer_name"] = current_user.name
        order_list.append(order_dict)
    
    return order_list

@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Order, User.name).join(User, Order.farmer_id == User.id).where(Order.id == order_id)
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order, farmer_name = row
    order_dict = OrderResponse.from_orm(order).dict()
    order_dict["farmer_name"] = farmer_name
    
    return order_dict

# ========== BID ENDPOINTS ==========
@app.post("/orders/{order_id}/bids", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
async def place_bid(
    order_id: int,
    bid_data: BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order or order.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order not found or not open for bidding"
        )
    
    if bid_data.amount <= order.min_price or bid_data.amount <= order.current_high_bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bid amount must be greater than minimum price and current highest bid"
        )
    
    bid = Bid(
        order_id=order_id,
        bidder_id=current_user.id,
        amount=bid_data.amount
    )
    db.add(bid)
    
    order.current_high_bid = bid_data.amount
    order.bids_count += 1
    
    await db.commit()
    await db.refresh(bid)
    
    bid_dict = BidResponse.from_orm(bid).dict()
    bid_dict["bidder_name"] = current_user.name
    
    return bid_dict

@app.get("/orders/{order_id}/bids", response_model=List[BidResponse])
async def get_order_bids(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Bid, User.name).join(User, Bid.bidder_id == User.id).where(
        Bid.order_id == order_id
    ).order_by(Bid.amount.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    bids = []
    for bid, bidder_name in rows:
        bid_dict = BidResponse.from_orm(bid).dict()
        bid_dict["bidder_name"] = bidder_name
        bids.append(bid_dict)
    
    return bids

@app.get("/bids/my", response_model=List[BidResponse])
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    result = await db.execute(
        select(Bid)
        .where(Bid.bidder_id == current_user.id)
        .order_by(Bid.created_at.desc())
    )
    bids = result.scalars().all()
    
    bid_list = []
    for bid in bids:
        bid_dict = BidResponse.from_orm(bid).dict()
        bid_dict["bidder_name"] = current_user.name
        bid_list.append(bid_dict)
    
    return bid_list

# ========== DEAL ENDPOINTS ==========
@app.post("/orders/{order_id}/accept-bid", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def accept_bid(
    order_id: int,
    deal_data: DealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_farmer)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order or order.farmer_id != current_user.id:
        raise HTTPException(status_code=400, detail="Order not found or not owned by you")
    
    if order.status != "OPEN":
        raise HTTPException(status_code=400, detail="Order is not open for bidding")
    
    result = await db.execute(select(Bid).where(
        Bid.id == deal_data.bid_id,
        Bid.order_id == order_id
    ))
    bid = result.scalar_one_or_none()
    
    if not bid:
        raise HTTPException(status_code=400, detail="Bid not found or doesn't belong to this order")
    
    # Create deal
    total_amount = order.quantity * bid.amount
    deal = Deal(
        order_id=order_id,
        seller_id=current_user.id,
        buyer_id=bid.bidder_id,
        final_price=bid.amount,
        total_amount=total_amount,
        status="LOCKED"
    )
    
    # Update order status
    order.status = "LOCKED"
    
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    await db.refresh(bid)  # Refresh to get bidder info
    
    # Get seller and buyer names
    seller_result = await db.execute(select(User).where(User.id == current_user.id))
    seller = seller_result.scalar_one()
    
    buyer_result = await db.execute(select(User).where(User.id == bid.bidder_id))
    buyer = buyer_result.scalar_one()
    
    deal_dict = DealResponse.from_orm(deal).dict()
    deal_dict["seller_name"] = seller.name
    deal_dict["buyer_name"] = buyer.name
    deal_dict["crop"] = order.crop
    deal_dict["variety"] = order.variety
    deal_dict["quantity"] = order.quantity
    deal_dict["quantity_unit"] = order.quantity_unit
    
    return deal_dict

@app.get("/deals", response_model=List[DealResponse])
async def get_deals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Deal, Order, User_seller.name.label("seller_name"), User_buyer.name.label("buyer_name")).join(
        Order, Deal.order_id == Order.id
    ).join(
        User_seller, Deal.seller_id == User_seller.id
    ).join(
        User_buyer, Deal.buyer_id == User_buyer.id
    ).where(
        (Deal.seller_id == current_user.id) | (Deal.buyer_id == current_user.id)
    ).order_by(Deal.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    deals = []
    for deal, order, seller_name, buyer_name in rows:
        deal_dict = DealResponse.from_orm(deal).dict()
        deal_dict["seller_name"] = seller_name
        deal_dict["buyer_name"] = buyer_name
        deal_dict["crop"] = order.crop
        deal_dict["variety"] = order.variety
        deal_dict["quantity"] = order.quantity
        deal_dict["quantity_unit"] = order.quantity_unit
        deals.append(deal_dict)
    
    return deals

@app.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal_details(
    deal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Deal, Order, User_seller.name.label("seller_name"), User_buyer.name.label("buyer_name")).join(
        Order, Deal.order_id == Order.id
    ).join(
        User_seller, Deal.seller_id == User_seller.id
    ).join(
        User_buyer, Deal.buyer_id == User_buyer.id
    ).where(Deal.id == deal_id)
    
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal, order, seller_name, buyer_name = row
    
    # Check if user is part of this deal
    if current_user.id != deal.seller_id and current_user.id != deal.buyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this deal")
    
    deal_dict = DealResponse.from_orm(deal).dict()
    deal_dict["seller_name"] = seller_name
    deal_dict["buyer_name"] = buyer_name
    deal_dict["crop"] = order.crop
    deal_dict["variety"] = order.variety
    deal_dict["quantity"] = order.quantity
    deal_dict["quantity_unit"] = order.quantity_unit
    
    return deal_dict

@app.patch("/deals/{deal_id}/status", response_model=DealResponse)
async def update_deal_status(
    deal_id: int,
    status_data: DealStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_statuses = ["LOCKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]
    if status_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")
    
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check if user is part of this deal
    if current_user.id != deal.seller_id and current_user.id != deal.buyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this deal")
    
    deal.status = status_data.status
    
    # If delivered, update trust scores
    if status_data.status == "DELIVERED":
        seller_result = await db.execute(select(User).where(User.id == deal.seller_id))
        seller = seller_result.scalar_one()
        
        buyer_result = await db.execute(select(User).where(User.id == deal.buyer_id))
        buyer = buyer_result.scalar_one()
        
        seller.trust_score = min(5.0, seller.trust_score + 0.1)
        buyer.trust_score = min(5.0, buyer.trust_score + 0.1)
    
    await db.commit()
    await db.refresh(deal)
    
    # Get names for response
    seller_result = await db.execute(select(User).where(User.id == deal.seller_id))
    seller = seller_result.scalar_one()
    
    buyer_result = await db.execute(select(User).where(User.id == deal.buyer_id))
    buyer = buyer_result.scalar_one()
    
    order_result = await db.execute(select(Order).where(Order.id == deal.order_id))
    order = order_result.scalar_one()
    
    deal_dict = DealResponse.from_orm(deal).dict()
    deal_dict["seller_name"] = seller.name
    deal_dict["buyer_name"] = buyer.name
    deal_dict["crop"] = order.crop
    deal_dict["variety"] = order.variety
    deal_dict["quantity"] = order.quantity
    deal_dict["quantity_unit"] = order.quantity_unit
    
    return deal_dict

# ========== ADMIN ENDPOINTS ==========
@app.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    return [UserResponse.from_orm(user) for user in users]

@app.post("/admin/users/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.from_orm(user)

# ========== MAIN ==========
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)