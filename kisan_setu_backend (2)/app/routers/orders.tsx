from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.order import Order, Bid
from ..models.deal import Deal
from ..schemas.order import OrderResponse, BidResponse, DealResponse
from ..dependencies import get_current_user
from ..services import notifications
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.post("/orders", response_model=OrderResponse)
async def create_order(data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "FARMER": raise HTTPException(403, "Farmers only")
    
    order = Order(
        farmer_id=user.id,
        crop=data['crop'],
        variety=data['variety'],
        quantity=data['quantity'],
        quantity_unit=data['quantityUnit'],
        moisture=data.get('moisture'),
        min_price=data['minPrice'],
        location=data['location'],
        pincode=data['pincode'],
        lat=data.get('coordinates', {}).get('lat'),
        lng=data.get('coordinates', {}).get('lng'),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    order.farmer_name = user.name
    return order

@router.get("/orders", response_model=List[OrderResponse])
async def list_orders(db: AsyncSession = Depends(get_db)):
    stmt = select(Order, User.name).join(User, Order.farmer_id == User.id).where(Order.status == 'OPEN').order_by(Order.created_at.desc())
    res = await db.execute(stmt)
    rows = res.all()
    return [{**o.__dict__, "farmer_name": name, "coordinates": o.coordinates} for o, name in rows]

@router.get("/orders/my", response_model=List[OrderResponse])
async def my_orders(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Order).where(Order.farmer_id == user.id))
    return res.scalars().all()

@router.get("/orders/{id}", response_model=OrderResponse)
async def get_order(id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Order, User.name).join(User, Order.farmer_id == User.id).where(Order.id == id)
    res = await db.execute(stmt)
    row = res.first()
    if not row: raise HTTPException(404)
    o, name = row
    o.farmer_name = name
    return o

@router.post("/orders/{id}/bids", response_model=BidResponse)
async def place_bid(id: int, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "FARMER": raise HTTPException(403)
    o = await db.get(Order, id)
    
    bid = Bid(order_id=id, bidder_id=user.id, amount=data['amount'])
    db.add(bid)
    o.current_high_bid = data['amount']
    o.bids_count += 1
    await notifications.create(db, o.farmer_id, f"New bid: ₹{bid.amount}", "BID")
    await db.commit()
    await db.refresh(bid)
    bid.bidder_name = user.name
    return bid

@router.get("/orders/{id}/bids", response_model=List[BidResponse])
async def get_bids(id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Bid, User.name).join(User, Bid.bidder_id == User.id).where(Bid.order_id == id).order_by(Bid.amount.desc())
    res = await db.execute(stmt)
    return [{**b.__dict__, "bidder_name": name} for b, name in res.all()]

@router.post("/orders/{id}/accept-bid")
async def accept_bid(id: int, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    o = await db.get(Order, id)
    if o.farmer_id != user.id: raise HTTPException(403)
    bid = await db.get(Bid, data['bidId'])
    
    deal = Deal(
        order_id=o.id, seller_id=user.id, buyer_id=bid.bidder_id,
        final_price=bid.amount, total_amount=bid.amount * o.quantity,
        status="LOCKED"
    )
    o.status = "LOCKED"
    db.add(deal)
    await notifications.create(db, bid.bidder_id, f"Bid Accepted for {o.variety}!", "DEAL")
    await db.commit()
    await db.refresh(deal)
    return deal
