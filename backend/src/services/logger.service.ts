import { prisma } from '../lib/prisma.js';
import { createNotification } from '../controllers/admin/notificationController.js';

interface LogData {
  user_id?: bigint;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

// Critical actions that trigger admin notifications
const CRITICAL_ACTIONS = ['Xóa', 'delete'];

const ENTITY_LABELS: Record<string, string> = {
  product: 'Sản phẩm',
  order: 'Đơn hàng',
  user: 'Người dùng',
  category: 'Danh mục',
  coupon: 'Mã giảm giá',
  banner: 'Banner',
  settings: 'Cài đặt',
  brand: 'Thương hiệu',
  review: 'Đánh giá',
};

export const logActivity = async (data: LogData) => {
  try {
    await prisma.activity_logs.create({
      data: {
        user_id: data.user_id || null,
        action: data.action,
        entity_type: data.entity_type || null,
        entity_id: data.entity_id ? String(data.entity_id) : null,
        details: data.details ? JSON.stringify(data.details) : null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null
      }
    });

    // Trigger alert notification for critical actions
    const isCritical = CRITICAL_ACTIONS.some(a => data.action.toLowerCase().includes(a.toLowerCase()));
    if (isCritical && data.user_id) {
      try {
        // Get user info for notification message
        const user = await prisma.users.findUnique({
          where: { id: data.user_id },
          select: { username: true, full_name: true, role: true }
        });

        const userName = user?.full_name || user?.username || 'Unknown';
        const userRole = user?.role || 'unknown';
        const entityLabel = ENTITY_LABELS[data.entity_type?.toLowerCase() || ''] || data.entity_type || 'dữ liệu';
        const entityId = data.entity_id ? ` #${data.entity_id}` : '';

        await createNotification({
          user_id: null, // null = broadcast to admin-room
          type: 'system',
          title: '⚠️ Hành động quan trọng',
          message: `${userName} (${userRole}) đã ${data.action.toLowerCase()} ${entityLabel}${entityId}`,
          link: '/admin/logs'
        });
      } catch (notifErr) {
        console.error('Failed to send critical action notification:', notifErr);
      }
    }
  } catch (error) {
    console.error('Failed to create activity log:', error);
    // Don't throw error to avoid blocking main flow
  }
};
