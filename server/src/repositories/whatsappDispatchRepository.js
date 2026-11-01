import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const whatsappDispatchRepository = {
  create: async (data) => {
    const id = data.id || `wa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      kyc_application_id: data.kycApplicationId || data.kyc_application_id || null,
      inquiry_id: data.inquiryId || data.inquiry_id || null,
      recipient_number: data.recipientNumber || data.recipient_number || '919825799754',
      client_name: data.clientName || data.client_name || 'Valued Client',
      client_phone: data.clientPhone || data.client_phone || '',
      message_type: data.messageType || data.message_type || 'kyc_reservation',
      property_ref: data.propertyRef || data.property_ref || null,
      agent_code: data.agentCode || data.agent_code || null,
      message_body: data.messageBody || data.message_body || '',
      dispatch_url: data.dispatchUrl || data.dispatch_url || '',
      delivery_channel: data.deliveryChannel || data.delivery_channel || 'whatsapp_direct',
      status: data.status || 'dispatched',
      created_at: now,
    };

    if (isPostgresActive() && getPool()) {
      try {
        const pool = getPool();
        const sql = `
          INSERT INTO whatsapp_dispatches (
            id, kyc_application_id, inquiry_id, recipient_number, client_name, client_phone,
            message_type, property_ref, agent_code, message_body, dispatch_url, delivery_channel, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *;
        `;
        const res = await pool.query(sql, [
          record.id,
          record.kyc_application_id,
          record.inquiry_id,
          record.recipient_number,
          record.client_name,
          record.client_phone,
          record.message_type,
          record.property_ref,
          record.agent_code,
          record.message_body,
          record.dispatch_url,
          record.delivery_channel,
          record.status,
          record.created_at,
        ]);
        return res.rows[0];
      } catch (err) {
        console.warn('[DB:WhatsApp] Fallback to local store on insert:', err.message);
      }
    }

    localStore.whatsappDispatches.push(record);
    persistLocalStoreAsync();
    return { ...record };
  },

  findById: async (id) => {
    if (isPostgresActive() && getPool()) {
      try {
        const pool = getPool();
        const res = await pool.query('SELECT * FROM whatsapp_dispatches WHERE id = $1 LIMIT 1;', [id]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[DB:WhatsApp] Fallback to local store on findById:', err.message);
      }
    }
    return localStore.whatsappDispatches.find((d) => d.id === id) || null;
  },

  getAll: async ({ page = 1, limit = 50, recipient, status } = {}) => {
    if (isPostgresActive() && getPool()) {
      try {
        const pool = getPool();
        const offset = (page - 1) * limit;
        let conditions = [];
        let params = [];

        if (recipient) {
          params.push(`%${recipient}%`);
          conditions.push(`recipient_number ILIKE $${params.length}`);
        }
        if (status) {
          params.push(status);
          conditions.push(`status = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const dataSql = `SELECT * FROM whatsapp_dispatches ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`;
        const countSql = `SELECT COUNT(*) FROM whatsapp_dispatches ${whereClause};`;

        const dataRes = await pool.query(dataSql, [...params, limit, offset]);
        const countRes = await pool.query(countSql, params);

        return {
          dispatches: dataRes.rows,
          total: parseInt(countRes.rows[0].count, 10),
          page,
          limit,
        };
      } catch (err) {
        console.warn('[DB:WhatsApp] Fallback to local store on getAll:', err.message);
      }
    }

    let filtered = [...localStore.whatsappDispatches];
    if (recipient) filtered = filtered.filter((d) => d.recipient_number.includes(recipient));
    if (status) filtered = filtered.filter((d) => d.status === status);

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const dispatches = filtered.slice(offset, offset + limit);

    return { dispatches, total, page, limit };
  },
};
