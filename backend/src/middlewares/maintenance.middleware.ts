import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../config/logger.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && ['admin', 'manager', 'staff'].includes(decoded.role)) {
        return next(); // Admins bypass maintenance mode entirely
      }
    } catch (e) {
      // Invalid token, ignore and proceed to block if maintenance is on
    }
  }

  try {
    const settings = await prisma.$queryRaw<any[]>`SELECT value FROM settings WHERE \`key\` = 'maintenance_mode'`;
    
    if (settings && settings.length > 0 && settings[0].value === 'true') {
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
