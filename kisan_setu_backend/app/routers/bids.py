# app/routers/bids.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_buyer
from app import schemas, crud
from app.schemas import TokenData
from app.config import settings

router = APIRouter(tags=["bids"])

@router.post("/orders/{order_id}/bids", response_model=schemas.BidResponse, status_code=status.HTTP_201_CREATED)
async def place_bid(
    order_id: int,
    bid_data: schemas.BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_buyer)
):
    try:
        bid = await crud.create_bid(db, bid_data, order_id, current_user.user_id)
        return bid
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/orders/{order_id}/bids", response_model=List[schemas.BidResponse])
async def get_order_bids(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    bids = await crud.get_order_bids(db, order_id)
    return bids if bids else []

@router.get("/bids/my", response_model=List[schemas.BidResponse])
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_buyer)
):
    bids = await crud.get_user_bids(db, current_user.user_id)
    return bids if bids else []