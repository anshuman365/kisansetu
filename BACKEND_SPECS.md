# Backend Specifications for KisanSetu

This document outlines the API endpoints, data models, and business logic required to support the KisanSetu frontend.

## 1. Authentication & Users
**Models:**
- `User`: { id, phone, name, role (FARMER|BUYER|TRADER|ADMIN), location, isVerified, trustScore, kycDocuments }

**Endpoints:**
- `POST /auth/send-otp`: { phone } -> { success, message }
- `POST /auth/verify-otp`: { phone, otp } -> { token, user }
- `POST /auth/register`: { phone, name, role, location } -> { token, user }
- `GET /users/profile`: (Auth required) -> { user }
- `POST /admin/users/{id}/verify`: (Admin only) -> { user }

## 2. Order Management (Crops)
**Models:**
- `Order`: { id, farmerId, cropType, variety, quantity, quantityUnit, moisture, minPrice, currentHighBid, location, pincode, status (OPEN|LOCKED|DELIVERED), expiresAt }

**Endpoints:**
- `POST /orders`: (Farmer only) Create new listing.
- `GET /orders`: Public list. Support query params: `?crop=RICE&minPrice=2000&location=Karnal`. **Must filter out LOCKED/DELIVERED orders.**
- `GET /orders/my`: (Farmer only) Get own orders.
- `GET /orders/{id}`: Get details + bid history.

## 3. Bidding System
**Models:**
- `Bid`: { id, orderId, bidderId, amount, timestamp }

**Endpoints:**
- `POST /orders/{id}/bids`: (Buyer only) Place bid. 
  - *Logic*: Amount must be > `currentHighBid`. Update Order's `currentHighBid` and `bidsCount`.
- `GET /orders/{id}/bids`: Get all bids for an order.
- `GET /bids/my`: (Buyer only) Get bids placed by current user.

## 4. Deals & Contracts
**Models:**
- `Deal`: { id, orderId, buyerId, sellerId, finalPrice, totalAmount, status (LOCKED|DELIVERED), contractUrl }

**Endpoints:**
- `POST /orders/{id}/accept-bid`: (Farmer only) { bidId }
  - *Logic*: 
    1. Verify `bidId` belongs to `orderId`.
    2. Change Order status to `LOCKED`.
    3. Create `Deal` record.
    4. Trigger Notification to Buyer.
- `GET /deals`: Get deals for current user (either as buyer or seller).
- `GET /deals/{id}`: Get specific deal details.
- `PATCH /deals/{id}/status`: (Buyer/Seller) { status: 'DELIVERED' }
  - *Logic*: Only allow transition if currently `LOCKED`.

## 5. Business Rules
1. **Trust Score**: Should increase when a deal is marked `DELIVERED` without disputes.
2. **Order Expiry**: Cron job should auto-expire orders > `expiresAt` if not locked.
3. **Escrow (Future)**: Payment integration flow should happen before Deal status becomes LOCKED.

## 6. Tech Recommendations
- **Database**: PostgreSQL (for relational integrity of Orders/Bids) or MongoDB.
- **Real-time**: Socket.io for live bid updates on the Marketplace screen.
- **Search**: ElasticSearch or Postgres Full Text Search for crop varieties.
