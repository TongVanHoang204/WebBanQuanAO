import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
  full_name: z
    .string()
    .max(200, 'Full name must be at most 200 characters')
    .optional(),
  phone: z
    .string()
    .max(30, 'Phone must be at most 30 characters')
    .optional()
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  full_name: z.string().max(200).optional(),
  phone: z.string().max(15).regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  address_line1: z.string().max(255).optional(),
  city: z.string().max(120).optional(),
  province: z.string().max(120).optional(),
  avatar_url: z.string().max(1000).optional()
});

export const addressSchema = z.object({
  full_name: z.string().min(1, 'Họ tên là bắt buộc').max(200),
  phone: z.string().min(1, 'Số điện thoại là bắt buộc').max(15).regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  address_line1: z.string().min(1, 'Địa chỉ là bắt buộc').max(255),
  city: z.string().min(1, 'Thành phố là bắt buộc').max(120),
  province: z.string().min(1, 'Tỉnh/Thành là bắt buộc').max(120),
  type: z.string().max(50).optional(),
  is_default: z.boolean().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
