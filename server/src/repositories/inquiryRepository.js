import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const inquiryRepository = {
  findAll: async () => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
      return res.rows;
    }
    return localStore.inquiries;
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
