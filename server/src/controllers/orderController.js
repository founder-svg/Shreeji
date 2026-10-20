import { orderRepository } from '../repositories/orderRepository.js';
import { jobQueue } from '../jobs/jobQueue.js';

export const orderController = {
  // GET /api/v1/orders (Admin Protected, Paginated)
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const result = await orderRepository.findAndCountAll({
        page: Math.max(1, parseInt(page, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
        status,
      });

      res.json({
        success: true,
        count: result.orders.length,
        data: result.orders,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/orders/:id (Admin Protected)
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const order = await orderRepository.findById(id);

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

  // POST /api/v1/orders (Public, Rate Limited, Transactional Pricing & Idempotency)
  create: async (req, res, next) => {
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items,
        paymentMethod,
        notes,
      } = req.body;

      // Extract idempotency key from header or body
      const idempotencyKey =
        req.headers['idempotency-key'] ||
        req.body.idempotencyKey ||
        null;

      if (idempotencyKey) {
        const existingOrder = await orderRepository.findByIdempotencyKey(String(idempotencyKey).trim());
        if (existingOrder) {
          return res.status(200).json({
            success: true,
            message: 'Order already processed (idempotent)',
            idempotent: true,
            data: existingOrder,
          });
        }
      }

      const createdOrder = await orderRepository.createWithTransaction({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone ? customerPhone.trim() : '',
        shippingAddress,
        rawItems: items,
        paymentMethod: paymentMethod || 'cod',
        notes,
        idempotencyKey: idempotencyKey ? String(idempotencyKey).trim() : null,
      });

      // Enqueue non-blocking email notification job
      jobQueue.enqueue('sendOrderConfirmation', {
        orderNumber: createdOrder.orderNumber || createdOrder.order_number,
        customerEmail: createdOrder.customerEmail || createdOrder.customer_email,
        total: createdOrder.total,
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully with verified pricing and reserved inventory',
        data: createdOrder,
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/v1/orders/:id/status (Admin Protected + Audit Log)
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await orderRepository.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Record audit log asynchronously in background
      jobQueue.enqueue('recordAuditLog', {
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE_ORDER_STATUS',
        entityType: 'order',
        entityId: id,
        details: { newStatus: status },
        ipAddress: req.ip,
        clientPlatform: req.clientPlatform,
      });

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
