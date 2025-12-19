from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .database import get_db
from .config import SECRET_KEY, ALGORITHM
from .models.user import User

security = HTTPBearer()

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None: raise HTTPException(401)
        res = await db.execute(select(User).where(User.id == int(user_id)))
        user = res.scalar_one_or_none()
        if not user: raise HTTPException(401, "User not found")
        if user.is_blocked: raise HTTPException(403, "Account is blocked. Contact Admin.")
        return user
    except JWTError: raise HTTPException(401, "Invalid Token")
