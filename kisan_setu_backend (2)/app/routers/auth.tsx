from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from ..database import get_db
from ..models.user import User
from ..schemas.auth import Token, UserResponse
from ..dependencies import get_current_user
from ..config import ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from datetime import datetime, timedelta, timezone
from jose import jwt

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_hash(password): return pwd_context.hash(password)
def verify(plain, hashed): return pwd_context.verify(plain, hashed)

@router.post("/register", response_model=Token)
async def register(user_data: dict, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.phone == user_data['phone']))
    if res.scalar_one_or_none(): raise HTTPException(400, "Phone taken")
    user = User(
        phone=user_data['phone'],
        password_hash=get_hash(user_data['password']),
        name=user_data['name'],
        role=user_data['role'],
        location=user_data['location']
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode({"sub": str(user.id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
async def login(data: dict, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.phone == data['phone']))
    user = res.scalar_one_or_none()
    if not user or not verify(data['password'], user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode({"sub": str(user.id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/users/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)): return user
