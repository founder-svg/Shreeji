# Shreeji - High-Performance E-Commerce Backend Server

A high-throughput, ultra-low latency Node.js backend server designed for Shreeji luxury e-commerce. Engineered for sub-3ms response times, instantaneous cache hits, PostgreSQL/Supabase database integration, and multi-provider Cloud Storage (Cloudflare R2, AWS S3, Supabase Storage, and local dev storage).

---

## ⚡ Performance Highlights

- **Sub-3ms Cached GET Responses**: Built-in LRU in-memory cache layer (`X-Cache: HIT`).
- **Precision Timing**: Every request sends `X-Response-Time` and `Server-Timing` headers for microsecond-level latency monitoring.
- **Brotli & Gzip Compression**: Minimum network transfer size for fast client page loads.
- **Unified Storage Engine**: Supports Cloudflare R2, AWS S3, Supabase Storage S3-compatible API, and Local Disk storage out-of-the-box.
- **Database Flexibility**: Native PostgreSQL / Supabase connection pool (`pg`) with automatic schema setup and high-speed local memory/JSON fallback.

---

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment (.env)
The repository includes `.env.example`. Copy or edit `.env`:
```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api
CORS_ORIGIN=*
CACHE_TTL_SECONDS=60

# Database (PostgreSQL / Supabase)
# Leave empty to use local high-speed JSON store, or paste your Supabase connection string:
DATABASE_URL=

# Cloud Storage (Options: "local", "s3", "r2", "supabase")
STORAGE_PROVIDER=local
S3_REGION=auto
S3_BUCKET=shreeji-media
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=
S3_PUBLIC_URL=
```

### 3. Run the Server
```bash
# Start in production mode
npm start

# Or start with live reload
npm run dev
```

Server will run at `http://localhost:5000`.

### 4. Run Automated Performance & Latency Tests
```bash
npm test
```

---

## 📡 API Endpoints Reference

### 🩺 System & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Server root status & available endpoints |
| `GET` | `/api/health` | Health status, database, storage & memory usage |
| `GET` | `/api/metrics` | In-memory cache stats & provider diagnostics |

### 🛍️ Products Catalog (Cached for 60s)
| Method | Endpoint | Query Params / Body | Description |
|---|---|---|---|
| `GET` | `/api/products` | `category`, `search`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit` | Paginated product list (sub-2ms on cache hit) |
| `GET` | `/api/products/:id` | `:id` (UUID or slug) | Single product details |
| `POST` | `/api/products` | JSON body | Create a new product (auto invalidates cache) |
| `PUT` | `/api/products/:id` | JSON body | Update product (auto invalidates cache) |
| `DELETE` | `/api/products/:id` | - | Delete product |

### 🏷️ Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Get all categories |
| `POST` | `/api/categories` | Add a new category |

### 🛒 Cart
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cart?cartId=xxx` | Get cart items & total amount |
| `POST` | `/api/cart/items` | Add item to cart `{ cartId, productId, quantity }` |
| `DELETE` | `/api/cart/items/:id?cartId=xxx` | Remove item from cart |
| `DELETE` | `/api/cart?cartId=xxx` | Clear cart |

### 📦 Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Get order by ID |
| `POST` | `/api/orders` | Place new order with tax & total calculation |
| `PATCH` | `/api/orders/:id/status` | Update status (`pending`, `confirmed`, `shipped`, `delivered`) |

### 💌 Inquiries & Bridal Consultations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/inquiries` | List all customer inquiries |
| `POST` | `/api/inquiries` | Submit bridal consultation or contact request |

### ☁️ Cloud Storage & Media Uploads
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/uploads/info` | Storage provider info & upload limits |
| `POST` | `/api/uploads` | Upload single file (form-data: `file`, `folder`) |
| `POST` | `/api/uploads/multiple` | Upload up to 10 files (form-data: `files`, `folder`) |
| `POST` | `/api/uploads/presigned` | Generate direct S3/R2 presigned URL `{ filename, mimetype }` |
| `DELETE` | `/api/uploads` | Delete file by key `{ key }` |

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

1. Create a free project on [Supabase](https://supabase.com).
2. Go to **Project Settings** -> **Database** -> **Connection string** (URI).
3. Paste the URI into `server/.env` under `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres.yourproject:yourpassword@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
4. Restart the server. It will automatically initialize the tables (`categories`, `products`, `orders`, `inquiries`) and connect to your pool!

---

## ☁️ Cloud Storage Setup (Cloudflare R2 / AWS S3)

### Cloudflare R2:
```env
STORAGE_PROVIDER=r2
S3_REGION=auto
S3_BUCKET=shreeji-media
S3_ACCESS_KEY_ID=<your-r2-access-key-id>
S3_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://pub-xxxxxx.r2.dev
```

### AWS S3:
```env
STORAGE_PROVIDER=s3
S3_REGION=ap-south-1
S3_BUCKET=shreeji-media
S3_ACCESS_KEY_ID=<your-aws-key>
S3_SECRET_ACCESS_KEY=<your-aws-secret>
```
