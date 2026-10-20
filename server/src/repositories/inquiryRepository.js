import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const inquiryRepository = {
  findAndCountAll: async ({ page = 1, limit = 20, status } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    if (isPostgresActive()) {
      const pool = getPool();
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`status = $${paramIdx++}`);
        params.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await pool.query(`SELECT COUNT(*) FROM inquiries ${whereClause}`, params);
      const total = parseInt(countRes.rows[0].count, 10);

      const dataParams = [...params, limitNum, offset];
      const res = await pool.query(
        `SELECT * FROM inquiries ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        dataParams
      );

      return {
        inquiries: res.rows,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      };
    }

    let filtered = [...localStore.inquiries];
    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    return {
      inquiries: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  },

  findAll: async () => {
    const res = await inquiryRepository.findAndCountAll({ limit: 1000 });
    return res.inquiries;
  },

  create: async (inquiryData) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO inquiries (id, name, email, phone, subject, message, product_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          inquiryData.id,
          inquiryData.name,
          inquiryData.email,
          inquiryData.phone || null,
          inquiryData.subject || 'General Inquiry',
          inquiryData.message,
          inquiryData.productId || null,
          inquiryData.status || 'unread',
        ]
      );
      return res.rows[0];
    }

    localStore.inquiries.unshift(inquiryData);
    await persistLocalStoreAsync();
    return inquiryData;
  },
};
