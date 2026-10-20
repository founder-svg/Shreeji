import { categoryRepository } from '../repositories/categoryRepository.js';
import { cacheService } from '../config/cache.js';

export const categoryController = {
  // GET /api/categories (Public, cached)
  getAll: async (req, res, next) => {
    try {
      const categories = await categoryRepository.findAll();
      res.json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/categories (Admin Protected)
  create: async (req, res, next) => {
    try {
      const { name, description, featured = false } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Category name is required (minimum 2 characters)',
        });
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const newCategory = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        slug,
        description: description ? description.trim() : '',
        featured: Boolean(featured),
        itemCount: 0,
      };

      const created = await categoryRepository.create(newCategory);
      cacheService.invalidatePrefix('http:/api/v1/categories');
      cacheService.invalidatePrefix('http:/api/categories');
      cacheService.invalidatePrefix('http:/api/v1/products');
      cacheService.invalidatePrefix('http:/api/products');

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },
};
