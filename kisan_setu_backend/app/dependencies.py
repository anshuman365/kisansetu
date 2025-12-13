# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import decode_token
from app.database import get_db
from app.schemas import TokenData

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token_data = decode_token(credentials.credentials)
    return token_data

def require_role(required_role: str):
    def role_checker(current_user: TokenData = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} role required"
            )
        return current_user
    return role_checker

# Role-specific dependencies
require_farmer = require_role("FARMER")
require_buyer = require_role("BUYER")
require_admin = require_role("ADMIN")