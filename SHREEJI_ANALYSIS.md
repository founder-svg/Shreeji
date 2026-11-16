# Comprehensive Architectural & Technical Analysis: Shreeji Real Estate Platform

**Report Generated:** November 16, 2026  
**Target Repository:** Shreeji Real Estate Consultancy & 3D Spatial Digital Twin Platform  
**Root Path:** `c:\Users\samay\Downloads\Shreeji`  
**Mode:** READ-ONLY Architectural Audit & Code Review  

---

## Executive Summary

A comprehensive code, security, performance, UI/UX, database, and architectural audit was performed across all frontend web assets, 3D WebGL twin engines, executive admin portals, and Node.js/Express/PostgreSQL backend services of the Shreeji project.

The platform shows ambitious architectural features—combining commercial real estate consulting, Three.js 3D parcel visualizations, Google Earth hybrid satellite layers, and WhatsApp dispatch integrations. However, the codebase contains severe security vulnerabilities, broken form handling on multiple subpages, conflicting navigation architectures, mobile responsiveness breakdowns, and significant remnants of dead e-commerce/bridal jewelry code inherited from an earlier project template.

### Total Identified Issues: 50
- **High Severity:** 12
- **Medium Severity:** 24
- **Low Severity:** 14

---

## 1. Project Overview

### 1.1 Purpose
The Shreeji platform serves as a commercial real estate and land consultancy web application centered on **Gandhidham and Adipur** within Kutch, Gujarat. Its core objectives are:
- Facilitating rental, lease, and sale inquiries for commercial retail shops, corporate offices, showrooms, and highway industrial plots.
- Providing high-tech **3D Spatial Digital Twins** for surveyed parcels (Revenue Survey No. 374 in Nagavaladiya, Nakshatra Township, and Regal Farms).
- Routing verified commercial client leads directly to the executive sales desk on WhatsApp (`+91 98257 99754`).
- Managing AutoCAD survey overlays, drone videos, and inventory booking statuses via an Executive Administration Studio.

### 1.2 Tech Stack
| Component | Technologies / Libraries |
| :--- | :--- |
| **Frontend Core** | HTML5, CSS3 (Modern Glassmorphism & Vanilla CSS variables), JavaScript (ES6+ Modules) |
| **3D & Spatial Engines** | Three.js (r128 in `3d-map`, r182 via importmap in `survey-374`), Mapbox GL JS (v3.2.0), OrbitControls, GLTFLoader, GSAP (v3.12.5) |
| **Icons & Typography** | FontAwesome 6.4.0 (CDN), Google Fonts (`Outfit`, `Plus Jakarta Sans`, `Cinzel`, `Inter`) |
| **Client Protection** | JavaScript-Obfuscator (v5.10.0), custom `shreeji-security-shield.js` (anti-devtools & anti-clickjacking) |
| **Static Export Viewer** | Next.js 14 static export (`adipur/3d-viewer`) |
| **Backend Runtime** | Node.js (ESM modules), Express.js (v4.21.2) |
| **Database & Cache** | PostgreSQL (`pg` v8.13.3) with connection pooling / Supabase support; in-memory JSON fallback (`local-db.json`); LRU Cache (`lru-cache` v11.0.2) |
| **Security & Auth** | JWT (`jsonwebtoken` v9.0.3), `bcryptjs`, `helmet` (v8.0.0), `express-rate-limit` (v8.7.1), AES-256-GCM crypto utility |
| **Storage & Uploads** | Multer (`multer` v1.4.5-lts.1), AWS SDK for S3 / Cloudflare R2 (`@aws-sdk/client-s3` v3.750.0) |
| **Process & Containers** | PM2 (`pm2` v7.0.4, `ecosystem.config.cjs`), Docker (`Dockerfile`), Docker Compose (`docker-compose.yml`) |

