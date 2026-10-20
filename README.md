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
   npm start
   ```
   Or in development mode:
   ```bash
   npm run dev
   ```
4. Verify & Benchmark:
   ```bash
   npm test
   ```

## ⚡ Performance Verification
The server includes automated latency benchmarking (`npm test`), achieving **< 2ms** average response times on cached endpoints with Gzip/Brotli compression and low-memory overhead.

## 🔜 Next Steps
1. Add PostgreSQL / Supabase credentials to `server/.env` when ready.
2. Add Cloudflare R2 / AWS S3 credentials for cloud media storage.
3. Build the responsive frontend website consuming the `/api` endpoints.
