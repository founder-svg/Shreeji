import { getPool, isPostgresActive, localStore, persistLocalStoreAsync } from '../config/database.js';

export const clientRepository = {
  createClientUser: async (user) => {
    const record = {
      id: user.id || `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      client_id: user.clientId || user.client_id,
      full_name: user.fullName || user.full_name,
      email: user.email ? user.email.toLowerCase().trim() : null,
      phone: user.phone ? user.phone.trim() : '',
      password_hash: user.passwordHash || user.password_hash,
      agent_code: user.agentCode || user.agent_code || null,
      role: 'client',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO client_users (
           id, client_id, full_name, email, phone, password_hash, agent_code, role, status, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          record.id,
          record.client_id,
          record.full_name,
          record.email,
          record.phone,
          record.password_hash,
          record.agent_code,
          record.role,
          record.status,
          record.created_at,
          record.updated_at,
        ]
      );
      return res.rows[0];
    }

    localStore.clientUsers.push(record);
    await persistLocalStoreAsync();
    return { ...record };
  },

  findByClientIdOrEmailOrPhone: async (identifier) => {
    if (!identifier) return null;
    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `SELECT * FROM client_users 
         WHERE LOWER(client_id) = $1 
            OR (email IS NOT NULL AND LOWER(email) = $1)
            OR phone = $2`,
        [cleanLower, clean]
      );
      return res.rows[0] || null;
    }

    return (
      localStore.clientUsers.find(
        (u) =>
          (u.client_id && u.client_id.toLowerCase() === cleanLower) ||
          (u.clientId && u.clientId.toLowerCase() === cleanLower) ||
          (u.email && u.email.toLowerCase() === cleanLower) ||
          u.phone === clean
      ) || null
    );
  },

  findById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM client_users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return localStore.clientUsers.find((u) => u.id === id) || null;
  },

  createKycApplication: async (kyc) => {
    const record = {
      id: kyc.id || `kyc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      client_user_id: kyc.clientUserId || kyc.client_user_id,
      client_id: kyc.clientId || kyc.client_id,
      full_name: kyc.fullName || kyc.full_name,
      phone: kyc.phone,
      email: kyc.email ? kyc.email.toLowerCase().trim() : null,
      address_street: kyc.addressStreet || kyc.address_street,
      city: kyc.city || 'Gandhidham',
      state: kyc.state || 'Gujarat',
      pincode: kyc.pincode,
      occupation: kyc.occupation || 'Business',
      company_name: kyc.companyName || kyc.company_name || null,
      work_details: kyc.workDetails || kyc.work_details || null,
      annual_income_or_budget: kyc.annualIncomeOrBudget || kyc.annual_income_or_budget || null,
      aadhar_number: kyc.aadharNumber || kyc.aadhar_number,
      aadhar_document_url: kyc.aadharDocumentUrl || kyc.aadhar_document_url || null,
      aadhar_document_back_url: kyc.aadharDocumentBackUrl || kyc.aadhar_document_back_url || null,
      pan_number: kyc.panNumber || kyc.pan_number || null,
      interested_project_id: kyc.interestedProjectId || kyc.interested_project_id || null,
      interested_plot_number: kyc.interestedPlotNumber || kyc.interested_plot_number || null,
      interested_plot_area: kyc.interestedPlotArea || kyc.interested_plot_area || null,
      interested_plot_value: kyc.interestedPlotValue || kyc.interested_plot_value || null,
      agent_code: kyc.agentCode || kyc.agent_code || null,
      verification_status: 'pending',
      admin_notes: null,
      verified_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `INSERT INTO client_kyc_applications (
           id, client_user_id, client_id, full_name, phone, email, address_street, city, state, pincode,
           occupation, company_name, work_details, annual_income_or_budget, aadhar_number,
           aadhar_document_url, aadhar_document_back_url, pan_number, interested_project_id,
           interested_plot_number, interested_plot_area, interested_plot_value, agent_code, verification_status,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15,
           $16, $17, $18, $19,
           $20, $21, $22, $23, $24,
           $25, $26
         ) RETURNING *`,
        [
          record.id,
          record.client_user_id,
          record.client_id,
          record.full_name,
          record.phone,
          record.email,
          record.address_street,
          record.city,
          record.state,
          record.pincode,
          record.occupation,
          record.company_name,
          record.work_details,
          record.annual_income_or_budget,
          record.aadhar_number,
          record.aadhar_document_url,
          record.aadhar_document_back_url,
          record.pan_number,
          record.interested_project_id,
          record.interested_plot_number,
          record.interested_plot_area,
          record.interested_plot_value,
          record.agent_code,
          record.verification_status,
          record.created_at,
          record.updated_at,
        ]
      );
      return res.rows[0];
    }

    localStore.kycApplications.push(record);
    await persistLocalStoreAsync();
    return { ...record };
  },

  findKycByClientUserId: async (clientUserId) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        'SELECT * FROM client_kyc_applications WHERE client_user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [clientUserId]
      );
      return res.rows[0] || null;
    }

    const apps = localStore.kycApplications.filter(
      (k) => k.client_user_id === clientUserId || k.clientUserId === clientUserId
    );
    return apps.length > 0 ? apps[apps.length - 1] : null;
  },

  findKycById: async (id) => {
    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM client_kyc_applications WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return localStore.kycApplications.find((k) => k.id === id) || null;
  },

  getAllKycApplications: async ({ status, page = 1, limit = 20, search } = {}) => {
    const offset = (page - 1) * limit;

    if (isPostgresActive()) {
      const pool = getPool();
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`verification_status = $${paramIndex++}`);
        params.push(status);
      }

      if (search) {
        conditions.push(
          `(LOWER(full_name) LIKE $${paramIndex} OR phone LIKE $${paramIndex} OR LOWER(client_id) LIKE $${paramIndex} OR aadhar_number LIKE $${paramIndex})`
        );
        params.push(`%${search.toLowerCase()}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM client_kyc_applications ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(limit, offset);
      const dataRes = await pool.query(
        `SELECT * FROM client_kyc_applications ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        params
      );

      return {
        applications: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    let items = [...localStore.kycApplications];
    if (status) {
      items = items.filter((k) => (k.verification_status || k.verificationStatus) === status);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (k) =>
          (k.full_name && k.full_name.toLowerCase().includes(q)) ||
          (k.fullName && k.fullName.toLowerCase().includes(q)) ||
          (k.phone && k.phone.includes(q)) ||
          (k.client_id && k.client_id.toLowerCase().includes(q)) ||
          (k.aadhar_number && k.aadhar_number.includes(q))
      );
    }

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return {
      applications: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  updateKycStatus: async (id, { status, adminNotes }) => {
    const verifiedAt = status === 'verified' ? new Date().toISOString() : null;
    const updatedAt = new Date().toISOString();

    if (isPostgresActive()) {
      const pool = getPool();
      const res = await pool.query(
        `UPDATE client_kyc_applications 
         SET verification_status = $1, admin_notes = $2, verified_at = $3, updated_at = $4
         WHERE id = $5
         RETURNING *`,
        [status, adminNotes || null, verifiedAt, updatedAt, id]
      );
      return res.rows[0] || null;
    }

    const idx = localStore.kycApplications.findIndex((k) => k.id === id);
    if (idx === -1) return null;

    localStore.kycApplications[idx] = {
      ...localStore.kycApplications[idx],
      verification_status: status,
      verificationStatus: status,
      admin_notes: adminNotes || null,
      adminNotes: adminNotes || null,
      verified_at: verifiedAt,
      verifiedAt: verifiedAt,
      updated_at: updatedAt,
      updatedAt: updatedAt,
    };
    await persistLocalStoreAsync();
    return { ...localStore.kycApplications[idx] };
  },
};
