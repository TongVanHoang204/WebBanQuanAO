import rateLimit from 'express-rate-limit';

// Global rate limiter applied to all routes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    error: { message: 'Too many requests from this IP, please try again after 15 minutes' }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for sensitive routes like auth, login, register
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 auth requests per minute
  message: {
    success: false,
    error: { message: 'Too many authentication attempts, please try again later' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
