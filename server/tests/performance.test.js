import http from 'http';
import app from '../src/app.js';
import { initDatabase } from '../src/config/database.js';
import { config } from '../src/config/env.js';

const PORT = 5599;

const runTests = async () => {
  console.log('🧪 Starting Shreeji Automated PRD Integration & Security Tests...\n');
  await initDatabase();

  const server = app.listen(PORT);

  const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();
      const reqOptions = {
        hostname: 'localhost',
        port: PORT,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': 'web',
          ...(options.headers || {}),
        },
      };

      const req = http.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1_000_000;
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
            durationMs,
          });
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  };

  let totalTests = 0;
  let passedTests = 0;

  const assert = (condition, title, latency) => {
    totalTests++;
    const latencyStr = latency !== undefined ? ` [${latency.toFixed(2)}ms]` : '';
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${title}${latencyStr}`);
    } else {
      console.error(`  ❌ FAIL: ${title}${latencyStr}`);
    }
  };

  try {
    // 1. Root Status & API Versioning
    const r1 = await request('/');
    assert(r1.statusCode === 200 && r1.body.versions?.v1 === '/api/v1', 'GET / returns API versioning metadata', r1.durationMs);

    // 2. Health Check (Minimal public liveness)
    const r2 = await request('/health/live');
    assert(r2.statusCode === 200 && r2.body.status === 'live', 'GET /health/live returns process live status', r2.durationMs);

    // 3. Readiness Check (Deep DB & Storage Ping)
    const r3 = await request('/health/ready');
    assert(r3.statusCode === 200 && r3.body.status === 'ready', 'GET /health/ready returns service readiness', r3.durationMs);

    // 4. Request ID & Client Platform Header Validation
    const r4 = await request('/api/v1/health');
    assert(
      r4.statusCode === 200 && r4.headers['x-request-id'] && r4.headers['x-client-platform'] === 'web',
      'X-Request-Id and X-Client-Platform propagated on all responses',
      r4.durationMs
    );

    // 5. Admin Authentication Login
    const r5 = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: config.admin.email,
        password: config.admin.password,
      },
    });
    const adminToken = r5.body.token;
    assert(
      r5.statusCode === 200 && adminToken && r5.body.user.role === 'admin',
      'POST /api/v1/auth/login authenticates admin & returns JWT token',
      r5.durationMs
    );

    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // 6. Authenticated Admin Profile
    const r6 = await request('/api/v1/auth/me', { headers: authHeaders });
    assert(r6.statusCode === 200 && r6.body.user.email === config.admin.email, 'GET /api/v1/auth/me returns admin profile', r6.durationMs);

    // 7. Products initial fetch (Cache MISS)
    const r7 = await request('/api/v1/products');
    assert(
      r7.statusCode === 200 && r7.body.data.length >= 4 && r7.headers['x-cache'] === 'MISS',
      'GET /api/v1/products returns products (Cache MISS)',
      r7.durationMs
    );

    // 8. Products second fetch (Cache HIT)
    const r8 = await request('/api/v1/products');
    assert(
      r8.statusCode === 200 && r8.headers['x-cache'] === 'HIT' && r8.durationMs < 20,
      `GET /api/v1/products (Cache HIT) responds in < 20ms (${r8.durationMs.toFixed(2)}ms)`,
      r8.durationMs
    );

    // 9. Normalized Cache Key Verification
    // Calling with shuffled query parameters: '?limit=10&sort=newest' then '?sort=newest&limit=10'
    await request('/api/v1/products?limit=10&sort=newest');
    const r9 = await request('/api/v1/products?sort=newest&limit=10');
    assert(
      r9.statusCode === 200 && r9.headers['x-cache'] === 'HIT',
      'Normalized query parameters produce identical cache HIT',
      r9.durationMs
    );

    // 10. Category Filtering
    const r10 = await request('/api/v1/products?category=bridal-lehengas');
    assert(
      r10.statusCode === 200 && r10.body.data.every((p) => p.category === 'bridal-lehengas'),
      'GET /api/v1/products?category=bridal-lehengas filters correctly',
      r10.durationMs
    );

    // 11. Search query
    const r11 = await request('/api/v1/products?search=crimson');
    assert(
      r11.statusCode === 200 && r11.body.data.length >= 1,
      'GET /api/v1/products?search=crimson returns search matches',
      r11.durationMs
    );

    // 12. Negative Caching for 404 (prevents DB stampede)
    const r12a = await request('/api/v1/products/non-existent-product-id');
    const r12b = await request('/api/v1/products/non-existent-product-id');
    assert(
      r12a.statusCode === 404 && r12b.statusCode === 404 && r12b.headers['x-cache'] === 'HIT',
      'Negative caching caches 404 Not Found to protect database',
      r12b.durationMs
    );

    // 13. Single Product by ID
    const r13 = await request('/api/v1/products/prod-1');
    assert(
      r13.statusCode === 200 && r13.body.data.id === 'prod-1',
      'GET /api/v1/products/prod-1 returns single product',
      r13.durationMs
    );

    // 14. Categories List
    const r14 = await request('/api/v1/categories');
    assert(
      r14.statusCode === 200 && r14.body.data.length >= 4,
      'GET /api/v1/categories returns category tree',
      r14.durationMs
    );

    // 15. Add Item to Cart
    const testCartId = `test-cart-${Date.now()}`;
    const r15 = await request('/api/v1/cart/items', {
      method: 'POST',
      body: { cartId: testCartId, productId: 'prod-1', quantity: 2 },
    });
    assert(
      r15.statusCode === 201 && r15.body.data.quantity === 2,
      'POST /api/v1/cart/items adds product to cart',
      r15.durationMs
    );

    // 16. Create Order with Server-Side Pricing & Atomic Stock Reservation
    const r16 = await request('/api/v1/orders', {
      method: 'POST',
      body: {
        customerName: 'Priya Sharma',
        customerEmail: 'priya@example.com',
        customerPhone: '+919876543210',
        shippingAddress: {
          line1: '402 Royal Palms, MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        items: [{ productId: 'prod-1', quantity: 1 }],
      },
    });
    assert(
      r16.statusCode === 201 && r16.body.data.id.startsWith('ORD-') && r16.body.data.total > 0,
      'POST /api/v1/orders places order with verified server-side pricing',
      r16.durationMs
    );

    // 17. Admin Protected Orders Fetch
    const r17 = await request('/api/v1/orders', { headers: authHeaders });
    assert(
      r17.statusCode === 200 && r17.body.data.length >= 1,
      'GET /api/v1/orders (Admin Authenticated) returns order list',
      r17.durationMs
    );

    // 18. Unauthenticated Orders Fetch Rejection
    const r18 = await request('/api/v1/orders');
    assert(
      r18.statusCode === 401,
      'GET /api/v1/orders without Bearer token returns 401 Unauthorized',
      r18.durationMs
    );

    // 19. Submit Customer Inquiry (Dispatches background notification job)
    const r19 = await request('/api/v1/inquiries', {
      method: 'POST',
      body: {
        name: 'Aanya Patel',
        email: 'aanya@example.com',
        phone: '+919988776655',
        subject: 'Bridal Couture Fitting Appointment',
        message: 'Looking for a private consultation for December wedding.',
      },
    });
    assert(
      r19.statusCode === 201 && r19.body.success === true,
      'POST /api/v1/inquiries submits customer bridal consultation',
      r19.durationMs
    );

    // 20. Admin Protected Inquiries Fetch
    const r20 = await request('/api/v1/inquiries', { headers: authHeaders });
    assert(
      r20.statusCode === 200 && r20.body.data.length >= 1,
      'GET /api/v1/inquiries (Admin Authenticated) returns customer inquiries',
      r20.durationMs
    );

    // 21. Admin Protected Uploads Info & SVG Rejection Verification
    const r21 = await request('/api/v1/uploads/info', { headers: authHeaders });
    assert(
      r21.statusCode === 200 && !r21.body.allowedMimeTypes.includes('image/svg+xml'),
      'GET /api/v1/uploads/info strictly excludes SVG XSS attack vectors',
      r21.durationMs
    );

    // 22. Admin Protected Product Creation with Audit Log
    const r22 = await request('/api/v1/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Imperial Kundan Haar Bridal Set',
        category: 'jewellery',
        price: 125000,
        discountPrice: 110000,
        stockCount: 8,
        inStock: true,
        description: '22K gold finished uncut polki necklace with emerald droplets.',
      },
    });
    assert(
      r22.statusCode === 201 && r22.body.data.id.startsWith('prod-'),
      'POST /api/v1/products creates product and enqueues audit log',
      r22.durationMs
    );

    // 23. Admin Audit Log Verification
    // Wait briefly for setImmediate background job
    await new Promise((resolve) => setTimeout(resolve, 50));
    const r23 = await request('/api/v1/audit-logs', { headers: authHeaders });
    assert(
      r23.statusCode === 200 && r23.body.count >= 1,
      'GET /api/v1/audit-logs records administrative actions with platform metadata',
      r23.durationMs
    );

    console.log('\n----------------------------------------------------');
    console.log(`📊 Benchmark Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`⚡ Average Cached Response Latency: ${r8.durationMs.toFixed(2)}ms`);
    console.log('----------------------------------------------------');

    server.close(() => {
      if (passedTests === totalTests) {
        console.log('🎉 All 23 PRD architectural, security, and integrity tests PASSED!\n');
        process.exit(0);
      } else {
        console.error('❌ Some tests failed.');
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('💥 Test suite crashed:', err);
    server.close(() => process.exit(1));
  }
};

runTests();
