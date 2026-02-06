import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Download product import template
 * GET /api/admin/import/products/template
 */
export declare const downloadProductTemplate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Import products from Excel
 * POST /api/admin/import/products
 */
export declare const importProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=import.controller.d.ts.map