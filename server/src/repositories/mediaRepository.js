import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const mediaRepository = {
  create: async (data) => {
    const id = data.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      project_id: data.projectId || data.project_id || 'nagavaladiya',
      plot_number: data.plotNumber || data.plot_number || null,
      title: data.title || 'Untitled Media',
      media_type: data.mediaType || data.media_type || 'photo',
      media_url: data.mediaUrl || data.media_url || '',
      thumbnail_url: data.thumbnailUrl || data.thumbnail_url || data.mediaUrl || data.media_url || '',
      description: data.description || '',
      author: data.author || 'Shreeji Admin',
      created_at: now,
      updated_at: now,
    };

    if (isPostgresActive() && getPool()) {
      try {
        const pool = getPool();
        const sql = `
          INSERT INTO project_media (
            id, project_id, plot_number, title, media_type, media_url,
            thumbnail_url, description, author, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *;
        `;
        const res = await pool.query(sql, [
          record.id,
          record.project_id,
          record.plot_number,
          record.title,
          record.media_type,
          record.media_url,
          record.thumbnail_url,
          record.description,
          record.author,
          record.created_at,
          record.updated_at,
        ]);
        return res.rows[0];
      } catch (err) {
        console.warn('[DB:Media] Fallback to local store on insert:', err.message);
      }
    }

    localStore.mediaItems.push(record);
    persistLocalStoreAsync();
    return { ...record };
  },

  getAll: async ({ page = 1, limit = 50, type, projectId } = {}) => {
    if (isPostgresActive() && getPool()) {
      try {
        const pool = getPool();
        const offset = (page - 1) * limit;
        let conditions = [];
        let params = [];

        if (type) {
          params.push(type);
          conditions.push(`media_type = $${params.length}`);
        }
        if (projectId) {
          params.push(projectId);
          conditions.push(`project_id = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const dataSql = `SELECT * FROM project_media ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`;
        const countSql = `SELECT COUNT(*) FROM project_media ${whereClause};`;

        const dataRes = await pool.query(dataSql, [...params, limit, offset]);
        const countRes = await pool.query(countSql, params);

        return {
          media: dataRes.rows,
          total: parseInt(countRes.rows[0].count, 10),
          page,
          limit,
        };
      } catch (err) {
        console.warn('[DB:Media] Fallback to local store on getAll:', err.message);
      }
    }

    let filtered = [...localStore.mediaItems];
    if (type) filtered = filtered.filter((m) => m.media_type === type);
    if (projectId) filtered = filtered.filter((m) => m.project_id === projectId);

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const media = filtered.slice(offset, offset + limit);

    return { media, total, page, limit };
  },

  delete: async (id) => {
    if (isPostgresActive() && getPool()) {
      try {
        const pool = getPool();
        await pool.query('DELETE FROM project_media WHERE id = $1', [id]);
        return true;
      } catch (err) {
        console.warn('[DB:Media] Fallback to local store on delete:', err.message);
      }
    }

    const idx = localStore.mediaItems.findIndex((m) => m.id === id);
    if (idx !== -1) {
      localStore.mediaItems.splice(idx, 1);
      persistLocalStoreAsync();
      return true;
    }
    return false;
  },
};
