import { v4 as uuidv4 } from 'uuid';
import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

const mapOrderRow = (row) => ({
  id: row.id,
  orderNumber: row.order_number,
  order_number: row.order_number,
  idempotencyKey: row.idempotency_key,
  idempotency_key: row.idempotency_key,
  customerName: row.customer_name,
  customer_name: row.customer_name,
  customerEmail: row.customer_email,
  customer_email: row.customer_email,
  customerPhone: row.customer_phone,
  shippingAddress:
    typeof row.shipping_address === 'string'
      ? JSON.parse(row.shipping_address)
      : row.shipping_address || {},
  subtotal: parseFloat(row.subtotal),
  tax: parseFloat(row.tax),
  shippingFee: parseFloat(row.shipping_fee),
  total: parseFloat(row.total),
  status: row.status,
  paymentMethod: row.payment_method,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: [],
});

const attachOrderItems = async (orders, pool) => {
  if (!orders || orders.length === 0) return orders;
  const orderIds = orders.map((o) => o.id);
  const placeholders = orderIds.map((_, idx) => `$${idx + 1}`).join(', ');
  const itemsRes = await pool.query(
    `SELECT id, order_id, product_id, product_name, price, quantity, subtotal, sku FROM order_items WHERE order_id IN (${placeholders})`,
    orderIds
  );

  const itemsMap = new Map();
  itemsRes.rows.forEach((it) => {
    const list = itemsMap.get(it.order_id) || [];
    list.push({
      id: it.id,
      productId: it.product_id,
      productName: it.product_name,
      price: parseFloat(it.price),
      quantity: parseInt(it.quantity, 10),
      subtotal: parseFloat(it.subtotal),
      sku: it.sku,
    });
    itemsMap.set(it.order_id, list);
  });

  orders.forEach((o) => {
    o.items = itemsMap.get(o.id) || [];
  });

  return orders;
};

