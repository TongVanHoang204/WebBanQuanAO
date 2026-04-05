import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../services/logger.service.js';

interface AuthRequest extends Request {
  user?: any;
}

export const getPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

export const createPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    const existing = await prisma.permissions.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, error: { message: 'Quyen da ton tai' } });
    }

    await prisma.permissions.create({
      data: { name, description }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tao quyen/vai tro',
      entity_type: 'permission',
      entity_id: name,
      details: { name, description },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Tao quyen thanh cong' });
  } catch (error) {
    next(error);
  }
};

export const updatePermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const permissionId = Number(id);

    const existing = await prisma.permissions.findFirst({
      where: {
        name,
        id: { not: permissionId }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: { message: 'Ten quyen da duoc su dung' } });
    }

    await prisma.permissions.update({
      where: { id: permissionId },
      data: { name, description }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cap nhat quyen/vai tro',
      entity_type: 'permission',
      entity_id: String(id),
      details: { name, description },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Cap nhat quyen thanh cong' });
  } catch (error) {
    next(error);
  }
};

export const deletePermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const permId = Number(id);

    const perm = await prisma.permissions.findUnique({ where: { id: permId } });
    if (!perm) {
      return res.status(404).json({ success: false, error: { message: 'Khong tim thay quyen' } });
    }

    const userCount = await prisma.users.count({
      where: { role: perm.name }
    });

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Khong the xoa quyen/vai tro nay vi dang co ${userCount} nguoi dung so huu.` }
      });
    }

    await prisma.permissions.delete({ where: { id: permId } });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xoa quyen/vai tro',
      entity_type: 'permission',
      entity_id: String(id),
      details: { name: perm.name },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Xoa quyen thanh cong' });
  } catch (error) {
    next(error);
  }
};
