# KisanSetu Backend API

A FastAPI-based backend for agricultural marketplace platform.

## Features

- JWT Authentication with role-based access (FARMER, BUYER, TRADER, ADMIN)
- Crop order management with bidding system
- Deal tracking and status updates
- Trust score system
- Admin user verification

## Quick Start

### 1. Clone and install dependencies
```bash
git clone <repository-url>
cd kisan_setu_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the application

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API Documentation

Once running, visit:

· Swagger UI: http://localhost:8000/docs
· ReDoc: http://localhost:8000/redoc

Deployment

Render.com Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use these settings:
   · Build Command: pip install -r requirements.txt
   · Start Command: uvicorn app.main:app --host 0.0.0.0 --port 10000
4. Add environment variables:
   · DATABASE_URL: Your PostgreSQL connection string
   · SECRET_KEY: Strong secret key for JWT
5. Add PostgreSQL database from Render marketplace

PythonAnywhere Deployment

1. Upload your code to PythonAnywhere
2. Create a virtual environment:
   ```bash
   mkvirtualenv kisansetu --python=python3.10
   pip install -r requirements.txt
   ```
3. Configure Web app:
   · Manual configuration
   · Python 3.10
   · Set virtualenv path
4. Modify WSGI file:
   ```python
   import sys
   path = '/home/yourusername/kisan_setu_backend'
   if path not in sys.path:
       sys.path.append(path)
   
   from app.main import app as application
   ```
5. Set environment variables in Web app configuration

Testing API Endpoints

Authentication

```bash
# Register
curl -X POST "http://localhost:8000/register" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","password":"password123","name":"Rajesh Kumar","role":"FARMER","location":"Karnal, Haryana"}'

# Login
curl -X POST "http://localhost:8000/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=9876543210&password=password123"
```

Create Order (Requires FARMER token)

```bash
curl -X POST "http://localhost:8000/orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crop":"Dhan (Paddy)","variety":"Pusa 1121","quantity":50,"quantity_unit":"quintal","moisture":12,"min_price":3500,"location":"Village X","pincode":"123456"}'
```

Database Schema

See BACKEND_SPECS.md for complete database schema specification.

License

MIT

```

## 19. Example Deployment Script

```bash
#!/bin/bash
# deploy.sh

echo "Starting KisanSetu deployment..."

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the application
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}