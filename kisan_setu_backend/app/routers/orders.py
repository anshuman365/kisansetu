# app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.database import get_db
from app.dependencies import get_current_user, require_farmer
from app import schemas, crud
from app.schemas import TokenData
from app.config import settings

router = APIRouter(tags=["orders"])

@router.get("/", response_model=List[schemas.OrderResponse])
async def get_all_orders(
    crop: Optional[str] = Query(None, description="Filter by crop type"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    location: Optional[str] = Query(None, description="Location filter"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    orders = await crud.get_orders(
        db,
        crop=crop,
        min_price=min_price,
        location=location
    )
    return orders if orders else []

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: schemas.OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_farmer)
):
    try:
        order = await crud.create_order(db, order_data, current_user.user_id)
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/my", response_model=List[schemas.OrderResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_farmer)
):
    orders = await crud.get_user_orders(db, current_user.user_id)
    return orders if orders else []

@router.get("/{order_id}", response_model=schemas.OrderResponse)
async def get_order_details(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    order = await crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order