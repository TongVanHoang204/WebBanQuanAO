import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get all shipping methods
 * GET /api/admin/shipping
 */
export declare const getShippingMethods: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get shipping method by ID
 * GET /api/admin/shipping/:id
 */
export declare const getShippingMethodById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create shipping method
 * POST /api/admin/shipping
 */
export declare const createShippingMethod: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update shipping method
 * PUT /api/admin/shipping/:id
 */
export declare const updateShippingMethod: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete shipping method
 * DELETE /api/admin/shipping/:id
 */
export declare const deleteShippingMethod: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Calculate shipping fee (public API)
 * POST /api/shipping/calculate
 */
export declare const calculateShippingFee: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=shipping.controller.d.ts.map