### 1.3 Folder Structure
```text
Shreeji/
├── .github/workflows/          # CI/CD pipeline definitions (ci.yml, deploy.yml)
├── .vscode/                    # Editor workspace settings & extensions
├── 3d-map/                     # Standalone Three.js 3D Masterplot CAD Digital Twin
│   ├── assets/                 # Three.js libraries, textures, model data
│   ├── projects/               # JSON and JS plot datasets (nagavaladiya, nakshatra)
│   ├── index.html              # 3D interactive viewer markup
│   ├── viewer.css              # Viewer UI styles & HUD overlays
│   └── viewer.js               # WebGL engine, OrbitControls & BroadcastChannel sync
├── adipur/                     # Adipur micro-market landing page & Next.js 3D viewer
│   ├── 3d-map/                 # Next.js 14 / TypeScript source code for Adipur twin
│   ├── 3d-viewer/              # Exported static build of Next.js 3D viewer
│   └── index.html              # Adipur commercial rental portal
├── admin/                      # Executive Administration Studio
│   └── index.html              # Admin workspace, login overlay, CAD & lead manager
├── audio/                      # Audio tracks (shreeji-cinematic-theme.mp3)
├── components/                 # Shared UI components
├── docs/                       # API.md, DEPLOYMENT.md, SECURITY.md
├── faq/                        # Commercial real estate FAQ hub (index.html)
├── gandhidham/                 # Gandhidham commercial market hub (index.html)
├── images/                     # Photographic, architectural, and drone assets (PNG/JPG)
├── js/                         # Client security scripts (shreeji-security-shield.js)
├── overview/                   # Kutch commercial real estate overview (index.html)
├── process/                    # 5-Step commercial leasing process (index.html)
├── regal-farms-fix/            # Drop-in patches for Vercel deployment & credentials
├── server/                     # Node.js Express API & Database Server
│   ├── data/                   # local-db.json (dev database fallback)
│   ├── migrations/             # SQL DDL schemas (001 through 007)
│   ├── scripts/                # Database backup, restore, migrate, obfuscator
│   ├── src/                    # Controllers, repositories, routes, middleware, config
│   ├── tests/                  # Integration and security test suites
│   ├── uploads/                # Local uploaded binary media
│   ├── ecosystem.config.cjs    # PM2 24/7 cluster config
│   └── package.json            # Server dependencies and test scripts
├── services/                   # Commercial real estate services catalog (index.html)
├── Shreeji web/                # Redundant duplicate copy of frontend files
├── survey-374/                 # Survey 374 Nagavaladiya Mapbox + Three.js satellite twin
│   ├── data/                   # GeoJSON roads and alignments
│   ├── icons/                  # HUD icon assets
│   ├── media/                  # Drone photo gallery & brochure PDF
│   ├── index.html              # Satellite twin interface
│   ├── main.js                 # Mapbox GL + Three.js projection synchronization
│   └── ui.css                  # High-tech HUD styles
├── target-areas/               # Gujarat AnyRoR cascading land search filter (index.html)
├── videos/                     # MP4 drone and commercial walkthrough videos
├── 404.html                    # Single-Page-App redirect handler for GitHub Pages
├── index.html                  # Main homepage & commercial portal
├── portal.html                 # VIP Property Consultation & KYC Application Portal
├── script.js                   # Main client-side interactivity engine
├── script.protected.js         # Obfuscated version of script.js
├── styles.css                  # Global website styles, animations & design system
├── docker-compose.yml          # Container configuration for 24/7 service
└── package.json                # Root package configuration
```

### 1.4 Pages and Routes
- **Public Commercial Website**:
  - `/index.html`: Main landing page (hero, 3D tunnel, corridors, projects, contact, lead modal).
  - `/overview/index.html`: Macro economic overview of Gandhidham & Adipur corridors.
  - `/services/index.html`: Commercial rental, showroom lease, and land advisory services.
  - `/process/index.html`: 5-step transaction workflow from title due diligence to registry.
  - `/faq/index.html`: Categorized real estate FAQs with dynamic search.
  - `/target-areas/index.html`: AnyRoR-style 4-step cascading Taluka/Village land filter.
  - `/gandhidham/index.html`: Micro-market focus page for Gandhidham commercial sectors.
  - `/adipur/index.html`: Micro-market focus page for Adipur retail wards.
- **Interactive 3D Digital Twins**:
  - `/3d-map/index.html`: Three.js 3D WebGL parcel layout viewer (Survey 374 & Nakshatra).
  - `/survey-374/index.html`: Mapbox Satellite + Three.js vector layout twin (176 parcels).
  - `/adipur/3d-viewer/index.html`: Next.js static export parcel viewer for Adipur.
- **Portals & Administration**:
  - `/portal.html`: VIP Client account registration, login, and KYC intake application.
  - `/admin/index.html`: Executive Admin Studio (lead CRM, plot inventory manager, CAD upload).
- **Backend API Endpoints (Prefix: `/api/v1` and `/api`)**:
  - `GET /health`, `/health/live`, `/health/ready`: System liveness and DB connectivity checks.
  - `POST /auth/login`, `GET /auth/me`: Staff/Admin authentication.
  - `POST /client/register`, `POST /client/login`, `GET /client/me`: Client authentication.
  - `POST /client/kyc`, `GET /client/kyc/status`: Client KYC submission.
  - `GET /projects`, `GET /projects/:id`, `GET /plots`, `GET /plots/:id`: Real estate catalog.
  - `POST /property-inquiries`: Public lead funnel intake.
  - `POST /dispatch/whatsapp`: WhatsApp click tracking and audit dispatch log.
  - `POST /admin/cad-project`, `POST /admin/media`, `POST /uploads`: Binary file uploads.
  - Legacy E-Commerce: `/products`, `/categories`, `/cart`, `/orders`, `/inquiries`.

### 1.5 How to Run the Project
1. **Frontend Only (Live-Server / Python)**:
   ```bash
   # Option A: Node Live Server (runs on port 8080)
   npm start
   # or
   npx live-server --port=8080

   # Option B: Python HTTP Server
   python -m http.server 8080
   ```
   Open `http://localhost:8080` in the browser.

