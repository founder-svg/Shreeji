import { LRUCache } from 'lru-cache';
import { config } from './env.js';

// Initialize high-throughput LRU cache
export const cache = new LRUCache({
  max: 1000, // Maximum items in cache
  ttl: config.cacheTtl * 1000, // Time to live in ms
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

/**
 * Cache helper functions
 */
export const cacheService = {
  get: (key) => cache.get(key),
  set: (key, val, ttlSeconds) => {
    const options = ttlSeconds ? { ttl: ttlSeconds * 1000 } : undefined;
    return cache.set(key, val, options);
  },
  has: (key) => cache.has(key),
  delete: (key) => cache.delete(key),
  clear: () => cache.clear(),
  
  // Invalidate all keys matching a prefix (e.g., 'products:', 'categories:')
  invalidatePrefix: (prefix) => {
    for (const key of cache.keys()) {
      if (typeof key === 'string' && key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  },

  stats: () => ({
    size: cache.size,
    max: cache.max,
    ttl: config.cacheTtl,
  }),
};
