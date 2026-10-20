import { v4 as uuidv4 } from 'uuid';
import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const auditRepository = {
  log: async ({
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    details = {},
    ipAddress = '',
    clientPlatform = 'web',
  }) => {
    const id = `audit-${Date.now()}-${uuidv4().slice(0, 6)}`;
    const logEntry = {
      id,
      userId: userId || null,
      userEmail: userEmail || 'system',
      action,
      entityType,
      entityId: entityId || null,
      details,
      ipAddress,
      clientPlatform,
      createdAt: new Date().toISOString(),
    };

    if (isPostgresActive()) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details, ip_address, client_platform)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            logEntry.id,
            logEntry.userId,
            logEntry.userEmail,
            logEntry.action,
            logEntry.entityType,
            logEntry.entityId,
            JSON.stringify(logEntry.details),
            logEntry.ipAddress,
            logEntry.clientPlatform,
          ]
        );
      } catch (err) {
        console.error('⚠️ [AuditLog] Failed to record audit log:', err.message);
      }
    } else {
      localStore.auditLogs.unshift(logEntry);
      if (localStore.auditLogs.length > 500) localStore.auditLogs.pop();
      await persistLocalStoreAsync();
    }

    return logEntry;
  },

  findAll: async ({ limit = 100, page = 1 } = {}) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const offset = (page - 1) * limit;
      const res = await pool.query(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return res.rows;
    }
    const startIndex = (page - 1) * limit;
    return localStore.auditLogs.slice(startIndex, startIndex + limit);
  },
};
