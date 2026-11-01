# Regal Farms & Shreeji Admin Authentication Fix Guide

This directory contains the drop-in patches to fix the critical authentication and rate-limiting issues on `https://regalfarms.vercel.app/`.

---

## 🚀 Quick Fix Instructions for the Dev Team

### Step 1: Replace `/pages/api/auth.js` (or `/app/api/auth/route.js`)
Replace the existing authentication endpoint with `regal-farms-fix/api/auth.js`.
* **Fixes**:
  * Accepts both `email` and `username` input fields.
  * Validates credentials for both `/regal` (`admin@regalfarms.com` / `admin123`) and `/shreeji` (`admin@shreeji.com` / `shreeji123`).
  * Replaces the 9-minute lockout with a 60-second window and automatically resets the failed counter on successful login.

### Step 2: Configure Environment Variables in Vercel
Go to **Vercel Dashboard** -> **Project Settings** -> **Environment Variables**, and add:
```ini
SHREEJI_ADMIN_EMAIL=admin@shreeji.com
SHREEJI_ADMIN_PASSWORD=shreeji123

REGAL_ADMIN_EMAIL=admin@regalfarms.com
REGAL_ADMIN_USER=owner
REGAL_ADMIN_PASSWORD=admin123
```

### Step 3: Apply Frontend Patches in `admin.js` & `regal.js`
* In `admin.js` (for `/shreeji`), apply the code from `regal-farms-fix/public/admin-patch.js`.
* In `regal.js` (for `/regal`), apply the code from `regal-farms-fix/public/regal-patch.js`.

---

## 🔑 Verified Credentials
* **Shreeji Admin (`/shreeji`)**:
  * Email / Username: `admin@shreeji.com`
  * Password: `shreeji123`
* **Regal Farms Owner (`/regal`)**:
  * Email / Username: `admin@regalfarms.com` (or `owner`)
  * Password: `admin123`

