import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get all banners (admin)
 * GET /api/admin/banners
 */
export declare const getBanners: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get active banners for public display
 * GET /api/banners
 */
export declare const getPublicBanners: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get banner by ID
 * GET /api/admin/banners/:id
 */
export declare const getBannerById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create banner
 * POST /api/admin/banners
 */
export declare const createBanner: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update banner
 * PUT /api/admin/banners/:id
 */
export declare const updateBanner: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update banner order (bulk)
 * PATCH /api/admin/banners/reorder
 */
export declare const reorderBanners: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete banner
 * DELETE /api/admin/banners/:id
 */
export declare const deleteBanner: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=banner.controller.d.ts.map