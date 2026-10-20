import { cacheService } from '../config/cache.js';

/**
 * Normalizes request URL by sorting query parameters alphabetically.
 * Ensures consistent cache hits regardless of query parameter order.
 */
const normalizeCacheKey = (req) => {
  const url = req.originalUrl || req.url;
  const [path, queryString] = url.split('?');

  if (!queryString) {
    return `http:${path}`;
  }

  const params = new URLSearchParams(queryString);
  params.sort(); // Sort keys alphabetically
  return `http:${path}?${params.toString()}`;
};

/**
 * Route-level cache middleware with parameter normalization and negative caching.
 * @param {number} ttlSeconds - Cache TTL in seconds for 200 OK responses
 * @param {number} negativeTtl - Short-lived TTL for 404 Not Found responses (default: 10s)
 */
export const cacheRoute = (ttlSeconds, negativeTtl = 10) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = normalizeCacheKey(req);
    const cachedResponse = cacheService.get(cacheKey);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(cachedResponse.status || 200).json(cachedResponse.body);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store into cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // 1. Cache successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, { status: res.statusCode, body }, ttlSeconds);
      }
      // 2. Negative caching for 404 Not Found to prevent DB hammering
      else if (res.statusCode === 404 && negativeTtl > 0) {
        cacheService.set(cacheKey, { status: 404, body }, negativeTtl);
      }

      return originalJson(body);
    };

    next();
  };
};
