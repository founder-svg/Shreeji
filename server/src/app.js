import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env.js';
import { timingMiddleware } from './middleware/timing.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { timeoutMiddleware } from './middleware/timeout.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/api.js';

const app = express();

// Trust reverse proxy hops (Cloudflare, Nginx, cloud load balancers)
app.set('trust proxy', 1);

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. High-speed Gzip / Brotli compression
app.use(compression());

// 3. Robust CORS with explicit allowlist (fixes origin: '*' with credentials)
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'https://founder-svg.github.io',
];

const customOrigins = config.corsOrigin
  ? config.corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...customOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');

      // Strictly check against explicit allowlist or local dev
      if (
        allowedOrigins.includes(cleanOrigin) ||
        (config.nodeEnv === 'development' && cleanOrigin.includes('localhost'))
      ) {
        return callback(null, true);
      }

      const msg = `The CORS policy for this site does not allow access from origin: ${origin}`;
      return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id', 'X-Client-Platform'],
    credentials: true,
  })
);

// 4. Request Body Parsing with Bounded Limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Request Tracking, Timeout, and Precision Timing Headers
app.use(requestIdMiddleware);
app.use(timeoutMiddleware);
app.use(timingMiddleware);

// 6. Request Logging with Redaction & Request ID
if (config.nodeEnv !== 'test') {
  morgan.token('req-id', (req) => req.id || '-');
  morgan.token('client-platform', (req) => req.clientPlatform || 'web');
  app.use(
    morgan('[:date[iso]] [:req-id] [:client-platform] :method :url :status :res[content-length] - :response-time ms')
  );
}

// 7. Serve local uploads statically
app.use('/uploads', express.static(config.uploadsDir));

// 8. Root Server Status & API Reference
app.get('/', (req, res) => {
  res.json({
    service: 'Shreeji API Server',
    status: 'online',
    version: '1.2.0',
    clientUrl: config.clientUrl,
    versions: {
      v1: '/api/v1',
      legacy: '/api',
    },
    endpoints: {
      liveness: '/api/v1/health/live',
      readiness: '/api/v1/health/ready',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      inquiries: '/api/v1/inquiries',
      auth: '/api/v1/auth/login',
    },
  });
});

// 9. Mount Versioned API Routes (/api/v1 and legacy /api)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// 10. Direct Root Health Endpoints (Docker / K8s / Cloud load balancer friendly)
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'live', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  const { pingDatabase } = await import('./config/database.js');
  const dbHealth = await pingDatabase();
  res.status(dbHealth.connected ? 200 : 503).json({
    status: dbHealth.connected ? 'ready' : 'unhealthy',
    database: dbHealth,
  });
});

// 11. Handle 404 & Global Errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
