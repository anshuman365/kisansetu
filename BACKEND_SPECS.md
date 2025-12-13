# KisanSetu Backend Specification

## 1. JSON Convention
**CRITICAL**: The Frontend expects keys in **camelCase**.
*   **Correct**: `minPrice`, `farmerId`, `createdAt`
*   **Incorrect**: `min_price`, `farmer_id`, `created_at`

If using Python Pydantic, use `alias_generator` to auto-convert.
Alternatively, the Frontend has a `toCamelCase` transformer, so strict adherence is less critical now, but consistent naming is preferred.

## 2. API Endpoints Checklist
Ensure your Python `main.py` contains:

1.  `POST /login` -> Returns `{ access_token, user: { ... } }`
2.  `POST /register` -> Returns `{ access_token, user: { ... } }`
3.  `GET /orders` -> Returns list. Must JOIN with Users table to include `farmer_name`.
4.  `POST /orders/{id}/bids` -> Place a bid.
5.  `POST /orders/{id}/accept-bid` -> **Logic**:
    *   Change Order Status to `LOCKED`.
    *   Create a Deal record.
6.  `GET /deals` -> List deals for the logged-in user.
7.  `GET /deals/{id}` -> Deal details. Must include `seller_name`, `buyer_name`, `crop`, `variety`.

## 3. Database Updates
*   Ensure `Deals` table exists.
*   Ensure `User` table has `trust_score` and `is_verified` columns.
