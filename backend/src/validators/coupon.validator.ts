import { z } from 'zod';

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, 'Coupon code is required')
    .max(50, 'Coupon code too long')
    .trim()
    .toUpperCase(),
  subtotal: z
    .number({ invalid_type_error: 'Subtotal must be a number' })
    .nonnegative('Subtotal must be non-negative')
    .max(1_000_000_000, 'Subtotal value is unreasonable'),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
