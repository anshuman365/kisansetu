# app/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from app import models, schemas
from app.auth import get_password_hash

class CRUD:
    # User operations
    @staticmethod
    async def create_user(db: AsyncSession, user: schemas.UserCreate):
        hashed_password = get_password_hash(user.password)
        db_user = models.User(
            phone=user.phone,
            password_hash=hashed_password,
            name=user.name,
            role=user.role.value,  # Convert Enum to string
            location=user.location
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    @staticmethod
    async def get_user_by_phone(db: AsyncSession, phone: str):
        result = await db.execute(
            select(models.User).where(models.User.phone == phone)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(models.User).where(models.User.id == user_id)
        )
        return result.scalar_one_or_none()

    # Order operations
    @staticmethod
    async def create_order(db: AsyncSession, order: schemas.OrderCreate, farmer_id: int):
        # Set expiration to 7 days from now
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        db_order = models.Order(
            **order.dict(),
            farmer_id=farmer_id,
            expires_at=expires_at
        )
        db.add(db_order)
        await db.commit()
        await db.refresh(db_order)
        return db_order

    @staticmethod
    async def get_orders(
        db: AsyncSession,
        crop: Optional[str] = None,
        min_price: Optional[float] = None,
        location: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ):
        query = select(models.Order).where(
            and_(
                models.Order.status == models.OrderStatus.OPEN,
                models.Order.expires_at > datetime.now(timezone.utc)
            )
        )
        
        if crop:
            query = query.where(models.Order.crop == crop)
        if min_price:
            query = query.where(models.Order.min_price >= min_price)
        if location:
            query = query.where(models.Order.location.ilike(f"%{location}%"))
        
        query = query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_order_by_id(db: AsyncSession, order_id: int):
        result = await db.execute(
            select(models.Order).where(models.Order.id == order_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_orders(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(models.Order)
            .where(models.Order.farmer_id == user_id)
            .order_by(models.Order.created_at.desc())
        )
        return result.scalars().all()

    # Bid operations
    @staticmethod
    async def create_bid(
        db: AsyncSession,
        bid: schemas.BidCreate,
        order_id: int,
        bidder_id: int
    ):
        # Check if order exists and is open
        order = await CRUD.get_order_by_id(db, order_id)
        if not order or order.status != models.OrderStatus.OPEN:
            raise ValueError("Order not found or not open for bidding")
        
        # Check bid amount requirements
        if bid.amount <= order.min_price or bid.amount <= order.current_high_bid:
            raise ValueError("Bid amount must be greater than minimum price and current highest bid")
        
        # Create bid
        db_bid = models.Bid(
            order_id=order_id,
            bidder_id=bidder_id,
            amount=bid.amount
        )
        db.add(db_bid)
        
        # Update order with new high bid
        order.current_high_bid = bid.amount
        order.bids_count += 1
        
        await db.commit()
        await db.refresh(db_bid)
        return db_bid

    @staticmethod
    async def get_order_bids(db: AsyncSession, order_id: int):
        result = await db.execute(
            select(models.Bid)
            .where(models.Bid.order_id == order_id)
            .order_by(models.Bid.amount.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_user_bids(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(models.Bid)
            .where(models.Bid.bidder_id == user_id)
            .order_by(models.Bid.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_bid_by_id(db: AsyncSession, bid_id: int):
        result = await db.execute(
            select(models.Bid).where(models.Bid.id == bid_id)
        )
        return result.scalar_one_or_none()

    # Deal operations
    @staticmethod
    async def accept_bid(
        db: AsyncSession,
        order_id: int,
        bid_id: int,
        farmer_id: int
    ):
        # Get order and verify ownership
        order = await CRUD.get_order_by_id(db, order_id)
        if not order or order.farmer_id != farmer_id:
            raise ValueError("Order not found or not owned by farmer")
        
        # Get bid and verify it belongs to order
        bid = await CRUD.get_bid_by_id(db, bid_id)
        if not bid or bid.order_id != order_id:
            raise ValueError("Bid not found or doesn't belong to this order")
        
        # Update order status
        order.status = models.OrderStatus.LOCKED
        
        # Create deal
        total_amount = order.quantity * bid.amount
        db_deal = models.Deal(
            order_id=order_id,
            seller_id=farmer_id,
            buyer_id=bid.bidder_id,
            final_price=bid.amount,
            total_amount=total_amount
        )
        db.add(db_deal)
        
        await db.commit()
        await db.refresh(db_deal)
        return db_deal

    @staticmethod
    async def get_user_deals(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(models.Deal)
            .where(
                or_(
                    models.Deal.seller_id == user_id,
                    models.Deal.buyer_id == user_id
                )
            )
            .order_by(models.Deal.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update_deal_status(
        db: AsyncSession,
        deal_id: int,
        status: schemas.DealStatus
    ):
        # Get deal
        result = await db.execute(
            select(models.Deal).where(models.Deal.id == deal_id)
        )
        deal = result.scalar_one_or_none()
        
        if not deal:
            raise ValueError("Deal not found")
        
        # Update status
        deal.status = status
        
        # If status is DELIVERED, update trust scores
        if status == models.DealStatus.DELIVERED:
            # Get seller and buyer
            seller = await CRUD.get_user_by_id(db, deal.seller_id)
            buyer = await CRUD.get_user_by_id(db, deal.buyer_id)
            
            # Increase trust scores (max 5.0)
            if seller:
                seller.trust_score = min(5.0, seller.trust_score + 0.1)
            if buyer:
                buyer.trust_score = min(5.0, buyer.trust_score + 0.1)
        
        await db.commit()
        await db.refresh(deal)
        return deal

    @staticmethod
    async def get_all_users(db: AsyncSession, skip: int = 0, limit: int = 100):
        result = await db.execute(
            select(models.User)
            .order_by(models.User.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def verify_user(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(models.User).where(models.User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        user.is_verified = True
        await db.commit()
        await db.refresh(user)
        return user

crud = CRUD()