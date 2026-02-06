import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
export declare const checkout: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getOrders: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getOrderById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getOrderByCode: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateOrderStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllOrders: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const cancelOrder: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=order.controller.d.ts.map