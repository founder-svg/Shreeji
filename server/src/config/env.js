import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Strict validation: In production, database URL, secure JWT secret, and non-default admin credentials are mandatory!
if (isProduction) {
  const errors = [];
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is strictly required in production mode!');
  }
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.includes('change_in_production') ||
    process.env.JWT_SECRET.includes('dev_secret')
  ) {
    errors.push('A cryptographically secure JWT_SECRET of at least 32 characters is strictly required in production!');
  }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'Admin@Shreeji2026') {
    errors.push('Default ADMIN_PASSWORD is not allowed in production! Set a custom secure password via ADMIN_PASSWORD.');
  }

  if (errors.length > 0) {
    console.error('❌ [FATAL CONFIG ERROR] Production startup aborted due to configuration violations:');
    errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
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
    sslRejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
    sslCa: process.env.PG_SSL_CA || null,
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
