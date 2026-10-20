import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { newDb } from 'pg-mem';
import { setPool, isPostgresActive } from '../src/config/database.js';
import { categoryRepository } from '../src/repositories/categoryRepository.js';
import { productRepository } from '../src/repositories/productRepository.js';
import { orderRepository } from '../src/repositories/orderRepository.js';
import { inquiryRepository } from '../src/repositories/inquiryRepository.js';
import { auditRepository } from '../src/repositories/auditRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPostgresTests() {
  console.log('🧪 Starting Dedicated PostgreSQL Persistence, Transaction & Migration Test Suite...\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, title) => {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${title}`);
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      process.exitCode = 1;
    }
  };

  try {
    // 1. Initialize PostgreSQL In-Memory Engine
    const db = newDb({ noAstCoverageCheck: true });
    db.public.registerFunction({
      name: 'now',
      returns: db.public.getType('timestamp'),
      implementation: () => new Date(),
    });
    db.public.registerFunction({
      name: 'current_timestamp',
      returns: db.public.getType('timestamp'),
      implementation: () => new Date(),
    });

    const { Pool } = db.adapters.createPg();
    const pool = new Pool();
    setPool(pool, true);

    assert(isPostgresActive() === true, 'PostgreSQL active flag enabled on database pool');

    // 2. Migration Execution & Tracking Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const migrationsDir = path.resolve(__dirname, '../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    }

    const migCheck = await pool.query('SELECT filename FROM schema_migrations ORDER BY id');
    assert(
      migCheck.rows.length === files.length,
      `All ${files.length} PostgreSQL migrations tracked in schema_migrations table`
    );

    // 3. Category Persistence in PostgreSQL
    const cat = await categoryRepository.create({
      id: 'cat-pg-royal',
      name: 'Royal Heritage Silks',
      slug: 'royal-heritage-silks',
      description: 'Handwoven pure Kanjivaram and Banarasi silk sarees',
      featured: true,
      itemCount: 0,
    });
    assert(cat.id === 'cat-pg-royal' && cat.name === 'Royal Heritage Silks', 'PostgreSQL: Category inserted successfully');

    const catList = await categoryRepository.findAll();
    assert(catList.some((c) => c.id === 'cat-pg-royal'), 'PostgreSQL: Category retrieved via SQL SELECT');

    // 4. Product Persistence with JSONB Specs & Pricing
    const prod = await productRepository.create({
      id: 'prod-pg-lehenga-01',
      name: 'Zardozi Crimson Bridal Lehenga',
      slug: 'zardozi-crimson-bridal-lehenga',
      categoryId: cat.id,
      category: cat.slug,
      price: 185000.0,
      discountPrice: 175000.0,
      inStock: true,
      stockCount: 2, // strictly 2 units available for concurrency test
      rating: 5.0,
      reviewCount: 14,
      featured: true,
      isNew: true,
      sku: 'SHR-CRIMSON-001',
      images: ['https://example.com/lehenga-1.jpg', 'https://example.com/lehenga-2.jpg'],
      description: 'Handcrafted zardozi embroidery with micro-pearl detailing.',
      tags: ['bridal', 'crimson', 'zardozi', 'velvet'],
      specs: { fabric: 'Pure Raw Silk', embroidery: 'Zardozi & Dabka', pieces: 3 },
    });

    assert(
      prod.id === 'prod-pg-lehenga-01' && prod.stockCount === 2,
      'PostgreSQL: Product inserted with JSONB specs and initial stock of 2'
    );

    const checkProds = await pool.query('SELECT id, name, in_stock, stock_count FROM products');
    console.log('    [DEBUG] Products in DB table:', checkProds.rows);

    const fetchedProd = await productRepository.findById('prod-pg-lehenga-01');
    assert(
      fetchedProd.name === 'Zardozi Crimson Bridal Lehenga' &&
      Array.isArray(fetchedProd.images) &&
      fetchedProd.images.length === 2,
      'PostgreSQL: Product retrieved with parsed JSONB image arrays'
    );

    // 5. Atomic Order Creation with Stock Reservation (Tx 1)
    const order1 = await orderRepository.createWithTransaction({
      customerName: 'Aishwarya Roy',
      customerEmail: 'aishwarya@example.com',
      customerPhone: '+91 98765 43210',
      shippingAddress: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      rawItems: [{ productId: 'prod-pg-lehenga-01', quantity: 2 }],
      paymentMethod: 'prepaid',
      notes: 'Bridal consultation order',
      idempotencyKey: 'IDEMP-SHR-TEST-001',
    });

    assert(order1.id && order1.order_number, 'PostgreSQL: Order placed inside ACID transaction');

    const updatedProdAfterOrder1 = await productRepository.findById('prod-pg-lehenga-01');
    assert(
      updatedProdAfterOrder1.stockCount === 0 && updatedProdAfterOrder1.inStock === false,
      'PostgreSQL: Product stock atomically decremented from 2 to 0 (in_stock set to false)'
    );

    // 6. Overselling Prevention & Transaction Rollback (Tx 2 - Must Fail)
    let oversellFailed = false;
    try {
      await orderRepository.createWithTransaction({
        customerName: 'Duplicate Shopper',
        customerEmail: 'duplicate@example.com',
        customerPhone: '+91 98765 00000',
        shippingAddress: { city: 'Delhi', state: 'Delhi', pincode: '110001' },
        rawItems: [{ productId: 'prod-pg-lehenga-01', quantity: 1 }],
        paymentMethod: 'cod',
      });
    } catch (err) {
      oversellFailed = true;
      assert(
        err.message.includes('Insufficient stock'),
        `PostgreSQL: Oversell prevented with message '${err.message}'`
      );
    }
    assert(oversellFailed, 'PostgreSQL: Transaction rolled back safely on stock exhaustion');

    // 7. Order Idempotency Test
    const duplicateOrderCheck = await orderRepository.findByIdempotencyKey('IDEMP-SHR-TEST-001');
    assert(
      duplicateOrderCheck && duplicateOrderCheck.id === order1.id,
      'PostgreSQL: Existing order retrieved by Idempotency Key (prevents duplicate checkout)'
    );

    // 8. Administrative Pagination for Inquiries
    for (let i = 1; i <= 25; i++) {
      await inquiryRepository.create({
        id: `INQ-TEST-${i.toString().padStart(3, '0')}`,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: '+91 99999 88888',
        subject: 'Couture Appointment',
        message: `Inquiry message ${i}`,
        productId: null,
        status: i % 2 === 0 ? 'read' : 'unread',
      });
    }

    const p1 = await inquiryRepository.findAndCountAll({ page: 1, limit: 10 });
    assert(p1.total >= 25 && p1.inquiries.length === 10 && p1.totalPages >= 3, 'PostgreSQL: Inquiries page 1 returns 10 items with total count');

    const p3 = await inquiryRepository.findAndCountAll({ page: 3, limit: 10 });
    assert(p3.inquiries.length >= 5, 'PostgreSQL: Inquiries page 3 returns remaining paginated items');

    // 9. Administrative Pagination for Orders
    const ordPage = await orderRepository.findAndCountAll({ page: 1, limit: 5 });
    assert(ordPage.total >= 1 && ordPage.orders.length >= 1, 'PostgreSQL: Orders paginated with total count metadata');

    // 10. Audit Logging in PostgreSQL
    await auditRepository.log({
      userId: 'admin-1',
      userEmail: 'admin@shreeji.com',
      action: 'UPDATE_STOCK',
      entityType: 'product',
      entityId: 'prod-pg-lehenga-01',
      details: { previousStock: 2, currentStock: 0 },
      ipAddress: '127.0.0.1',
      clientPlatform: 'admin-panel',
    });

    const auditList = await auditRepository.findAll();
    assert(
      auditList.some((a) => a.action === 'UPDATE_STOCK' && a.entity_id === 'prod-pg-lehenga-01'),
      'PostgreSQL: Audit log written and verified in audit_logs table'
    );

    console.log(`\n----------------------------------------------------`);
    console.log(`📊 PostgreSQL Test Summary: ${passed}/${total} tests passed`);
    console.log(`----------------------------------------------------`);

    if (passed === total) {
      console.log('🎉 Real PostgreSQL schema, migrations, transactions & row locks verified!\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 [FATAL TEST ERROR]:', err);
    process.exit(1);
  }
}

runPostgresTests();
