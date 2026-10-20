import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { categoryController } from '../controllers/categoryController.js';
import { orderController } from '../controllers/orderController.js';
import { cartController } from '../controllers/cartController.js';
import { inquiryController } from '../controllers/inquiryController.js';
import {
  uploadController,
  uploadMiddleware,
  uploadMultipleMiddleware,
} from '../controllers/uploadController.js';
import { cacheRoute } from '../middleware/cacheMiddleware.js';
import { cacheService } from '../config/cache.js';
import { db } from '../config/database.js';
import { storageService } from '../config/storage.js';

const router = Router();

// ==========================================
// 1. SYSTEM HEALTH & PERFORMANCE BENCHMARKS
// ==========================================
router.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'Shreeji High-Performance Server',
    database: {
      provider: db.isPostgres() ? 'PostgreSQL / Supabase' : 'Local Memory / JSON Store',
      status: 'connected',
    },
    storage: {
      provider: storageService.getProvider(),
      status: 'ready',
    },
    cache: {
      status: 'active',
      size: cacheService.stats().size,
    },
    memory: {
      rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
    },
  });
});

router.get('/metrics', (req, res) => {
  res.json({
    cache: cacheService.stats(),
    database: db.isPostgres() ? 'PostgreSQL' : 'Local',
    storage: storageService.getProvider(),
  });
});

// ==========================================
// 2. PRODUCT CATALOG (Ultra-fast cached GETs)
// ==========================================
router.get('/products', cacheRoute(60), productController.getAll);
router.get('/products/:id', cacheRoute(120), productController.getById);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.remove);

// ==========================================
// 3. CATEGORIES (Cached GETs)
// ==========================================
router.get('/categories', cacheRoute(180), categoryController.getAll);
router.post('/categories', categoryController.create);

// ==========================================
// 4. CART
// ==========================================
router.get('/cart', cartController.getCart);
router.post('/cart/items', cartController.addItem);
router.delete('/cart/items/:id', cartController.removeItem);
router.delete('/cart', cartController.clear);

// ==========================================
// 5. ORDERS
// ==========================================
router.get('/orders', orderController.getAll);
router.get('/orders/:id', orderController.getById);
router.post('/orders', orderController.create);
router.patch('/orders/:id/status', orderController.updateStatus);

// ==========================================
// 6. INQUIRIES & BRIDAL CONSULTATIONS
// ==========================================
router.get('/inquiries', inquiryController.getAll);
router.post('/inquiries', inquiryController.create);

// ==========================================
// 7. CLOUD STORAGE & UPLOADS
// ==========================================
router.get('/uploads/info', uploadController.getInfo);
router.post('/uploads', uploadMiddleware, uploadController.uploadSingle);
router.post('/uploads/multiple', uploadMultipleMiddleware, uploadController.uploadMultiple);
router.post('/uploads/presigned', uploadController.getPresignedUrl);
router.delete('/uploads', uploadController.deleteFile);

export default router;
