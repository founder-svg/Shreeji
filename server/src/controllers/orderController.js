import { orderRepository } from '../repositories/orderRepository.js';

export const orderController = {
  // GET /api/orders (Admin Protected)
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

  // GET /api/orders/:id (Admin Protected or Customer with orderNumber)
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

  // POST /api/orders (Public, Rate Limited, Atomic Transaction with Trusted DB Pricing)
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

      res.status(201).json({
        success: true,
        message: 'Order created successfully with verified pricing and reserved inventory',
        data: createdOrder,
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/orders/:id/status (Admin Protected)
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
