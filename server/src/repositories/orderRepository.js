import { v4 as uuidv4 } from 'uuid';
import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const orderRepository = {
  findAll: async () => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(`
        SELECT o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'price', oi.price,
                'quantity', oi.quantity,
                'subtotal', oi.subtotal,
                'sku', oi.sku
              )
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
      return res.rows;
    }
    return localStore.orders;
  },

  findById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `SELECT o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'price', oi.price,
                'quantity', oi.quantity,
                'subtotal', oi.subtotal,
                'sku', oi.sku
              )
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1 OR o.order_number = $1
        GROUP BY o.id`,
        [id]
      );
      return res.rows[0] || null;
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
        const prodRes = await client.query(
          'SELECT id, name, price, discount_price, in_stock, stock_count, sku FROM products WHERE id = ANY($1) FOR UPDATE',
          [productIds]
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

        // 4. Insert order
        const insertOrderSql = `
          INSERT INTO orders (
            id, order_number, customer_name, customer_email, customer_phone,
            shipping_address, subtotal, tax, shipping_fee, total, status,
            payment_method, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12)
          RETURNING *
        `;

        const orderRes = await client.query(insertOrderSql, [
          orderId,
          orderNumber,
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

        const createdOrder = orderRes.rows[0];
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
