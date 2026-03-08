import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get activity logs
 * GET /api/admin/logs
 */
export declare const getLogs: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get activity log statistics
 * GET /api/admin/logs/stats
 */
export declare const getLogStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export activity logs as CSV
 * GET /api/admin/logs/export
 */
export declare const exportLogs: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=log.controller.d.ts.map