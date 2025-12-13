# app/routers/deals.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_farmer
from app import schemas, crud
from app.schemas import TokenData
from app.config import settings

router = APIRouter(tags=["deals"])

@router.post("/orders/{order_id}/accept-bid", response_model=schemas.DealResponse, status_code=status.HTTP_201_CREATED)
async def accept_bid(
    order_id: int,
    deal_data: schemas.DealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_farmer)
):
    try:
        deal = await crud.accept_bid(
            db,
            order_id,
            deal_data.bid_id,
            current_user.user_id
        )
        return deal
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

@router.get("/deals", response_model=List[schemas.DealResponse])
async def get_deals(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    deals = await crud.get_user_deals(db, current_user.user_id)
    return deals if deals else []

@router.patch("/deals/{deal_id}/status", response_model=schemas.DealResponse)
async def update_deal_status(
    deal_id: int,
    status_data: schemas.DealStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    try:
        deal = await crud.update_deal_status(db, deal_id, status_data.status)
        return deal
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