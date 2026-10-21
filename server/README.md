# Shreeji - High-Performance Real Estate & Commercial Advisory API Server

A production-grade, ultra-low latency Node.js backend server designed for **Shreeji Commercial Real Estate, Land Development & Plot Advisory** (headquartered in Gandhidham & Adipur, Kutch, Gujarat). 

The backend architecture provides a unified platform for:
1. **Commercial Real Estate Domain**: Projects, surveyed plots/parcels with GeoJSON polygon boundaries, 2D/3D map assets, and property lead inquiry tracking.
2. **High-Concurrency Performance**: Instantaneous cache hits, precision timing, sub-5ms latencies, Brotli/Gzip compression, and rate limiting.
3. **Dual-Mode Persistence**: Seamlessly switches between in-memory/JSON store for rapid local development and PostgreSQL / Supabase with ACID transactions and schema migrations.
4. **Security & RBAC**: Admin-protected inventory management, staff assignment, CRM leads, and multi-provider storage uploads.
5. **Backwards Compatibility**: Preserves e-commerce and legacy endpoints alongside the real estate domain.

---

## ⚡ Performance Highlights & Benchmarks

- **4,500+ Requests/sec Throughput**: Validated with `autocannon` under high concurrency.
- **Latency p50: ~5 ms, p99: ~12 ms**: Measured under 50 concurrent active connections.
- **Sub-2ms Cached Project & Plot Catalog**: Built-in LRU in-memory cache layer (`X-Cache: HIT`).
- **Precision Timing**: Every request sends `X-Response-Time` and `Server-Timing` headers for microsecond-level latency monitoring.
- **Brotli & Gzip Compression**: Minimum network transfer size for high-speed client page loads.
- **Surveyed GeoJSON Boundaries**: Plots deliver validated polygon coordinates ready for Leaflet, Mapbox, or Three.js 2D/3D parcel viewers.
- **CORS & Domain Security**: Configured for local dev, custom domains, and GitHub Pages staging (`https://founder-svg.github.io`).

---

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment (`.env`)

The repository includes `.env.example`. Copy or edit `.env`:

```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:8080,http://localhost:3000,https://founder-svg.github.io

# Security & Authentication (Rotate in production!)
JWT_SECRET=shreeji_dev_secret_key_change_in_production_2026
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@shreeji.com
ADMIN_PASSWORD=Admin@Shreeji2026

# Database (PostgreSQL / Supabase - optional in local dev, required in production)
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

Server will start at `http://localhost:5000`.

---

## 🧪 Testing & Verification

The test suite runs 51 automated checks verifying performance, PostgreSQL ACID transactions, and Real Estate API contracts:

```bash
# Run all automated integration & domain tests
npm test

# Run real estate domain test suite specifically
npm run test:realestate

# Run PostgreSQL transaction, migration & row lock tests
npm run test:postgres

# Run high-concurrency load benchmark (Autocannon)
npm run test:load
```

---

## 📡 API Endpoints Reference

> **Note on Versioning**: The server mounts all routes under both `/api/v1` (canonical) and `/api` (legacy backward-compatible fallback).

### 🏢 1. Commercial Real Estate: Projects

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/projects` | Public | List published commercial development projects (cached) |
| `GET` | `/api/v1/projects/:id` | Public | Retrieve project details by ID or slug with coordinates and gallery |
| `GET` | `/api/v1/projects/:id/plots` | Public | Retrieve all plots / parcels belonging to a project |
| `GET` | `/api/v1/projects/:id/assets` | Public | Retrieve 2D/3D maps and document assets for a project |
| `POST` | `/api/v1/admin/projects` | Admin | Create a new commercial project |
| `PATCH` | `/api/v1/admin/projects/:id` | Admin | Update project status, metadata or publication state |
| `DELETE` | `/api/v1/admin/projects/:id` | Admin | Soft-delete / remove project |

### 📐 2. Plots & Parcels (Surveyed Boundaries & Availability)

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/plots` | Public | List plots with filters (`projectId`, `availabilityStatus`, `category`, `minPrice`, `maxPrice`) |
| `GET` | `/api/v1/plots/:id` | Public | Retrieve single plot with verified GeoJSON `surveyedBoundaryGeometry` |
| `POST` | `/api/v1/admin/plots` | Admin | Add new surveyed plot / commercial unit |
| `PATCH` | `/api/v1/admin/plots/:id` | Staff/Admin | Atomically update plot status (`available`, `under_offer`, `sold`) and price |
| `DELETE` | `/api/v1/admin/plots/:id` | Admin | Delete plot record |

### 📋 3. Property Inquiries & Leads CRM

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/property-inquiries` | Public | Submit commercial inquiry from website (Buyer/Tenant/Owner) |
| `GET` | `/api/v1/admin/property-inquiries` | Staff/Admin | List CRM inquiries with pagination and status filters |
| `GET` | `/api/v1/property-inquiries/:id` | Staff/Admin | View single inquiry details |
| `PATCH` | `/api/v1/admin/property-inquiries/:id` | Staff/Admin | Update lead status (`new`, `contacted`, `site_visit_scheduled`, `closed`) and assign staff |

### 🗺️ 4. Map & 3D Assets

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/admin/assets` | Admin | Register 3D model (GLB), master plan PDF, or CAD layer metadata |
| `DELETE` | `/api/v1/admin/assets/:id` | Admin | Remove asset record |

### 🔐 5. Authentication & Health Checks

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Public | Staff/Admin login, returns JWT token |
| `GET` | `/api/v1/auth/me` | Staff/Admin | View authenticated staff profile |
| `GET` | `/health/live` | Public | Liveness probe (process up) |
| `GET` | `/health/ready` | Public | Readiness probe (verifies database & storage connection) |
| `GET` | `/api/v1/metrics` | Admin | Server RAM, heap, and cache statistics |
| `GET` | `/api/v1/audit-logs` | Admin | Administrative activity audit logs |

---

## 🏗️ 24/7 Production Deployment

### PM2 Process Manager
```bash
npm run prod:start     # Start 24/7 background process
npm run prod:status    # View live status & memory
npm run prod:logs      # View streaming logs
npm run prod:restart   # Zero-downtime reload
npm run prod:stop      # Stop server
```

### Docker
```bash
docker compose up -d   # Start container in background
docker compose logs -f # Follow logs
```
