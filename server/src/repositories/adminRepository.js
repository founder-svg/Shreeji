import { getPool, isPostgresActive, localStore } from '../config/database.js';

export const adminRepository = {
  findByEmail: async (email) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
      return res.rows[0] || null;
    }
    return localStore.adminUsers.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findByIdentifier: async (identifier) => {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        'SELECT * FROM admin_users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1',
        [clean]
      );
      return res.rows[0] || null;
    }
    return (
      localStore.adminUsers.find(
        (u) =>
          (u.email && u.email.toLowerCase() === clean) ||
          (u.username && u.username.toLowerCase() === clean)
      ) || null
    );
  },

  updateLastLogin: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      await pool.query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [id]);
    }
  },
};
