# Shreeji Real Estate Consultancy & 3D Spatial Digital Twin Platform

Welcome to the **Shreeji** commercial real estate platform and 3D spatial digital twin platform repository. Built with performance, responsiveness, and rapid loading as primary architectural goals.

```text
Shreeji/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated testing & security validation in CI
│       └── deploy.yml             # Production build, test & deploy workflow
├── Shreeji web/
│   ├── index.html                 # Modern commercial portal with 3D Spatial Twin viewer
│   ├── portal.html                # VIP Property Consultation & Inquiry Portal
│   ├── script.js                  # Frontend client engine with centralized API_BASE
│   ├── styles.css                 # Responsive stylesheet & animations
│   ├── 3d-map/                    # Three.js WebGL 3D Spatial Digital Twin Engine
│   │   ├── viewer.js              # Real-time BroadcastChannel parcel sync & 3D shader
│   │   └── index.html             # Fullscreen interactive 3D layout viewer
│   └── admin/
│       └── index.html             # Executive Administration Studio & CAD Management
├── server/
│   ├── src/
│   │   ├── config/                # Environment, PostgreSQL pool, Cloud Storage, Cache
│   │   ├── controllers/           # CAD Projects, Media Studio, Property Inquiries, Auth
│   │   ├── middleware/            # Auth (JWT), Validation, Rate Limiter, Timing, Cache
│   │   ├── repositories/          # Real SQL queries, transactions, property CRM
│   │   ├── routes/                # Unified /api routes with RBAC protection
│   │   ├── data/                  # Seed projects, surveyed plots & commercial assets
│   │   ├── app.js                 # Express app (Helmet, CORS allowlist, Compression)
│   │   └── server.js              # Entrypoint with graceful shutdown & crash recovery
│   ├── tests/
│   │   ├── performance.test.js    # PRD Integration & security test suite
│   │   ├── postgres.test.js       # PostgreSQL transactions, migrations & row locks
│   │   ├── realEstate.test.js     # Real estate projects, plots & CAD 3D map tests
│   │   └── clientKyc.test.js      # Client auth, WhatsApp dispatches & CRM tests
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
├── docker-compose.yml             # Containerized 24/7 service with env_file injection
├── .gitignore
└── README.md
```

## 🌟 Key Capabilities

1. **3D Spatial Digital Twin**: Interactive Three.js/WebGL map engine displaying surveyed plot parcels with real-time status reflection (`Available`, `Booked`, `Sold`).
2. **AutoCAD & Media Studio**: Ingest vector CAD files (`.dwg`, `.dxf`, `.json`, `.glb`) and publish 4K drone videos and site walk photos with in-depth narrative documentation.
3. **Executive Admin Studio**: Secured with User ID `Shreejii` and hashed credentials (`Shreeji@108`).
4. **WhatsApp Sales Integration**: Direct routing to Shreeji's sales desk (`+91 98257 99754`) with audit logging.
5. **Offline KYC & Payment Policy**: All legal documentation, physical title checks, and booking payments are completed in person by Shreeji Advisory.

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
   npm test                # Run integration, database & real estate test suites
   ```

## ⚡ Performance & Security Verification

- **Real-Time Cross-Window Sync**: Instantaneous Three.js mesh re-coloring via `BroadcastChannel('shreeji_inventory_sync')`.
- **Upload Hardening**: SVGs rejected; magic byte binary validation for DWG, GLB, MP4, WebM; directory traversal defense.
- **Centralized API Base**: Clean fallback to local backend or production host without hardcoded localhost in deployment.
- **Minimal Health Check**: No internal heap/RAM telemetry leaked to public health endpoint.

## 📚 Documentation

- [API Reference](docs/API.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Security Policy & Controls](docs/SECURITY.md)
