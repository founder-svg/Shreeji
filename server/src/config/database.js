import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { config } from './env.js';
import { initialCategories, initialProducts } from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pgPool = null;
let isPostgres = false;

// In-memory data store strictly for local dev or fallback
export const localStore = {
  categories: [...initialCategories],
  products: [...initialProducts],
  orders: [],
  orderItems: [],
  cart: [],
  inquiries: [],
  adminUsers: [
    {
      id: 'admin-1',
      email: config.admin.email,
      name: config.admin.name,
      passwordHash: bcrypt.hashSync(config.admin.password, 10),
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ],
};

const localDbPath = path.join(config.dataDir, 'local-db.json');

// Asynchronous, non-blocking persist of local store to avoid event-loop blocking
let isPersisting = false;
let pendingPersist = false;

export const persistLocalStoreAsync = async () => {
  if (isPersisting) {
    pendingPersist = true;
    return;
  }
  isPersisting = true;
  try {
    await fs.promises.mkdir(config.dataDir, { recursive: true });
    await fs.promises.writeFile(
      localDbPath,
      JSON.stringify(localStore, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('[DB] Failed to persist local store asynchronously:', err.message);
  } finally {
    isPersisting = false;
    if (pendingPersist) {
      pendingPersist = false;
      persistLocalStoreAsync();
    }
  }
};

// Helper to load local store from disk
const loadLocalStore = () => {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      if (data.products && Array.isArray(data.products)) localStore.products = data.products;
      if (data.categories && Array.isArray(data.categories)) localStore.categories = data.categories;
      if (data.orders && Array.isArray(data.orders)) localStore.orders = data.orders;
      if (data.orderItems && Array.isArray(data.orderItems)) localStore.orderItems = data.orderItems;
      if (data.cart && Array.isArray(data.cart)) localStore.cart = data.cart;
      if (data.inquiries && Array.isArray(data.inquiries)) localStore.inquiries = data.inquiries;
      if (data.adminUsers && Array.isArray(data.adminUsers)) localStore.adminUsers = data.adminUsers;
    } else {
      persistLocalStoreAsync();
    }
  } catch (err) {
    console.warn('[DB] Could not load local-db.json, using seed data:', err.message);
  }
};

/**
 * Initialize Database Connection and run Schema Migrations
 */
export const initDatabase = async () => {
  if (config.databaseUrl) {
    try {
      pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 25, // Optimized pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await pgPool.connect();
      console.log('✅ [DB] Connected to PostgreSQL / Supabase pool successfully');

      // Run migration script
      const migrationPath = path.resolve(__dirname, '../../migrations/001_initial_schema.sql');
      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await client.query(migrationSql);
        console.log('✅ [DB] Database schema migration executed successfully');
      }

      // Seed default admin in PostgreSQL if not already present
      const adminCheck = await client.query('SELECT id FROM admin_users WHERE email = $1', [
        config.admin.email,
      ]);
      if (adminCheck.rows.length === 0) {
        const passwordHash = await bcrypt.hash(config.admin.password, 10);
        await client.query(
          `INSERT INTO admin_users (id, email, password_hash, name, role)
           VALUES ($1, $2, $3, $4, $5)`,
          ['admin-1', config.admin.email, passwordHash, config.admin.name, 'admin']
        );
        console.log(`👤 [DB] Seeded default administrator account: ${config.admin.email}`);
      }

      client.release();
      isPostgres = true;
      return { type: 'postgresql', status: 'connected' };
    } catch (err) {
      console.error('⚠️ [DB] PostgreSQL connection failed, falling back to local memory store:', err.message);
      loadLocalStore();
      return { type: 'local-memory', status: 'fallback', error: err.message };
    }
  } else {
    console.log('ℹ️ [DB] No DATABASE_URL provided. Running with non-blocking local memory/JSON store.');
    loadLocalStore();
    return { type: 'local-memory', status: 'active' };
  }
};

/**
 * Real Database Health Ping
 */
export const pingDatabase = async () => {
  if (isPostgres && pgPool) {
    try {
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      return { connected: true, provider: 'PostgreSQL / Supabase' };
    } catch (err) {
      return { connected: false, provider: 'PostgreSQL / Supabase', error: err.message };
    }
  }
  return { connected: true, provider: 'Local Memory / JSON Store (Development Mode)' };
};

export const getPool = () => pgPool;
export const isPostgresActive = () => isPostgres;
