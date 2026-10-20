import { orderRepository } from '../repositories/orderRepository.js';
import { jobQueue } from '../jobs/jobQueue.js';

export const orderController = {
  // GET /api/v1/orders (Admin Protected)
  getAll: async (req, res, next) => {
    try {
      const orders = await orderRepository.findAll();
      res.json({
        success: true,
        count: orders.length,
        data: orders,
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

  // POST /api/v1/orders (Public, Rate Limited, Transactional Pricing & Stock Reservation)
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

      const createdOrder = await orderRepository.createWithTransaction({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone ? customerPhone.trim() : '',
        shippingAddress,
        rawItems: items,
        paymentMethod: paymentMethod || 'cod',
        notes,
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
