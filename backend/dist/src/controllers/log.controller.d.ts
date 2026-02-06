import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get activity logs
 * GET /api/admin/logs
 */
export declare const getLogs: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=log.controller.d.ts.map