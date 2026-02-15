import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema, addressSchema } from '../validators/auth.validator.js';
import { logActivity } from '../services/logger.service.js';
import { sendWelcomeEmail, sendResetPasswordEmail, sendOTP } from '../services/email.service.js';

// Helper to serialize BigInt for JSON
const serializeUser = (user: any) => ({
  id: user.id.toString(),
  username: user.username,
  email: user.email,
  full_name: user.full_name,
  phone: user.phone,
  address_line1: user.address_line1,
  city: user.city,
  province: user.province,
  role: user.role,
  status: user.status,
  avatar_url: user.avatar_url,
  created_at: user.created_at,
  two_factor_enabled: user.two_factor_enabled || false
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if email already exists
    const existingEmail = await prisma.users.findUnique({
      where: { email: validatedData.email }
    });

    if (existingEmail) {
      throw new ApiError(400, 'Email already registered');
    }

    // Check if username already exists
    const existingUsername = await prisma.users.findUnique({
      where: { username: validatedData.username }
    });

    if (existingUsername) {
      throw new ApiError(400, 'Username already taken');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(validatedData.password, salt);

    // Create user with default role 'customer'
    const user = await prisma.users.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        password_hash,
        full_name: validatedData.full_name,
        phone: validatedData.phone,
        role: 'customer',
        status: 'active'
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' as const }
    );

    // Send welcome email
    sendWelcomeEmail(user.email, user.full_name || user.username).catch(console.error);

    res.status(201).json({
      success: true,
      data: {
        user: serializeUser(user),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user by username
    const user = await prisma.users.findUnique({
      where: { username: validatedData.username }
    });

    if (!user) {
      throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }

    if (user.status === 'blocked') {
      throw new ApiError(403, 'Tài khoản của bạn đã bị khóa');
    }

    // Verify password
    if (!user.password_hash) {
      throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password_hash);

    if (!isValidPassword) {
      throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // CHECK 2FA
    // Cast to any because Client might not be regenerated yet
    const userWith2FA = user as any; 
    
    if (userWith2FA.two_factor_enabled) {
       // Generate OTP
       const otp = Math.floor(100000 + Math.random() * 900000).toString();
       const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

       // DEBUG: Log OTP to console
       console.log('====================================================');
       console.log(`>>> 2FA OTP CODE for ${user.email}: ${otp}`);
       console.log('====================================================');

       // Save OTP
       await prisma.users.update({
         where: { id: user.id },
         data: {
           two_factor_otp: otp,
           two_factor_expires: expires
         } as any // Bypass TS check
       });

       // Send Email
       await sendOTP(user.email, otp);

       // Return 2FA requirement (NO TOKEN)
       return res.json({
         success: true,
         require2fa: true,
         userId: user.id.toString(),
         email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
         message: 'Mã xác thực đã được gửi đến email của bạn'
       });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' as const }
    );

    res.json({
      success: true,
      data: {
        user: serializeUser(user),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      throw new ApiError(400, 'Thiếu thông tin xác thực');
    }

    const user = await prisma.users.findUnique({
      where: { id: BigInt(userId) }
    }) as any;

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.status === 'blocked') {
        throw new ApiError(403, 'Account is blocked');
    }

    // Verify OTP
    if (!user.two_factor_otp || user.two_factor_otp !== otp) {
      throw new ApiError(400, 'Mã OTP không chính xác');
    }

    if (!user.two_factor_expires || new Date() > new Date(user.two_factor_expires)) {
      throw new ApiError(400, 'Mã OTP đã hết hạn');
    }

    // Clear OTP
    await prisma.users.update({
      where: { id: user.id },
      data: {
        two_factor_otp: null,
        two_factor_expires: null
      } as any
    });

    // Generate Token
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' as const }
    );

    res.json({
      success: true,
      data: {
        user: serializeUser(user),
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

export const toggle2FA = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    
    const { enabled } = req.body; // true or false

    await prisma.users.update({
      where: { id: req.user.id },
      data: { two_factor_enabled: Boolean(enabled) } as any
    });

    res.json({
      success: true,
      message: enabled ? 'Đã bật xác thực 2 bước' : 'Đã tắt xác thực 2 bước',
      enabled: Boolean(enabled)
    });
  } catch (error) {
    next(error);
  }
};

// Google Auth
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { credential } = req.body;

    // Verify Google Token (Support both ID Token and Access Token)
    let googleId, email, name, picture;

    console.log('[GoogleAuth] Credential received length:', credential?.length);

    try {
       console.log('[GoogleAuth] Trying verifyIdToken...');
       // Try as ID Token
       const ticket = await client.verifyIdToken({
         idToken: credential,
         audience: process.env.GOOGLE_CLIENT_ID,
       });
       const payload = ticket.getPayload();
       console.log('[GoogleAuth] verifyIdToken success:', payload?.email);
       if (payload) {
         googleId = payload.sub;
         email = payload.email;
         name = payload.name;
         picture = payload.picture;
       }
    } catch (e: any) {
       console.log('[GoogleAuth] verifyIdToken failed:', e.message);
       // Try as Access Token
       try {
         console.log('[GoogleAuth] Trying fetch userinfo with Access Token...');
         const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
           headers: { Authorization: `Bearer ${credential}` }
         });
         
         if (!res.ok) {
            const errorText = await res.text();
            console.log('[GoogleAuth] UserInfo response not OK:', res.status, errorText);
            throw new Error('Invalid Token');
         }
         
         const payload = await res.json() as any;
         console.log('[GoogleAuth] UserInfo success:', payload.email);
         
         googleId = payload.sub;
         email = payload.email;
         name = payload.name;
         picture = payload.picture;
       } catch (innerError: any) {
         console.error('[GoogleAuth] All verification methods failed:', innerError);
         throw new ApiError(400, 'Invalid Google Token: ' + innerError.message);
       }
    }

    if (!email) {
      throw new ApiError(400, 'Invalid Google Token (No Email)');
    }

    // Check if user exists
    let user = await prisma.users.findFirst({
      where: {
        OR: [
          { google_id: googleId },
          { email: email }
        ]
      }
    });

    if (user) {
      // Update google_id and avatar if missing
      if (!user.google_id || !user.avatar_url) {
        user = await prisma.users.update({
          where: { id: user.id },
          data: { 
            google_id: googleId,
            avatar_url: picture,
             // If user was created by email/pass but now verifying with Google, we can trust this.
          }
        });
      }

      if (user.status === 'blocked') {
        throw new ApiError(403, 'Account is blocked');
      }

    } else {
      // Create new user
      // Generate a random username base on name
      const baseUsername = email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      
      // Ensure unique username
      while (await prisma.users.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.users.create({
        data: {
          username,
          email,
          full_name: name,
          google_id: googleId,
          avatar_url: picture,
          role: 'customer',
          status: 'active'
        }
      });
      
      // Send welcome email
      sendWelcomeEmail(user.email, user.full_name || user.username).catch(console.error);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' as const }
    );

    res.json({
      success: true,
      data: {
        user: serializeUser(user),
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        two_factor_enabled: true
      }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const { full_name, phone, address_line1, city, province, avatar_url } = validatedData;

    const user = await prisma.users.update({
      where: { id: req.user.id },
      data: {
        full_name,
        phone,
        address_line1,
        city,
        province,
        avatar_url
      }
    });

    res.json({
      success: true,
      data: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const getMyActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const logs = await prisma.activity_logs.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: logs.map(log => ({
        ...log,
        id: log.id.toString(),
        user_id: log.user_id?.toString(),
        details: log.details ? JSON.parse(log.details) : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new ApiError(400, 'Please provide current and new password');
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.password_hash) {
      throw new ApiError(400, 'Current account has no password set');
    }
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError(400, 'Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await prisma.users.update({
      where: { id: req.user.id },
      data: { password_hash }
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal user existence
      return res.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
      });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to user record (using the 2FA fields as temporary storage)
    await prisma.users.update({
      where: { id: user.id },
      data: {
        two_factor_otp: resetToken,
        two_factor_expires: resetExpires
      } as any
    });

    console.log(`[RESET PASSWORD] Token for ${email}: ${resetToken}`);

    // Send real email with reset link
    sendResetPasswordEmail(email, resetToken).catch(console.error);
    
    res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      throw new ApiError(400, 'Thiếu thông tin cần thiết');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Find user and verify token
    const user = await prisma.users.findUnique({
      where: { email }
    }) as any;

    if (!user) {
      throw new ApiError(400, 'Link đặt lại mật khẩu không hợp lệ');
    }

    // Check token
    if (!user.two_factor_otp || user.two_factor_otp !== token) {
      throw new ApiError(400, 'Mã xác nhận không đúng hoặc đã được sử dụng');
    }

    // Check expiry
    if (!user.two_factor_expires || new Date() > new Date(user.two_factor_expires)) {
      throw new ApiError(400, 'Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password and clear token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash,
        two_factor_otp: null,
        two_factor_expires: null
      } as any
    });

    res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADDRESS MANAGEMENT ====================

export const getAddresses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');

    const addresses = await prisma.shipping_addresses.findMany({
      where: { user_id: req.user.id },
      orderBy: { is_default: 'desc' } // Default first
    });

    res.json({
      success: true,
      data: addresses.map(addr => ({ ...addr, id: addr.id.toString(), user_id: addr.user_id.toString() }))
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    
    const validatedData = addressSchema.parse(req.body);
    const { full_name, phone, address_line1, city, province, type, is_default } = validatedData;

    // If making this default, unset others
    if (is_default) {
      await prisma.shipping_addresses.updateMany({
        where: { user_id: req.user.id },
        data: { is_default: false }
      });
    }

    // Check if this is the first address, make it default automatically
    const count = await prisma.shipping_addresses.count({ where: { user_id: req.user.id } });
    const shouldBeDefault = is_default || count === 0;

    const address = await prisma.shipping_addresses.create({
      data: {
        user_id: req.user.id,
        full_name,
        phone,
        address_line1,
        city,
        province,
        type: type || 'Nhà riêng',
        is_default: shouldBeDefault
      }
    });

    // Sync with main profile if default (Optional, for backward compatibility)
    if (shouldBeDefault) {
      await prisma.users.update({
        where: { id: req.user.id },
        data: { address_line1, city, province, phone, full_name }
      });
    }

    res.status(201).json({
      success: true,
      data: { ...address, id: address.id.toString(), user_id: address.user_id.toString() }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;
    const validatedData = addressSchema.parse(req.body);
    const { full_name, phone, address_line1, city, province, type, is_default } = validatedData;

    // Verify ownership
    const existing = await prisma.shipping_addresses.findUnique({
      where: { id: BigInt(id as string) }
    });

    if (!existing || existing.user_id !== req.user.id) {
       throw new ApiError(403, 'Address not found or unauthorized');
    }

    // Handle default toggle
    if (is_default) {
      await prisma.shipping_addresses.updateMany({
        where: { user_id: req.user.id, id: { not: BigInt(id as string) } },
        data: { is_default: false }
      });
    }

    const updated = await prisma.shipping_addresses.update({
      where: { id: BigInt(id as string) },
      data: {
        full_name,
        phone,
        address_line1,
        city,
        province,
        type,
        is_default
      }
    });

     // Sync with main profile if default
     if (is_default) {
      await prisma.users.update({
        where: { id: req.user.id },
        data: { address_line1, city, province, phone, full_name }
      });
    }

    res.json({
      success: true,
      data: { ...updated, id: updated.id.toString(), user_id: updated.user_id.toString() }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;

    const existing = await prisma.shipping_addresses.findUnique({
      where: { id: BigInt(id as string) }
    });

    if (!existing || existing.user_id !== req.user.id) {
       throw new ApiError(403, 'Address not found or unauthorized');
    }

    await prisma.shipping_addresses.delete({
      where: { id: BigInt(id as string) }
    });

    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    const { id } = req.params;

    const existing = await prisma.shipping_addresses.findUnique({
      where: { id: BigInt(id as string) }
    });

    if (!existing || existing.user_id !== req.user.id) {
       throw new ApiError(403, 'Address not found or unauthorized');
    }

    await prisma.$transaction([
       prisma.shipping_addresses.updateMany({
          where: { user_id: req.user.id, id: { not: BigInt(id as string) } },
          data: { is_default: false }
       }),
       prisma.shipping_addresses.update({
          where: { id: BigInt(id as string) },
          data: { is_default: true }
       }),
       // Sync main profile
       prisma.users.update({
          where: { id: req.user.id },
          data: { 
             address_line1: existing.address_line1,
             city: existing.city,
             province: existing.province,
             phone: existing.phone,
             full_name: existing.full_name
          }
       })
    ]);

    res.json({ success: true, message: 'Default address updated' });
  } catch (error) {
    next(error);
  }
};
