import { db } from '../config/database.js';
import { cacheService } from '../config/cache.js';

export const categoryController = {
  // GET /api/categories
  getAll: async (req, res, next) => {
    try {
      const categories = await db.getCategories();
      res.json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/categories
  create: async (req, res, next) => {
    try {
      const { name, description, featured = false } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Category name is required',
        });
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const newCategory = {
        id: `cat-${Date.now()}`,
        name,
        slug,
        description: description || '',
        featured: Boolean(featured),
        itemCount: 0,
      };

      const created = await db.createCategory(newCategory);
      cacheService.invalidatePrefix('http:/api/categories');

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
