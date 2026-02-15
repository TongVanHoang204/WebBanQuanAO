import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import bcrypt from 'bcryptjs';
import { logActivity } from '../services/logger.service.js';
import { getIO } from '../socket.js';

const prisma = new PrismaClient();

// Helper to serialize BigInt
const serialize = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

/**
 * Get all staff members (non-customer users)
 * GET /api/admin/staff
 */
export const getStaffList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, status, search } = req.query;

    const where: any = {
      role: { not: 'customer' }
    };

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status === 'active') where.status = 'active';
    if (status === 'blocked') where.status = 'blocked';

    if (search) {
      where.OR = [
        { full_name: { contains: search as string } },
        { email: { contains: search as string } },
        { username: { contains: search as string } }
      ];
    }

    const staff = await prisma.users.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        role_def: {
          select: { name: true, description: true }
        }
      }
    });

    // Get available roles
    const roles = await prisma.permissions.findMany({
      where: { name: { not: 'customer' } },
      select: { name: true, description: true }
    });

    res.json({
      success: true,
      data: {
        staff: serialize(staff),
        roles
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get staff member by ID
 * GET /api/admin/staff/:id
 */
export const getStaffById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const staff = await prisma.users.findUnique({
      where: { id: BigInt(id as string) },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        address_line1: true,
        city: true,
        province: true,
        role_def: {
          select: { name: true, description: true }
        }
      }
    });

    if (!staff || staff.role === 'customer') {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy nhân viên' }
      });
    }

    res.json({
      success: true,
      data: serialize(staff)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new staff member
 * POST /api/admin/staff
 */
export const createStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, full_name, phone, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username, email và mật khẩu là bắt buộc' }
      });
    }

    if (role === 'customer') {
      return res.status(400).json({
        success: false,
        error: { message: 'Không thể tạo nhân viên với role customer' }
      });
    }

    // RESTRICTION: Only Admin can create new users (Staff/Manager/Admin)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Chỉ có Admin mới có quyền thêm nhân viên mới' }
      });
    }

    // Check existing
    const existing = await prisma.users.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username hoặc email đã tồn tại' }
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const staff = await prisma.users.create({
      data: {
        username,
        email,
        password_hash,
        full_name: full_name || null,
        phone: phone || null,
        role: role || 'staff',
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        status: true
      }
    });

    res.status(201).json({
      success: true,
      data: serialize(staff)
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'create_staff',
      entity_type: 'user',
      entity_id: staff.id.toString(),
      details: `Created staff account: ${username}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update staff member
 * PUT /api/admin/staff/:id
 */
export const updateStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, status, password } = req.body;

    const existing = await prisma.users.findUnique({
      where: { id: BigInt(id as string) }
    });

    if (!existing || existing.role === 'customer') {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy nhân viên' }
      });
    }

    // Prevent changing to customer role
    if (role === 'customer') {
      return res.status(400).json({
        success: false,
        error: { message: 'Không thể chuyển nhân viên thành customer' }
      });
    }

    // Prevent self-blocking or role change
    if (req.user?.id && existing.id === BigInt(req.user.id)) {
      if (status === 'blocked') {
        return res.status(400).json({
          success: false,
          error: { message: 'Bạn không thể tự khóa tài khoản của mình' }
        });
      }
      if (role && role !== existing.role) {
        return res.status(400).json({
          success: false,
          error: { message: 'Bạn không thể tự thay đổi quyền của mình' }
        });
      }
    }

    // PROTECT SUPER ADMIN (ID 1) from external block/role-change
    // Assuming ID 1 is the Owner/First User
    if (existing.id === BigInt(6)) {
      if (status === 'blocked' || (role && role !== 'admin')) {
         return res.status(403).json({
           success: false,
           error: { message: 'Không thể khóa hoặc đổi quyền của Tài khoản Gốc (Super Admin)' }
         });
      }
    }

    const updateData: any = {
      full_name: full_name !== undefined ? full_name : existing.full_name,
      phone: phone !== undefined ? phone : existing.phone,
      role: role || existing.role,
      status: status || existing.status
    };

    // RESTRICTION: Only Admin can block/unblock staff
    // Managers can update info but cannot change status 'blocked'
    if (status && status !== existing.status) {
      if (req.user?.role !== 'admin') {
         return res.status(403).json({
           success: false,
           error: { message: 'Chỉ có Admin mới có quyền chặn/mở chặn nhân viên' }
         });
      }
    }

    // SAME-ROLE PROTECTION: Admin cannot update another admin
    // Only Super Admin (ID 1 or 6) can update users of equal/higher role
    const isSuperAdmin = req.user?.id && (BigInt(req.user.id) === BigInt(1) || BigInt(req.user.id) === BigInt(6));
    const isSelf = req.user?.id && (BigInt(req.user.id) === existing.id);
    const targetRole = (existing.role || '').toLowerCase();

    // STRICT RULE: If target is Admin/Manager, only Super Admin (or Self) can touch it.
    if ((targetRole === 'admin' || targetRole === 'manager') && !isSuperAdmin && !isSelf) {
         return res.status(403).json({
            success: false,
            error: { message: 'Bạn không có quyền thay đổi thông tin của quản trị viên/quản lý khác.' }
         });
    }

    // Update password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // ... inside updateStaff function ...
    const staff = await prisma.users.update({
      where: { id: BigInt(id as string) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        status: true
      }
    });

    // CHANGE: Force logout if blocked
    if (status === 'blocked') {
      try {
        const io = getIO();
        const sockets = await io.fetchSockets(); // Use fetchSockets for multi-node compat if needed, or simple iteration
        
        for (const socket of sockets) {
          // Check if socket belongs to this user
          // Note: fetchSockets() returns RemoteSocket, we need to access properties carefully or cast if local
          // We stored userId on socket in middleware
          const s = socket as any; 
          if (s.userId && s.userId.toString() === id.toString()) {
            console.log(`[Admin] Force logging out blocked user: ${staff.username}`);
            socket.emit('force_logout', { message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
            socket.disconnect(true);
          }
        }
      } catch (e) {
        console.error('Error forcing logout:', e);
      }
    }

    res.json({
      success: true,
      data: serialize(staff)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete staff member
 * DELETE /api/admin/staff/:id
 */
export const deleteStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staffId = BigInt(id as string);

    const staff = await prisma.users.findUnique({
      where: { id: staffId }
    });

    if (!staff || staff.role === 'customer') {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy nhân viên' }
      });
    }

    // Prevent self-deletion
    if (req.user?.id && staff.id === BigInt(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Bạn không thể tự xóa tài khoản của mình' }
      });
    }

    // PROTECT SUPER ADMIN (ID 1)
    if (staff.id === BigInt(1)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Không thể xóa Tài khoản Gốc (Super Admin)' }
      });
    }

    // STRICT PROTECTION: Cannot delete Admin/Manager unless Super Admin
    const isSuperAdmin = req.user?.id && (BigInt(req.user.id) === BigInt(1) || BigInt(req.user.id) === BigInt(6));
    const targetRole = (staff.role || '').toLowerCase();
    
    if ((targetRole === 'admin' || targetRole === 'manager') && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: `Bạn không thể xóa quản trị viên/quản lý (${staff.role}). Chỉ Super Admin mới có quyền này.` }
      });
    }

    // Check if staff has processed any orders
    const activityCount = await prisma.activity_logs.count({
      where: { user_id: staffId }
    });

    if (activityCount > 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Không thể xóa nhân viên này vì có ${activityCount} hoạt động trong hệ thống. Hãy khóa tài khoản thay vì xóa.` }
      });
    }

    await prisma.users.delete({
      where: { id: staffId }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'delete_staff',
      entity_type: 'user',
      entity_id: id as string,
      details: `Deleted staff ID: ${id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Đã xóa nhân viên'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all available roles/permissions
 * GET /api/admin/roles
 */
export const getRoles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.permissions.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true } }
      }
    });

    res.json({
      success: true,
      data: serialize(roles)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new role
 * POST /api/admin/roles
 */
export const createRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tên vai trò phải có ít nhất 2 ký tự' }
      });
    }

    // Check existing
    const existing = await prisma.permissions.findUnique({
      where: { name: name.toLowerCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: 'Vai trò đã tồn tại' }
      });
    }

    const role = await prisma.permissions.create({
      data: {
        name: name.toLowerCase().trim(),
        description: description || null
      }
    });

    res.status(201).json({
      success: true,
      data: serialize(role)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update role
 * PUT /api/admin/roles/:id
 */
export const updateRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const role = await prisma.permissions.update({
      where: { id: parseInt(id as string) },
      data: { description }
    });

    res.json({
      success: true,
      data: serialize(role)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete role
 * DELETE /api/admin/roles/:id
 */
export const deleteRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await prisma.permissions.findUnique({
      where: { id: parseInt(id as string) },
      include: { _count: { select: { users: true } } }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy vai trò' }
      });
    }

    // Prevent deleting protected roles
    const protectedRoles = ['admin', 'customer', 'staff'];
    if (protectedRoles.includes(role.name)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Không thể xóa vai trò hệ thống' }
      });
    }

    if (role._count.users > 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Không thể xóa. Có ${role._count.users} người dùng với vai trò này.` }
      });
    }

    await prisma.permissions.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({
      success: true,
      message: 'Đã xóa vai trò'
    });
  } catch (error) {
    next(error);
  }
};