2. **Backend API Server**:
   ```bash
   cd server
   npm install
   npm run dev       # Development mode with nodemon on port 5000
   # or
   npm start         # Production node startup
   ```

3. **Running 24/7 in Production via PM2**:
   ```bash
   cd server
   npm run prod:start    # Boots via PM2 cluster from ecosystem.config.cjs
   npm run prod:status   # View cluster uptime and memory
   npm run prod:logs     # View streaming logs
   ```

4. **Running with Docker**:
   ```bash
   docker compose up -d  # Boots shreeji-server-247 container on port 5000
   ```

---

## 2. Bugs and Broken Things

| ID | File Path & Line | Severity | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | `overview/index.html:317`<br>`process/index.html:330`<br>`services/index.html:337`<br>`faq/index.html:310` | **High** | The modal forms on all four subpages call `onsubmit="handleFormSubmit(event)"`. `handleFormSubmit` is never defined anywhere in `script.js` or subpage scripts, causing an uncaught `ReferenceError: handleFormSubmit is not defined`. The form fails to submit and reloads with query params. | Define `window.handleFormSubmit` in `script.js` or map it directly to `handleInquirySubmit(event, 'buyer')`. |
| **BUG-02** | `overview/index.html:317-356`<br>`process/index.html:330-366`<br>`services/index.html:337-373`<br>`faq/index.html:310-346` | **High** | Subpage modal inputs lack the element IDs required by `script.js` (`buyerName`, `buyerPhone`, `buyerLoc`, `buyerCategory`, `buyerNotes`). Even if `handleInquirySubmit` is wired up, `document.getElementById('buyerName')` returns `null`, triggering a validation alert and blocking submission. | Add matching IDs (`id="buyerName"`, `id="buyerPhone"`, etc.) or update `handleInquirySubmit` to read from form elements relatively (`e.target.elements`). |
| **BUG-03** | `server/src/app.js:17`<br>`server/Dockerfile:16` | **High** | `app.js` resolves `webRootDir` via `path.resolve(__dirname, '../../')`. Inside Docker, `server/` is copied into `/app`, so `webRootDir` resolves to container root (`/`). All static routes (`/admin`, `/3d-map`, `/portal`, `/`) fail with `ENOENT: no such file or directory`. | Copy the entire project context in `Dockerfile` or mount static web assets explicitly to `/app/public` and point `webRootDir` accordingly. |
| **BUG-04** | `script.js:228`<br>`script.js:1197`<br>`script.js:1850` | **Medium** | `window.openModalWithDetails` is defined twice with inverted parameter orders: definition 1 is `(propertyName, location, price)`, while definition 2 is `(title, price, location)`. Definition 2 overwrites definition 1, but calls at line 1850 pass `(title, location, price)`. As a result, the price string is placed into the location input and location is placed into the notes textarea. | Remove the duplicate definition at line 228 and standardize the parameter signature to `(title, location, price)` across definition and all call sites. |
| **BUG-05** | `script.js:901`<br>`admin/index.html:1405-1406, 1435` | **Medium** | Storage key mismatch: `script.js` checks `sessionStorage.getItem('admin_logged') === 'true'`, but `admin/index.html` writes `sessionStorage.setItem('shreeji_admin_logged', 'true')`. Consequently, logging into the admin studio never activates the floating admin button (`#floatingAdminBtn`) or PDF vault on the main website. | Standardize both files to use the same session storage key (`shreeji_admin_logged`). |
| **BUG-06** | `3d-map/index.html:82`<br>`3d-map/viewer.js:1003` | **Medium** | The first `<option>` in the project switcher `<select id="project-select">` is `value="survey-374"`, but `viewer.js` boots with `loadProject("nagavaladiya")`. The UI displays "Survey 374 Satellite Twin", but the canvas renders Nagavaladiya 109 plots. Clicking the dropdown triggers a jarring redirect. | Set `selected` on the Nagavaladiya option in HTML or set `projectSelect.value = state.currentProjectId;` during `setupUI()`. |
| **BUG-07** | `3d-map/viewer.js:569` | **Medium** | `fetch("/api/v1/dispatch/whatsapp", ...)` uses a hardcoded root-relative path rather than `API_BASE`. When deployed on GitHub Pages (`https://.../Shreeji/3d-map/`) or run via Live Server on port 8080, telemetry requests 404 to the static host. | Use `API_BASE` (with fallback to `http://localhost:5000/api/v1` or Render URL) consistently. |
| **BUG-08** | `3d-map/viewer.js:574` | **Medium** | In the WhatsApp dispatch telemetry payload, `clientPhone: waPhone` passes Shreeji's sales number (`919825799754`) as the customer's phone number. | Change `clientPhone` to `'Website 3D Visitor'` or omit clientPhone until collected via modal. |
| **BUG-09** | `survey-374/main.js:54, 754` | **Medium** | `main.js` issues `fetch("/api/content")` and `fetch("/api/config")` on startup. Neither endpoint exists in `server/src/routes/api.js`, causing redundant 404 errors in the console on every page load. | Implement `/api/content` and `/api/config` in Express backend or gracefully handle local defaults without failing network requests. |
| **BUG-10** | `survey-374/main.js:1655` | **Medium** | `fetch("/api/plots")` uses a root-relative path without base URL configuration. When the frontend is served on port 8080 or GitHub Pages, the request fails with 404. | Prepend `API_BASE` so requests route to `http://localhost:5000/api/v1/plots`. |
| **BUG-11** | `404.html:10, 38` | **Low** | `404.html` hardcodes `var repoBase = '/Shreeji';`. On custom domains (e.g. `shreejiproperty.com`) or root localhost, visiting an unknown route redirects to `/Shreeji/index.html`, resulting in a broken page or 404 loop. | Dynamically detect `repoBase` from `window.location.pathname.startsWith('/Shreeji')` or use relative `./index.html`. |
| **BUG-12** | `images/Mundra-Anjar Industrial Port at Sunset.png`<br>`images/Mundra–Anjar Industrial Port at Sunset.png` | **Low** | Duplicate 2.53 MB file exists twice in `images/` due to an en-dash (`–`) vs hyphen (`-`) filename typo, wasting 2.53 MB of repository and disk space. | Delete the duplicate file and standardize code references on the hyphenated filename. |
| **BUG-13** | `server/ecosystem.config.cjs:32-34` | **Low** | PM2 configuration specifies log outputs in `./logs/pm2-error.log` and `./logs/pm2-out.log`, but the `server/logs` directory is not committed to the repository and does not exist. | Add `mkdir -p logs` or create `server/logs/.gitkeep`. |

