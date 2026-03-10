import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../services/logger.service.js';

interface AuthRequest extends Request {
  user?: any;
}

// Get all permissions
export const getPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // raw query to bypass potential client generation issues
    const permissions = await prisma.$queryRaw`SELECT * FROM permissions ORDER BY created_at DESC`;
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

// Create permission
export const createPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    
    // Check if exists
    const existing: any[] = await prisma.$queryRaw`SELECT * FROM permissions WHERE name = ${name}`;
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: { message: 'Quyền đã tồn tại' } });
    }

    await prisma.$executeRaw`
      INSERT INTO permissions (name, description, created_at)
      VALUES (${name}, ${description}, NOW())
    `;

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tạo quyền/vai trò',
      entity_type: 'permission',
      entity_id: name,
      details: { name, description },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Tạo quyền thành công' });
  } catch (error) {
    next(error);
  }
};

// Update permission
export const updatePermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if another perm exists with same name (excluding self)
    const existing: any[] = await prisma.$queryRaw`
      SELECT * FROM permissions WHERE name = ${name} AND id != ${id}
    `;
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: { message: 'Tên quyền đã được sử dụng' } });
    }

    await prisma.$executeRaw`
      UPDATE permissions 
      SET name = ${name}, description = ${description}
      WHERE id = ${id}
    `;

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cập nhật quyền/vai trò',
      entity_type: 'permission',
      entity_id: String(id),
      details: { name, description },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Cập nhật quyền thành công' });
  } catch (error) {
    next(error);
  }
};

// Delete permission
export const deletePermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const permId = parseInt(id as string);
    
    // Check if permission is assigned to any user (via role)
    // Actually, permissions table holds ROLES definition (schema name `permissions` but logically `roles`).
    // So we check if any user has this role.
    const perm = await prisma.$queryRaw<any[]>`SELECT * FROM permissions WHERE id = ${permId}`;
    if (!perm || perm.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Không tìm thấy quyền' } });
    }
    const roleName = perm[0].name;

    const userCount = await prisma.users.count({
        where: { role: roleName }
    });

    if (userCount > 0) {
        return res.status(400).json({
            success: false,
            error: { message: `Không thể xóa quyền/vai trò này vì đang có ${userCount} người dùng sở hữu.` }
        });
    }

    await prisma.$executeRaw`DELETE FROM permissions WHERE id = ${permId}`;

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xóa quyền/vai trò',
      entity_type: 'permission',
      entity_id: String(id),
      details: { name: roleName },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Xóa quyền thành công' });
  } catch (error) {
    next(error);
  }
};
