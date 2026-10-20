import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * JWT Authentication Middleware
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Bearer token in Authorization header.',
    });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        expired: err.name === 'TokenExpiredError',
      });
    }

    req.user = decoded;
    next();
  });
};

/**
 * Role-Based Access Control: Admin Only
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrative privileges required.',
    });
  }
  next();
};
