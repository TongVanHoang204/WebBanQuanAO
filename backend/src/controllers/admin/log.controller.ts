import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { logActivity } from '../../services/logger.service.js';

// Helper
const serialize = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

/**
 * Get activity logs
 * GET /api/admin/logs
 */
export const getLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', user_id, action, entity_type, entity_id, ip_address, search, start_date, end_date, role } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const where: any = {};

    if (user_id) where.user_id = BigInt(user_id as string);
    if (action) where.action = { contains: action as string };
    if (entity_type) where.entity_type = entity_type;
    if (entity_id) where.entity_id = { contains: entity_id as string };
    if (ip_address) where.ip_address = { contains: ip_address as string };
    if (role) where.user = { role: role as string };

    if (search) {
      const s = search as string;
      where.OR = [
        { action: { contains: s } },
        { entity_type: { contains: s } },
        { entity_id: { contains: s } },
        { ip_address: { contains: s } },
        { user: { username: { contains: s } } },
        { user: { full_name: { contains: s } } },
      ];
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date as string);
      if (end_date) {
        const endDate = new Date(end_date as string);
        endDate.setHours(23, 59, 59, 999);
        where.created_at.lte = endDate;
      }
    }

    const [logs, total, rollbackEntries] = await Promise.all([
      prisma.activity_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: {
            select: { id: true, username: true, full_name: true, role: true }
          }
        }
      }),
      prisma.activity_logs.count({ where }),
      prisma.activity_logs.findMany({
        where: { action: 'Khôi phục dữ liệu' },
        select: { details: true }
      })
    ]);

    // Build a set of log IDs that have already been rolled back
    const rolledBackIds = new Set<string>();
    for (const entry of rollbackEntries) {
      if (entry.details) {
        try {
          const d = JSON.parse(entry.details);
          if (d.rolled_back_from_log_id) rolledBackIds.add(String(d.rolled_back_from_log_id));
        } catch { /* ignore malformed */ }
      }
    }

    const annotatedLogs = serialize(logs).map((l: any) => ({
      ...l,
      is_rolled_back: rolledBackIds.has(String(l.id))
    }));

    res.json({
      success: true,
      data: {
        logs: annotatedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity log statistics
 * GET /api/admin/logs/stats
 */
export const getLogStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [totalToday, totalWeek, totalAll, actionGroups, entityGroups, topUsers] = await Promise.all([
      prisma.activity_logs.count({ where: { created_at: { gte: todayStart } } }),
      prisma.activity_logs.count({ where: { created_at: { gte: weekStart } } }),
      prisma.activity_logs.count(),
      prisma.activity_logs.groupBy({ by: ['action'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
      prisma.activity_logs.groupBy({ by: ['entity_type'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
      prisma.activity_logs.groupBy({ by: ['user_id'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5, where: { user_id: { not: null } } })
    ]);

    // Fetch user info for top users
    const topUserIds = topUsers.map(u => u.user_id!).filter(Boolean);
    const users = topUserIds.length > 0 ? await prisma.users.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, username: true, full_name: true, role: true, avatar_url: true }
    }) : [];

    const topUsersWithInfo = topUsers.map(u => {
      const user = users.find(usr => usr.id === u.user_id);
      return {
        user_id: u.user_id?.toString(),
        count: u._count.id,
        username: user?.username || 'Unknown',
        full_name: user?.full_name || null,
        role: user?.role || null,
        avatar_url: user?.avatar_url || null
      };
    });

    res.json({
      success: true,
      data: {
        totalToday,
        totalWeek,
        totalAll,
        actionDistribution: actionGroups.map(g => ({ action: g.action, count: g._count.id })),
        entityDistribution: entityGroups.map(g => ({ entity_type: g.entity_type, count: g._count.id })),
        topUsers: topUsersWithInfo
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export activity logs as CSV
 * GET /api/admin/logs/export
 */
export const exportLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { action, entity_type, search, start_date, end_date } = req.query;
    const where: any = {};

    if (action) where.action = { contains: action as string };
    if (entity_type) where.entity_type = entity_type;
    if (search) {
      const s = search as string;
      where.OR = [
        { action: { contains: s } },
        { entity_type: { contains: s } },
        { entity_id: { contains: s } },
        { user: { username: { contains: s } } },
        { user: { full_name: { contains: s } } },
      ];
    }
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date as string);
      if (end_date) {
        const endDate = new Date(end_date as string);
        endDate.setHours(23, 59, 59, 999);
        where.created_at.lte = endDate;
      }
    }

    const logs = await prisma.activity_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 5000,
      include: {
        user: { select: { username: true, full_name: true, role: true } }
      }
    });

    // BOM for UTF-8 Excel compatibility
    const BOM = '\uFEFF';
    const header = 'Thời gian,Người dùng,Vai trò,Hành động,Đối tượng,Mã đối tượng,IP,Chi tiết\n';
    const rows = logs.map(log => {
      const time = new Date(log.created_at!).toLocaleString('vi-VN');
      const user = log.user?.full_name || log.user?.username || 'System';
      const role = log.user?.role || '';
      const act = log.action || '';
      const entity = log.entity_type || '';
      const entityId = log.entity_id || '';
      const ip = log.ip_address || '';
      const details = (log.details || '').replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${time}","${user}","${role}","${act}","${entity}","${entityId}","${ip}","${details}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(BOM + header + rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a single log
 * DELETE /api/admin/logs/:id
 */
export const deleteLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Chỉ admin mới được xóa nhật ký hoạt động' } });
    }

    const { id } = req.params;
    const logId = Array.isArray(id) ? id[0] : id;
    await prisma.activity_logs.delete({
      where: { id: BigInt(logId) }
    });
    
    res.json({ success: true, message: 'Đã xóa nhật ký' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete multiple logs
 * POST /api/admin/logs/bulk-delete
 */
export const bulkDeleteLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Chỉ admin mới được xóa nhật ký hoạt động' } });
    }

    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có ID nào được cung cấp' });
    }

    const { count } = await prisma.activity_logs.deleteMany({
      where: {
        id: { in: ids.map((id: string) => BigInt(id)) }
      }
    });

    res.json({ success: true, message: `Đã xóa ${count} nhật ký` });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete logs older than a number of days
 * POST /api/admin/logs/delete-old
 */
export const deleteOldLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Chỉ admin mới được xóa nhật ký hoạt động' } });
    }

    const rawDays = Number(req.body?.days);
    const days = Number.isFinite(rawDays) && rawDays > 0 ? Math.floor(rawDays) : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count } = await prisma.activity_logs.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate
        }
      }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Xóa log cũ',
      entity_type: 'system',
      details: {
        deleted_count: count,
        cutoff_days: days,
        cutoff_date: cutoffDate.toISOString()
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Đã xóa ${count} nhật ký cũ hơn ${days} ngày`,
      data: { count, days }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rollback an entity to the state captured in a log entry
 * POST /api/admin/logs/:id/rollback
 */
export const rollbackLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Only admins can perform rollbacks
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Chỉ Admin mới có quyền khôi phục dữ liệu' } });
    }

    const { id } = req.params;
    const logId = Array.isArray(id) ? id[0] : id;
    const log = await prisma.activity_logs.findUnique({ where: { id: BigInt(logId) } });

    if (!log) {
      return res.status(404).json({ success: false, error: { message: 'Không tìm thấy nhật ký' } });
    }

    // Guard: prevent rolling back the same log twice
    const alreadyRolledBack = await prisma.activity_logs.findFirst({
      where: {
        action: 'Khôi phục dữ liệu',
        details: { contains: `"rolled_back_from_log_id":"${logId}"` }
      },
      select: { id: true }
    });
    if (alreadyRolledBack) {
      return res.status(409).json({ success: false, error: { message: 'Nhật ký này đã được khôi phục trước đó' } });
    }

    if (!log.details) {
      return res.status(400).json({ success: false, error: { message: 'Nhật ký này không có dữ liệu để khôi phục' } });
    }

    let details: any;
    try {
      details = JSON.parse(log.details);
    } catch {
      return res.status(400).json({ success: false, error: { message: 'Dữ liệu nhật ký không hợp lệ' } });
    }

    const entityType = log.entity_type;
    const entityId = log.entity_id;
    const isDelete = log.action?.includes('Xóa');

    // Build restore data: prefer explicit `before`, fall back to diff reconstruction, then deleted_data
    let restoreData: Record<string, any> = {};

    if (details.before && typeof details.before === 'object') {
      restoreData = { ...details.before };
    } else if (details.diff && typeof details.diff === 'object' && Object.keys(details.diff).length > 0) {
      // Reconstruct from diff — only changed fields but enough to invert the change
      for (const [field, change] of Object.entries(details.diff)) {
        restoreData[field] = (change as any).from;
      }
    } else if (details.deleted_data && typeof details.deleted_data === 'object') {
      restoreData = { ...details.deleted_data };
    } else if (entityType === 'inventory' && details.old_stock !== undefined) {
      restoreData = {
        old_stock: Number(details.old_stock),
        new_stock: details.new_stock !== undefined ? Number(details.new_stock) : undefined,
        type: details.type,
        note: details.note,
        product_name: details.product_name,
        variant_sku: details.variant_sku
      };
    } else {
      return res.status(400).json({ success: false, error: { message: 'Không tìm thấy dữ liệu trước đó để khôi phục' } });
    }

    // Remove system-managed fields
    const { id: _id, created_at, updated_at, password_hash, password, ...safeData } = restoreData as any;

    let result: any = null;

    switch (entityType) {
      case 'brand': {
        if (isDelete && details.deleted_data) {
          const brandId = details.deleted_data.id ? BigInt(details.deleted_data.id) : undefined;
          result = await prisma.brands.create({
            data: {
              ...(brandId ? { id: brandId } : {}),
              name: safeData.name,
              slug: safeData.slug,
              logo: safeData.logo ?? null,
              description: safeData.description ?? null,
              is_active: safeData.is_active ?? true,
            }
          });
        } else if (entityId) {
          result = await prisma.brands.update({
            where: { id: BigInt(entityId) },
            data: {
              ...(safeData.name !== undefined && { name: safeData.name }),
              ...(safeData.slug !== undefined && { slug: safeData.slug }),
              ...(safeData.logo !== undefined && { logo: safeData.logo }),
              ...(safeData.description !== undefined && { description: safeData.description }),
              ...(safeData.is_active !== undefined && { is_active: safeData.is_active }),
            }
          });
        }
        break;
      }
      case 'category': {
        if (isDelete && details.deleted_data) {
          const catId = details.deleted_data.id ? BigInt(details.deleted_data.id) : undefined;
          result = await prisma.categories.create({
            data: {
              ...(catId ? { id: catId } : {}),
              name: safeData.name,
              slug: safeData.slug,
              parent_id: safeData.parent_id ? BigInt(safeData.parent_id) : null,
              is_active: safeData.is_active ?? true,
              sort_order: safeData.sort_order ?? 0,
            }
          });
        } else if (entityId) {
          result = await prisma.categories.update({
            where: { id: BigInt(entityId) },
            data: {
              ...(safeData.name !== undefined && { name: safeData.name }),
              ...(safeData.slug !== undefined && { slug: safeData.slug }),
              ...(safeData.parent_id !== undefined && { parent_id: safeData.parent_id ? BigInt(safeData.parent_id) : null }),
              ...(safeData.is_active !== undefined && { is_active: safeData.is_active }),
              ...(safeData.sort_order !== undefined && { sort_order: safeData.sort_order }),
            }
          });
        }
        break;
      }
      case 'product': {
        if (entityId) {
          const productUpdate: Record<string, any> = {};
          const safeFields = ['name', 'description', 'is_active', 'sku'];
          for (const f of safeFields) {
            if (safeData[f] !== undefined) productUpdate[f] = safeData[f];
          }
          if (safeData.price !== undefined) productUpdate.price = Number(safeData.price);
          if (safeData.sale_price !== undefined) productUpdate.sale_price = safeData.sale_price != null ? Number(safeData.sale_price) : null;
          if (Object.keys(productUpdate).length > 0) {
            result = await prisma.products.update({ where: { id: BigInt(entityId) }, data: productUpdate });
          } else {
            return res.status(400).json({ success: false, error: { message: 'Không tìm thấy trường dữ liệu để khôi phục cho sản phẩm' } });
          }
        }
        break;
      }
      case 'user': {
        if (entityId) {
          const userUpdate: Record<string, any> = {};
          const safeFields = ['full_name', 'phone', 'role', 'status', 'address_line1', 'address_line2', 'city', 'province', 'country'];
          for (const f of safeFields) {
            if (safeData[f] !== undefined) userUpdate[f] = safeData[f];
          }
          if (Object.keys(userUpdate).length > 0) {
            result = await prisma.users.update({ where: { id: BigInt(entityId) }, data: userUpdate });
          } else {
            return res.status(400).json({ success: false, error: { message: 'Không tìm thấy trường dữ liệu để khôi phục cho người dùng' } });
          }
        }
        break;
      }
      case 'collection': {
        if (isDelete && details.deleted_data) {
          const collectionId = details.deleted_data.id ? BigInt(details.deleted_data.id) : undefined;
          result = await prisma.collections.create({
            data: {
              ...(collectionId ? { id: collectionId } : {}),
              name: safeData.name,
              slug: safeData.slug,
              image: safeData.image ?? null,
              description: safeData.description ?? null,
              is_active: safeData.is_active ?? true,
              is_featured: safeData.is_featured ?? false,
              featured_sort_order: safeData.featured_sort_order ?? 0
            }
          });
        } else if (entityId) {
          result = await prisma.collections.update({
            where: { id: BigInt(entityId) },
            data: {
              ...(safeData.name !== undefined && { name: safeData.name }),
              ...(safeData.slug !== undefined && { slug: safeData.slug }),
              ...(safeData.image !== undefined && { image: safeData.image }),
              ...(safeData.description !== undefined && { description: safeData.description }),
              ...(safeData.is_active !== undefined && { is_active: safeData.is_active }),
              ...(safeData.is_featured !== undefined && { is_featured: safeData.is_featured }),
              ...(safeData.featured_sort_order !== undefined && { featured_sort_order: Number(safeData.featured_sort_order) || 0 })
            }
          });
        }
        break;
      }
      case 'inventory': {
        if (!entityId || restoreData.old_stock === undefined) {
          return res.status(400).json({ success: false, error: { message: 'Không đủ dữ liệu để khôi phục tồn kho' } });
        }
        const variantId = BigInt(entityId);
        const restoredStock = Number(restoreData.old_stock);
        const currentVariant = await prisma.product_variants.findUnique({
          where: { id: variantId },
          select: { id: true, stock_qty: true }
        });
        if (!currentVariant) {
          return res.status(404).json({ success: false, error: { message: 'Không tìm thấy biến thể sản phẩm để khôi phục tồn kho' } });
        }
        const qtyDelta = Math.abs(restoredStock - currentVariant.stock_qty);
        result = await prisma.$transaction(async (tx) => {
          const updatedVariant = await tx.product_variants.update({
            where: { id: variantId },
            data: { stock_qty: restoredStock }
          });
          await tx.inventory_movements.create({
            data: {
              variant_id: variantId,
              type: 'adjust',
              qty: qtyDelta,
              note: `Rollback log #${log.id}${restoreData.note ? ` · ${restoreData.note}` : ''}`.slice(0, 255)
            }
          });
          return updatedVariant;
        });
        break;
      }
      case 'shipping_method': {
        if (isDelete && details.deleted_data) {
          const methodId = details.deleted_data.id ? BigInt(details.deleted_data.id) : undefined;
          result = await prisma.shipping_methods.create({
            data: {
              ...(methodId ? { id: methodId } : {}),
              name: safeData.name,
              code: safeData.code,
              description: safeData.description ?? null,
              base_fee: safeData.base_fee ?? 0,
              fee_per_kg: safeData.fee_per_kg ?? 0,
              min_days: safeData.min_days ?? 1,
              max_days: safeData.max_days ?? 3,
              provinces: safeData.provinces ?? null,
              is_active: safeData.is_active ?? true,
              sort_order: safeData.sort_order ?? 0
            }
          });
        } else if (entityId) {
          result = await prisma.shipping_methods.update({
            where: { id: BigInt(entityId) },
            data: {
              ...(safeData.name !== undefined && { name: safeData.name }),
              ...(safeData.code !== undefined && { code: safeData.code }),
              ...(safeData.description !== undefined && { description: safeData.description }),
              ...(safeData.base_fee !== undefined && { base_fee: safeData.base_fee }),
              ...(safeData.fee_per_kg !== undefined && { fee_per_kg: safeData.fee_per_kg }),
              ...(safeData.min_days !== undefined && { min_days: safeData.min_days }),
              ...(safeData.max_days !== undefined && { max_days: safeData.max_days }),
              ...(safeData.provinces !== undefined && { provinces: safeData.provinces }),
              ...(safeData.is_active !== undefined && { is_active: safeData.is_active }),
              ...(safeData.sort_order !== undefined && { sort_order: safeData.sort_order })
            }
          });
        }
        break;
      }
      case 'coupon': {
        if (isDelete && details.deleted_data) {
          const couponId = details.deleted_data.id ? BigInt(details.deleted_data.id) : undefined;
          result = await prisma.coupons.create({
            data: {
              ...(couponId ? { id: couponId } : {}),
              code: safeData.code,
              type: safeData.type,
              value: safeData.value,
              min_subtotal: safeData.min_subtotal ?? 0,
              max_discount: safeData.max_discount ?? null,
              start_at: safeData.start_at ? new Date(safeData.start_at) : null,
              end_at: safeData.end_at ? new Date(safeData.end_at) : null,
              usage_limit: safeData.usage_limit ?? null,
              usage_per_user: safeData.usage_per_user ?? null,
              is_active: safeData.is_active ?? true
            }
          });
        } else if (entityId) {
          result = await prisma.coupons.update({
            where: { id: BigInt(entityId) },
            data: {
              ...(safeData.code !== undefined && { code: safeData.code }),
              ...(safeData.type !== undefined && { type: safeData.type }),
              ...(safeData.value !== undefined && { value: safeData.value }),
              ...(safeData.min_subtotal !== undefined && { min_subtotal: safeData.min_subtotal }),
              ...(safeData.max_discount !== undefined && { max_discount: safeData.max_discount }),
              ...(safeData.start_at !== undefined && { start_at: safeData.start_at ? new Date(safeData.start_at) : null }),
              ...(safeData.end_at !== undefined && { end_at: safeData.end_at ? new Date(safeData.end_at) : null }),
              ...(safeData.usage_limit !== undefined && { usage_limit: safeData.usage_limit }),
              ...(safeData.usage_per_user !== undefined && { usage_per_user: safeData.usage_per_user }),
              ...(safeData.is_active !== undefined && { is_active: safeData.is_active })
            }
          });
        }
        break;
      }
      case 'banner': {
        if (isDelete && details.deleted_data) {
          const bannerId = details.deleted_data.id ? BigInt(details.deleted_data.id) : undefined;
          result = await prisma.banners.create({
            data: {
              ...(bannerId ? { id: bannerId } : {}),
              title: safeData.title,
              subtitle: safeData.subtitle ?? null,
              image_url: safeData.image_url,
              link_url: safeData.link_url ?? null,
              button_text: safeData.button_text ?? null,
              position: safeData.position ?? 'home_hero',
              sort_order: safeData.sort_order ?? 0,
              is_active: safeData.is_active ?? true,
              start_date: safeData.start_date ? new Date(safeData.start_date) : null,
              end_date: safeData.end_date ? new Date(safeData.end_date) : null,
              banner_images: Array.isArray(safeData.images) && safeData.images.length > 0
                ? {
                    create: safeData.images.map((imageUrl: string, index: number) => ({
                      image_url: imageUrl,
                      sort_order: index
                    }))
                  }
                : undefined
            }
          });
        } else if (entityId) {
          if (safeData.images !== undefined) {
            await prisma.banner_images.deleteMany({ where: { banner_id: BigInt(entityId) } });
          }
          result = await prisma.banners.update({
            where: { id: BigInt(entityId) },
            data: {
              ...(safeData.title !== undefined && { title: safeData.title }),
              ...(safeData.subtitle !== undefined && { subtitle: safeData.subtitle }),
              ...(safeData.image_url !== undefined && { image_url: safeData.image_url }),
              ...(safeData.link_url !== undefined && { link_url: safeData.link_url }),
              ...(safeData.button_text !== undefined && { button_text: safeData.button_text }),
              ...(safeData.position !== undefined && { position: safeData.position }),
              ...(safeData.sort_order !== undefined && { sort_order: safeData.sort_order }),
              ...(safeData.is_active !== undefined && { is_active: safeData.is_active }),
              ...(safeData.start_date !== undefined && { start_date: safeData.start_date ? new Date(safeData.start_date) : null }),
              ...(safeData.end_date !== undefined && { end_date: safeData.end_date ? new Date(safeData.end_date) : null }),
              ...(safeData.images !== undefined && {
                banner_images: {
                  create: Array.isArray(safeData.images)
                    ? safeData.images.map((imageUrl: string, index: number) => ({
                        image_url: imageUrl,
                        sort_order: index
                      }))
                    : []
                }
              })
            },
            include: { banner_images: true }
          });
        }
        break;
      }
      case 'settings': {
        const settingsToRestore = details.before && typeof details.before === 'object'
          ? details.before
          : restoreData;
        const settingEntries = Object.entries(settingsToRestore || {});
        if (settingEntries.length === 0) {
          return res.status(400).json({ success: false, error: { message: 'Không có cài đặt nào để khôi phục' } });
        }
        await prisma.$transaction(
          settingEntries.map(([key, value]) =>
            prisma.$executeRaw`
              INSERT INTO settings (\`key\`, value, updated_at)
              VALUES (${key}, ${String(value ?? '')}, NOW())
              ON DUPLICATE KEY UPDATE value = ${String(value ?? '')}, updated_at = NOW()
            `
          )
        );
        result = settingsToRestore;
        break;
      }
      default:
        return res.status(400).json({ success: false, error: { message: `Loại đối tượng "${entityType}" chưa hỗ trợ rollback` } });
    }

    if (!result) {
      return res.status(500).json({ success: false, error: { message: 'Không thể thực hiện khôi phục' } });
    }

    // Build restored_values: only include fields that actually changed
    // If the original log stored a diff, use only those keys (they are the changed fields)
    // For deletions (no diff), include everything since the whole entity is being restored
    const restoredValues: Record<string, any> = {};
    if (details.diff && typeof details.diff === 'object' && Object.keys(details.diff).length > 0) {
      for (const [field, change] of Object.entries(details.diff)) {
        restoredValues[field] = (change as any).from;
      }
    } else {
      for (const [k, v] of Object.entries(safeData)) {
        restoredValues[k] = v;
      }
    }

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Khôi phục dữ liệu',
      entity_type: entityType || undefined,
      entity_id: entityId || undefined,
      details: {
        rolled_back_from_log_id: log.id.toString(),
        original_action: log.action,
        entity_type: entityType,
        entity_id: entityId,
        restored_values: restoredValues,
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Khôi phục dữ liệu thành công' });
  } catch (error) {
    next(error);
  }
};
