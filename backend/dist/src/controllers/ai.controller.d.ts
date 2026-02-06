import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
export declare const chatWithAI: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateContent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=ai.controller.d.ts.map