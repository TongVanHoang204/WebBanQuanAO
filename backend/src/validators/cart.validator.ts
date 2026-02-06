import { z } from 'zod';

export const addToCartSchema = z.object({
  variant_id: z.number().int().positive('Variant ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1)
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1')
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
