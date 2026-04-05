import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../config/logger.js';
import jwt from 'jsonwebtoken';
import { getJwtSecret, getTokenFromRequest } from '../utils/auth-session.js';

export const maintenanceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.originalUrl || req.path;

  // Always allow auth routes (so admins can log in), specific admin routes, and uploads
  if (
    path.includes('/auth/') || 
    path.includes('/admin/') || 
    path.includes('/uploads') ||
    path.includes('/api-docs')
  ) {
    return next();
  }

  // Check if user is an admin/staff based on JWT
  const token = getTokenFromRequest(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      if (decoded && ['admin', 'manager', 'staff'].includes(decoded.role)) {
        return next(); // Admins bypass maintenance mode entirely
      }
    } catch (e) {
      // Invalid token, ignore and proceed to block if maintenance is on
    }
  }

  try {
    const maintenanceSetting = await prisma.settings.findUnique({
      where: { key: 'maintenance_mode' },
      select: { value: true }
    });

    if (maintenanceSetting?.value === 'true') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'MAINTENANCE_MODE',
          message: 'Hệ thống đang được bảo trì. Vui lòng quay lại sau.'
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking maintenance mode:', error);
    next(); // On DB error, let the request pass instead of blocking the whole site
  }
};
