import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
                orderBy: { created_at: 'desc' }
            }),
            prisma.coupons.count({ where: whereClause })
        ]);

        res.json({
            data: coupons,
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
            return res.status(400).json({ message: 'Coupon code is required' });
        }
        if (value === undefined || value === null) {
            return res.status(400).json({ message: 'Coupon value is required' });
        }

        // Check if code exists
        const existing = await prisma.coupons.findUnique({
            where: { code }
        });

        if (existing) {
            return res.status(400).json({ message: 'Coupon code already exists' });
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

        res.status(201).json(coupon);
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, type, value, min_subtotal, start_at, end_at, usage_limit, is_active } = req.body;

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
        res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
// ... (previous functions)

export const applyCoupon = async (req: Request, res: Response) => {
    try {
        const { code, subtotal } = req.body;
        
        if (!code) {
             return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
        }

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
        } else {
            discountAmount = Number(coupon.value);
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
