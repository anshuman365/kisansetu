# app/main.py - COMPLETE WORKING VERSION
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, ForeignKey, select
from sqlalchemy.sql import func
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import enum
import os
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
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

# ========== ENUMS ==========
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

# ========== MODELS ==========
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(10), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Store as string for simplicity
    location = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    trust_score = Column(Float, default=3.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop = Column(String, nullable=False)  # Store as string
    variety = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    quantity_unit = Column(String, nullable=False)  # Store as string
    moisture = Column(Float, nullable=True)
    min_price = Column(Float, nullable=False)
    current_high_bid = Column(Float, default=0)
    bids_count = Column(Integer, default=0)
    location = Column(String, nullable=False)
    pincode = Column(String(6), nullable=False)
    status = Column(String, default="OPEN")  # Store as string
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ========== PYDANTIC SCHEMAS ==========
class UserCreate(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=6, max_length=50)  # Add max_length
    name: str
    role: str
    location: str

class UserLogin(BaseModel):
    phone: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class OrderCreate(BaseModel):
    crop: str
    variety: str
    quantity: float = Field(..., gt=0)
    quantity_unit: str
    moisture: Optional[float] = None
    min_price: float = Field(..., gt=0)
    location: str
    pincode: str = Field(..., min_length=6, max_length=6)

class OrderResponse(BaseModel):
    id: int
    farmer_id: int
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
        orm_mode = True

class BidCreate(BaseModel):
    amount: float = Field(..., gt=0)

# ========== AUTH UTILITIES ==========
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    # Truncate password to 72 bytes if too long
    if len(password.encode('utf-8')) > 72:
        password = password[:72]  # Simple truncation
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
        return {"user_id": int(user_id), "role": role}
    except JWTError:
        raise credentials_exception

def require_role(required_role: str):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != required_role:
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
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
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

@app.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
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
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# ORDERS ENDPOINTS
@app.get("/orders", response_model=List[OrderResponse])
async def get_all_orders(
    crop: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = select(Order).where(
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
    orders = result.scalars().all()
    return orders if orders else []

@app.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_farmer)
):
    # Set expiration to 7 days from now
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    order = Order(
        **order_data.dict(),
        farmer_id=current_user["user_id"],
        expires_at=expires_at
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order

@app.get("/orders/my", response_model=List[OrderResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_farmer)
):
    result = await db.execute(
        select(Order)
        .where(Order.farmer_id == current_user["user_id"])
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return orders if orders else []

@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order

# BIDDING ENDPOINTS
@app.post("/orders/{order_id}/bids", status_code=status.HTTP_201_CREATED)
async def place_bid(
    order_id: int,
    bid_data: BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_buyer)
):
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order or order.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order not found or not open for bidding"
        )
    
    # Check bid amount
    if bid_data.amount <= order.min_price or bid_data.amount <= order.current_high_bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bid amount must be greater than minimum price and current highest bid"
        )
    
    # Create bid
    bid = Bid(
        order_id=order_id,
        bidder_id=current_user["user_id"],
        amount=bid_data.amount
    )
    db.add(bid)
    
    # Update order
    order.current_high_bid = bid_data.amount
    order.bids_count += 1
    
    await db.commit()
    await db.refresh(bid)
    
    return {
        "id": bid.id,
        "order_id": bid.order_id,
        "bidder_id": bid.bidder_id,
        "amount": bid.amount,
        "created_at": bid.created_at
    }

@app.get("/orders/{order_id}/bids")
async def get_order_bids(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(
        select(Bid)
        .where(Bid.order_id == order_id)
        .order_by(Bid.amount.desc())
    )
    bids = result.scalars().all()
    
    return [{
        "id": bid.id,
        "order_id": bid.order_id,
        "bidder_id": bid.bidder_id,
        "amount": bid.amount,
        "created_at": bid.created_at
    } for bid in bids] if bids else []

@app.get("/bids/my")
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_buyer)
):
    result = await db.execute(
        select(Bid)
        .where(Bid.bidder_id == current_user["user_id"])
        .order_by(Bid.created_at.desc())
    )
    bids = result.scalars().all()
    
    return [{
        "id": bid.id,
        "order_id": bid.order_id,
        "bidder_id": bid.bidder_id,
        "amount": bid.amount,
        "created_at": bid.created_at
    } for bid in bids] if bids else []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)