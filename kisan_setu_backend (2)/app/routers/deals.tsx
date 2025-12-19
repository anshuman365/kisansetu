from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import random
from ..database import get_db
from ..models.user import User
from ..models.order import Order
from ..models.deal import Deal, Review
from ..schemas.deal import DealResponse
from ..dependencies import get_current_user
from ..services import payment, notifications, geocoding
from ..config import TRANSPORT_RATE_PER_KM

router = APIRouter()

@router.get("/deals", response_model=List[DealResponse])
async def list_deals(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Deal).where((Deal.seller_id == user.id) | (Deal.buyer_id == user.id)).order_by(Deal.created_at.desc()))
    deals = res.scalars().all()
    # Populate extra fields using separate queries (simplified for demo)
    out = []
    for d in deals:
        o = await db.get(Order, d.order_id)
        s = await db.get(User, d.seller_id)
        b = await db.get(User, d.buyer_id)
        d.seller_name, d.buyer_name = s.name, b.name
        d.crop, d.variety, d.quantity, d.quantity_unit = o.crop, o.variety, o.quantity, o.quantity_unit
        out.append(d)
    return out

@router.get("/deals/{id}", response_model=DealResponse)
async def get_deal(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    d = await db.get(Deal, id)
    if not d: raise HTTPException(404)
    
    o = await db.get(Order, d.order_id)
    s = await db.get(User, d.seller_id)
    b = await db.get(User, d.buyer_id)
    
    d.seller_name, d.buyer_name = s.name, b.name
    d.crop, d.variety, d.quantity, d.quantity_unit = o.crop, o.variety, o.quantity, o.quantity_unit
    
    # Phone Number Logic: Only show if Direct Deal OR Transport Paid
    show_phone = (d.status == "DIRECT_DEAL") or (d.transport_mode == "KISAN_SETU" and d.payment_status in ["ADVANCE_PAID", "FULLY_PAID"])
    if show_phone:
        d.seller_phone, d.buyer_phone = s.phone, b.phone
    else:
        d.seller_phone, d.buyer_phone = "+91 XXXXX XXXXX", "+91 XXXXX XXXXX"
        
    return d

@router.post("/deals/{id}/finalize")
async def finalize_deal(id: int, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    d = await db.get(Deal, id)
    mode = data['mode']
    if mode == "DIRECT_DEAL":
        d.status, d.transport_mode = "DIRECT_DEAL", "SELF"
        await notifications.create(db, d.seller_id, "Direct Deal Confirmed", "DEAL")
    elif mode == "KISAN_SETU":
        d.status, d.transport_mode = "TRANSIT", "KISAN_SETU"
        d.tracking_status = "PENDING"
        await notifications.create(db, d.seller_id, "Buyer opted for KisanSetu Transport", "DEAL")
    await db.commit()
    return {"status": "ok"}

@router.post("/deals/{id}/pay/initiate")
async def initiate_payment(id: int, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    d = await db.get(Deal, id)
    amount = data['amount']
    
    # Calculate costs if not set (Mock logic)
    if d.transport_cost == 0:
        d.distance_km = 250.0
        d.transport_cost = d.distance_km * TRANSPORT_RATE_PER_KM
        d.advance_amount = d.transport_cost + (d.total_amount * 0.05)
        d.remaining_amount = d.total_amount * 0.95
    
    # Create Razorpay Order
    try:
        # rz_order = payment.create_order(amount, str(d.id))
        # d.razorpay_order_id = rz_order['id']
        d.razorpay_order_id = f"order_mock_{random.randint(10000,99999)}" # Mock
    except Exception as e:
        print(f"Payment Error: {e}")
        # In demo we proceed with mock
        d.razorpay_order_id = "mock_order_id"

    # Auto-complete payment for demo
    if amount >= d.advance_amount and d.payment_status == "PENDING":
        d.payment_status = "ADVANCE_PAID"
        d.tracking_status = "ASSIGNED"
        d.tracking_id = f"KS-{random.randint(1000,9999)}"
        await notifications.create(db, d.seller_id, "Truck Dispatched!", "DEAL")
        
    await db.commit()
    return {"order_id": d.razorpay_order_id}

@router.patch("/deals/{id}/status")
async def update_status(id: int, data: dict, db: AsyncSession = Depends(get_db)):
    d = await db.get(Deal, id)
    if data['status'] == "DELIVERED":
        d.status = "DELIVERED"
        d.tracking_status = "DELIVERED"
        d.payment_status = "FULLY_PAID"
        await notifications.create(db, d.seller_id, "Deal Completed! Payment Released.", "DEAL")
    await db.commit()
    return {"status": "ok"}

@router.post("/deals/{id}/review")
async def review_deal(id: int, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    d = await db.get(Deal, id)
    target_id = d.seller_id if user.id == d.buyer_id else d.buyer_id
    
    rev = Review(deal_id=id, reviewer_id=user.id, reviewee_id=target_id, rating=data['rating'], comment=data['comment'])
    db.add(rev)
    
    # Update Trust Score
    stmt = select(func.avg(Review.rating)).where(Review.reviewee_id == target_id)
    avg = (await db.execute(stmt)).scalar()
    u = await db.get(User, target_id)
    u.trust_score = round(avg, 1) if avg else 3.5
    
    await db.commit()
    return {"status": "reviewed"}
