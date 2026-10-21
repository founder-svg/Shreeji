import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const projectRepository = {
  findAll: async ({ status = 'active', publicationState = 'published' } = {}) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const conditions = [];
      const params = [];
      let idx = 1;

      if (status && status !== 'all') {
        conditions.push(`status = $${idx++}`);
        params.push(status);
      }
      if (publicationState && publicationState !== 'all') {
        conditions.push(`publication_state = $${idx++}`);
        params.push(publicationState);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await pool.query(
        `SELECT * FROM projects ${whereClause} ORDER BY created_at DESC`,
        params
      );
      return res.rows;
    }

    let items = [...localStore.projects];
    if (status && status !== 'all') items = items.filter((p) => p.status === status);
    if (publicationState && publicationState !== 'all') {
      items = items.filter((p) => p.publicationState === publicationState);
    }
    return items;
  },

  findByIdOrSlug: async (identifier) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        'SELECT * FROM projects WHERE id = $1 OR slug = $1 LIMIT 1',
        [identifier]
      );
      return res.rows[0] || null;
    }

    return (
      localStore.projects.find(
        (p) => p.id === identifier || p.slug === identifier
      ) || null
    );
  },

  create: async (projectData) => {
    const id = projectData.id || `proj-${Date.now()}`;
    const slug =
      projectData.slug ||
      projectData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const record = {
      id,
      name: projectData.name,
      slug,
      description: projectData.description || '',
      address: projectData.address || '',
      city: projectData.city || 'Gandhidham',
      district: projectData.district || 'Kutch',
      state: projectData.state || 'Gujarat',
      status: projectData.status || 'active',
      latitude: projectData.latitude || null,
      longitude: projectData.longitude || null,
      boundaryGeometry: projectData.boundaryGeometry || {},
      gallery: projectData.gallery || [],
      publicationState: projectData.publicationState || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO projects (
          id, name, slug, description, address, city, district, state,
          status, latitude, longitude, boundary_geometry, gallery, publication_state, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          record.id,
          record.name,
          record.slug,
          record.description,
          record.address,
          record.city,
          record.district,
          record.state,
          record.status,
          record.latitude,
          record.longitude,
          JSON.stringify(record.boundaryGeometry),
          JSON.stringify(record.gallery),
          record.publicationState,
          record.createdAt,
          record.updatedAt,
        ]
      );
      return res.rows[0];
    }

    localStore.projects.unshift(record);
    await persistLocalStoreAsync();
    return record;
  },

  update: async (id, updateData) => {
    const now = new Date().toISOString();
    if (isPostgresActive()) {
      const pool = getPool();
      const existing = await projectRepository.findByIdOrSlug(id);
      if (!existing) return null;

      const updated = { ...existing, ...updateData, updated_at: now };
      const res = await pool.query(
        `UPDATE projects SET
          name = $1, description = $2, address = $3, city = $4,
          status = $5, latitude = $6, longitude = $7,
          boundary_geometry = $8, gallery = $9, publication_state = $10, updated_at = $11
        WHERE id = $12
        RETURNING *`,
        [
          updated.name,
          updated.description,
          updated.address,
          updated.city,
          updated.status,
          updated.latitude,
          updated.longitude,
          JSON.stringify(updated.boundary_geometry || updated.boundaryGeometry || {}),
          JSON.stringify(updated.gallery || []),
          updated.publication_state || updated.publicationState,
          now,
          id,
        ]
      );
      return res.rows[0];
    }

    const index = localStore.projects.findIndex((p) => p.id === id || p.slug === id);
    if (index === -1) return null;

    localStore.projects[index] = {
      ...localStore.projects[index],
      ...updateData,
      updatedAt: now,
    };
    await persistLocalStoreAsync();
    return localStore.projects[index];
  },

  delete: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
      return res.rows.length > 0;
    }

    const initialLen = localStore.projects.length;
    localStore.projects = localStore.projects.filter((p) => p.id !== id && p.slug !== id);
    const deleted = localStore.projects.length < initialLen;
    if (deleted) await persistLocalStoreAsync();
    return deleted;
  },
};
