import { z } from 'zod';
export declare const addToCartSchema: z.ZodObject<{
    variant_id: z.ZodNumber;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    variant_id: number;
    quantity: number;
}, {
    variant_id: number;
    quantity?: number | undefined;
}>;
export declare const updateCartItemSchema: z.ZodObject<{
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
}, {
    quantity: number;
}>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
//# sourceMappingURL=cart.validator.d.ts.map