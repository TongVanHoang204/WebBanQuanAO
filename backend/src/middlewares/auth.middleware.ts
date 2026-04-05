import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { ApiError } from './error.middleware.js';
import { getJwtSecret, getTokenFromRequest } from '../utils/auth-session.js';

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

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      throw new ApiError(401, 'Access token required');
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.userId) },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (user.status === 'blocked') {
      throw new ApiError(403, 'Account is blocked');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.userId) },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        status: true
      }
    });

    if (user && user.status === 'active') {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }

  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      console.log(`[Auth] Access denied. User Role: ${req.user.role}, Required: ${roles.join(', ')}`);
      return next(new ApiError(403, 'Access denied'));
    }

    next();
  };
};
