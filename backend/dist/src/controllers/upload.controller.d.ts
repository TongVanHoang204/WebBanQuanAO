import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadSingle: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadMultiple: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteFile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=upload.controller.d.ts.map