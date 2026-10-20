import http from 'http';
import app from '../src/app.js';
import { initDatabase } from '../src/config/database.js';

const PORT = 5599; // Test port

const runTests = async () => {
  console.log('🧪 Starting Shreeji Automated Server & Performance Tests...\n');
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

    // 2. Health Check
    const r2 = await request('/api/health');
    assert(r2.statusCode === 200 && r2.body.status === 'healthy', 'GET /api/health returns healthy', r2.durationMs);

    // 3. Products initial fetch (Cache MISS)
    const r3 = await request('/api/products');
    assert(
      r3.statusCode === 200 && r3.body.data.length >= 4 && r3.headers['x-cache'] === 'MISS',
      'GET /api/products returns products (Cache MISS)',
      r3.durationMs
    );

    // 4. Products second fetch (Cache HIT - Ultra fast!)
    const r4 = await request('/api/products');
    assert(
      r4.statusCode === 200 && r4.headers['x-cache'] === 'HIT' && r4.durationMs < 15,
      `GET /api/products (Cache HIT) responds in < 15ms (${r4.durationMs.toFixed(2)}ms)`,
      r4.durationMs
    );

    // 5. Category Filtering
    const r5 = await request('/api/products?category=bridal-lehengas');
    assert(
      r5.statusCode === 200 && r5.body.data.every((p) => p.category === 'bridal-lehengas'),
      'GET /api/products?category=bridal-lehengas filters correctly',
      r5.durationMs
    );

    // 6. Search query
    const r6 = await request('/api/products?search=crimson');
    assert(
      r6.statusCode === 200 && r6.body.data.length >= 1,
      'GET /api/products?search=crimson returns search matches',
      r6.durationMs
    );

    // 7. Single Product by ID
    const r7 = await request('/api/products/prod-1');
    assert(
      r7.statusCode === 200 && r7.body.data.id === 'prod-1',
      'GET /api/products/prod-1 returns single product',
      r7.durationMs
    );

    // 8. Categories List
    const r8 = await request('/api/categories');
    assert(
      r8.statusCode === 200 && r8.body.data.length >= 4,
      'GET /api/categories returns category tree',
      r8.durationMs
    );

    // 9. Add Item to Cart
    const r9 = await request('/api/cart/items', {
      method: 'POST',
      body: { cartId: 'test-session-1', productId: 'prod-1', quantity: 2 },
    });
    assert(
      r9.statusCode === 201 && r9.body.data.quantity === 2,
      'POST /api/cart/items adds product to cart',
      r9.durationMs
    );

    // 10. Fetch Cart
    const r10 = await request('/api/cart?cartId=test-session-1');
    assert(
      r10.statusCode === 200 && r10.body.itemCount === 1,
      'GET /api/cart returns user cart items',
      r10.durationMs
    );

    // 11. Create Order
    const r11 = await request('/api/orders', {
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
        items: [{ id: 'prod-1', name: 'Noor-E-Chashm Crimson Bridal Lehenga', price: 165000, quantity: 1 }],
      },
    });
    assert(
      r11.statusCode === 201 && r11.body.data.id.startsWith('ORD-'),
      'POST /api/orders places order with auto calculation',
      r11.durationMs
    );

    // 12. Submit Inquiry
    const r12 = await request('/api/inquiries', {
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
      r12.statusCode === 201 && r12.body.success === true,
      'POST /api/inquiries submits bridal consultation inquiry',
      r12.durationMs
    );

    // 13. Uploads info check
    const r13 = await request('/api/uploads/info');
    assert(
      r13.statusCode === 200 && r13.body.provider !== undefined,
      'GET /api/uploads/info returns storage configuration',
      r13.durationMs
    );

    console.log('\n----------------------------------------------------');
    console.log(`📊 Benchmark Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`⚡ Average Cached Response Latency: ${r4.durationMs.toFixed(2)}ms`);
    console.log('----------------------------------------------------');

    server.close(() => {
      if (passedTests === totalTests) {
        console.log('🎉 All server & latency tests PASSED perfectly!\n');
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
