import { z } from 'zod';
export const checkoutSchema = z.object({
    customer_name: z.string().min(1, 'Customer name is required').max(200),
    email: z.string().email('Email is invalid').optional().or(z.literal('')),
    customer_phone: z.string().min(1, 'Phone is required').max(30),
    ship_address_line1: z.string().min(1, 'Address is required').max(255),
    ship_address_line2: z.string().max(255).optional(),
    ship_city: z.string().min(1, 'City is required').max(120),
    ship_province: z.string().min(1, 'Province is required').max(120),
    ship_postal_code: z.string().max(20).optional(),
    ship_country: z.string().max(80).default('VN'),
    note: z.string().max(500).optional(),
    payment_method: z.enum(['cod', 'bank_transfer', 'momo', 'zalopay', 'vnpay']).default('cod'),
    coupon_code: z.string().max(50).optional()
});
export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'])
});
//# sourceMappingURL=order.validator.js.map