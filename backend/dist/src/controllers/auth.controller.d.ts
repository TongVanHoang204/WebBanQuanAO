import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verify2FA: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const toggle2FA: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const googleLogin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyActivity: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const changePassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const forgotPassword: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAddresses: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const setDefaultAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map