import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/logger.service.js';

export const getCoupons = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page as string) || 1;
        const limit = Number(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const query = req.query.query as string;

        const whereClause: any = {};
        if (query) {
            whereClause.code = { contains: query };
        }

        const [coupons, total] = await Promise.all([
            prisma.coupons.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    _count: {
                        select: { coupon_redemptions: true }
                    }
                }
            }),
            prisma.coupons.count({ where: whereClause })
        ]);

        // Map data tạo field used_count
        const data = coupons.map(c => ({
            ...c,
            used_count: c._count.coupon_redemptions
        }));

        res.json({
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const coupon = await prisma.coupons.findUnique({
            where: { id: BigInt(id as string) }
        });

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { code, type, value, min_subtotal, start_at, end_at, usage_limit, is_active } = req.body;
        
        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }
        if (value === undefined || value === null) {
            return res.status(400).json({ success: false, message: 'Coupon value is required' });
        }
        if (!type || !['percent', 'fixed'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type must be "percent" or "fixed"' });
        }
        if (Number(value) < 0) {
            return res.status(400).json({ success: false, message: 'Value must be non-negative' });
        }
        if (type === 'percent' && Number(value) > 100) {
            return res.status(400).json({ success: false, message: 'Percent value cannot exceed 100' });
        }
        if (start_at && end_at && new Date(end_at) <= new Date(start_at)) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        // Check if code exists
        const existing = await prisma.coupons.findUnique({
            where: { code }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: `Mã giảm giá "${code}" đã tồn tại` });
        }

        const coupon = await prisma.coupons.create({
            data: {
                code,
                type,
                value,
                min_subtotal: min_subtotal || 0,
                start_at: start_at ? new Date(start_at) : null,
                end_at: end_at ? new Date(end_at) : null,
                usage_limit: usage_limit ? Number(usage_limit) : null,
                is_active: is_active ?? true
            }
        });

        await logActivity({
          user_id: BigInt((req as any).user?.id || 0),
          action: 'Tạo mã giảm giá',
          entity_type: 'coupon',
          entity_id: String(coupon.id),
          details: { code, type, value },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });

        res.status(201).json({ success: true, data: coupon });
    } catch (error: any) {
        console.error('Create coupon error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, type, value, min_subtotal, start_at, end_at, usage_limit, is_active } = req.body;

        // Validate type if provided
        if (type && !['percent', 'fixed'].includes(type)) {
            return res.status(400).json({ message: 'Type must be "percent" or "fixed"' });
        }
        if (value !== undefined && Number(value) < 0) {
            return res.status(400).json({ message: 'Value must be non-negative' });
        }
        if (type === 'percent' && value !== undefined && Number(value) > 100) {
            return res.status(400).json({ message: 'Percent value cannot exceed 100' });
        }
        if (start_at && end_at && new Date(end_at) <= new Date(start_at)) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        // Check if coupon exists
        const existing = await prisma.coupons.findUnique({
            where: { id: BigInt(id as string) }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Check code uniqueness if code is being changed
        if (code && code !== existing.code) {
            const duplicate = await prisma.coupons.findUnique({ where: { code } });
            if (duplicate) {
                return res.status(400).json({ message: 'Coupon code already exists' });
            }
        }

        const coupon = await prisma.coupons.update({
            where: { id: BigInt(id as string) },
            data: {
                code,
                type,
                value,
                min_subtotal,
                start_at: start_at ? new Date(start_at) : null,
                end_at: end_at ? new Date(end_at) : null,
                usage_limit: usage_limit ? Number(usage_limit) : null,
                is_active
            }
        });

        await logActivity({
          user_id: BigInt((req as any).user?.id || 0),
          action: 'Cập nhật mã giảm giá',
          entity_type: 'coupon',
          entity_id: String(id),
          details: { code: coupon.code },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });

        res.json(coupon);
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const couponId = BigInt(id as string);

        // Check if coupon has been used in orders
        const usageCount = await prisma.coupon_redemptions.count({
            where: { coupon_id: couponId }
        });

        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa mã giảm giá này vì đã được sử dụng ${usageCount} lần trong đơn hàng.`
            });
        }

        await prisma.coupons.delete({
            where: { id: couponId }
        });

        await logActivity({
          user_id: BigInt((req as any).user?.id || 0),
          action: 'Xóa mã giảm giá',
          entity_type: 'coupon',
          entity_id: String(id),
          details: { },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });

        res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
// ... (previous functions)

export const applyCoupon = async (req: Request, res: Response) => {
    try {
        // Validate input with Zod
        const { applyCouponSchema } = await import('../validators/coupon.validator.js');
        const parsed = applyCouponSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ 
            message: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' 
          });
        }
        const { code, subtotal } = parsed.data;

        const coupon = await prisma.coupons.findUnique({
            where: { code }
        });

        if (!coupon) {
            return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
        }

        if (!coupon.is_active) {
            return res.status(400).json({ message: 'Mã giảm giá đã hết hạn hoặc bị khóa' });
        }

        const now = new Date();
        if (coupon.start_at && now < coupon.start_at) {
             return res.status(400).json({ message: 'Mã giảm giá chưa có hiệu lực' });
        }
        if (coupon.end_at && now > coupon.end_at) {
             return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
        }

        if (coupon.usage_limit) {
            const usageCount = await prisma.coupon_redemptions.count({
                where: { coupon_id: coupon.id }
            });
            if (usageCount >= coupon.usage_limit) {
                return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
            }
        }

        if (subtotal < Number(coupon.min_subtotal)) {
             return res.status(400).json({ 
                 message: `Đơn hàng tối thiểu để áp dụng mã này là ${Number(coupon.min_subtotal).toLocaleString('vi-VN')}đ` 
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === 'percent') {
            discountAmount = (subtotal * Number(coupon.value)) / 100;
            if (coupon.max_discount) {
                discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
            }
        } else {
            discountAmount = Number(coupon.value);
            if (coupon.max_discount) {
                discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
            }
        }

        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        // Don't save usage_count here, only when order is placed.
        // For now just return the discount info.

        res.json({
            success: true,
            data: {
                code: coupon.code,
                discount_amount: discountAmount,
                type: coupon.type,
                value: Number(coupon.value)
            }
        });

    } catch (error) {
        console.error('Apply coupon error:', error);
        res.status(500).json({ message: 'Lỗi server khi kiểm tra mã giảm giá' });
    }
};