---

## 3. Frontend & UI / UX

| ID | File Path & Line | Severity | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- |
| **UX-01** | `js/shreeji-security-shield.js:70-82` | **High** | An active anti-debugging loop executes `setInterval(..., 2000)` running a `debugger;` statement on any non-localhost domain. If developers, QA, or clients open browser DevTools on staging, a custom domain, or a local LAN IP (e.g. mobile testing at `192.168.x.x`), the browser freezes indefinitely. | Remove the `debugger;` setInterval loop completely; anti-debugging is hostile to maintenance and easily bypassed. |
| **UX-02** | `script.js:1611-1630` | **High** | The script listens to global `['click', 'touchstart', 'scroll']` events and automatically starts playing background audio (`shreeji-cinematic-theme.mp3`) at 55% volume on first scroll or click. Violates WCAG 2.1 1.4.2 Audio Control, disturbs visitors, and triggers high bounce rates. | Require explicit user interaction with a visible "Play Music" button before starting audio; never autoplay on scroll. |
| **UX-03** | `survey-374/index.html:7` | **Medium** | Viewport contains `initial-scale=0.9, maximum-scale=1.0, user-scalable=no`. Disabling pinch-to-zoom violates accessibility standards (WCAG 2.1 1.4.4 Resize text) and prevents visually impaired users from zooming on mobile. | Change viewport meta tag to standard: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. |
| **UX-04** | `styles.css:1681`<br>`index.html:56-86` | **Medium** | Breakpoint mismatch: `.mobile-menu-btn` is only displayed `@media (max-width: 768px)`. On tablet viewports (769px to 1024px), the navbar attempts to render 10 nav links, 3 language buttons, search, and the VIP consultation button in an 80px container, causing severe horizontal overflow and misaligned buttons. | Change the mobile navigation toggle breakpoint from `768px` to `1024px` (`@media (max-width: 1024px)`). |
| **UX-05** | `styles.css:1704`<br>`index.html:78` | **Medium** | Mobile header CSS hides `.nav-actions .btn-primary`, but `index.html` uses class `btn-spatial-primary`. The button stays visible on small mobile screens (320px–414px), cramming the header and pushing the hamburger toggle off-screen. | Add `.nav-actions .btn-spatial-primary { display: none; }` to the mobile `@media (max-width: 768px)` stylesheet. |
| **UX-06** | `index.html:56-67`<br>`target-areas/index.html:41-48`<br>`services/index.html:41-48` | **Medium** | Complete architecture mismatch between navbars: `index.html` has one-page anchor links (`About`, `Projects`, `Corridors`, `3D Models`), while subpages have multi-page links (`Overview`, `Target Areas`, `Services`, `Process`, `FAQ`). Visitors on the homepage have no way to access Overview, Services, Process, or FAQ through the navigation. | Unify the navigation bar across all pages. Include dropdowns or secondary links to subpages (`Services`, `Process`, `Target Areas`, `FAQ`). |
| **UX-07** | `script.js:1740-1743`<br>`index.html:1520-1526` | **Medium** | When clicking the "Survey 374" link in the navbar, the cinematic portal overlay activates. Because the URL does not contain `3d-map`, line 1742 sets the badge to `TARGET: REGAL FARMS 3D SPATIAL TWIN`. The overlay skip buttons also only offer "3D CAD Map" or "Regal Farms Vercel", confusing users. | Update `launch3DMapPortal` to detect `survey-374` and set the badge to `TARGET: SURVEY 374 3D SATELLITE TWIN` with an appropriate skip link. |
| **UX-08** | `script.js:175-195`<br>`script.js:1155-1170` | **Low** | `openModal` and `closeModal` are declared twice in `script.js`. Definition 1 resets `document.body.style.overflow = 'auto'`, while definition 2 resets it to `''`. Redundant code leads to maintainability issues. | Consolidate modal control into a single clean module. |
| **UX-09** | `index.html:234`<br>`3d-map/index.html:71, 83` | **Low** | Copy inconsistency: `index.html` tool card claims "verified plot dimensions (176 plots)", whereas `3d-map/index.html` and `viewer.js` state "109 Master Plots". | Clarify whether Survey 374 has 109 or 176 plots and unify the count across all cards. |
| **UX-10** | `js/shreeji-security-shield.js:14-21` | **Low** | Frame-busting script blanks `document.documentElement.style.display = 'none'` when embedded inside any cross-origin iframe. Prevents legitimate iframe previews, CMS embeds, or client portal widgets. | Replace blanket frame-busting with server-side `Content-Security-Policy: frame-ancestors` allowing authorized domains. |
| **UX-11** | `js/shreeji-security-shield.js:36-68` | **Low** | Disabling right-click and keyboard shortcuts (Ctrl+U, Ctrl+S) provides zero actual security (assets can still be fetched via curl or disabled JS) and frustrates legitimate users who rely on context menus for accessibility. | Remove client-side input and context-menu blockers. |

