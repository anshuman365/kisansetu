import os

SECRET_KEY = os.getenv("SECRET_KEY", "kisan-setu-secure-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 Days
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./kisansetu.db")

# Payment Keys
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_123456789")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "secret_key_here")

# Logistics
TRANSPORT_RATE_PER_KM = 40