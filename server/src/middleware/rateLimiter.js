import rateLimit from 'express-rate-limit';

const isTest = () => process.env.NODE_ENV === 'test';

// General API rate limiter: 120 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again in a minute.',
  },
});

// Strict limiter for authentication: 10 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes.',
  },
});

// Order and inquiry submission limiter: 15 submissions per 10 minutes
export const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: 'Too many submissions from this IP, please wait a few minutes.',
  },
});

// Upload limiter: 25 uploads per 15 minutes
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: 'Upload rate limit exceeded. Please try again later.',
  },
});