---

## 4. Backend / API & Database

| ID | File Path & Line | Severity | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- |
| **API-01** | `server/src/app.js:35-46`<br>`package.json:7-9` | **High** | Root `package.json` specifies `"dev": "npx live-server --port=8080"`, but `server/src/app.js` default CORS allowlist only permits ports 3000, 5173, 5000, and github.io. Out of the box, running the project's own start scripts blocks all local API requests with a CORS error. | Add `http://localhost:8080` and `http://127.0.0.1:8080` to `defaultOrigins` in `app.js`. |
| **API-02** | `server/src/app.js:100` | **Medium** | `app.use(express.static(webRootDir, { index: false }))` disables directory index serving. Navigating to `http://localhost:5000/survey-374` or `/adipur` returns 404 unless `/index.html` is typed explicitly. | Remove `{ index: false }` or add dedicated static handlers for `/survey-374`, `/adipur`, `/gandhidham`. |
| **API-03** | `server/src/routes/api.js:138-182` | **Medium** | Over 15 endpoints (`/products`, `/categories`, `/cart`, `/orders`, `/inquiries`) and corresponding controllers serve bridal jewelry and lehengas. This represents dead code that confuses maintainers and bloats the API surface. | Deprecate and remove legacy e-commerce endpoints and controllers, focusing purely on real estate domain routes. |
| **API-04** | `server/src/controllers/uploadController.js:12-40` | **Medium** | Upload handler accepts binary DWG, GLB, and MP4 files, but when `STORAGE_PROVIDER=local` is active in multi-instance PM2 cluster mode (`ecosystem.config.cjs:19`), uploaded files saved on one worker's local disk will not be accessible to other workers. | Require S3/Cloudflare R2 storage in cluster mode or use a shared NFS/Docker volume. |
| **API-05** | `server/src/middleware/rateLimiter.js:28-36` | **Low** | In development mode, failed login attempts can trigger a 9-minute IP lockout (`submissionLimiter` / `authLimiter`), hindering QA and local testing. | Bypass or lower rate-limiting thresholds when `NODE_ENV === 'development'`. |

---

## 5. Security

