import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Strict validation: In production, database URL and secure JWT secret are mandatory!
if (isProduction) {
  if (!process.env.DATABASE_URL) {
    console.error('❌ [FATAL CONFIG ERROR] DATABASE_URL is strictly required in production mode!');
    console.error('   The server will not silently fall back to an in-memory database in production.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change_in_production')) {
    console.warn('⚠️ [SECURITY WARNING] Please set a cryptographically secure JWT_SECRET in production!');
  }
}

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  apiPrefix: process.env.API_PREFIX || '/api',
  clientUrl: process.env.CLIENT_URL || 'https://founder-svg.github.io/Shreeji',
  corsOrigin:
    process.env.CORS_ORIGIN ||
    'http://localhost:3000,http://localhost:5173,http://localhost:5000,https://founder-svg.github.io',
  cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 60,
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 15000,

  // Database Connection Pool for 100 Concurrent Users
  databaseUrl: process.env.DATABASE_URL || '',
  db: {
    poolMax: parseInt(process.env.PG_POOL_MAX, 10) || 30,
    poolMin: parseInt(process.env.PG_POOL_MIN, 10) || 5,
    idleTimeoutMs: parseInt(process.env.PG_IDLE_TIMEOUT_MS, 10) || 30000,
    connTimeoutMs: parseInt(process.env.PG_CONN_TIMEOUT_MS, 10) || 5000,
    slowQueryThresholdMs: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS, 10) || 100,
  },

  // JWT & Admin Security
  jwtSecret: process.env.JWT_SECRET || 'shreeji_dev_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@shreeji.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@Shreeji2026',
    name: process.env.ADMIN_NAME || 'Shreeji Master Administrator',
  },

  // Cloud Storage
  storageProvider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
  s3: {
    region: process.env.S3_REGION || 'auto',
    bucket: process.env.S3_BUCKET || 'shreeji-media',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT || '',
    publicUrl: process.env.S3_PUBLIC_URL || '',
  },

  // Paths
  uploadsDir: path.resolve(__dirname, '../../uploads'),
  dataDir: path.resolve(__dirname, '../../data'),
};
