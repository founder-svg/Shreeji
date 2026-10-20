import { cacheService } from '../config/cache.js';

/**
 * Route-level cache middleware for lightning-fast repeated queries.
 * @param {number} ttlSeconds - Optional custom TTL for specific endpoint
 */
export const cacheRoute = (ttlSeconds) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Cache key incorporates the entire request URL including query parameters
    const cacheKey = `http:${req.originalUrl || req.url}`;
    const cachedResponse = cacheService.get(cacheKey);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(cachedResponse.status || 200).json(cachedResponse.body);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store into cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, { status: res.statusCode, body }, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};
