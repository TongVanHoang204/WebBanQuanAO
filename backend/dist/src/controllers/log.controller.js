import { prisma } from '../lib/prisma.js';
// Helper
const serialize = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
};
/**
 * Get activity logs
 * GET /api/admin/logs
 */
export const getLogs = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', user_id, action, entity_type, search, start_date, end_date, role } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const where = {};
        if (user_id)
            where.user_id = BigInt(user_id);
        if (action)
            where.action = { contains: action };
        if (entity_type)
            where.entity_type = entity_type;
        if (role)
            where.user = { role: role };
        if (search) {
            const s = search;
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
            if (start_date)
                where.created_at.gte = new Date(start_date);
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                where.created_at.lte = endDate;
            }
        }
        const [logs, total] = await Promise.all([
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
            prisma.activity_logs.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                logs: serialize(logs),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get activity log statistics
 * GET /api/admin/logs/stats
 */
export const getLogStats = async (req, res, next) => {
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
        const topUserIds = topUsers.map(u => u.user_id).filter(Boolean);
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
    }
    catch (error) {
        next(error);
    }
};
/**
 * Export activity logs as CSV
 * GET /api/admin/logs/export
 */
export const exportLogs = async (req, res, next) => {
    try {
        const { action, entity_type, search, start_date, end_date } = req.query;
        const where = {};
        if (action)
            where.action = { contains: action };
        if (entity_type)
            where.entity_type = entity_type;
        if (search) {
            const s = search;
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
            if (start_date)
                where.created_at.gte = new Date(start_date);
            if (end_date) {
                const endDate = new Date(end_date);
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
            const time = new Date(log.created_at).toLocaleString('vi-VN');
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
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=log.controller.js.map