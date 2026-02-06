import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
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
        const { page = '1', limit = '20', user_id, action, start_date, end_date } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const where = {};
        if (user_id)
            where.user_id = BigInt(user_id);
        if (action)
            where.action = action;
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
//# sourceMappingURL=log.controller.js.map