import { config } from '../config/env.js';

/**
 * Request Timeout Middleware
 * Ensures slow or hanging queries abort cleanly rather than consuming resources indefinitely.
 */
export const timeoutMiddleware = (req, res, next) => {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'Gateway Timeout: Request execution exceeded time limit.',
        requestId: req.id,
      });
    }
  }, config.requestTimeoutMs);

  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));

  next();
};
