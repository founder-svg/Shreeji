/**
 * High-resolution response timing middleware.
 * Records precise execution duration down to microseconds
 * and sets 'X-Response-Time' and 'Server-Timing' headers.
 */
export const timingMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationNs = end - start;
    const durationMs = Number(durationNs) / 1_000_000;
    
    // Header can only be set if not already sent
    // But for logging or metrics, durationMs is available
    res.responseTimeMs = durationMs;
  });

  // Intercept writeHead or setHeader
  const originalSend = res.send;
  res.send = function (...args) {
    const end = process.hrtime.bigint();
    const durationMs = (Number(end - start) / 1_000_000).toFixed(2);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs}ms`);
      res.setHeader('Server-Timing', `total;dur=${durationMs}`);
    }
    return originalSend.apply(this, args);
  };

  next();
};