export const orderRepository = {
  findAndCountAll: async ({ page = 1, limit = 20, status } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    if (isPostgresActive()) {
      const pool = getPool();
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`status = $${paramIdx++}`);
        params.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countRes = await pool.query(`SELECT COUNT(*) FROM orders ${whereClause}`, params);
      const total = parseInt(countRes.rows[0].count, 10);

      // Data query
      const dataParams = [...params, limitNum, offset];
      const res = await pool.query(
        `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        dataParams
      );

      const mappedOrders = res.rows.map(mapOrderRow);
      await attachOrderItems(mappedOrders, pool);

      return {
        orders: mappedOrders,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      };
    }

    // Local store pagination
    let filtered = [...localStore.orders];
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    return {
      orders: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  },

  findAll: async () => {
    const res = await orderRepository.findAndCountAll({ limit: 1000 });
    return res.orders;
  },

  findByIdempotencyKey: async (key) => {
    if (!key) return null;
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `SELECT * FROM orders WHERE idempotency_key = $1 LIMIT 1`,
        [key]
      );
      if (res.rows.length === 0) return null;
      const order = mapOrderRow(res.rows[0]);
      await attachOrderItems([order], pool);
      return order;
    }
    return localStore.orders.find((o) => o.idempotencyKey === key) || null;
  },

  findById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      const order = mapOrderRow(res.rows[0]);
      await attachOrderItems([order], pool);
      return order;
    }
    return localStore.orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  /**
   * Atomic Order Creation with Trusted Database Pricing & Stock Reservation
   */
  createWithTransaction: async ({
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    rawItems,
    paymentMethod = 'cod',
    notes = '',
    idempotencyKey = null,
  }) => {
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    const orderNumber = `SHR-${uuidv4().slice(0, 8).toUpperCase()}`;

    if (isPostgresActive()) {
      const pool = getPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // 1. Fetch real products with row lock to prevent race conditions
        const productIds = rawItems.map((i) => i.productId || i.id);
        const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(', ');
        const prodRes = await client.query(
          `SELECT id, name, price, discount_price, in_stock, stock_count, sku FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
          productIds
        );

        const dbProductsMap = new Map();
        prodRes.rows.forEach((p) => dbProductsMap.set(p.id, p));

        // 2. Validate availability and calculate trusted price strictly on server
        let calculatedSubtotal = 0;
        const verifiedOrderItems = [];

        for (const item of rawItems) {
          const pId = item.productId || item.id;
          const dbProduct = dbProductsMap.get(pId);

          if (!dbProduct) {
            throw new Error(`Product with ID '${pId}' not found in active catalog`);
          }

          const qty = parseInt(item.quantity, 10);
          if (!qty || qty <= 0) {
            throw new Error(`Invalid quantity (${item.quantity}) for product '${dbProduct.name}'`);
          }

          if (dbProduct.stock_count < qty) {
            throw new Error(
              `Insufficient stock for '${dbProduct.name}'. Available: ${dbProduct.stock_count}, Requested: ${qty}`
            );
          }

          // Strictly use trusted price from DB (ignore any client-submitted prices)
          const trustedPrice = dbProduct.discount_price
            ? parseFloat(dbProduct.discount_price)
            : parseFloat(dbProduct.price);
          const itemSubtotal = trustedPrice * qty;
          calculatedSubtotal += itemSubtotal;

          verifiedOrderItems.push({
            id: `item-${Date.now()}-${uuidv4().slice(0, 6)}`,
            productId: dbProduct.id,
            productName: dbProduct.name,
            price: trustedPrice,
            quantity: qty,
            subtotal: itemSubtotal,
            sku: dbProduct.sku,
          });

          // 3. Atomically decrement stock
          await client.query(
            `UPDATE products
             SET stock_count = stock_count - $1,
                 in_stock = (stock_count - $1 > 0),
                 updated_at = NOW()
             WHERE id = $2`,
            [qty, dbProduct.id]
          );
        }

        const calculatedTax = Math.round(calculatedSubtotal * 0.05); // 5% GST
        const shippingFee = calculatedSubtotal > 50000 ? 0 : 500; // Free shipping over ₹50,000
        const calculatedTotal = calculatedSubtotal + calculatedTax + shippingFee;

        // 4. Insert order with optional idempotency key
        const insertOrderSql = `
          INSERT INTO orders (
            id, order_number, idempotency_key, customer_name, customer_email, customer_phone,
            shipping_address, subtotal, tax, shipping_fee, total, status,
            payment_method, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13)
          RETURNING *
        `;

        const orderRes = await client.query(insertOrderSql, [
          orderId,
          orderNumber,
          idempotencyKey || null,
          customerName,
          customerEmail,
          customerPhone || null,
          JSON.stringify(shippingAddress),
          calculatedSubtotal,
          calculatedTax,
          shippingFee,
          calculatedTotal,
          paymentMethod,
          notes || null,
        ]);

        // 5. Insert order items
        for (const item of verifiedOrderItems) {
          await client.query(
            `INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, subtotal, sku)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              item.id,
              orderId,
              item.productId,
              item.productName,
              item.price,
              item.quantity,
              item.subtotal,
              item.sku,
            ]
          );
        }

        await client.query('COMMIT');

        const createdOrder = mapOrderRow(orderRes.rows[0]);
        createdOrder.items = verifiedOrderItems;
        return createdOrder;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Local dev store with verified server pricing and atomic deduction
    let calculatedSubtotal = 0;
    const verifiedOrderItems = [];

    for (const item of rawItems) {
      const pId = item.productId || item.id;
      const dbProduct = localStore.products.find((p) => p.id === pId);

      if (!dbProduct) {
        throw new Error(`Product with ID '${pId}' not found`);
      }

      const qty = parseInt(item.quantity, 10) || 1;
      if (dbProduct.stockCount < qty && dbProduct.stockCount > 0) {
        throw new Error(`Insufficient stock for '${dbProduct.name}'`);
      }

      // Decrement stock
      if (dbProduct.stockCount >= qty) {
        dbProduct.stockCount -= qty;
        dbProduct.inStock = dbProduct.stockCount > 0;
      }

      const trustedPrice = dbProduct.discountPrice || dbProduct.price;
      const itemSubtotal = trustedPrice * qty;
      calculatedSubtotal += itemSubtotal;

      verifiedOrderItems.push({
        id: `item-${Date.now()}-${uuidv4().slice(0, 4)}`,
        productId: dbProduct.id,
        productName: dbProduct.name,
        price: trustedPrice,
        quantity: qty,
        subtotal: itemSubtotal,
        sku: dbProduct.sku,
      });
    }

    const calculatedTax = Math.round(calculatedSubtotal * 0.05);
    const shippingFee = calculatedSubtotal > 50000 ? 0 : 500;
    const calculatedTotal = calculatedSubtotal + calculatedTax + shippingFee;

    const newOrder = {
      id: orderId,
      orderNumber,
      idempotencyKey: idempotencyKey || null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      shippingAddress,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      shippingFee,
      total: calculatedTotal,
      status: 'pending',
      paymentMethod,
      items: verifiedOrderItems,
      createdAt: new Date().toISOString(),
    };

    localStore.orders.unshift(newOrder);
    await persistLocalStoreAsync();
    return newOrder;
  },

  updateStatus: async (id, status) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `UPDATE orders
         SET status = $1, updated_at = NOW()
         WHERE id = $2 OR order_number = $2
         RETURNING *`,
        [status, id]
      );
      return res.rows[0] || null;
    }

    const order = localStore.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await persistLocalStoreAsync();
    return order;
  },
};
