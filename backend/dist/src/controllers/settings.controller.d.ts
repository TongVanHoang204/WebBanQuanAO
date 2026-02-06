import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getSettings: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSettings: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadLogo: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPublicSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=settings.controller.d.ts.map