import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

// Default settings
const DEFAULT_SETTINGS = {
  store_name: 'Fashion Store',
  legal_entity_name: '',
  store_logo: '',
  support_email: '',
  support_phone: '',
  physical_address: '',
  maintenance_mode: 'false',
  seo_indexing: 'true',
  // Shipping settings
  shipping_standard_fee: '30000',
  shipping_free_threshold: '500000',
  shipping_min_days: '3',
  shipping_max_days: '5',
  // Social Login
  google_client_id: '',
  // Payment Settings
  payment_vnpay_enabled: 'false',
  payment_vnpay_tmn_code: '',
  payment_vnpay_hash_secret: '',
  payment_vnpay_url: '',
  payment_cod_enabled: 'true',
  payment_bank_enabled: 'false',
  payment_bank_info: '', // Legacy text
  payment_bank_id: '',   // e.g. 'VCB', 'MB'
  payment_bank_account: '',
  payment_bank_account_name: '',
  payment_momo_enabled: 'false',
  payment_momo_qrcode: '', // Image URL or Phone number
};

// Get all settings
export const getSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Use raw query because Prisma Client might not be regenerated yet
    const settings = await prisma.$queryRaw<any[]>`SELECT * FROM settings`;
    
    // Convert array to object and merge with defaults
    const settingsObj: { [key: string]: string } = { ...DEFAULT_SETTINGS };
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    next(error);
  }
};

// Update settings
export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const updates = req.body;
    const allowedKeys = Object.keys(DEFAULT_SETTINGS);
    const results: { [key: string]: string } = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedKeys.includes(key) && typeof value === 'string') {
        // Use raw query for upsert
        await prisma.$executeRaw`
          INSERT INTO settings (\`key\`, value, updated_at) 
          VALUES (${key}, ${value}, NOW()) 
          ON DUPLICATE KEY UPDATE value = ${value}, updated_at = NOW()
        `;
        results[key] = value;
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Cập nhật cài đặt thành công'
    });
  } catch (error) {
    next(error);
  }
};

// Upload logo
export const uploadLogo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    
    // Use raw query
    await prisma.$executeRaw`
      INSERT INTO settings (\`key\`, value, updated_at) 
      VALUES ('store_logo', ${logoUrl}, NOW()) 
      ON DUPLICATE KEY UPDATE value = ${logoUrl}, updated_at = NOW()
    `;

    res.json({
      success: true,
      data: { url: logoUrl }
    });
  } catch (error) {
    next(error);
  }
};

// Get public settings (Safe for frontend)
export const getPublicSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await prisma.$queryRaw<any[]>`SELECT * FROM settings`;
    
    const settingsObj: { [key: string]: string } = { ...DEFAULT_SETTINGS };
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    // Filter secure keys
    const safeSettings = {
      store_name: settingsObj.store_name,
      store_logo: settingsObj.store_logo,
      support_email: settingsObj.support_email,
      support_phone: settingsObj.support_phone,
      physical_address: settingsObj.physical_address,
      maintenance_mode: settingsObj.maintenance_mode,
      shipping_standard_fee: settingsObj.shipping_standard_fee,
      shipping_free_threshold: settingsObj.shipping_free_threshold,
      shipping_min_days: settingsObj.shipping_min_days,
      shipping_max_days: settingsObj.shipping_max_days,
      google_client_id: settingsObj.google_client_id,
      payment_cod_enabled: settingsObj.payment_cod_enabled,
      payment_vnpay_enabled: settingsObj.payment_vnpay_enabled,
      payment_bank_enabled: settingsObj.payment_bank_enabled,
      payment_bank_info: settingsObj.payment_bank_info,
      payment_bank_id: settingsObj.payment_bank_id,
      payment_bank_account: settingsObj.payment_bank_account,
      payment_bank_account_name: settingsObj.payment_bank_account_name,
      payment_momo_enabled: settingsObj.payment_momo_enabled,
      payment_momo_qrcode: settingsObj.payment_momo_qrcode,
    };

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    next(error);
  }
};
