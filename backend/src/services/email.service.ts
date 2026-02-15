import nodemailer from 'nodemailer';
import { logActivity } from './logger.service.js';

// Create reusable transporter object using the default SMTP transport
// Create reusable transporter object using the default SMTP transport
const isResend = !!process.env.RESEND_API_KEY;

const transporter = nodemailer.createTransport({
  host: isResend ? 'smtp.resend.com' : (process.env.SMTP_HOST || 'smtp-relay.brevo.com'),
  port: isResend ? 465 : parseInt(process.env.SMTP_PORT || '2525'),
  secure: isResend ? true : (process.env.SMTP_SECURE === 'true'),
  auth: {
    user: isResend ? 'resend' : process.env.SMTP_USER,
    pass: isResend ? process.env.RESEND_API_KEY : process.env.SMTP_PASS,
  },
  // Timeout settings for slow connections (Render/Cloud)
  connectionTimeout: 30000, 
  greetingTimeout: 15000,   
  socketTimeout: 30000,     
  logger: true, 
  debug: false, 
});

// Verify connection configuration ONLY if credentials are present
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify(function (error, success) {
    if (error) {
      console.log('[Email] Server connection failed:', error);
    } else {
      console.log('[Email] Server is ready to take our messages');
    }
  });
} else {
  console.log('[Email] SMTP credentials missing. Email service will run in MOCK mode.');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[Email] SMTP credentials missing. Mock email sent to:', to);
      console.log('[Email] Subject:', subject);
      console.log('[Email] Body Preview:', html.substring(0, 200) + '...'); 
      return true; // Return success to avoid blocking flow in dev
    }

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Fashion Store'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('[Email] Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = 'Chào mừng đến với Fashion Store!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Xin chào ${name},</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Fashion Store</strong>.</p>
      <p>Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình khám phá phong cách thời trang mới.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Khám phá ngay</a>
      </div>
      <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">Đây là email tự động, vui lòng không trả lời email này.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const subject = 'Yêu cầu đặt lại mật khẩu - Fashion Store';
  // In a real app, this would link to a frontend page with the token
  // For this simplified flow, we send the token as a "code" or link
  // Let's assume we link to /reset-password?token=XYZ or just give them a temp code if logic dictates
  // But wait, the previous logic was just console log a token.
  // Ideally: Link to /reset-password?email=...&token=...
  
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Đặt lại mật khẩu</h2>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này.</p>
      <p>Mã xác nhận của bạn là: <strong style="font-size: 18px; color: #333;">${token}</strong></p>
      <p>Hoặc nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
      </div>
      <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
    </div>
  `;

  if (!process.env.SMTP_USER) {
      console.log('====================================================');
      console.log('>>> MOCK RESET LINK:', resetLink);
      console.log('>>> TOKEN:', token);
      console.log('====================================================');
  }
  return sendEmail({ to: email, subject, html });
};

export const sendOrderConfirmationEmail = async (email: string, orderCode: string, total: number) => {
  const subject = `Xác nhận đơn hàng #${orderCode} - Fashion Store`;
  const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">Đặt hàng thành công!</h2>
      <p>Cảm ơn bạn đã mua sắm tại <strong>Fashion Store</strong>.</p>
      <p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã được ghi nhận.</p>
      <p>Tổng giá trị: <strong>${formattedTotal}</strong></p>
      <p>Chúng tôi sẽ sớm liên hệ để xác nhận và giao hàng cho bạn.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem đơn hàng</a>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};


export const sendOTP = async (email: string, otp: string) => {
  const subject = 'Mã xác thực 2 bước (2FA) - Fashion Store';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Mã xác thực đăng nhập</h2>
      <p>Xin chào,</p>
      <p>Mã OTP để xác thực đăng nhập của bạn là:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <strong style="font-size: 32px; letter-spacing: 5px; color: #1F2937;">${otp}</strong>
      </div>
      <p>Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng đổi mật khẩu ngay lập tức.</p>
    </div>
  `;

  if (!process.env.SMTP_USER) {
      console.log('====================================================');
      console.log('>>> MOCK OTP CODE:', otp);
      console.log('====================================================');
  }
  return sendEmail({ to: email, subject, html });
};
