import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const mapAssetRepository = {
  findByProjectId: async (projectId) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        'SELECT * FROM map_assets WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      );
      return res.rows;
    }

    return localStore.mapAssets.filter((a) => a.projectId === projectId);
  },

  findById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM map_assets WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }

    return localStore.mapAssets.find((a) => a.id === id) || null;
  },

  create: async (assetData) => {
    const id = assetData.id || `asset-${Date.now()}`;
    const record = {
      id,
      projectId: assetData.projectId,
      assetType: assetData.assetType,
      storageKey: assetData.storageKey,
      url: assetData.url,
      format: assetData.format,
      fileSizeBytes: Number(assetData.fileSizeBytes) || 0,
      coordinateReferenceSystem: assetData.coordinateReferenceSystem || 'EPSG:4326',
      version: assetData.version || '1.0',
      publicationStatus: assetData.publicationStatus || 'published',
      createdAt: new Date().toISOString(),
    };

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO map_assets (
          id, project_id, asset_type, storage_key, url, format,
          file_size_bytes, coordinate_reference_system, version,
          publication_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          record.id,
          record.projectId,
          record.assetType,
          record.storageKey,
          record.url,
          record.format,
          record.fileSizeBytes,
          record.coordinateReferenceSystem,
          record.version,
          record.publicationStatus,
          record.createdAt,
        ]
      );
      return res.rows[0];
    }

    localStore.mapAssets.push(record);
    await persistLocalStoreAsync();
    return record;
  },

  delete: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('DELETE FROM map_assets WHERE id = $1 RETURNING id', [id]);
      return res.rows.length > 0;
    }

    const initialLen = localStore.mapAssets.length;
    localStore.mapAssets = localStore.mapAssets.filter((a) => a.id !== id);
    const deleted = localStore.mapAssets.length < initialLen;
    if (deleted) await persistLocalStoreAsync();
    return deleted;
  },
};
