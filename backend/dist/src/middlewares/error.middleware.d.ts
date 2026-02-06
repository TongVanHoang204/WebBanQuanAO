import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(statusCode: number, message: string);
}
//# sourceMappingURL=error.middleware.d.ts.map