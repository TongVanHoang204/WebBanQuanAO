import { z } from 'zod';
export declare const checkoutSchema: z.ZodObject<{
    customer_name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    customer_phone: z.ZodString;
    ship_address_line1: z.ZodString;
    ship_address_line2: z.ZodOptional<z.ZodString>;
    ship_city: z.ZodString;
    ship_province: z.ZodString;
    ship_postal_code: z.ZodOptional<z.ZodString>;
    ship_country: z.ZodDefault<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    payment_method: z.ZodDefault<z.ZodEnum<["cod", "bank_transfer", "momo", "zalopay", "vnpay"]>>;
    coupon_code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customer_name: string;
    customer_phone: string;
    ship_address_line1: string;
    ship_city: string;
    ship_province: string;
    ship_country: string;
    payment_method: "cod" | "bank_transfer" | "momo" | "zalopay" | "vnpay";
    email?: string | undefined;
    ship_address_line2?: string | undefined;
    ship_postal_code?: string | undefined;
    note?: string | undefined;
    coupon_code?: string | undefined;
}, {
    customer_name: string;
    customer_phone: string;
    ship_address_line1: string;
    ship_city: string;
    ship_province: string;
    email?: string | undefined;
    ship_address_line2?: string | undefined;
    ship_postal_code?: string | undefined;
    ship_country?: string | undefined;
    note?: string | undefined;
    payment_method?: "cod" | "bank_transfer" | "momo" | "zalopay" | "vnpay" | undefined;
    coupon_code?: string | undefined;
}>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "confirmed", "paid", "processing", "shipped", "completed", "cancelled", "refunded"]>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "confirmed" | "paid" | "processing" | "shipped" | "completed" | "cancelled" | "refunded";
}, {
    status: "pending" | "confirmed" | "paid" | "processing" | "shipped" | "completed" | "cancelled" | "refunded";
}>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
//# sourceMappingURL=order.validator.d.ts.map