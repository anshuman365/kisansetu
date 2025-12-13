# app/main_fixed_v5.py - FIXED SERIALIZATION + ALL ENDPOINTS
from fastapi import FastAPI, Depends, HTTPException, status, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, Session
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, select, func
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import enum
import os
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, validator, ConfigDict
import re

# ========== CONFIG ==========
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./kisansetu.db")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for easier testing

# ========== DATABASE ==========
engine = create_async_engine(DATABASE_URL, echo=True)  # True for debugging
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
    status = Column(String, default="OPEN")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Deal(Base):
    __tablename__ = "deals"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    final_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="LOCKED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ========== PYDANTIC SCHEMAS ==========
# FIXED: Using ConfigDict instead of Config for Pydantic V2
class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str
    location: str
    is_verified: bool = False
    trust_score: float = 3.0
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserCreate(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=4, max_length=20)
    name: str = Field(..., min_length=2, max_length=50)
    role: str = Field(..., pattern="^(FARMER|BUYER|ADMIN)$")
    location: str = Field(..., min_length=2, max_length=100)
    
    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Phone number must be 10 digits')
        return v

class UserLogin(BaseModel):
    phone: str
    password: str

class OrderCreate(BaseModel):
    crop: str = Field(..., min_length=2, max_length=50)
    variety: str = Field(..., min_length=1, max_length=50)
    quantity: float = Field(..., gt=0)
    quantity_unit: str = Field(..., min_length=2, max_length=20)  # More flexible
    moisture: Optional[float] = Field(None, ge=0, le=100)
    min_price: float = Field(..., gt=0)
    location: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=6)
    
    @validator('pincode')
    def validate_pincode(cls, v):
        if not v.isdigit():
            raise ValueError('Pincode must contain only digits')
        return v

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
    
    model_config = ConfigDict(from_attributes=True)

class BidCreate(BaseModel):
    amount: float = Field(..., gt=0)

class BidResponse(BaseModel):
    id: int
    order_id: int
    bidder_id: int
    bidder_name: Optional[str] = None
    amount: float
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

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
    
    model_config = ConfigDict(from_attributes=True)

class DealStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(LOCKED|IN_TRANSIT|DELIVERED|CANCELLED)$")

# ========== AUTH UTILITIES ==========
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

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
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} role required. Current role: {current_user.role}"
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
app = FastAPI(
    title="KisanSetu API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ========== HELPER FUNCTIONS ==========
def user_to_dict(user: User) -> Dict[str, Any]:
    """Convert User SQLAlchemy model to dictionary"""
    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "role": user.role,
        "location": user.location,
        "is_verified": user.is_verified,
        "trust_score": user.trust_score,
        "created_at": user.created_at
    }

def order_to_dict(order: Order, farmer_name: Optional[str] = None) -> Dict[str, Any]:
    """Convert Order SQLAlchemy model to dictionary"""
    return {
        "id": order.id,
        "farmer_id": order.farmer_id,
        "farmer_name": farmer_name,
        "crop": order.crop,
        "variety": order.variety,
        "quantity": order.quantity,
        "quantity_unit": order.quantity_unit,
        "moisture": order.moisture,
        "min_price": order.min_price,
        "current_high_bid": order.current_high_bid,
        "bids_count": order.bids_count,
        "location": order.location,
        "pincode": order.pincode,
        "status": order.status,
        "expires_at": order.expires_at,
        "created_at": order.created_at
    }

def bid_to_dict(bid: Bid, bidder_name: Optional[str] = None) -> Dict[str, Any]:
    """Convert Bid SQLAlchemy model to dictionary"""
    return {
        "id": bid.id,
        "order_id": bid.order_id,
        "bidder_id": bid.bidder_id,
        "bidder_name": bidder_name,
        "amount": bid.amount,
        "created_at": bid.created_at
    }

def deal_to_dict(deal: Deal, seller_name: Optional[str] = None, buyer_name: Optional[str] = None) -> Dict[str, Any]:
    """Convert Deal SQLAlchemy model to dictionary"""
    return {
        "id": deal.id,
        "order_id": deal.order_id,
        "seller_id": deal.seller_id,
        "seller_name": seller_name,
        "buyer_id": deal.buyer_id,
        "buyer_name": buyer_name,
        "final_price": deal.final_price,
        "total_amount": deal.total_amount,
        "status": deal.status,
        "created_at": deal.created_at
    }

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

