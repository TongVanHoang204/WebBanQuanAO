import { Request, Response, NextFunction } from 'express';
export declare const getProducts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProductBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProductById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getNewArrivals: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const searchProducts: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=product.controller.d.ts.map