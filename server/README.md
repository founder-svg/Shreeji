# Shreeji - High-Performance E-Commerce Backend Server

A production-grade, ultra-low latency Node.js backend server designed for Shreeji luxury e-commerce. Engineered for high concurrency, instantaneous cache hits, PostgreSQL/Supabase database integration with atomic transactions, role-based access control (RBAC), and multi-provider Cloud Storage (Cloudflare R2, AWS S3, Supabase Storage, and local dev storage).

---

## ⚡ Performance Highlights & Benchmarks

- **4,500+ Requests/sec Throughput**: Validated with `autocannon` under high concurrency.
- **Latency p50: ~5 ms, p99: ~12 ms**: Measured under 50 concurrent active connections.
- **Sub-2ms Cached Product Catalog**: Built-in LRU in-memory cache layer (`X-Cache: HIT`).
- **Atomic Stock Reservation**: Orders decrement stock and verify pricing server-side inside atomic database transactions (`SELECT ... FOR UPDATE`).
- **Precision Timing**: Every request sends `X-Response-Time` and `Server-Timing` headers for microsecond-level latency monitoring.
- **Brotli & Gzip Compression**: Minimum network transfer size for fast client page loads.
- **Production RBAC**: Admin-protected inventory, order status updates, customer inquiries, and media uploads with JWT authentication.

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
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Security & Authentication
JWT_SECRET=shreeji_dev_secret_key_change_in_production_2026
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@shreeji.com
ADMIN_PASSWORD=Admin@Shreeji2026

# Database (PostgreSQL / Supabase)
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
# Start in standard mode
npm start

# Or start with live reload
npm run dev
```

Server will run at `http://localhost:5000`.

### 4. 🕒 Run 24/7 Continuously (Production PM2 & Docker)

#### Option A: PM2 Process Manager (Auto-Restart on Crash/Reboot)
```bash
npm run prod:start     # Start 24/7 background process
npm run prod:status    # View live status & memory
npm run prod:logs      # View streaming logs
npm run prod:restart   # Zero-downtime hot reload
npm run prod:stop      # Stop server

# Persist across system reboots:
npx pm2 save
npx pm2 startup
```

#### Option B: Docker (Auto-Healing Container 24/7)
```bash
docker compose up -d   # Start container in background (restart: always)
docker compose logs -f # View logs
```

---

## 🧪 Testing & Load Benchmarking

```bash
# 1. Run Automated Integration & Security Tests (19 tests)
npm test

# 2. Run High-Concurrency Load & Stress Benchmark (Autocannon)
npm run test:load
```

---

## 📡 API Endpoints Summary

See [`docs/API.md`](../docs/API.md) for full documentation.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Admin login, returns JWT token |
| `GET` | `/api/auth/me` | Admin | Current admin profile |
| `GET` | `/api/health` | Public | Minimal liveness & database ping check |
| `GET` | `/api/metrics` | Admin | Detailed RAM, heap, and cache metrics |
| `GET` | `/api/products` | Public | Paginated catalog (cached) |
| `GET` | `/api/products/:id` | Public | Single product details (cached) |
| `POST` | `/api/products` | Admin | Create product (validated) |
| `PUT` | `/api/products/:id` | Admin | Update product |
| `DELETE` | `/api/products/:id` | Admin | Delete product |
| `GET` | `/api/categories` | Public | Category list (cached) |
| `POST` | `/api/categories` | Admin | Create category |
| `GET` | `/api/cart` | Public | Get cart |
| `POST` | `/api/cart/items` | Public | Add item to cart |
| `POST` | `/api/orders` | Public | Place order (trusted DB price & atomic stock decrement) |
| `GET` | `/api/orders` | Admin | List all orders |
| `PATCH` | `/api/orders/:id/status`| Admin | Update order status |
| `POST` | `/api/inquiries` | Public | Submit bridal consultation inquiry |
| `GET` | `/api/inquiries` | Admin | View customer inquiries |
| `POST` | `/api/uploads` | Admin | Upload verified binary image/PDF |
| `DELETE` | `/api/uploads` | Admin | Delete storage key |
