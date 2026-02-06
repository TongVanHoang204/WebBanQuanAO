import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Safe logging to prevent inspector crash on certain Prisma errors
  console.error('[ErrorHandler] Caught Error:', err.name, err.message, err.code);
  if (process.env.NODE_ENV === 'development' && err.stack) {
      console.error(err.stack);
  }
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    // Format Zod errors into a readable string
    // e.g. "price: Price must be non-negative"
    message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
  }

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      statusCode = 409;
      // const target = (err.meta?.target as string[])?.join(', ') || 'field';
      message = `Generic unique constraint violation. One of the unique fields (e.g. SKU, Slug) already exists.`;
      // Try to be more specific if possible
       if (err.meta && err.meta.target) {
           message = `Unique constraint failed on the fields: ${(err.meta.target as any).join(', ')}`;
       }
    }
    // Record not found
    if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found or operation not allowed.';
    }
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token session';
  }
  if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
