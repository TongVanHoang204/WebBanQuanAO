import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if the store is in maintenance mode.
 * If enabled, it blocks all requests except for those starting with /api/admin or /api/auth.
 * This allows admins to still access the dashboard to turn off maintenance mode.
 */
export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Skip check for admin and auth routes
    if (req.path.startsWith('/admin') || req.path.startsWith('/auth') || req.path.startsWith('/settings/public')) {
      return next();
    }

    // 2. Fetch maintenance mode setting from DB
    // Optimization: In a real app, this should be cached (Redis or memory)
    const setting = await prisma.$queryRaw<any[]>`SELECT value FROM settings WHERE \`key\` = 'maintenance_mode' LIMIT 1`;
    
    const isMaintenance = setting.length > 0 && setting[0].value === 'true';

    if (isMaintenance) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'MAINTENANCE_MODE',
          message: 'Website đang bảo trì. Vui lòng quay lại sau.'
        }
      });
    }

    next();
  } catch (error) {
    // If DB fails, we still want the site to work if possible, or handle error normally
    console.error('[MaintenanceMiddleware] Error:', error);
    next();
  }
};
