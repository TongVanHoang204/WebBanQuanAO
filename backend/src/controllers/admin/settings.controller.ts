import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { getIO } from '../../socket.js';
import { logActivity } from '../../services/logger.service.js';
import { deepDiff } from '../../utils/deepDiff.js';

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

const PUBLIC_SETTING_KEYS = [
  'store_name',
  'store_logo',
  'support_email',
  'support_phone',
  'physical_address',
  'maintenance_mode',
  'shipping_standard_fee',
  'shipping_free_threshold',
  'shipping_min_days',
  'shipping_max_days',
  'google_client_id',
  'payment_cod_enabled',
  'payment_vnpay_enabled',
  'payment_bank_enabled',
  'payment_bank_info',
  'payment_bank_id',
  'payment_bank_account',
  'payment_bank_account_name',
  'payment_momo_enabled',
  'payment_momo_qrcode'
] as const;

const pickPublicSettings = (source: Record<string, string>) =>
  PUBLIC_SETTING_KEYS.reduce<Record<string, string>>((acc, key) => {
    if (key in source) {
      acc[key] = source[key];
    }
    return acc;
  }, {});

// Get all settings
export const getSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await prisma.settings.findMany();
    
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
    const currentRows = await prisma.settings.findMany();
    const currentSettings: Record<string, string> = { ...DEFAULT_SETTINGS };
    currentRows.forEach((row) => {
      currentSettings[row.key] = row.value;
    });

    for (const [key, value] of Object.entries(updates)) {
      if (allowedKeys.includes(key) && typeof value === 'string') {
        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
        results[key] = value;
      }
    }

    const beforeSettings: Record<string, string> = {};
    const afterSettings: Record<string, string> = {};
    for (const key of Object.keys(results)) {
      beforeSettings[key] = currentSettings[key] ?? '';
      afterSettings[key] = results[key];
    }

    // Broadcast only public-safe settings to clients.
    try {
      const io = getIO();
      const publicResults = pickPublicSettings(results);
      if (io && Object.keys(publicResults).length > 0) {
        io.emit('settings-updated', publicResults);
      }
    } catch (socketErr) {
      console.error('Socket broadcast failed:', socketErr);
    }

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Cập nhật cài đặt hệ thống',
      entity_type: 'settings',
      entity_id: 'system',
      details: {
        before: beforeSettings,
        after: afterSettings,
        diff: deepDiff(beforeSettings, afterSettings)
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

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
    const existingLogo = await prisma.settings.findUnique({
      where: { key: 'store_logo' },
      select: { value: true }
    });
    const previousLogo = existingLogo?.value || '';

    await prisma.settings.upsert({
      where: { key: 'store_logo' },
      update: { value: logoUrl },
      create: { key: 'store_logo', value: logoUrl }
    });

    await logActivity({
      user_id: BigInt(req.user?.id || 0),
      action: 'Tải lên logo cửa hàng',
      entity_type: 'settings',
      entity_id: 'store_logo',
      details: {
        before: { store_logo: previousLogo },
        after: { store_logo: logoUrl },
        diff: deepDiff({ store_logo: previousLogo }, { store_logo: logoUrl })
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

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
    const settings = await prisma.settings.findMany();
    
    const settingsObj: { [key: string]: string } = { ...DEFAULT_SETTINGS };
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    // Filter secure keys
    const safeSettings = pickPublicSettings(settingsObj);

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    next(error);
  }
};
