import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
export declare const getWishlist: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addToWishlist: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeFromWishlist: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=wishlist.controller.d.ts.map