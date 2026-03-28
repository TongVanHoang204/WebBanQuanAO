interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
interface OrderEmailPayload {
    order_code: string;
    grand_total: number | string | {
        toString(): string;
    };
    admin_note?: string | null;
    user?: {
        email?: string | null;
    } | null;
}
export declare const attachOrderEmailToAdminNote: (adminNote: string | null | undefined, email?: string | null) => string | null;
export declare const getOrderEmailFromAdminNote: (adminNote?: string | null) => string | null;
export declare const sendEmail: ({ to, subject, html }: EmailOptions) => Promise<boolean>;
export declare const sendWelcomeEmail: (email: string, name: string) => Promise<boolean>;
export declare const sendResetPasswordEmail: (email: string, token: string) => Promise<boolean>;
export declare const sendOrderConfirmationEmail: (email: string, orderCode: string, total: number) => Promise<boolean>;
export declare const sendOrderConfirmationForOrder: (order: OrderEmailPayload) => Promise<boolean>;
export declare const sendOTP: (email: string, otp: string) => Promise<boolean>;
export {};
//# sourceMappingURL=email.service.d.ts.map