import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get all brands
 * GET /api/admin/brands
 */
export declare const getBrands: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get brand by ID
 * GET /api/admin/brands/:id
 */
export declare const getBrandById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create brand
 * POST /api/admin/brands
 */
export declare const createBrand: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update brand
 * PUT /api/admin/brands/:id
 */
export declare const updateBrand: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete brand
 * DELETE /api/admin/brands/:id
 */
export declare const deleteBrand: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=brand.controller.d.ts.map