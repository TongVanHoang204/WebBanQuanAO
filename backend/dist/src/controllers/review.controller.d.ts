import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
export declare const getProductReviews: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createReview: (req: Request, res: Response) => Promise<void>;
export declare const updateReviewStatus: (req: Request, res: Response) => Promise<void>;
export declare const getAdminReviews: (req: Request, res: Response) => Promise<void>;
export declare const bulkUpdateReviewStatus: (req: Request, res: Response) => Promise<void>;
export declare const bulkDeleteReviews: (req: Request, res: Response) => Promise<void>;
export declare const deleteReview: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=review.controller.d.ts.map