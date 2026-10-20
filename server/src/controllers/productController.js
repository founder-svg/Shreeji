import { v4 as uuidv4 } from 'uuid';
import { productRepository } from '../repositories/productRepository.js';
import { cacheService } from '../config/cache.js';
import { jobQueue } from '../jobs/jobQueue.js';

export const productController = {
  // GET /api/v1/products (Public, cached)
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
        limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
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

  // GET /api/v1/products/:id (Public, cached with negative caching on 404)
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

  // POST /api/v1/products (Admin Protected + Audit Log)
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
      cacheService.invalidatePrefix('http:/api/v1/products');
      cacheService.invalidatePrefix('http:/api/products');

      // Record audit log in background
      jobQueue.enqueue('recordAuditLog', {
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'CREATE_PRODUCT',
        entityType: 'product',
        entityId: created.id,
        details: { name: created.name, price: created.price },
        ipAddress: req.ip,
        clientPlatform: req.clientPlatform,
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/v1/products/:id (Admin Protected + Audit Log)
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

      cacheService.invalidatePrefix('http:/api/v1/products');
      cacheService.invalidatePrefix('http:/api/products');

      jobQueue.enqueue('recordAuditLog', {
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE_PRODUCT',
        entityType: 'product',
        entityId: id,
        details: { updates: Object.keys(req.body) },
        ipAddress: req.ip,
        clientPlatform: req.clientPlatform,
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/v1/products/:id (Admin Protected + Audit Log)
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

      cacheService.invalidatePrefix('http:/api/v1/products');
      cacheService.invalidatePrefix('http:/api/products');

      jobQueue.enqueue('recordAuditLog', {
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DELETE_PRODUCT',
        entityType: 'product',
        entityId: id,
        details: {},
        ipAddress: req.ip,
        clientPlatform: req.clientPlatform,
      });

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
