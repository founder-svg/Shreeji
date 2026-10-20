import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';

export const orderController = {
  // GET /api/orders
  getAll: async (req, res, next) => {
    try {
      const orders = await db.getOrders();
      res.json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/orders/:id
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const order = await db.getOrderById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }
      res.json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/orders
  create: async (req, res, next) => {
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items,
        paymentMethod = 'cod',
      } = req.body;

      if (!customerName || !customerEmail || !items || !items.length) {
        return res.status(400).json({
          success: false,
          error: 'Customer name, email, and at least one item are required',
        });
      }

      // Calculate totals
      const subtotal = items.reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      );
      const tax = Math.round(subtotal * 0.05); // 5% GST
      const total = subtotal + tax;

      const newOrder = {
        id: `ORD-${Date.now().toString().slice(-8)}`,
        orderNumber: `SHR-${uuidv4().slice(0, 8).toUpperCase()}`,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        shippingAddress: shippingAddress || {},
        items,
        subtotal,
        tax,
        total,
        status: 'pending',
        paymentMethod,
        createdAt: new Date().toISOString(),
      };

      const created = await db.createOrder(newOrder);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/orders/:id/status
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Order status is required (e.g. pending, confirmed, shipped, delivered, cancelled)',
        });
      }

      const updated = await db.updateOrderStatus(id, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        message: `Order status updated to '${status}'`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
