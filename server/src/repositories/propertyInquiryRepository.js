import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';
import { encryptField, decryptField } from '../utils/cryptoSecurity.js';

function decryptInquiry(inq) {
  if (!inq) return inq;
  return {
    ...inq,
    phone: decryptField(inq.phone),
    email: decryptField(inq.email),
    message: decryptField(inq.message),
    notes: decryptField(inq.notes),
  };
}

export const propertyInquiryRepository = {
  findAndCountAll: async ({ page = 1, limit = 20, status, role } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    if (isPostgresActive()) {
      const pool = getPool();
      const conditions = [];
      const params = [];
      let idx = 1;

      if (status && status !== 'all') {
        conditions.push(`status = $${idx++}`);
        params.push(status);
      }
      if (role && role !== 'all') {
        conditions.push(`role = $${idx++}`);
        params.push(role);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM property_inquiries ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0].count, 10);

      const dataParams = [...params, limitNum, offset];
      const res = await pool.query(
        `SELECT * FROM property_inquiries ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
        dataParams
      );

      return {
        inquiries: res.rows.map(decryptInquiry),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      };
    }

    let filtered = [...localStore.propertyInquiries];
    if (status && status !== 'all') filtered = filtered.filter((i) => i.status === status);
    if (role && role !== 'all') filtered = filtered.filter((i) => i.role === role);

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    return {
      inquiries: paginated.map(decryptInquiry),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  },

  findById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM property_inquiries WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] ? decryptInquiry(res.rows[0]) : null;
    }

    const found = localStore.propertyInquiries.find((i) => i.id === id);
    return found ? decryptInquiry(found) : null;
  },

  create: async (data) => {
    const id = data.id || `lead-${Date.now()}`;
    const rawRecord = {
      id,
      name: data.name,
      email: data.email || '',
      phone: data.phone,
      role: data.role || 'tenant',
      projectId: data.projectId || null,
      plotId: data.plotId || null,
      propertyCategory: data.propertyCategory || data.category || '',
      preferredLocation: data.preferredLocation || data.location || '',
      budgetOrExpected: data.budgetOrExpected || data.budget || data.expected || '',
      builtupArea: data.builtupArea || data.area || '',
      message: data.message || data.notes || '',
      source: data.source || 'website',
      assignedStaffId: data.assignedStaffId || null,
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Protect sensitive fields at rest using AES-256-GCM
    const record = {
      ...rawRecord,
      phone: encryptField(rawRecord.phone),
      email: encryptField(rawRecord.email),
      message: encryptField(rawRecord.message),
      notes: encryptField(rawRecord.notes),
    };

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO property_inquiries (
          id, name, email, phone, role, project_id, plot_id,
          property_category, preferred_location, budget_or_expected,
          builtup_area, message, source, assigned_staff_id, status, notes,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          record.id,
          record.name,
          record.email,
          record.phone,
          record.role,
          record.projectId,
          record.plotId,
          record.propertyCategory,
          record.preferredLocation,
          record.budgetOrExpected,
          record.builtupArea,
          record.message,
          record.source,
          record.assignedStaffId,
          record.status,
          record.notes,
          record.createdAt,
          record.updatedAt,
        ]
      );
      return decryptInquiry(res.rows[0]);
    }

    localStore.propertyInquiries.unshift(record);
    await persistLocalStoreAsync();
    return decryptInquiry(record);
  },

  updateStatus: async (id, { status, assignedStaffId, notes }) => {
    const now = new Date().toISOString();
    if (isPostgresActive()) {
      const pool = getPool();
      const existing = await propertyInquiryRepository.findById(id);
      if (!existing) return null;

      const newStatus = status || existing.status;
      const newStaff = assignedStaffId !== undefined ? assignedStaffId : existing.assigned_staff_id;
      const newNotes = notes !== undefined ? encryptField(notes) : existing.notes;

      const res = await pool.query(
        `UPDATE property_inquiries SET
          status = $1, assigned_staff_id = $2, notes = $3, updated_at = $4
        WHERE id = $5
        RETURNING *`,
        [newStatus, newStaff, newNotes, now, id]
      );
      return decryptInquiry(res.rows[0]);
    }

    const index = localStore.propertyInquiries.findIndex((i) => i.id === id);
    if (index === -1) return null;

    if (status) localStore.propertyInquiries[index].status = status;
    if (assignedStaffId !== undefined) {
      localStore.propertyInquiries[index].assignedStaffId = assignedStaffId;
    }
    if (notes !== undefined) localStore.propertyInquiries[index].notes = encryptField(notes);
    localStore.propertyInquiries[index].updatedAt = now;

    await persistLocalStoreAsync();
    return decryptInquiry(localStore.propertyInquiries[index]);
  },
};
