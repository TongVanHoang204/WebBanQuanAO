import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    full_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
    full_name?: string | undefined;
    phone?: string | undefined;
}, {
    username: string;
    email: string;
    password: string;
    full_name?: string | undefined;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
//# sourceMappingURL=auth.validator.d.ts.map