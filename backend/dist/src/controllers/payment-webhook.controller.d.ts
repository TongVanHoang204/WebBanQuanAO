import { Request, Response, NextFunction } from 'express';
/**
 * Middleware: Verify HMAC-SHA256 signature from webhook provider (Casso/Sepay).
 * Expects header: x-webhook-signature = HMAC-SHA256(rawBody, secret)
 * Set PAYMENT_WEBHOOK_SECRET env var to enable verification.
 */
export declare const verifyWebhookSignature: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const handleBankWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=payment-webhook.controller.d.ts.map