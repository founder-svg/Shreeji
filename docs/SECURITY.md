# Shreeji Security Policy & Controls

This document details the security controls, validation rules, authentication policies, and operational safeguards implemented in the Shreeji platform.

---

## 🛡️ Security Architecture

### 1. Authentication & Role-Based Access Control (RBAC)

- **Algorithm**: HMAC-SHA256 (JWT) with configurable expiry (`config.jwtExpiresIn`).
- **Password Storage**: Passwords are saved strictly as salted hashes generated with `bcryptjs` (work factor 10).
- **Public vs. Protected Operations**:
  - **Public**: Product discovery, catalog browsing, cart operations, checkout submission, customer inquiries.
  - **Protected (Admin)**: Product creation/editing/deletion, order status modification, order history access, inquiry viewing, file upload and deletion.

### 2. Request Validation

All mutating endpoints are shielded by schema validation middleware:

- String length constraints (min/max characters).
- Numeric constraints (positive prices, integer stock counts).
- Email format verification using RFC-compliant regular expressions.
- Enumerated status transitions for orders (`pending` -> `confirmed` -> `processing` -> `shipped` -> `delivered` / `cancelled`).

### 3. Order Integrity & Anti-Tampering

- **Zero Client Price Trust**: Client-submitted prices are ignored. The server looks up product records from the database and calculates subtotals, GST, shipping, and order totals.
- **Atomic Stock Reservation**: Orders decrement stock inside an atomic database transaction with row-level locks (`SELECT ... FOR UPDATE` in PostgreSQL), eliminating double-spending and overselling under concurrent checkouts.

### 4. File Upload Protection

- **No SVG Files**: SVG files are completely disallowed to eliminate XML-based Cross-Site Scripting (XSS) vectors.
- **Allowed Types**: Strictly binary raster formats: JPEG, PNG, WebP (and PDF documents).
- **Magic Byte Verification**: File buffers are inspected for true binary signatures before storage; renamed malicious binaries are rejected.
- **Directory Traversal Defense**: Upload folders are validated against a strict allowlist (`products`, `categories`, `banners`, `documents`, `inquiries`). Storage keys on deletion are sanitized against path traversal (`..` sequences and absolute paths are stripped).
- **Admin Authorization**: Upload and deletion endpoints require administrative Bearer tokens.

### 5. CORS & Network Security

- **Explicit Allowlist**: Wildcard `origin: '*'` is never paired with `credentials: true`. The server matches against `config.corsOrigin` domains.
- **Rate Limiting**:
  - `apiLimiter`: 120 requests / min.
  - `authLimiter`: 10 attempts / 15 mins.
  - `submissionLimiter`: 15 requests / 10 mins.
  - `uploadLimiter`: 25 uploads / 15 mins.
- **Security Headers**: Standardized security headers via Helmet (Cross-Origin Resource Policy, X-Content-Type-Options, DNS Prefetch Control, Frameguard).

### 6. Minimal Public Health Check

The public health endpoint (`GET /api/health`) exposes only high-level status (`healthy`/`unhealthy`) and database ping connectivity. Detailed operational metrics, memory consumption, heap usage, and cache statistics are strictly confined to the admin-authenticated `/api/metrics` endpoint.
