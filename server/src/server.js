import app from './app.js';
import { config } from './config/env.js';
import { initDatabase } from './config/database.js';

const startServer = async () => {
  try {
    console.log('----------------------------------------------------');
    console.log('🚀 Starting Shreeji High-Performance Server...');
    console.log('----------------------------------------------------');

    // 1. Initialize Database
    const dbStatus = await initDatabase();

    // 2. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log('----------------------------------------------------');
      console.log(`✅ Server running in [${config.nodeEnv.toUpperCase()}] mode`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🩺 Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
      console.log(`🛍️  Products:     http://localhost:${config.port}${config.apiPrefix}/products`);
      console.log(`🏷️  Categories:   http://localhost:${config.port}${config.apiPrefix}/categories`);
      console.log(`☁️  Storage:      ${config.storageProvider.toUpperCase()} (${config.storageProvider === 'local' ? 'server/uploads' : config.s3.bucket})`);
      console.log(`⚡ In-Memory LRU: Active (TTL: ${config.cacheTtl}s)`);
      console.log('----------------------------------------------------');
    });

    // Graceful shutdown
    const handleShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('🔒 HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    // Prevent unexpected crashes from killing 24/7 server
    process.on('unhandledRejection', (reason, promise) => {
      console.error('⚠️ [24/7 Resilience] Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('🚨 [24/7 Resilience] Uncaught Exception:', err);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
