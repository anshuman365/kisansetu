from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import Notification

async def create(db: AsyncSession, user_id: int, msg: str, type: str = "SYSTEM"):
    n = Notification(user_id=user_id, message=msg, type=type)
    db.add(n)
    await db.commit()
