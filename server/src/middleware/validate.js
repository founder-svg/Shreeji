const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateProduct = (req, res, next) => {
  const { name, price, discountPrice, stockCount } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Product name is required and must be between 2 and 255 characters',
    });
  }

  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Price must be a valid positive number greater than 0',
    });
  }

  if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
    const numDiscount = parseFloat(discountPrice);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > numPrice) {
      return res.status(400).json({
        success: false,
        error: 'Discount price must be a positive number less than or equal to original price',
      });
    }
  }

  if (stockCount !== undefined) {
    const numStock = parseInt(stockCount, 10);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock count must be a non-negative integer',
      });
    }
  }

  next();
};

export const validateOrder = (req, res, next) => {
  const { customerName, customerEmail, shippingAddress, items } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Customer name is required and must be at least 2 characters',
    });
  }

  if (!customerEmail || !EMAIL_REGEX.test(customerEmail.trim())) {
    return res.status(400).json({
      success: false,
      error: 'A valid customer email address is required',
    });
  }

  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Shipping address object is required',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Order must contain an array of at least 1 item',
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pId = item.productId || item.id;
    if (!pId) {
      return res.status(400).json({
        success: false,
        error: `Item at index ${i} is missing product ID`,
      });
    }
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > 100) {
      return res.status(400).json({
        success: false,
        error: `Item '${pId}' must have a valid quantity between 1 and 100`,
      });
    }
  }

  next();
};

export const validateOrderStatus = (req, res, next) => {
  const { status } = req.body;
  const ALLOWED_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!status || !ALLOWED_STATUSES.includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
    });
  }

  req.body.status = status.toLowerCase();
  next();
};

export const validateInquiry = (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Name is required (minimum 2 characters)',
    });
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'A valid email address is required',
    });
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 2000) {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be between 5 and 2000 characters',
    });
  }

  next();
};
