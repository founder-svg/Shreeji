import { db } from '../config/database.js';

export const cartController = {
  // GET /api/cart?cartId=xxx
  getCart: async (req, res, next) => {
    try {
      const { cartId = 'default-guest' } = req.query;
      const items = await db.getCart(cartId);
      const totalAmount = items.reduce(
        (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1),
        0
      );

      res.json({
        success: true,
        cartId,
        itemCount: items.length,
        totalAmount,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/cart/items
  addItem: async (req, res, next) => {
    try {
      const { cartId = 'default-guest', productId, quantity = 1 } = req.body;
      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'productId is required',
        });
      }

      const product = await db.getProductById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      const item = await db.addToCart(cartId, product, parseInt(quantity, 10));

      res.status(201).json({
        success: true,
        message: 'Item added to cart',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/cart/items/:id?cartId=xxx
  removeItem: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { cartId = 'default-guest' } = req.query;

      const success = await db.removeFromCart(cartId, id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Item not found in cart',
        });
      }

      res.json({
        success: true,
        message: 'Item removed from cart',
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/cart?cartId=xxx
  clear: async (req, res, next) => {
    try {
      const { cartId = 'default-guest' } = req.query;
      await db.clearCart(cartId);
      res.json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
