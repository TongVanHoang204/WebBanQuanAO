import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Create VNPay Payment URL
 * POST /api/payment/create_url
 */
/**
 * Create VNPay Payment URL
 * POST /api/payment/create_url
 */
export declare const createPaymentUrl: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Handle VNPay Return (IPN/Callback)
 * GET /api/payment/vnpay_return
 */
export declare const vnpayReturn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Handle VNPay IPN (Server to Server)
 * GET /api/payment/vnpay_ipn
 */
export declare const vnpayIpn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get all transactions
 * GET /api/payment/transactions
 */
export declare const getTransactions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map