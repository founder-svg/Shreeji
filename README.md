# Shreeji - Luxury E-Commerce & Retail Platform

Welcome to the **Shreeji** platform repository. Built with performance, responsiveness, and rapid loading as primary architectural goals.

```text
Shreeji/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated testing & security validation in CI
│       └── deploy.yml             # Production deployment workflow template
├── server/
│   ├── src/
│   │   ├── config/                # Environment, PostgreSQL pool, Cloud Storage, LRU Cache
│   │   ├── controllers/           # Auth, Products, Categories, Orders, Inquiries, Uploads
│   │   ├── middleware/            # Auth (JWT), Validation, Rate Limiter, Timing, Cache
│   │   ├── repositories/          # Real SQL queries, transactions, stock decrement
│   │   ├── routes/                # Unified /api routes with RBAC protection
│   │   ├── data/                  # Seed catalog data (luxury bridal, jewellery, silks)
│   │   ├── app.js                 # Express app (Helmet, CORS allowlist, Compression)
│   │   └── server.js              # Entrypoint with graceful shutdown & crash recovery
│   ├── tests/
│   │   ├── performance.test.js    # Integration & security test suite (19 tests)
│   │   └── load.test.js           # High-concurrency load benchmark (Autocannon)
│   ├── migrations/
│   │   └── 001_initial_schema.sql # PostgreSQL DDL schema with performance indexes
│   ├── uploads/                   # Local uploads storage directory
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── ecosystem.config.cjs       # PM2 24/7 cluster configuration
├── docs/
│   ├── API.md                     # Comprehensive REST API reference
│   ├── DEPLOYMENT.md              # Cloud VPS, Docker, Supabase, Cloudflare guide
│   └── SECURITY.md                # Security policy, RBAC, upload hardening
├── docker-compose.yml             # Containerized 24/7 service (restart: always)
├── .gitignore
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
   npm test                # Run 19 integration & security tests
   npm run test:load       # Run realistic high-concurrency benchmark (autocannon)
   ```

## ⚡ Performance & Security Verification

- **Throughput**: ~4,500 requests/sec under 50 concurrent connections (`autocannon`).
- **Latency**: p50: ~5ms, p99: ~12ms (target was < 100ms).
- **Error Rate**: 0.00% under high concurrent load.
- **Order Integrity**: Zero client-price trust; prices calculated server-side; stock reserved atomically inside PostgreSQL transaction.
- **Upload Hardening**: SVGs rejected; magic byte binary validation; directory traversal defense.
- **Minimal Health Check**: No internal heap/RAM telemetry leaked to public health endpoint.

## 📚 Documentation

- [API Reference](docs/API.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Security Policy & Controls](docs/SECURITY.md)
