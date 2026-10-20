# Shreeji Production Deployment Guide

This guide covers deploying the Shreeji server 24/7 with zero-downtime reloads, persistent database connections (Supabase / PostgreSQL), and Cloud Storage (Cloudflare R2 / AWS S3).

---

## 🏛️ Recommended Production Architecture

```text
[ Clients (Web, iOS, Android) ]
              │
              ▼
   [ Cloudflare CDN & WAF ]
   (SSL, DDoS Protection, Edge Caching)
              │
              ▼
    [ Node.js API Server ]
    (Docker / PM2 Cluster on VPS or Managed Host)
         ├── [ LRU In-Memory Cache ] (Sub-millisecond responses)
         ├── [ PostgreSQL / Supabase ] (ACID Transactions & Persistence)
         └── [ Cloudflare R2 / AWS S3 ] (Object Storage for Images)
```

---

## 🛠️ Deployment Options

### Option 1: Cloud VPS (DigitalOcean, Hetzner, AWS EC2, Linode)

1. **Clone repository on the server**:

   ```bash
   git clone https://github.com/founder-svg/Shreeji.git
   cd Shreeji/server
   ```

2. **Configure Production Environment (`.env`)**:

   ```env
   NODE_ENV=production
   PORT=5000
   CORS_ORIGIN=https://shreeji.com,https://admin.shreeji.com
   JWT_SECRET=use_a_cryptographically_secure_random_string_here
   ADMIN_EMAIL=admin@shreeji.com
   ADMIN_PASSWORD=SuperStrongAdminPasswordHere!
   DATABASE_URL=postgresql://postgres.xxx:yyy@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   STORAGE_PROVIDER=r2
   S3_REGION=auto
   S3_BUCKET=shreeji-media
   S3_ACCESS_KEY_ID=<your-r2-key>
   S3_SECRET_ACCESS_KEY=<your-r2-secret>
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_PUBLIC_URL=https://pub-xxxxxx.r2.dev
   ```

3. **Install Dependencies & Start PM2**:

   ```bash
   npm ci --omit=dev
   npm run prod:start
   ```

4. **Persist Across Server Reboots**:

   ```bash
   npx pm2 save
   npx pm2 startup
   ```

---

### Option 2: Docker Container (Auto-Healing 24/7)

```bash
# Build and run detached container
docker compose up -d --build

# View container status & live logs
docker compose ps
docker compose logs -f
```

---

### Option 3: Managed Cloud Hosting (Render / Railway / Fly.io)

1. Connect your repository `founder-svg/Shreeji` on Render or Railway.
2. Set Root Directory: `server`.
3. Set Build Command: `npm ci --omit=dev`.
4. Set Start Command: `npm start`.
5. Add Environment Variables in the hosting dashboard (matches `server/.env.example`).

---

## ⚡ Cloudflare Setup (Edge Delivery & Security)

1. Add your domain to Cloudflare.
2. In **SSL/TLS**, set encryption mode to **Full (Strict)**.
3. In **Caching** -> **Cache Rules**, set caching for `/api/products*` and `/api/categories*` (e.g. Edge Cache TTL: 2 minutes) with `Bypass Cache on Cookie` for admin sessions.
4. Route API requests: point `api.shreeji.com` to your VPS origin IP with Cloudflare proxy enabled (Orange Cloud).

---

## 🌐 DNS & Domain Routing (Temporary vs Permanent Domain)

### 1. Temporary Testing Setup

- **Frontend URL**: `https://founder-svg.github.io/Shreeji/`
- **GitHub Pages Anycast Edge DNS Records**:
  - **IPv4 (A Records)**:
    - `185.199.108.153`
    - `185.199.109.153`
    - `185.199.110.153`
    - `185.199.111.153`
  - **IPv6 (AAAA Records)**:
    - `2606:50c0:8000::153`
    - `2606:50c0:8001::153`
    - `2606:50c0:8002::153`
    - `2606:50c0:8003::153`
- **Backend API Routing**:
  - The backend server accepts requests originating from `https://founder-svg.github.io` via the CORS policy in `server/src/app.js`.
  - When testing locally, use a tunnel (`cloudflared` or `ngrok`) to point your frontend to your local server port `5000`.

### 2. Transition to Permanent Domain

When you acquire the permanent domain (e.g. `shreeji.com`):

1. **Root / Web Frontend (`shreeji.com`)**:
   - Set A records pointing to your web hosting provider (or keep pointing to GitHub Pages if using custom domain in GitHub repository settings).
2. **Backend API (`api.shreeji.com`)**:
   - Set an A record pointing to your backend VPS IP address (or CNAME if hosted on Render/Railway).
3. **Update Environment (`server/.env`)**:
   - `CLIENT_URL=https://shreeji.com`
   - `CORS_ORIGIN=https://shreeji.com,https://www.shreeji.com`
   - Execute zero-downtime reload: `npm run prod:restart`.
