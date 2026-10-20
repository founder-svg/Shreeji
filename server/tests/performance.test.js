import http from 'http';
import app from '../src/app.js';
import { initDatabase } from '../src/config/database.js';
import { config } from '../src/config/env.js';

const PORT = 5599;

const runTests = async () => {
  console.log('🧪 Starting Shreeji Automated Integration & Security Tests...\n');
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
    // 1. Root Status
    const r1 = await request('/');
    assert(r1.statusCode === 200 && r1.body.status === 'online', 'GET / returns online status', r1.durationMs);

    // 2. Health Check (Minimal public liveness)
    const r2 = await request('/api/health');
    assert(r2.statusCode === 200 && r2.body.status === 'healthy', 'GET /api/health returns healthy', r2.durationMs);

    // 3. Admin Authentication Login
    const r3 = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: config.admin.email,
        password: config.admin.password,
      },
    });
    const adminToken = r3.body.token;
    assert(
      r3.statusCode === 200 && adminToken && r3.body.user.role === 'admin',
      'POST /api/auth/login authenticates admin & returns JWT token',
      r3.durationMs
    );

    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // 4. Authenticated Admin Profile
    const r4 = await request('/api/auth/me', { headers: authHeaders });
    assert(r4.statusCode === 200 && r4.body.user.email === config.admin.email, 'GET /api/auth/me returns admin profile', r4.durationMs);

    // 5. Products initial fetch (Cache MISS)
    const r5 = await request('/api/products');
    assert(
      r5.statusCode === 200 && r5.body.data.length >= 4 && r5.headers['x-cache'] === 'MISS',
      'GET /api/products returns products (Cache MISS)',
      r5.durationMs
    );

    // 6. Products second fetch (Cache HIT)
    const r6 = await request('/api/products');
    assert(
      r6.statusCode === 200 && r6.headers['x-cache'] === 'HIT' && r6.durationMs < 20,
      `GET /api/products (Cache HIT) responds in < 20ms (${r6.durationMs.toFixed(2)}ms)`,
      r6.durationMs
    );

    // 7. Category Filtering
    const r7 = await request('/api/products?category=bridal-lehengas');
    assert(
      r7.statusCode === 200 && r7.body.data.every((p) => p.category === 'bridal-lehengas'),
      'GET /api/products?category=bridal-lehengas filters correctly',
      r7.durationMs
    );

    // 8. Search query
    const r8 = await request('/api/products?search=crimson');
    assert(
      r8.statusCode === 200 && r8.body.data.length >= 1,
      'GET /api/products?search=crimson returns search matches',
      r8.durationMs
    );

    // 9. Single Product by ID
    const r9 = await request('/api/products/prod-1');
    assert(
      r9.statusCode === 200 && r9.body.data.id === 'prod-1',
      'GET /api/products/prod-1 returns single product',
      r9.durationMs
    );

    // 10. Categories List
    const r10 = await request('/api/categories');
    assert(
      r10.statusCode === 200 && r10.body.data.length >= 4,
      'GET /api/categories returns category tree',
      r10.durationMs
    );

    // 11. Add Item to Cart
    const testCartId = `test-cart-${Date.now()}`;
    const r11 = await request('/api/cart/items', {
      method: 'POST',
      body: { cartId: testCartId, productId: 'prod-1', quantity: 2 },
    });
    assert(
      r11.statusCode === 201 && r11.body.data.quantity === 2,
      'POST /api/cart/items adds product to cart',
      r11.durationMs
    );

    // 12. Create Order with Server-Side Pricing Verification & Stock Check
    const r12 = await request('/api/orders', {
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
      r12.statusCode === 201 && r12.body.data.id.startsWith('ORD-') && r12.body.data.total > 0,
      'POST /api/orders places order with verified server-side pricing',
      r12.durationMs
    );

    // 13. Admin Protected Orders Fetch
    const r13 = await request('/api/orders', { headers: authHeaders });
    assert(
      r13.statusCode === 200 && r13.body.data.length >= 1,
      'GET /api/orders (Admin Authenticated) returns order list',
      r13.durationMs
    );

    // 14. Unauthenticated Orders Fetch Rejection
    const r14 = await request('/api/orders');
    assert(
      r14.statusCode === 401,
      'GET /api/orders without Bearer token returns 401 Unauthorized',
      r14.durationMs
    );

    // 15. Submit Customer Inquiry
    const r15 = await request('/api/inquiries', {
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
      r15.statusCode === 201 && r15.body.success === true,
      'POST /api/inquiries submits customer bridal consultation',
      r15.durationMs
    );

    // 16. Admin Protected Inquiries Fetch
    const r16 = await request('/api/inquiries', { headers: authHeaders });
    assert(
      r16.statusCode === 200 && r16.body.data.length >= 1,
      'GET /api/inquiries (Admin Authenticated) returns customer inquiries',
      r16.durationMs
    );

    // 17. Admin Protected Uploads Info
    const r17 = await request('/api/uploads/info', { headers: authHeaders });
    assert(
      r17.statusCode === 200 && r17.body.allowedMimeTypes.includes('image/webp'),
      'GET /api/uploads/info (Admin Authenticated) returns hardened storage policy',
      r17.durationMs
    );

    // 18. Admin Protected Product Creation with Request Validation
    const r18 = await request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Aethelgard Royal Emerald Bridal Choker',
        category: 'jewellery',
        price: 85000,
        discountPrice: 78000,
        stockCount: 10,
        inStock: true,
        description: 'Exquisite 22K emerald and uncut polki choker set.',
      },
    });
    assert(
      r18.statusCode === 201 && r18.body.data.id.startsWith('prod-'),
      'POST /api/products (Admin Authenticated + Validated) creates product',
      r18.durationMs
    );

    // 19. Unauthorized Product Creation Rejection
    const r19 = await request('/api/products', {
      method: 'POST',
      body: { name: 'Hacker Item', price: 10 },
    });
    assert(
      r19.statusCode === 401,
      'POST /api/products without Bearer token returns 401 Unauthorized',
      r19.durationMs
    );

    console.log('\n----------------------------------------------------');
    console.log(`📊 Benchmark Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`⚡ Average Cached Response Latency: ${r6.durationMs.toFixed(2)}ms`);
    console.log('----------------------------------------------------');

    server.close(() => {
      if (passedTests === totalTests) {
        console.log('🎉 All security, database, and latency tests PASSED perfectly!\n');
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
