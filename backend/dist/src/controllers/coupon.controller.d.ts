import { Request, Response } from 'express';
export declare const getCoupons: (req: Request, res: Response) => Promise<void>;
export declare const getCoupon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createCoupon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCoupon: (req: Request, res: Response) => Promise<void>;
export declare const deleteCoupon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const applyCoupon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=coupon.controller.d.ts.map