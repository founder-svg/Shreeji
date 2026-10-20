import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env.js';
import { timingMiddleware } from './middleware/timing.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/api.js';

const app = express();

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. High-speed Gzip / Brotli compression
app.use(compression());

// 3. Robust CORS with explicit allowlist (fixes origin: '*' with credentials)
const allowedOrigins = config.corsOrigin
  ? config.corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check against allowlist
      if (allowedOrigins.includes(origin) || (config.nodeEnv === 'development' && origin.includes('localhost'))) {
        return callback(null, true);
      }

      const msg = `The CORS policy for this site does not allow access from origin: ${origin}`;
      return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// 4. Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. High-resolution Timing Header (X-Response-Time, Server-Timing)
app.use(timingMiddleware);

// 6. Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// 7. Serve local uploads statically
app.use('/uploads', express.static(config.uploadsDir));

// 8. Root Server Status & API Reference
app.get('/', (req, res) => {
  res.json({
    service: 'Shreeji API Server',
    status: 'online',
    version: '1.1.0',
    endpoints: {
      health: `${config.apiPrefix}/health`,
      products: `${config.apiPrefix}/products`,
      categories: `${config.apiPrefix}/categories`,
      cart: `${config.apiPrefix}/cart`,
      orders: `${config.apiPrefix}/orders`,
      inquiries: `${config.apiPrefix}/inquiries`,
      auth: `${config.apiPrefix}/auth/login`,
    },
  });
});

// 9. Mount API routes
app.use(config.apiPrefix, apiRoutes);

// 10. Handle 404 & Global Errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
