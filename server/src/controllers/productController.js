import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { cacheService } from '../config/cache.js';

export const productController = {
  // GET /api/products
  getAll: async (req, res, next) => {
    try {
      const {
        category,
        search,
        minPrice,
        maxPrice,
        inStock,
        sort,
        page = 1,
        limit = 50,
      } = req.query;

      const result = await db.getProducts({
        category,
        search,
        minPrice,
        maxPrice,
        inStock,
        sort,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      res.json({
        success: true,
        data: result.products,
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

  // GET /api/products/:id
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await db.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/products
  create: async (req, res, next) => {
    try {
      const {
        name,
        category,
        categoryId,
        price,
        discountPrice,
        inStock = true,
        stockCount = 0,
        images = [],
        description = '',
        tags = [],
        specs = {},
        featured = false,
      } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Product name and price are required',
        });
      }

      const id = `prod-${Date.now()}-${uuidv4().slice(0, 6)}`;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const newProduct = {
        id,
        name,
        slug,
        category: category || 'uncategorized',
        categoryId: categoryId || null,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        inStock: Boolean(inStock),
        stockCount: parseInt(stockCount, 10) || 0,
        rating: 5.0,
        reviewCount: 0,
        featured: Boolean(featured),
        isNew: true,
        sku: `SHR-${Date.now().toString().slice(-6)}`,
        images,
        description,
        tags,
        specs,
        createdAt: new Date().toISOString(),
      };

      const created = await db.createProduct(newProduct);

      // Invalidate products cache
      cacheService.invalidatePrefix('http:/api/products');

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/products/:id
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await db.updateProduct(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Invalidate products cache
      cacheService.invalidatePrefix('http:/api/products');

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/products/:id
  remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      const success = await db.deleteProduct(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Invalidate products cache
      cacheService.invalidatePrefix('http:/api/products');

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
