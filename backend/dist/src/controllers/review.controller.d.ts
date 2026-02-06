import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get all reviews with filters
 * GET /api/admin/reviews
 */
export declare const getReviews: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get review by ID
 * GET /api/admin/reviews/:id
 */
export declare const getReviewById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update review status (approve/reject/hide)
 * PATCH /api/admin/reviews/:id/status
 */
export declare const updateReviewStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Bulk update review status
 * PATCH /api/admin/reviews/bulk-status
 */
export declare const bulkUpdateStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete review
 * DELETE /api/admin/reviews/:id
 */
export declare const deleteReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Bulk delete reviews
 * DELETE /api/admin/reviews/bulk
 */
export declare const bulkDeleteReviews: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get public reviews for a product
 * GET /api/reviews/product/:id
 */
export declare const getPublicReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create a review
 * POST /api/reviews
 */
export declare const createReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=review.controller.d.ts.map