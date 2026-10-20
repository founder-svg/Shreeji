# Shreeji - Luxury E-Commerce & Retail Platform

Welcome to the **Shreeji** project repository. Built with performance, responsiveness, and rapid loading as primary architectural goals.

```
Shreeji/
├── server/                     # Ultra-low latency backend server (Node.js, Express, LRU Cache)
│   ├── src/
│   │   ├── config/             # DB (PostgreSQL / Supabase), Cloud Storage (S3 / R2), LRU Cache, Env
│   │   ├── controllers/        # Products, Categories, Orders, Cart, Inquiries, Uploads
│   │   ├── data/               # Seed data & local store
│   │   ├── middleware/         # Timing (X-Response-Time), Cache (X-Cache), Error handling
│   │   ├── routes/             # Unified API routes under /api
│   │   ├── app.js              # Express app with compression, helmet, CORS
│   │   └── server.js           # Server entrypoint
│   ├── uploads/                # Local uploads fallback directory
│   ├── tests/                  # Automated performance and benchmark test suite
│   ├── .env.example            # Environment variables template
│   └── package.json
└── README.md
```

## 🚀 Running the Server Locally

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start        # Standard start
   npm run dev      # Development with autoreload
   ```

4. 🕒 Run 24/7 in Background (Production):
   ```bash
   # PM2 Cluster Mode (auto-restart on crash, multi-core cluster)
   npm run prod:start

   # Check 24/7 status
   npm run prod:status

   # View live logs
   npm run prod:logs
   ```
   Or via Docker:
   ```bash
   docker compose up -d    # Auto-healing 24/7 container (restart: always)
   ```

5. Verify & Benchmark:
   ```bash
   npm test
   ```

## ⚡ Performance Verification
The server includes automated latency benchmarking (`npm test`), achieving **< 2ms** average response times on cached endpoints with Gzip/Brotli compression and low-memory overhead.

## 🔜 Next Steps
1. Add PostgreSQL / Supabase credentials to `server/.env` when ready.
2. Add Cloudflare R2 / AWS S3 credentials for cloud media storage.
3. Build the responsive frontend website consuming the `/api` endpoints.
