import { LRUCache } from 'lru-cache';
import { config } from './env.js';

let hitCount = 0;
let missCount = 0;
let evictionCount = 0;

// Initialize bounded high-throughput LRU cache
export const cache = new LRUCache({
  max: 2000, // Maximum items in cache
  ttl: config.cacheTtl * 1000, // Time to live in ms
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
  dispose: () => {
    evictionCount++;
  },
});

/**
 * Cache helper functions with hit/miss/eviction metrics
 */
export const cacheService = {
  get: (key) => {
    const val = cache.get(key);
    if (val !== undefined) {
      hitCount++;
    } else {
      missCount++;
    }
    return val;
  },

  set: (key, val, ttlSeconds) => {
    const options = ttlSeconds ? { ttl: ttlSeconds * 1000 } : undefined;
    return cache.set(key, val, options);
  },

  has: (key) => cache.has(key),
  delete: (key) => cache.delete(key),
  clear: () => {
    cache.clear();
    hitCount = 0;
    missCount = 0;
    evictionCount = 0;
  },

  // Invalidate all keys matching a prefix (e.g. 'http:/api/v1/products')
  invalidatePrefix: (prefix) => {
    for (const key of cache.keys()) {
      if (typeof key === 'string' && key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  },

  stats: () => {
    const totalRequests = hitCount + missCount;
    const hitRatio = totalRequests > 0 ? (hitCount / totalRequests) * 100 : 0;
    return {
      size: cache.size,
      max: cache.max,
      ttl: config.cacheTtl,
      hits: hitCount,
      misses: missCount,
      evictions: evictionCount,
      hitRatioPercent: parseFloat(hitRatio.toFixed(2)),
    };
  },
};
