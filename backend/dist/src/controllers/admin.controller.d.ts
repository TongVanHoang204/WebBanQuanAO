import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
export declare const createProduct: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProduct: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteProduct: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getDashboardStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminOrders: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createCategory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCategory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteCategory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUsers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=admin.controller.d.ts.map