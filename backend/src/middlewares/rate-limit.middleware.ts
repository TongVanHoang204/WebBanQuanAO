import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';

/**
 * Simple in-memory rate limiter (no external dependency).
 * Keyed by IP + optional userId for authenticated requests.
 * Automatically cleans expired entries every 5 minutes.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Create a rate limiter middleware.
 * @param name   Unique name for this limiter's store
 * @param max    Maximum requests allowed in the window
 * @param windowMs  Time window in milliseconds
 */
export function rateLimit(name: string, max: number, windowMs: number) {
  if (!stores.has(name)) stores.set(name, new Map());
  const store = stores.get(name)!;

  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const key = authReq.user
      ? `user:${authReq.user.id}`
      : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;

    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Add standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter} giây.`,
      });
    }

    next();
  };
}

export function authAccountThrottle(
  name: string,
  max: number,
  windowMs: number,
  getAccountKey: (req: Request) => string | null
) {
  if (!stores.has(name)) stores.set(name, new Map());
  const store = stores.get(name)!;

  return (req: Request, res: Response, next: NextFunction) => {
    const rawKey = getAccountKey(req);
    if (!rawKey) {
      return next();
    }

    const key = `account:${rawKey.toLowerCase()}`;
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: {
          message: `Tài khoản này đang bị giới hạn tạm thời. Vui lòng thử lại sau ${retryAfter} giây.`
        }
      });
    }

    next();
  };
}
