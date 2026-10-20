import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID and Client Platform Tracking Middleware
 */
export const requestIdMiddleware = (req, res, next) => {
  // Capture incoming request ID or generate a fresh UUID
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Identify client platform (web, android, ios, admin-panel)
  const clientPlatform = (req.headers['x-client-platform'] || 'web').toLowerCase();
  req.clientPlatform = ['web', 'android', 'ios', 'admin-panel'].includes(clientPlatform)
    ? clientPlatform
    : 'web';
  res.setHeader('X-Client-Platform', req.clientPlatform);

  next();
};
