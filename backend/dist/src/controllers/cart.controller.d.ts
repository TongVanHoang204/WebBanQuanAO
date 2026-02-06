import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
export declare const getCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addToCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCartItem: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const removeCartItem: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const clearCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const mergeCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=cart.controller.d.ts.map