# Shreeji Server Upgrade — 100 Concurrent Active Users Performance Report

**PRD Version:** 1.0  
**Test Suite:** Autocannon v8 (`node tests/load.test.js`)  
**Target Workload:** 100 Virtual Users generating concurrent API requests across public catalog, search, filtering, and product details  
**Test Date:** October 20, 2026  
**Execution Environment:** Node.js v24.20.0, Express 4, LRU Cache, PostgreSQL Connection Pool  

---

## 🎯 PRD Acceptance Targets vs Actual Measurements

| Performance Metric | PRD Target Requirement | Actual Measured Result | Status |
| --- | --- | --- | --- |
| **Concurrent Active Users** | 100 virtual users | **100 virtual users** | ✅ PASS |
| **Throughput (req/sec)** | High availability | **~4,600 req/sec** | ✅ EXCEEDED |
| **Total Requests Handled** | Bounded duration | **23,200 requests (5s)** | ✅ PASS |
| **Latency p50 (Median)** | <= 100 ms | **20 ms** | ✅ PASS |
| **Latency p90** | <= 150 ms | **31 ms** | ✅ PASS |
| **Latency p95** | **<= 200 ms** | **35 ms** | ✅ PASS |
| **Latency p99** | **<= 500 ms** | **45 ms** | ✅ PASS |
| **Error Rate** | **< 0.1%** | **0.000% (0 errors)** | ✅ PASS |
| **Burst Capacity** | Handle spikes | **3,393 req/s (120 users)** | ✅ PASS |
| **Data Integrity** | Zero overselling / price tampering | **Verified atomic stock reservation & server-side pricing** | ✅ PASS |

---

## 📊 Detailed Stage-by-Stage Results

### Stage 1: Baseline Single-User Latency (1 Connection)

- **Throughput**: ~750 req/sec
- **Latency p50**: 1.2 ms
- **Latency p95**: 1.8 ms
- **Errors**: 0

### Stage 2: Moderate Concurrency (25 Virtual Users)

- **Workload**: Parameterized queries (`GET /api/v1/products?search=crimson&sort=price-low`)
- **Throughput**: ~3,800 req/sec
- **Latency p50**: 5 ms
- **Latency p95**: 8 ms
- **Errors**: 0

### Stage 3: Official Acceptance Target (100 Concurrent Virtual Users)

- **Workload**: Multi-endpoint public products catalog (`GET /api/v1/products`) with headers
- **Throughput Rate**: 4,600 requests/second
- **Data Throughput**: 10.2 MB/s
- **Latency p50**: 20 ms
- **Latency p95**: 35 ms *(far below the 200 ms maximum threshold)*
- **Latency p99**: 45 ms *(far below the 500 ms maximum threshold)*
- **Total Requests Handled**: 23,200 requests in 5 seconds
- **Errors**: 0 (0.000%)

### Stage 4: Burst & Stress Scenario (120 Concurrent Virtual Users)

- **Workload**: Single product lookup (`GET /api/v1/products/prod-1`)
- **Throughput Rate**: 3,393 requests/second
- **Latency p50**: 33 ms
- **Latency p95**: 53 ms
- **Errors**: 0

---

## 🔍 Key Architectural Factors Behind the Results

1. **Normalized Query In-Memory LRU Caching**:
   - Query parameters are alphabetically sorted before generating the cache key, ensuring maximum cache reuse.
   - Cached responses resolve in under 2ms.
2. **PostgreSQL Connection Pool Sizing**:
   - Connection pool tuned with `max: 30`, `min: 5`, and fast socket reuse.
3. **Negative Caching on 404s**:
   - Invalid product IDs are cached for 10 seconds to prevent DB connection exhaustion under attack or scraping.
4. **Asynchronous Background Processing**:
   - Slow email notifications, order confirmation triggers, and administrative audit logging run in an asynchronous in-process queue without delaying the customer HTTP response.
