from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..database import get_db
from ..models.user import User, Notification
from ..models.deal import Deal
from ..schemas.auth import UserResponse
from ..dependencies import get_current_user
from ..services import notifications

router = APIRouter()

@router.get("/admin/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "ADMIN": raise HTTPException(403)
    res = await db.execute(select(User))
    return res.scalars().all()

@router.post("/admin/users/{id}/verify")
async def verify_user(id: int, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "ADMIN": raise HTTPException(403)
    u = await db.get(User, id)
    if data['status'] == 'APPROVED':
        u.is_verified = True
        u.kyc_status = "APPROVED"
        await notifications.create(db, id, "KYC Approved!", "SYSTEM")
    else:
        u.kyc_status = "REJECTED"
        await notifications.create(db, id, "KYC Rejected. Please re-apply.", "SYSTEM")
    await db.commit()
    return {"status": "ok"}

@router.post("/admin/users/{id}/block")
async def block_user(id: int, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "ADMIN": raise HTTPException(403)
    u = await db.get(User, id)
    u.is_blocked = data['isBlocked']
    await db.commit()
    return {"status": "ok"}

@router.get("/admin/transactions")
async def list_tx(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "ADMIN": raise HTTPException(403)
    # Mock transaction log from Deals
    res = await db.execute(select(Deal).where(Deal.payment_status != "PENDING"))
    deals = res.scalars().all()
    return [{"id": d.id, "amount": d.total_amount, "status": "SUCCESS", "date": d.created_at} for d in deals]
