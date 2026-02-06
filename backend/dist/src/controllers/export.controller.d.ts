import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Export orders to Excel
 * GET /api/admin/export/orders
 */
export declare const exportOrders: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export products to Excel
 * GET /api/admin/export/products
 */
export declare const exportProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export customers to Excel
 * GET /api/admin/export/customers
 */
export declare const exportCustomers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export revenue report to Excel
 * GET /api/admin/export/revenue
 */
export declare const exportRevenue: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=export.controller.d.ts.map