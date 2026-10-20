import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',
  cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 60,

  // JWT & Admin Security
  jwtSecret: process.env.JWT_SECRET || 'shreeji_dev_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@shreeji.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@Shreeji2026',
    name: process.env.ADMIN_NAME || 'Shreeji Master Administrator',
  },

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

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
