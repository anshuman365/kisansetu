# KisanSetu Backend Specification

This document serves as the **Master Specification** for the Backend API.
**Base URL**: `https://anshuman365.pythonanywhere.com`
**Authentication Method**: Bearer Token (JWT)

---

## 1. Database Schema

The backend should implement the following relational schema (SQL recommended).

### A. Users Table (`users`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Int | PK, Auto-inc | Unique User Identifier |
| `phone` | String | Unique, Not Null | 10-digit mobile number (Login ID) |
| `password_hash` | String | Not Null | Hashed password (Bcrypt/Argon2) |
| `name` | String | Not Null | Full Name |
| `role` | Enum | Not Null | Values: `FARMER`, `BUYER`, `TRADER`, `ADMIN` |
| `location` | String | Not Null | City / Village Name |
| `is_verified` | Boolean | Default `False` | KYC Verification Status |
| `trust_score` | Float | Default `3.0` | Range 0.0 - 5.0 |
| `created_at` | DateTime | Default Now | |

### B. Orders Table (`orders`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Int | PK | |
| `farmer_id` | FK (`users.id`) | Not Null | The Seller |
| `crop` | String | Not Null | Enum: `Dhan (Paddy)`, `Rice`, `Wheat`, `Maize` |
| `variety` | String | Not Null | e.g. "Basmati 1121" |
| `quantity` | Float | Not Null | |
| `quantity_unit` | String | Not Null | `quintal` or `ton` |
| `moisture` | Float | Nullable | Moisture percentage |
| `min_price` | Float | Not Null | Minimum asking price |
| `current_high_bid`| Float | Default 0 | Caches the highest bid amount |
| `bids_count` | Int | Default 0 | Caches number of bids |
| `location` | String | Not Null | Specific location for pickup |
| `pincode` | String | Not Null | |
| `status` | Enum | Default `OPEN` | `OPEN`, `LOCKED`, `DELIVERED` |
| `expires_at` | DateTime | Not Null | Default: Created + 7 days |

### C. Bids Table (`bids`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Int | PK | |
| `order_id` | FK (`orders.id`) | Not Null | |
| `bidder_id` | FK (`users.id`) | Not Null | The Buyer |
| `amount` | Float | Not Null | Offer Price per Unit |
| `created_at` | DateTime | Default Now | |

### D. Deals Table (`deals`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / Int | PK | |
| `order_id` | FK (`orders.id`) | Unique | Link to the closed order |
| `seller_id` | FK (`users.id`) | Not Null | Farmer |
| `buyer_id` | FK (`users.id`) | Not Null | Winning Bidder |
| `final_price` | Float | Not Null | Accepted Bid Amount |
| `total_amount` | Float | Not Null | `quantity * final_price` |
| `status` | Enum | Default `LOCKED` | `LOCKED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED` |
| `created_at` | DateTime | Default Now | |

---

## 2. API Endpoints Specification

All responses should be JSON.
**Success**: `200 OK` / `201 Created`
**Error**: `400 Bad Request` / `401 Unauthorized` / `500 Server Error`

### Authentication

#### 1. Register
*   **Endpoint**: `POST /register`
*   **Body**:
    ```json
    {
      "phone": "9876543210",
      "password": "secret_password",
      "name": "Rajesh Kumar",
      "role": "FARMER",
      "location": "Karnal, Haryana"
    }
    ```
*   **Response**:
    ```json
    {
      "token": "eyJhbGci...",
      "user": { "id": 1, "name": "Rajesh Kumar", "role": "FARMER", ... }
    }
    ```

#### 2. Login
*   **Endpoint**: `POST /login`
*   **Body**: `{ "phone": "...", "password": "..." }`
*   **Response**: Returns Token + User object.

---

### Orders (The Mandi)

#### 3. Get All Orders (Marketplace)
*   **Endpoint**: `GET /orders`
*   **Query Params**: `?crop=Rice&minPrice=2000&location=Karnal`
*   **Logic**:
    *   Filter by params.
    *   **CRITICAL**: Only return orders where `status` is `OPEN` and `expires_at` is in the future.
    *   Sort by `created_at` DESC.
*   **Response**: Array of Order objects. Returns `[]` if no data found.

#### 4. Create Order (Sell Crop)
*   **Endpoint**: `POST /orders` (Requires Auth: Farmer)
*   **Body**:
    ```json
    {
      "crop": "Dhan (Paddy)",
      "variety": "Pusa 1121",
      "quantity": 50,
      "quantityUnit": "quintal",
      "moisture": 12,
      "minPrice": 3500,
      "location": "Village X",
      "pincode": "123456"
    }
    ```
*   **Logic**: Set `farmer_id` from token. Set `status` = `OPEN`.

#### 5. Get My Orders
*   **Endpoint**: `GET /orders/my` (Requires Auth: Farmer)
*   **Logic**: Return all orders created by the logged-in user.

#### 6. Get Order Details
*   **Endpoint**: `GET /orders/:id`
*   **Response**: Order object.

---

### Bidding

#### 7. Place Bid
*   **Endpoint**: `POST /orders/:id/bids` (Requires Auth: Buyer)
*   **Body**: `{ "amount": 3600 }`
*   **Logic**:
    1. Check if Order exists and is `OPEN`.
    2. Check if `amount` > Order's `current_high_bid` and `min_price`.
    3. Insert into `bids` table.
    4. Update `orders` table: set `current_high_bid` = `amount` and increment `bids_count`.
*   **Response**: The created Bid object.

#### 8. Get Bids for Order
*   **Endpoint**: `GET /orders/:id/bids`
*   **Response**: Array of bids for this order, sorted by `amount` DESC.

#### 9. Get My Bids
*   **Endpoint**: `GET /bids/my` (Requires Auth: Buyer)
*   **Logic**: Return all bids made by the logged-in user.

---

### Deals

#### 10. Accept Bid (Close Deal)
*   **Endpoint**: `POST /orders/:id/accept-bid` (Requires Auth: Farmer)
*   **Body**: `{ "bidId": "..." }`
*   **Logic**:
    1. Verify Order belongs to logged-in Farmer.
    2. Verify Bid belongs to Order.
    3. Update Order `status` -> `LOCKED`.
    4. Create new entry in `deals` table copying details from Order and Bid.
*   **Response**: The created Deal object.

#### 11. Get Deals
*   **Endpoint**: `GET /deals`
*   **Logic**: Return deals where logged-in user is either `buyer_id` or `seller_id`.

#### 12. Update Deal Status
*   **Endpoint**: `PATCH /deals/:id/status`
*   **Body**: `{ "status": "DELIVERED" }`
*   **Logic**: Update status. If `DELIVERED`, backend logic should increment `trust_score` for both parties.

---

### Admin

#### 13. Get All Users
*   **Endpoint**: `GET /admin/users` (Requires Auth: Admin)

#### 14. Verify User
*   **Endpoint**: `POST /admin/users/:id/verify` (Requires Auth: Admin)
*   **Logic**: Set `is_verified` = `True`.

---

## 3. Implementation Notes for Backend Dev

1.  **CORS**: The frontend will be hosted on a different domain/port. Ensure your backend handles CORS Preflight requests (`OPTIONS`) and allows headers `Authorization` and `Content-Type`.
2.  **Empty States**: Do not return `404` for empty lists (e.g., searching for a crop that doesn't exist). Return `200 OK` with an empty array `[]`.
3.  **Date Handling**: Store dates in UTC. Frontend will handle local formatting.
4.  **Error Handling**: Return clean JSON errors: `{ "message": "Password is too short" }` rather than HTML stack traces.
