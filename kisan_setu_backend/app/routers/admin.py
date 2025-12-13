# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app import schemas, crud
from app.schemas import TokenData, UserResponse
from app.config import settings

router = APIRouter(tags=["admin"])

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_admin)
):
    users = await crud.get_all_users(db)
    return users if users else []

@router.post("/users/{user_id}/verify")
async def verify_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_admin)
):
    try:
        user = await crud.verify_user(db, user_id)
        return {"message": f"User {user_id} verified successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )