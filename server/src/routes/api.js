import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { productController } from '../controllers/productController.js';
import { categoryController } from '../controllers/categoryController.js';
import { orderController } from '../controllers/orderController.js';
import { cartController } from '../controllers/cartController.js';
import { inquiryController } from '../controllers/inquiryController.js';
import { projectController } from '../controllers/projectController.js';
import { plotController } from '../controllers/plotController.js';
import { propertyInquiryController } from '../controllers/propertyInquiryController.js';
import { mapAssetController } from '../controllers/mapAssetController.js';
import {
  uploadController,
  uploadMiddleware,
  uploadMultipleMiddleware,
} from '../controllers/uploadController.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  validateProduct,
  validateOrder,
  validateOrderStatus,
  validateInquiry,
} from '../middleware/validate.js';
import {
  apiLimiter,
  authLimiter,
  submissionLimiter,
  uploadLimiter,
} from '../middleware/rateLimiter.js';
import { cacheRoute } from '../middleware/cacheMiddleware.js';
import { cacheService } from '../config/cache.js';
import { pingDatabase, isPostgresActive } from '../config/database.js';
import { storageService } from '../config/storage.js';
import { jobQueue } from '../jobs/jobQueue.js';

const router = Router();

// ==========================================
// 1. HEALTH CHECKS (Live vs Ready)
// ==========================================

// Liveness Check: Confirms the process is running
router.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'live',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Readiness Check: Verifies database connectivity and storage readiness
router.get('/health/ready', async (req, res) => {
  const dbHealth = await pingDatabase();
  const isHealthy = dbHealth.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ready' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'Shreeji API Server',
    database: {
      status: isHealthy ? 'connected' : 'disconnected',
      provider: dbHealth.provider,
      latencyMs: dbHealth.latencyMs,
    },
    storage: {
      provider: storageService.getProvider(),
      status: 'ready',
    },
  });
});

// Standard minimal health check
router.get('/health', async (req, res) => {
  const dbHealth = await pingDatabase();
  const isHealthy = dbHealth.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'Shreeji API Server',
    database: isHealthy ? 'connected' : 'disconnected',
  });
});

// Operational Telemetry (Admin Only)
router.get('/metrics', authenticateToken, requireAdmin, (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    cache: cacheService.stats(),
    jobs: jobQueue.stats(),
    database: {
      provider: isPostgresActive() ? 'PostgreSQL / Supabase' : 'Local Memory / JSON Store',
      active: true,
    },
    storage: {
      provider: storageService.getProvider(),
    },
    memory: {
      rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
    },
  });
});

// Audit Logs (Admin Only)
router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await auditRepository.findAll({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    });
    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. AUTHENTICATION (Admin Login)
// ==========================================
router.post('/auth/login', authLimiter, authController.login);
router.get('/auth/me', authenticateToken, authController.me);

// ==========================================
// 3. PRODUCT CATALOG
// ==========================================
// Public read endpoints (cached for sub-millisecond retrieval)
router.get('/products', apiLimiter, cacheRoute(60), productController.getAll);
router.get('/products/:id', apiLimiter, cacheRoute(120), productController.getById);

// Admin-protected product management
router.post('/products', authenticateToken, requireAdmin, validateProduct, productController.create);
router.put('/products/:id', authenticateToken, requireAdmin, productController.update);
router.delete('/products/:id', authenticateToken, requireAdmin, productController.remove);

// ==========================================
// 4. CATEGORIES
// ==========================================
router.get('/categories', apiLimiter, cacheRoute(180), categoryController.getAll);
router.post('/categories', authenticateToken, requireAdmin, categoryController.create);

// ==========================================
// 5. CART (Client sessions)
// ==========================================
router.get('/cart', apiLimiter, cartController.getCart);
router.post('/cart/items', apiLimiter, cartController.addItem);
router.delete('/cart/items/:id', apiLimiter, cartController.removeItem);
router.delete('/cart', apiLimiter, cartController.clear);

// ==========================================
// 6. ORDERS
// ==========================================
// Public checkout placement with strict validation & server-side pricing
router.post('/orders', submissionLimiter, validateOrder, orderController.create);

// Admin-protected order fulfillment & history
router.get('/orders', authenticateToken, requireAdmin, orderController.getAll);
router.get('/orders/:id', authenticateToken, requireAdmin, orderController.getById);
router.patch('/orders/:id/status', authenticateToken, requireAdmin, validateOrderStatus, orderController.updateStatus);

// ==========================================
// 7. INQUIRIES & BRIDAL CONSULTATIONS
// ==========================================
// Public customer consultation request
router.post('/inquiries', submissionLimiter, validateInquiry, inquiryController.create);

// Admin-protected inquiry review
router.get('/inquiries', authenticateToken, requireAdmin, inquiryController.getAll);

// ==========================================
// 8. CLOUD STORAGE & MEDIA UPLOADS (Admin Only)
// ==========================================
router.get('/uploads/info', authenticateToken, requireAdmin, uploadController.getInfo);
router.post('/uploads', authenticateToken, requireAdmin, uploadLimiter, uploadMiddleware, uploadController.uploadSingle);
router.post('/uploads/multiple', authenticateToken, requireAdmin, uploadLimiter, uploadMultipleMiddleware, uploadController.uploadMultiple);
router.post('/uploads/presigned', authenticateToken, requireAdmin, uploadController.getPresignedUrl);
router.delete('/uploads', authenticateToken, requireAdmin, uploadController.deleteFile);

// ==========================================
// 9. REAL ESTATE DOMAIN: PROJECTS & PLOTS
// ==========================================

// --- Projects Endpoints ---
router.get('/projects', apiLimiter, cacheRoute(60), projectController.getAll);
router.get('/projects/:id', apiLimiter, cacheRoute(120), projectController.getById);
router.get('/projects/:id/plots', apiLimiter, cacheRoute(60), projectController.getPlots);
router.get('/projects/:id/assets', apiLimiter, cacheRoute(180), mapAssetController.getByProject);

// Admin Project Operations
router.post('/admin/projects', authenticateToken, requireAdmin, projectController.create);
router.patch('/admin/projects/:id', authenticateToken, requireAdmin, projectController.update);
router.delete('/admin/projects/:id', authenticateToken, requireAdmin, projectController.remove);

// --- Plots / Parcels Endpoints ---
router.get('/plots', apiLimiter, cacheRoute(60), plotController.getAll);
router.get('/plots/:id', apiLimiter, cacheRoute(120), plotController.getById);

// Admin Plot Operations (PATCH allows staff/admin status updates)
router.post('/admin/plots', authenticateToken, requireAdmin, plotController.create);
router.patch('/admin/plots/:id', authenticateToken, plotController.update);
router.delete('/admin/plots/:id', authenticateToken, requireAdmin, plotController.remove);

// --- Map & 3D Assets ---
router.post('/admin/assets', authenticateToken, requireAdmin, mapAssetController.create);
router.delete('/admin/assets/:id', authenticateToken, requireAdmin, mapAssetController.remove);

// --- Property Inquiries & Leads Funnel ---
// Public lead submission from website
router.post('/property-inquiries', submissionLimiter, propertyInquiryController.create);

// Authenticated staff / admin management
router.get('/property-inquiries', authenticateToken, propertyInquiryController.getAll);
router.get('/admin/property-inquiries', authenticateToken, propertyInquiryController.getAll);
router.get('/property-inquiries/:id', authenticateToken, propertyInquiryController.getById);
router.patch('/admin/property-inquiries/:id', authenticateToken, propertyInquiryController.updateStatus);
router.patch('/property-inquiries/:id', authenticateToken, propertyInquiryController.updateStatus);

export default router;
