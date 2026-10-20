import { v4 as uuidv4 } from 'uuid';
import { productRepository } from '../repositories/productRepository.js';
import { cacheService } from '../config/cache.js';

export const productController = {
  // GET /api/products (Public, cached)
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

      const result = await productRepository.findAndCountAll({
        category: category ? String(category).trim() : undefined,
        search: search ? String(search).trim() : undefined,
        minPrice,
        maxPrice,
        inStock,
        sort,
        page: Math.max(1, parseInt(page, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)), // capped at 100
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

  // GET /api/products/:id (Public, cached)
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await productRepository.findById(id);

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

  // POST /api/products (Admin Protected)
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

      const id = `prod-${Date.now()}-${uuidv4().slice(0, 6)}`;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const newProduct = {
        id,
        name: name.trim(),
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
        description: description.trim(),
        tags,
        specs,
      };

      const created = await productRepository.create(newProduct);

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

  // PUT /api/products/:id (Admin Protected)
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await productRepository.update(id, req.body);

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

  // DELETE /api/products/:id (Admin Protected)
  remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      const success = await productRepository.delete(id);

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
