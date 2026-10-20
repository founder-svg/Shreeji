import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const categoryRepository = {
  findAll: async () => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        'SELECT id, name, slug, description, featured, item_count AS "itemCount", created_at AS "createdAt" FROM categories ORDER BY name ASC'
      );
      return res.rows;
    }
    return localStore.categories;
  },

  findBySlug: async (slug) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        'SELECT id, name, slug, description, featured, item_count AS "itemCount", created_at AS "createdAt" FROM categories WHERE slug = $1 OR id = $1',
        [slug]
      );
      return res.rows[0] || null;
    }
    return localStore.categories.find((c) => c.slug === slug || c.id === slug) || null;
  },

  create: async (categoryData) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO categories (id, name, slug, description, featured, item_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, slug, description, featured, item_count AS "itemCount", created_at AS "createdAt"`,
        [
          categoryData.id,
          categoryData.name,
          categoryData.slug,
          categoryData.description || '',
          Boolean(categoryData.featured),
          categoryData.itemCount || 0,
        ]
      );
      return res.rows[0];
    }
    localStore.categories.push(categoryData);
    await persistLocalStoreAsync();
    return categoryData;
  },
};
