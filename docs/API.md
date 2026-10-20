# Shreeji E-Commerce API Documentation

The Shreeji API is a high-throughput, low-latency RESTful API with PostgreSQL/Supabase persistence, in-memory LRU caching, and S3/Cloudflare R2 cloud storage.

---

## 🔒 Authentication & Authorization

All administrative endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

Tokens are obtained via the `/api/auth/login` endpoint and are signed with `JWT_SECRET`.

---

## 📡 Endpoints

### 1. Authentication

#### `POST /api/auth/login`

- **Rate Limit**: 10 attempts per 15 mins
- **Body**:

  ```json
  {
    "email": "admin@shreeji.com",
    "password": "Admin@Shreeji2026"
  }
  ```

- **Response**: `200 OK`

  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "expiresIn": "24h",
    "user": {
      "id": "admin-1",
      "email": "admin@shreeji.com",
      "name": "Shreeji Administrator",
      "role": "admin"
    }
  }
  ```

#### `GET /api/auth/me`

- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` Returns currently authenticated user profile.

---

### 2. System Health & Diagnostics

#### `GET /api/health`

- **Access**: Public
- **Description**: Minimal liveness and database ping check.
- **Response**: `200 OK` (or `503 Service Unavailable` if database disconnected)

  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-20T12:00:00.000Z",
    "service": "Shreeji API Server",
    "database": "connected"
  }
  ```

#### `GET /api/metrics`

- **Access**: Admin Only (`Authorization: Bearer <token>`)
- **Response**: Memory usage (RSS, heap), in-memory cache hit statistics, storage provider info.

---

### 3. Product Catalog

#### `GET /api/products`

- **Access**: Public (Cached for 60 seconds)
- **Query Parameters**:
  - `category` (slug or id)
  - `search` (case-insensitive full text search)
  - `minPrice`, `maxPrice`
  - `inStock` (`true` or `false`)
  - `sort` (`price-low`, `price-high`, `rating`, `newest`)
  - `page` (default: 1)
  - `limit` (default: 50, max: 100)

#### `GET /api/products/:id`

- **Access**: Public (Cached for 120 seconds)

#### `POST /api/products`

- **Access**: Admin Only
- **Validation**:
  - `name`: String, 2-255 characters
  - `price`: Number > 0
  - `discountPrice`: Optional number >= 0 and <= price
  - `stockCount`: Optional integer >= 0

#### `PUT /api/products/:id`

- **Access**: Admin Only

#### `DELETE /api/products/:id`

- **Access**: Admin Only

---

### 4. Categories

#### `GET /api/categories`

- **Access**: Public (Cached for 180 seconds)

#### `POST /api/categories`

- **Access**: Admin Only

---

### 5. Orders & Checkout

#### `POST /api/orders`

- **Access**: Public (Rate Limited)
- **Integrity Guarantee**: Prices and subtotals are strictly verified and calculated on the server against the live database; inventory is reserved atomically inside a transaction.
- **Body**:

  ```json
  {
    "customerName": "Priya Sharma",
    "customerEmail": "priya@example.com",
    "customerPhone": "+919876543210",
    "shippingAddress": {
      "line1": "402 Royal Palms, MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "items": [
      {
        "productId": "prod-1",
        "quantity": 1
      }
    ],
    "paymentMethod": "cod"
  }
  ```

#### `GET /api/orders`

- **Access**: Admin Only

#### `GET /api/orders/:id`

- **Access**: Admin Only

#### `PATCH /api/orders/:id/status`

- **Access**: Admin Only
- **Body**: `{ "status": "confirmed" }` (Allowed: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`)

---

### 6. Bridal Consultations & Inquiries

#### `POST /api/inquiries`

- **Access**: Public (Rate Limited)
- **Body**:

  ```json
  {
    "name": "Aanya Patel",
    "email": "aanya@example.com",
    "phone": "+919988776655",
    "subject": "Bridal Couture Fitting Appointment",
    "message": "Interested in custom fitting for royal lehenga collection."
  }
  ```

#### `GET /api/inquiries`

- **Access**: Admin Only

---

### 7. Cloud Storage & Media Uploads

#### `GET /api/uploads/info`

- **Access**: Admin Only
- **Returns**: Allowed file types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), maximum size (10MB), and storage provider.

#### `POST /api/uploads`

- **Access**: Admin Only (Rate Limited)
- **Validation**: Magic byte binary verification, folder allowlisting (`products`, `categories`, `banners`, `documents`, `inquiries`).

#### `DELETE /api/uploads`

- **Access**: Admin Only
- **Body**: `{ "key": "products/1729420000-abcd1234.webp" }`