| ID | File Path & Line | Severity | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | `index.html:1334`<br>`admin/index.html:816-820` | **High** | The public website footer links directly to `/admin/index.html`. On the admin login screen, a credential hint box explicitly states: `ID: Shreejii • Pass: Shreeji@108` with a 1-click `Auto-Fill` button! Anyone visiting the website can log into the admin studio in one click. | Remove the admin link from the public footer; remove the credential hint and autofill button from `admin/index.html`. |
| **SEC-02** | `admin/index.html:1340-1346, 1434-1442` | **High** | Critical client-side authentication bypass: `isMasterLogin(user, pass)` checks credentials against hardcoded strings in client JS. Upon match, it creates a fake session token (`shreeji_master_token_...`), sets `shreeji_admin_logged = 'true'`, and unlocks the workspace without verifying credentials against the backend API. | Remove hardcoded credentials from frontend scripts. Authenticate strictly through `POST /api/v1/auth/login` and only grant access on valid JWT receipt. |
| **SEC-03** | `server/src/routes/api.js:225` | **High** | Broken Object Level Authorization (BOLA/IDOR): `router.get('/property-inquiries', authenticateToken, propertyInquiryController.getAll)` uses `authenticateToken` without `requireAdmin`. Any user registered as a regular client on `portal.html` receives a valid client JWT and can query this endpoint to dump all customer names, phone numbers, budgets, and listing inquiries in the database! | Add `requireAdmin` middleware: `router.get('/property-inquiries', authenticateToken, requireAdmin, propertyInquiryController.getAll)`. |
| **SEC-04** | `server/src/routes/api.js:213, 229` | **High** | `router.patch('/admin/plots/:id', authenticateToken, plotController.update)` and `router.patch('/property-inquiries/:id', authenticateToken, propertyInquiryController.updateStatus)` lack `requireAdmin`. Any authenticated client user can modify parcel statuses or alter lead disposition. | Add `requireAdmin` middleware to both route handlers. |
| **SEC-05** | `server/src/controllers/clientKycController.js:72`<br>`server/migrations/005_client_auth_and_kyc.sql:40`<br>`server/src/repositories/clientRepository.js:101` | **High** | Cleartext Aadhaar storage: `aadhar_number` is stored as plain 12-digit numbers in the database. Storing raw UIDAI Aadhaar numbers unencrypted violates Indian UIDAI regulations and the Aadhaar Act, carrying severe legal liability. | Encrypt Aadhaar using `encryptField` from `cryptoSecurity.js` before saving, or store only the masked version (`XXXX-XXXX-1234`). |
| **SEC-06** | `server/src/config/env.js:62, 66` | **High** | Fallback JWT secret and admin password are hardcoded in code: `jwtSecret: 'shreeji_dev_secret_key_change_in_production_2026'` and `password: 'Shreeji@108'`. If `.env` is omitted in production, the server boots with known default credentials. | Throw a fatal error on boot if `JWT_SECRET` or `ADMIN_PASSWORD` are not provided in environment variables, regardless of environment mode. |
| **SEC-07** | `survey-374/main.js:709-711` | **Medium** | `DEFAULT_MAPBOX_TOKEN = atob('cGsuZXlKMUlqb2ljMkZ0WVhsaFozSmhkMkZzSWl3aVlTSTZJbU50ZFdwaVpXcHZNVEZuWnpBeWQzTnBZV1JyZURCNWVXVWlmUS5sMmpmX1d0c3ludXNoTi1TamdqazRB')` decodes to a developer's personal Mapbox token (`samayagrawal`). Obfuscation with `atob` offers zero security. | Use URL domain restriction in the Mapbox account dashboard and inject the token from server environment variables. |
| **SEC-08** | `portal.html:1296` | **Medium** | When the backend API is offline during client registration, `portal.html` catches the error and creates a fake client session with `offline_jwt_token_...` stored in localStorage. This misleads users into thinking they have an account when no data was saved to the server. | Inform the user that the server is unreachable; do not forge client authentication state. |
| **SEC-09** | `regal-farms-fix/README.md:34-40` | **Medium** | Documentation contains plaintext admin passwords (`shreeji123`, `admin123`) committed to Git. | Remove all credentials from documentation and rotate passwords immediately. |

---

## 6. Performance