# ========== PUBLIC ENDPOINTS ==========
@app.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Validate role
    valid_roles = ["FARMER", "BUYER", "ADMIN"]
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role must be one of: {', '.join(valid_roles)}"
        )
    
    # Create user
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
    
    # Create token
    token = create_access_token({"sub": str(user.id), "role": user.role})
    
    # Use helper function to convert user to dict
    user_dict = user_to_dict(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse(**user_dict)
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
    
    # Use helper function to convert user to dict
    user_dict = user_to_dict(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse(**user_dict)
    }

# ========== PROTECTED ENDPOINTS ==========
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
        query = query.where(Order.crop.ilike(f"%{crop}%"))
    if min_price:
        query = query.where(Order.min_price >= min_price)
    if location:
        query = query.where(Order.location.ilike(f"%{location}%"))
    
    query = query.order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    orders = []
    for order, farmer_name in rows:
        order_dict = order_to_dict(order, farmer_name)
        orders.append(OrderResponse(**order_dict))
    
    return orders

@app.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_farmer)
):
    # Debug log
    print(f"Creating order with data: {order_data.dict()}")
    print(f"User: {current_user.name}, Role: {current_user.role}")
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    order = Order(
        **order_data.dict(),
        farmer_id=current_user.id,
        expires_at=expires_at
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    order_dict = order_to_dict(order, current_user.name)
    return OrderResponse(**order_dict)

@app.get("/orders/my", response_model=List[OrderResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Order)
        .where(Order.farmer_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    order_list = []
    for order in orders:
        order_dict = order_to_dict(order, current_user.name)
        order_list.append(OrderResponse(**order_dict))
    
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
    order_dict = order_to_dict(order, farmer_name)
    
    return OrderResponse(**order_dict)

# ========== BID ENDPOINTS ==========
@app.post("/orders/{order_id}/bids", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
async def place_bid(
    order_id: int,
    bid_data: BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user is a buyer
    if current_user.role != "BUYER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only BUYERS can place bids"
        )
    
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order or order.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order not found or not open for bidding"
        )
    
    if bid_data.amount <= order.min_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid amount must be greater than minimum price ({order.min_price})"
        )
    
    if bid_data.amount <= order.current_high_bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid amount must be greater than current highest bid ({order.current_high_bid})"
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
    
    bid_dict = bid_to_dict(bid, current_user.name)
    return BidResponse(**bid_dict)

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
        bid_dict = bid_to_dict(bid, bidder_name)
        bids.append(BidResponse(**bid_dict))
    
    return bids

@app.get("/bids/my", response_model=List[BidResponse])
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Bid)
        .where(Bid.bidder_id == current_user.id)
        .order_by(Bid.created_at.desc())
    )
    bids = result.scalars().all()
    
    bid_list = []
    for bid in bids:
        bid_dict = bid_to_dict(bid, current_user.name)
        bid_list.append(BidResponse(**bid_dict))
    
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
    
    # Get buyer name
    buyer_result = await db.execute(select(User).where(User.id == bid.bidder_id))
    buyer = buyer_result.scalar_one()
    
    deal_dict = deal_to_dict(deal, current_user.name, buyer.name)
    return DealResponse(**deal_dict)

@app.get("/deals", response_model=List[DealResponse])
async def get_deals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Deal).where(
        (Deal.seller_id == current_user.id) | (Deal.buyer_id == current_user.id)
    ).order_by(Deal.created_at.desc()))
    
    deals = result.scalars().all()
    
    deal_list = []
    for deal in deals:
        seller_result = await db.execute(select(User).where(User.id == deal.seller_id))
        seller = seller_result.scalar_one()
        
        buyer_result = await db.execute(select(User).where(User.id == deal.buyer_id))
        buyer = buyer_result.scalar_one()
        
        deal_dict = deal_to_dict(deal, seller.name, buyer.name)
        deal_list.append(DealResponse(**deal_dict))
    
    return deal_list

@app.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal_details(
    deal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if current_user.id != deal.seller_id and current_user.id != deal.buyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this deal")
    
    seller_result = await db.execute(select(User).where(User.id == deal.seller_id))
    seller = seller_result.scalar_one()
    
    buyer_result = await db.execute(select(User).where(User.id == deal.buyer_id))
    buyer = buyer_result.scalar_one()
    
    deal_dict = deal_to_dict(deal, seller.name, buyer.name)
    return DealResponse(**deal_dict)

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
    
    if current_user.id != deal.seller_id and current_user.id != deal.buyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this deal")
    
    deal.status = status_data.status
    
    if status_data.status == "DELIVERED":
        seller_result = await db.execute(select(User).where(User.id == deal.seller_id))
        seller = seller_result.scalar_one()
        
        buyer_result = await db.execute(select(User).where(User.id == deal.buyer_id))
        buyer = buyer_result.scalar_one()
        
        seller.trust_score = min(5.0, seller.trust_score + 0.1)
        buyer.trust_score = min(5.0, buyer.trust_score + 0.1)
    
    await db.commit()
    await db.refresh(deal)
    
    seller_result = await db.execute(select(User).where(User.id == deal.seller_id))
    seller = seller_result.scalar_one()
    
    buyer_result = await db.execute(select(User).where(User.id == deal.buyer_id))
    buyer = buyer_result.scalar_one()
    
    deal_dict = deal_to_dict(deal, seller.name, buyer.name)
    return DealResponse(**deal_dict)

# ========== ADMIN ENDPOINTS ==========
@app.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    user_list = []
    for user in users:
        user_dict = user_to_dict(user)
        user_list.append(UserResponse(**user_dict))
    
    return user_list

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
    
    user_dict = user_to_dict(user)
    return UserResponse(**user_dict)

# ========== TEST ENDPOINTS (Debugging) ==========
@app.post("/test/create-order")
async def test_create_order(data: dict, db: AsyncSession = Depends(get_db)):
    """Test endpoint to see what data is being sent"""
    print("Test endpoint called with data:", data)
    
    # Try to create an order with raw data
    try:
        # Validate required fields
        required_fields = ['crop', 'variety', 'quantity', 'quantityUnit', 'minPrice', 'location', 'pincode']
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing field: {field}", "received_data": data}
        
        # Create order with raw data
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        order = Order(
            farmer_id=1,  # Hardcoded for test
            crop=data['crop'],
            variety=data['variety'],
            quantity=float(data['quantity']),
            quantity_unit=data['quantityUnit'],
            moisture=data.get('moisture'),
            min_price=float(data['minPrice']),
            location=data['location'],
            pincode=data['pincode'],
            expires_at=expires_at
        )
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        
        return {"success": True, "order_id": order.id, "data_received": data}
        
    except Exception as e:
        return {"error": str(e), "data_received": data}

# ========== MAIN ==========
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")