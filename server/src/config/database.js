import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { config } from './env.js';
import {
  initialCategories,
  initialProducts,
  initialProjects,
  initialPlots,
  initialMapAssets,
} from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pgPool = null;
let isPostgres = false;

// In-memory data store strictly for local dev or isolated test fixtures
export const localStore = {
  categories: [...initialCategories],
  products: [...initialProducts],
  projects: [...initialProjects],
  plots: [...initialPlots],
  mapAssets: [...initialMapAssets],
  propertyInquiries: [],
  orders: [],
  orderItems: [],
  cart: [],
  inquiries: [],
  auditLogs: [],
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

const loadLocalStore = () => {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      if (data.products && Array.isArray(data.products)) localStore.products = data.products;
      if (data.categories && Array.isArray(data.categories)) localStore.categories = data.categories;
      if (data.projects && Array.isArray(data.projects)) localStore.projects = data.projects;
      if (data.plots && Array.isArray(data.plots)) localStore.plots = data.plots;
      if (data.mapAssets && Array.isArray(data.mapAssets)) localStore.mapAssets = data.mapAssets;
      if (data.propertyInquiries && Array.isArray(data.propertyInquiries)) localStore.propertyInquiries = data.propertyInquiries;
      if (data.orders && Array.isArray(data.orders)) localStore.orders = data.orders;
      if (data.orderItems && Array.isArray(data.orderItems)) localStore.orderItems = data.orderItems;
      if (data.cart && Array.isArray(data.cart)) localStore.cart = data.cart;
      if (data.inquiries && Array.isArray(data.inquiries)) localStore.inquiries = data.inquiries;
      if (data.auditLogs && Array.isArray(data.auditLogs)) localStore.auditLogs = data.auditLogs;
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
      const isLocal =
        config.databaseUrl.includes('localhost') ||
        config.databaseUrl.includes('127.0.0.1');

      let sslConfig = false;
      if (!isLocal) {
        sslConfig = {
          rejectUnauthorized: config.db.sslRejectUnauthorized,
        };
        if (config.db.sslCa) {
          try {
            sslConfig.ca = fs.readFileSync(config.db.sslCa, 'utf8');
          } catch (caErr) {
            console.warn('⚠️ [DB SSL] Could not load CA file, falling back to system trust store:', caErr.message);
          }
        }
      }

      pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: sslConfig,
        max: config.db.poolMax,
        min: config.db.poolMin,
        idleTimeoutMillis: config.db.idleTimeoutMs,
        connectionTimeoutMillis: config.db.connTimeoutMs,
      });

      // Handle pool-level errors to prevent unhandled process termination
      pgPool.on('error', (err) => {
        console.error('⚠️ [DB Pool] Unexpected error on idle client:', err.message);
      });

      // Test connection
      const client = await pgPool.connect();
      console.log(`✅ [DB] Connected to PostgreSQL pool (Max: ${config.db.poolMax}, Min: ${config.db.poolMin})`);

      // Ensure migrations tracking table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Execute all pending migrations in order
      const migrationsDir = path.resolve(__dirname, '../../migrations');
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs
          .readdirSync(migrationsDir)
          .filter((f) => f.endsWith('.sql'))
          .sort();

        for (const file of migrationFiles) {
          const checkRes = await client.query(
            'SELECT filename FROM schema_migrations WHERE filename = $1',
            [file]
          );

          if (checkRes.rows.length === 0) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query('BEGIN');
            try {
              await client.query(sql);
              await client.query(
                'INSERT INTO schema_migrations (filename) VALUES ($1)',
                [file]
              );
              await client.query('COMMIT');
              console.log(`✅ [DB Migration] Applied pending migration: ${file}`);
            } catch (migErr) {
              await client.query('ROLLBACK');
              throw migErr;
            }
          } else {
            console.log(`⏩ [DB Migration] Already applied: ${file}`);
          }
        }
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
      if (config.isProduction || config.databaseUrl) {
        console.error('❌ [FATAL DB ERROR] Failed to connect to PostgreSQL database:', err.message);
        throw err;
      }
      console.error('⚠️ [DB] PostgreSQL connection failed, falling back to local memory store:', err.message);
      loadLocalStore();
      return { type: 'local-memory', status: 'fallback', error: err.message };
    }
  } else {
    if (config.isProduction) {
      throw new Error('DATABASE_URL is strictly required in production mode!');
    }
    console.log('ℹ️ [DB] Running with non-blocking local memory/JSON store for development.');
    loadLocalStore();
    return { type: 'local-memory', status: 'active' };
  }
};

/**
 * Execute SQL query with performance metrics & slow query diagnostics
 */
export const queryDb = async (text, params) => {
  if (!pgPool) throw new Error('Database pool not initialized');
  const start = process.hrtime.bigint();
  try {
    const res = await pgPool.query(text, params);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    if (durationMs > config.db.slowQueryThresholdMs) {
      console.warn(`🐌 [SLOW QUERY - ${durationMs.toFixed(2)}ms]: ${text.slice(0, 100)}...`);
    }

    return res;
  } catch (err) {
    console.error(`💥 [DB Query Error]: ${err.message} | Query: ${text}`);
    throw err;
  }
};

/**
 * Real Database Health Ping & Connection Pool Diagnostics
 */
export const pingDatabase = async () => {
  if (isPostgres && pgPool) {
    try {
      const start = process.hrtime.bigint();
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;

      return {
        connected: true,
        provider: 'PostgreSQL / Supabase',
        latencyMs: parseFloat(durationMs.toFixed(2)),
        pool: {
          total: pgPool.totalCount,
          idle: pgPool.idleCount,
          waiting: pgPool.waitingCount,
        },
      };
    } catch (err) {
      return {
        connected: false,
        provider: 'PostgreSQL / Supabase',
        error: err.message,
      };
    }
  }
  return {
    connected: true,
    provider: 'Local Memory / JSON Store (Development Mode)',
    latencyMs: 0.1,
  };
};

export const getPool = () => pgPool;
export const setPool = (pool, active = true) => {
  pgPool = pool;
  isPostgres = active;
};
export const isPostgresActive = () => isPostgres;