| ID | File Path & Line | Severity | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- |
| **PERF-01** | `images/*.png` | **Medium** | Over 11 PNG images in `images/` are uncompressed photographic files between 2.5 MB and 3.0 MB each (e.g. `Sunset Express Beside Bhuj Sign.png` is 2.98 MB, `Kutch Future-Ready Urban Vision.png` is 2.97 MB, `Panoramic Container Port at Sunset.png` is 2.85 MB). Total image payload exceeds 27 MB. No images use modern WebP/AVIF formats, `srcset`, or `loading="lazy"`. | Convert all PNG/JPG images to WebP/AVIF (typically 80-90% size reduction, under 250 KB per image), and add `loading="lazy"` attributes. |
| **PERF-02** | `videos/*.mp4`<br>`audio/*.mp3` | **Medium** | Video assets total nearly 28 MB (`shreeji-logistics-warehouse.mp4` 10.28 MB, `shreeji-corporate-highrise.mp4` 9.89 MB, `shreeji-retail-showroom.mp4` 7.71 MB). Videos lack compressed poster frames (`poster="..."`), triggering high initial bandwidth consumption. | Compress MP4 files using H.264/AV1 with lower bitrates, provide lightweight poster thumbnails, and load videos conditionally on interaction. |
| **PERF-03** | `script.protected.js:1` | **Medium** | Obfuscated script (`script.protected.js`) is 285 KB compared to the 111 KB readable `script.js`. Control-flow flattening and dead-code injection add 2.5x download size and significant CPU parse/evaluation delays on mobile devices. | Remove obfuscation for standard frontend brochureware, or use standard terser/minification which shrinks script size rather than inflating it. |
| **PERF-04** | `Shreeji web/` | **Medium** | The repository contains an entire duplicate copy of the web application in `Shreeji web/` (~15 MB), creating disk bloat and risk of accidental editing of the wrong directory. | Archive or delete `Shreeji web/` to maintain a single source of truth at the project root. |
| **PERF-05** | `server/package.json:41-63` | **Low** | Server lists `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `pg`, `pg-mem`, `autocannon`, and `javascript-obfuscator`. If running purely on local JSON store, these packages are unused overhead. | Keep dependencies clean; ensure unused packages are moved to devDependencies or removed. |

---

## 7. SEO & Discoverability

| ID | File Path & Line | Severity | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- |
| **SEO-01** | `index.html`<br>`adipur/index.html`<br>`gandhidham/index.html`<br>`services/index.html`<br>`process/index.html`<br>`overview/index.html`<br>`faq/index.html`<br>`target-areas/index.html` | **Medium** | Not a single HTML page contains a canonical link tag (`<link rel="canonical" href="...">`). This leads to duplicate content penalties between GitHub Pages subpaths, custom domains, and trailing slash variations. | Add canonical URL tags to all pages (e.g. `<link rel="canonical" href="https://shreejilandinkutch.com/services/">`). |
| **SEO-02** | Entire Project | **Medium** | Completely missing Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) and Twitter Card (`twitter:card`, `twitter:image`) metadata. Links shared on WhatsApp, Facebook, LinkedIn, or Twitter render as plain raw URLs without preview cards or property thumbnails. | Add complete Open Graph and Twitter Card metadata to the `<head>` of all customer-facing HTML pages. |
| **SEO-03** | Project Root | **Medium** | Missing `sitemap.xml` and `robots.txt`. Search engine crawlers (Googlebot, Bingbot) cannot discover subpages efficiently or verify indexing permissions. | Add a standard `robots.txt` referencing an XML sitemap listing all commercial corridors, subpages, and 3D maps. |
| **SEO-04** | `survey-374/index.html` | **Low** | Missing `<h1>` heading element on the Survey 374 3D twin page, degrading search engine heading hierarchy and accessibility scores. | Add an accessible `<h1>` heading (e.g. `<h1 class="sr-only">Survey 374 Nagavaladiya 3D Spatial Digital Twin</h1>`). |
| **SEO-05** | `admin/index.html`<br>`404.html` | **Low** | Missing `<meta name="description">` tags on `admin/index.html` and `404.html`. `admin/index.html` also lacks `noindex, nofollow` to prevent indexing of internal management tools. | Add `<meta name="robots" content="noindex, nofollow">` to `admin/index.html`. |
| **SEO-06** | Entire Project | **Low** | No JSON-LD Schema.org structured data (`RealEstateAgent`, `LocalBusiness`, or `Place`). Google Search cannot generate rich snippets (contact phone, address, operating hours, micro-market service areas). | Embed JSON-LD structured data for `RealEstateAgent` on `index.html`. |

---

## 8. Missing Features & Incomplete Implementations

| ID | File Path & Line | Severity | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | `script.js:1320-1326` | **Medium** | Offline fallback queue: inquiries submitted while the backend is unreachable are saved to `localStorage.shreeji_inquiries` with `synced: false`. However, there is no sync daemon or retry mechanism upon page reload or online event (`window.addEventListener('online')`), so offline leads are lost forever on the client device. | Add an automatic background sync handler on `DOMContentLoaded` and `window.addEventListener('online')` that sends unsynced leads to `/property-inquiries`. |
| **FEAT-02** | `.github/workflows/deploy.yml:35-39` | **Medium** | The GitHub Action workflow is named `Production Deploy`, but only contains `echo` log commands. No actual automated deployment to GitHub Pages, AWS, Vercel, or a VPS is configured. | Add GitHub Pages deploy action (`actions/deploy-pages@v4`) or automated SSH/Docker VPS deployment steps. |
| **FEAT-03** | `3d-map/index.html`<br>`survey-374/index.html`<br>`portal.html` | **Low** | Multilingual support is incomplete: while `index.html` has 68 `data-i18n` elements with English, Gujarati, and Hindi dictionaries, `portal.html`, `3d-map/`, and `survey-374/` have zero i18n tags. Switching languages on the homepage has no effect on other views. | Extend i18n dictionaries to cover VIP Portal, Survey 374, and 3D Map controls. |
| **FEAT-04** | `admin/index.html:1349-1380`<br>`3d-map/viewer.js:900-915` | **Low** | Custom AutoCAD project uploads in the Admin Studio are saved only to the administrator's local browser `localStorage` (`shreeji_cad_projects`). They are never persisted to the backend database or storage, so public visitors and other devices cannot view newly uploaded CAD projects. | Connect CAD project creation in Admin Studio to `POST /api/v1/admin/cad-project` and fetch dynamic projects via `GET /api/v1/cad-projects` in `viewer.js`. |

---

## Prioritized Remediation Action Plan (High to Low)

### Phase 1: Critical Security & Integrity (Immediate Priority)
1. **[SEC-01 & SEC-02] Eliminate Admin Credential Leaks & Client Bypass**: Remove admin shortcut link from public footer; remove hardcoded `Shreejii` / `Shreeji@108` from `admin/index.html`; mandate server-side JWT authentication via `/api/v1/auth/login`.
2. **[SEC-03 & SEC-04] Secure API Endpoints with `requireAdmin`**: Protect `GET /api/v1/property-inquiries`, `PATCH /api/v1/property-inquiries/:id`, and `PATCH /api/v1/admin/plots/:id` with `requireAdmin` to prevent any registered client from dumping or modifying customer inquiries and plots.
3. **[SEC-05] Comply with UIDAI Regulations**: Encrypt Aadhaar numbers using AES-256-GCM via `cryptoSecurity.js` before database persistence, or store only masked digits (`XXXX-XXXX-1234`).
4. **[SEC-06] Remove Insecure Fallback Credentials**: Enforce strict environment variables on server startup for `JWT_SECRET` and `ADMIN_PASSWORD`.
5. **[BUG-01 & BUG-02] Repair Subpage Inquiry Forms**: Add missing element IDs and define `handleFormSubmit` so visitors on `overview`, `process`, `services`, and `faq` pages can submit commercial inquiries.
6. **[API-01] Fix Local Development CORS**: Whitelist `http://localhost:8080` in `server/src/app.js` to enable smooth out-of-the-box local development.
7. **[UX-01] Remove Browser-Freezing DevTools Loop**: Delete the `debugger;` setInterval trap in `js/shreeji-security-shield.js`.
8. **[UX-02] Disable Autoplay Audio**: Remove automatic unmuting of background music on user scroll/click.
9. **[BUG-03] Fix Docker Build Context**: Update `server/Dockerfile` or `app.js` so static web files resolve properly in containerized environments.

