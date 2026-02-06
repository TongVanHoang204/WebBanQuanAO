interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare const sendEmail: ({ to, subject, html }: EmailOptions) => Promise<boolean>;
export declare const sendWelcomeEmail: (email: string, name: string) => Promise<boolean>;
export declare const sendResetPasswordEmail: (email: string, token: string) => Promise<boolean>;
export declare const sendOrderConfirmationEmail: (email: string, orderCode: string, total: number) => Promise<boolean>;
export declare const sendOTP: (email: string, otp: string) => Promise<boolean>;
export {};
//# sourceMappingURL=email.service.d.ts.map