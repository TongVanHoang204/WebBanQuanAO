import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: bigint;
        username: string;
        email: string;
        full_name: string | null;
        role: string;
    };
}
export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}
export declare const verifyToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const authorize: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map