### Phase 2: Functional Bugs & UI Consistency (High Priority)
10. **[UX-06] Unify Navigation Architecture**: Synchronize header navbar links across `index.html` and subpages so all pages are discoverable.
11. **[UX-04] Fix Tablet Navigation Breakpoints**: Change mobile menu trigger to `1024px` to eliminate header overflow on iPad and tablet screens.
12. **[UX-05] Hide Consultation CTA on Mobile Header**: Hide `.btn-spatial-primary` on mobile screens to prevent hamburger menu clipping.
13. **[BUG-04] Resolve Parameter Swap in `openModalWithDetails`**: Fix inverted `(title, price, location)` parameters in `script.js` so location and notes are populated correctly.
14. **[BUG-05] Align Admin Session Keys**: Unify `admin_logged` and `shreeji_admin_logged` in `script.js` and `admin/index.html`.
15. **[BUG-06] Fix 3D Map Initial Selection**: Sync dropdown display with the actually loaded Nagavaladiya project on initial boot.
16. **[BUG-07 & BUG-10] Standardize `API_BASE` in 3D Twins**: Prepend `API_BASE` to all telemetry and plot fetch calls in `viewer.js` and `main.js`.
17. **[BUG-09] Clean up Non-Existent Endpoint Calls**: Remove or implement `/api/content` and `/api/config` calls in `survey-374/main.js`.
18. **[UX-03] Restore Mobile Pinch-to-Zoom**: Remove `user-scalable=no` in `survey-374/index.html`.
19. **[UX-07] Fix Spatial Portal Telemetry Badge**: Display correct project name and provide direct skip links for Survey 374.

### Phase 3: Performance, SEO & Cleanup (Medium Priority)
20. **[PERF-01] Compress 27 MB Image Library**: Convert all PNGs to modern WebP/AVIF formats with `loading="lazy"`.
21. **[PERF-02] Optimize Video & Audio Payload**: Add video poster images and configure metadata preloading.
22. **[PERF-04 & ARCH-01] Eliminate Duplicate & Dead Code**: Remove redundant `Shreeji web/` folder and bridal shop controllers/seed data.
23. **[PERF-03] Eliminate Obfuscator Bloat**: Replace 285 KB `script.protected.js` with standard lightweight minification.
24. **[SEO-01, SEO-02 & SEO-03] Implement SEO Foundations**: Add canonical tags, Open Graph meta tags, `robots.txt`, and `sitemap.xml`.
25. **[FEAT-01] Implement Offline Lead Sync**: Auto-sync cached localStorage inquiries once internet connectivity is detected.
26. **[FEAT-02] Implement Real Production Deploy Workflow**: Configure GitHub Pages or container deployment in `deploy.yml`.
27. **[BUG-11] Fix 404 Routing on Custom Domains**: Make redirect logic in `404.html` independent of hardcoded `/Shreeji` paths.
