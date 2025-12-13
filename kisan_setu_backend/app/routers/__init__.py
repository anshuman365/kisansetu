# app/routers/__init__.py
from .auth import router as auth_router
from .orders import router as orders_router
from .bids import router as bids_router
from .deals import router as deals_router
from .admin import router as admin_router

__all__ = ["auth_router", "orders_router", "bids_router", "deals_router", "admin_router"]