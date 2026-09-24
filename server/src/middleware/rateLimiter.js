const rateLimit = require('express-rate-limit');

// General API rate limiter. This React SPA fires several small requests
// per page (notifications, dashboard stats, categories, items, auth/me,
// etc.), and React 18 StrictMode double-invokes effects in development —
// so a low ceiling here trips almost immediately during normal use/testing
// and locks a person out of the whole API, including login. Kept generous
// in development and still reasonably safe in production.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 2000,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    message: 'Too many uploads, please try again later',
  },
});

module.exports = { apiLimiter, authLimiter, uploadLimiter };
