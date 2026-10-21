import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const plotRepository = {
  findAll: async ({ projectId, category, availabilityStatus, minPrice, maxPrice } = {}) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const conditions = [];
      const params = [];
      let idx = 1;

      if (projectId) {
        conditions.push(`project_id = $${idx++}`);
        params.push(projectId);
      }
      if (category && category !== 'all') {
        conditions.push(`category ILIKE $${idx++}`);
        params.push(`%${category}%`);
      }
      if (availabilityStatus && availabilityStatus !== 'all') {
        conditions.push(`availability_status = $${idx++}`);
        params.push(availabilityStatus);
      }
      if (minPrice) {
        conditions.push(`price >= $${idx++}`);
        params.push(minPrice);
      }
      if (maxPrice) {
        conditions.push(`price <= $${idx++}`);
        params.push(maxPrice);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await pool.query(
        `SELECT * FROM plots ${whereClause} ORDER BY plot_number ASC`,
        params
      );
      return res.rows;
    }

    let items = [...localStore.plots];
    if (projectId) items = items.filter((p) => p.projectId === projectId);
    if (category && category !== 'all') {
      items = items.filter((p) =>
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (availabilityStatus && availabilityStatus !== 'all') {
      items = items.filter((p) => p.availabilityStatus === availabilityStatus);
    }
    if (minPrice) items = items.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) items = items.filter((p) => p.price <= Number(maxPrice));

    return items;
  },

  findById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM plots WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }

    return localStore.plots.find((p) => p.id === id) || null;
  },

  create: async (plotData) => {
    const id = plotData.id || `plot-${Date.now()}`;
    const record = {
      id,
      projectId: plotData.projectId,
      plotNumber: plotData.plotNumber,
      sectorWard: plotData.sectorWard || '',
      category: plotData.category || 'Commercial Plot',
      area: Number(plotData.area) || 0,
      areaUnit: plotData.areaUnit || 'Sq.Ft',
      price: Number(plotData.price) || 0,
      pricingType: plotData.pricingType || 'lease',
      availabilityStatus: plotData.availabilityStatus || 'available',
      surveyedBoundaryGeometry: plotData.surveyedBoundaryGeometry || {},
      dimensions: plotData.dimensions || {},
      reraApproved: plotData.reraApproved !== false,
      titleStatus: plotData.titleStatus || '100% Clear Title (7/12 & 8A)',
      features: plotData.features || [],
      imageUrl: plotData.imageUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO plots (
          id, project_id, plot_number, sector_ward, category, area, area_unit,
          price, pricing_type, availability_status, surveyed_boundary_geometry,
          dimensions, rera_approved, title_status, features, image_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          record.id,
          record.projectId,
          record.plotNumber,
          record.sectorWard,
          record.category,
          record.area,
          record.areaUnit,
          record.price,
          record.pricingType,
          record.availabilityStatus,
          JSON.stringify(record.surveyedBoundaryGeometry),
          JSON.stringify(record.dimensions),
          record.reraApproved,
          record.titleStatus,
          JSON.stringify(record.features),
          record.imageUrl,
          record.createdAt,
          record.updatedAt,
        ]
      );
      return res.rows[0];
    }

    localStore.plots.push(record);
    await persistLocalStoreAsync();
    return record;
  },

  update: async (id, updateData) => {
    const now = new Date().toISOString();
    if (isPostgresActive()) {
      const pool = getPool();
      const existing = await plotRepository.findById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updateData, updated_at: now };
      const res = await pool.query(
        `UPDATE plots SET
          plot_number = $1, sector_ward = $2, category = $3, area = $4,
          area_unit = $5, price = $6, pricing_type = $7, availability_status = $8,
          surveyed_boundary_geometry = $9, dimensions = $10, rera_approved = $11,
          title_status = $12, features = $13, image_url = $14, updated_at = $15
        WHERE id = $16
        RETURNING *`,
        [
          updated.plot_number || updated.plotNumber,
          updated.sector_ward || updated.sectorWard,
          updated.category,
          updated.area,
          updated.area_unit || updated.areaUnit,
          updated.price,
          updated.pricing_type || updated.pricingType,
          updated.availability_status || updated.availabilityStatus,
          JSON.stringify(updated.surveyed_boundary_geometry || updated.surveyedBoundaryGeometry || {}),
          JSON.stringify(updated.dimensions || {}),
          updated.rera_approved ?? updated.reraApproved,
          updated.title_status || updated.titleStatus,
          JSON.stringify(updated.features || []),
          updated.image_url || updated.imageUrl,
          now,
          id,
        ]
      );
      return res.rows[0];
    }

    const index = localStore.plots.findIndex((p) => p.id === id);
    if (index === -1) return null;

    localStore.plots[index] = {
      ...localStore.plots[index],
      ...updateData,
      updatedAt: now,
    };
    await persistLocalStoreAsync();
    return localStore.plots[index];
  },

  delete: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('DELETE FROM plots WHERE id = $1 RETURNING id', [id]);
      return res.rows.length > 0;
    }

    const initialLen = localStore.plots.length;
    localStore.plots = localStore.plots.filter((p) => p.id !== id);
    const deleted = localStore.plots.length < initialLen;
    if (deleted) await persistLocalStoreAsync();
    return deleted;
  },
};
