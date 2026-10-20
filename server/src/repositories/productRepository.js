import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

const mapProductRow = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  category: row.category_slug,
  categoryId: row.category_id,
  price: parseFloat(row.price),
  discountPrice: row.discount_price ? parseFloat(row.discount_price) : null,
  inStock: Boolean(row.in_stock),
  stockCount: parseInt(row.stock_count, 10) || 0,
  rating: parseFloat(row.rating) || 5.0,
  reviewCount: parseInt(row.review_count, 10) || 0,
  featured: Boolean(row.featured),
  isNew: Boolean(row.is_new),
  sku: row.sku,
  images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
  description: row.description || '',
  tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
  specs: typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const productRepository = {
  findAndCountAll: async ({
    category,
    search,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page = 1,
    limit = 50,
  } = {}) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (category) {
        conditions.push(`(category_slug = $${paramIndex} OR category_id = $${paramIndex})`);
        values.push(category);
        paramIndex++;
      }

      if (search) {
        conditions.push(
          `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR tags::text ILIKE $${paramIndex})`
        );
        values.push(`%${search}%`);
        paramIndex++;
      }

      if (minPrice !== undefined && minPrice !== '') {
        conditions.push(`price >= $${paramIndex}`);
        values.push(parseFloat(minPrice));
        paramIndex++;
      }

      if (maxPrice !== undefined && maxPrice !== '') {
        conditions.push(`price <= $${paramIndex}`);
        values.push(parseFloat(maxPrice));
        paramIndex++;
      }

      if (inStock !== undefined) {
        conditions.push(`in_stock = $${paramIndex}`);
        values.push(inStock === 'true' || inStock === true);
        paramIndex++;
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countRes = await pool.query(
        `SELECT COUNT(*) AS total FROM products ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0].total, 10);

      // Order By clause
      let orderBy = 'ORDER BY created_at DESC';
      if (sort === 'price-low') {
        orderBy = 'ORDER BY COALESCE(discount_price, price) ASC';
      } else if (sort === 'price-high') {
        orderBy = 'ORDER BY COALESCE(discount_price, price) DESC';
      } else if (sort === 'rating') {
        orderBy = 'ORDER BY rating DESC';
      } else if (sort === 'newest') {
        orderBy = 'ORDER BY is_new DESC, created_at DESC';
      }

      const offset = (page - 1) * limit;
      values.push(limit, offset);
      const dataQuery = `
        SELECT * FROM products
        ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataRes = await pool.query(dataQuery, values);

      return {
        products: dataRes.rows.map(mapProductRow),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Local dev fallback
    let items = [...localStore.products];
    if (category) {
      items = items.filter((p) => p.category === category || p.categoryId === category);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (minPrice !== undefined && minPrice !== '') {
      items = items.filter((p) => p.price >= parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      items = items.filter((p) => p.price <= parseFloat(maxPrice));
    }
    if (inStock !== undefined) {
      const stockBool = inStock === 'true' || inStock === true;
      items = items.filter((p) => p.inStock === stockBool);
    }

    if (sort === 'price-low') {
      items.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sort === 'price-high') {
      items.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      items.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      products: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  findById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM products WHERE id = $1 OR slug = $1', [id]);
      return res.rows[0] ? mapProductRow(res.rows[0]) : null;
    }
    return localStore.products.find((p) => p.id === id || p.slug === id) || null;
  },

  findByIds: async (ids) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM products WHERE id = ANY($1::varchar[])', [ids]);
      return res.rows.map(mapProductRow);
    }
    return localStore.products.filter((p) => ids.includes(p.id));
  },

  create: async (productData) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO products (
          id, name, slug, category_slug, category_id, price, discount_price,
          in_stock, stock_count, rating, review_count, featured, is_new,
          sku, images, description, tags, specs
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18
        ) RETURNING *`,
        [
          productData.id,
          productData.name,
          productData.slug,
          productData.category,
          productData.categoryId || null,
          productData.price,
          productData.discountPrice || null,
          Boolean(productData.inStock),
          productData.stockCount || 0,
          productData.rating || 5.0,
          productData.reviewCount || 0,
          Boolean(productData.featured),
          Boolean(productData.isNew),
          productData.sku,
          JSON.stringify(productData.images || []),
          productData.description || '',
          JSON.stringify(productData.tags || []),
          JSON.stringify(productData.specs || {}),
        ]
      );
      return mapProductRow(res.rows[0]);
    }

    localStore.products.unshift(productData);
    await persistLocalStoreAsync();
    return productData;
  },

  update: async (id, updates) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const fields = [];
      const values = [];
      let index = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${index++}`);
        values.push(updates.name);
      }
      if (updates.price !== undefined) {
        fields.push(`price = $${index++}`);
        values.push(parseFloat(updates.price));
      }
      if (updates.discountPrice !== undefined) {
        fields.push(`discount_price = $${index++}`);
        values.push(updates.discountPrice ? parseFloat(updates.discountPrice) : null);
      }
      if (updates.inStock !== undefined) {
        fields.push(`in_stock = $${index++}`);
        values.push(Boolean(updates.inStock));
      }
      if (updates.stockCount !== undefined) {
        fields.push(`stock_count = $${index++}`);
        values.push(parseInt(updates.stockCount, 10));
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${index++}`);
        values.push(updates.description);
      }
      if (updates.images !== undefined) {
        fields.push(`images = $${index++}`);
        values.push(JSON.stringify(updates.images));
      }
      if (updates.tags !== undefined) {
        fields.push(`tags = $${index++}`);
        values.push(JSON.stringify(updates.tags));
      }
      if (updates.specs !== undefined) {
        fields.push(`specs = $${index++}`);
        values.push(JSON.stringify(updates.specs));
      }

      if (fields.length === 0) return null;

      fields.push(`updated_at = NOW()`);
      values.push(id);
      const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0] ? mapProductRow(res.rows[0]) : null;
    }

    const idx = localStore.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    localStore.products[idx] = { ...localStore.products[idx], ...updates };
    await persistLocalStoreAsync();
    return localStore.products[idx];
  },

  delete: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return res.rowCount > 0;
    }
    const idx = localStore.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    localStore.products.splice(idx, 1);
    await persistLocalStoreAsync();
    return true;
  },
};
