import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { getIO } from '../../socket.js';

// Notification type for serialization
interface NotificationData {
  id: bigint;
  user_id: bigint | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: Date;
}

const extractInventorySku = (message: string): string | null => {
  const match = message.match(/SKU:\s*([^).,\s]+)/i);
  return match?.[1] || null;
};

const getDefaultNotificationLink = (type: string, message?: string): string | null => {
  if (INVENTORY_NOTIFICATION_TYPES.includes(type)) {
    const sku = message ? extractInventorySku(message) : null;
    if (sku) {
      return `/admin/inventory?lowStock=true&sku=${encodeURIComponent(sku)}&open=true`;
    }

    return '/admin/inventory?lowStock=true';
  }

  return null;
};

const resolveNotificationLink = (type: string, link?: string | null, message?: string): string | null => {
  const inventoryLink = getDefaultNotificationLink(type, message);

  if (inventoryLink) {
    return inventoryLink;
  }

  return link || null;
};

const SHARED_ADMIN_ROLES = new Set(['admin', 'manager', 'staff']);
const ORDER_NOTIFICATION_TYPES = ['order_new', 'order_status'];
const INVENTORY_NOTIFICATION_TYPES = ['product_low_stock', 'product_out_of_stock'];

const canAccessSharedNotifications = (role?: string | null): boolean =>
  role ? SHARED_ADMIN_ROLES.has(role) : false;

const getVisibilityCondition = (userId: bigint, includeShared: boolean) =>
  includeShared
    ? Prisma.sql`(user_id = ${userId} OR user_id IS NULL)`
    : Prisma.sql`user_id = ${userId}`;

const getCategoryCondition = (category?: string) => {
  if (!category || category === 'all') {
    return Prisma.empty;
  }

  if (category === 'order') {
    return Prisma.sql`AND type IN (${Prisma.join(ORDER_NOTIFICATION_TYPES)})`;
  }

  if (category === 'inventory') {
    return Prisma.sql`AND type IN (${Prisma.join(INVENTORY_NOTIFICATION_TYPES)})`;
  }

  if (category === 'system') {
    return Prisma.sql`AND type = 'system'`;
  }

  return Prisma.empty;
};

const toCount = (value: unknown): number => Number(value || 0);

const serializeNotification = (notification: NotificationData) => ({
  ...notification,
  id: notification.id.toString(),
  user_id: notification.user_id?.toString(),
  link: resolveNotificationLink(notification.type, notification.link, notification.message),
  is_read: Boolean(Number(notification.is_read))
});

/**
 * Get all notifications for current user
 * GET /api/admin/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const includeShared = canAccessSharedNotifications(req.user?.role);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      page = 1,
      limit = 20,
      unread_only = 'false',
      category,
      search,
      recent_hours
    } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (parsedPage - 1) * parsedLimit;
    const recentHours = Number(recent_hours);
    const visibilityCondition = getVisibilityCondition(userId, includeShared);
    const unreadCondition = unread_only === 'true' ? Prisma.sql`AND is_read = false` : Prisma.empty;
    const categoryCondition = getCategoryCondition(typeof category === 'string' ? category : undefined);
    const searchValue = typeof search === 'string' ? search.trim() : '';
    const searchCondition = searchValue
      ? Prisma.sql`AND (title LIKE ${`%${searchValue}%`} OR message LIKE ${`%${searchValue}%`})`
      : Prisma.empty;
    const recentCondition = Number.isFinite(recentHours) && recentHours > 0
      ? Prisma.sql`AND created_at >= DATE_SUB(NOW(), INTERVAL ${Math.floor(recentHours)} HOUR)`
      : Prisma.empty;

    const notifications = await prisma.$queryRaw<NotificationData[]>`
      SELECT * FROM notifications
      WHERE ${visibilityCondition}
      ${unreadCondition}
      ${categoryCondition}
      ${searchCondition}
      ${recentCondition}
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${skip}
    `;

    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM notifications
      WHERE ${visibilityCondition}
      ${unreadCondition}
      ${categoryCondition}
      ${searchCondition}
      ${recentCondition}
    `;
    const total = toCount(countResult[0]?.count);

    const summaryRows = await prisma.$queryRaw<Array<{
      total: bigint | number | null;
      unread: bigint | number | null;
      orders: bigint | number | null;
      inventory: bigint | number | null;
      system: bigint | number | null;
    }>>`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN type IN (${Prisma.join(ORDER_NOTIFICATION_TYPES)}) THEN 1 ELSE 0 END) as orders,
        SUM(CASE WHEN type IN (${Prisma.join(INVENTORY_NOTIFICATION_TYPES)}) THEN 1 ELSE 0 END) as inventory,
        SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system
      FROM notifications
      WHERE ${visibilityCondition}
    `;

    const summary = summaryRows[0] || {
      total: 0,
      unread: 0,
      orders: 0,
      inventory: 0,
      system: 0
    };

    res.json({
      success: true,
      data: {
        notifications: notifications.map(serializeNotification),
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
        summary: {
          total: toCount(summary.total),
          unread: toCount(summary.unread),
          orders: toCount(summary.orders),
          inventory: toCount(summary.inventory),
          system: toCount(summary.system)
        }
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get unread notification count
 * GET /api/admin/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const includeShared = canAccessSharedNotifications(req.user?.role);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const visibilityCondition = getVisibilityCondition(userId, includeShared);
    const result = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM notifications 
      WHERE ${visibilityCondition} AND is_read = false
    `;
    const count = Number(result[0]?.count || 0);

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Mark notification as read
 * PATCH /api/admin/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const includeShared = canAccessSharedNotifications(req.user?.role);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notificationId = BigInt(id as string);

    // Check ownership
    const visibilityCondition = getVisibilityCondition(userId, includeShared);
    const existing = await prisma.$queryRaw<NotificationData[]>`
      SELECT * FROM notifications WHERE id = ${notificationId} AND ${visibilityCondition}
    `;

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Update
    await prisma.$executeRaw`
      UPDATE notifications SET is_read = true WHERE id = ${notificationId}
    `;

    res.json({
      success: true,
      data: {
        ...serializeNotification(existing[0]),
        is_read: true
      },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/admin/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const includeShared = canAccessSharedNotifications(req.user?.role);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const visibilityCondition = getVisibilityCondition(userId, includeShared);
    await prisma.$executeRaw`
      UPDATE notifications SET is_read = true 
      WHERE ${visibilityCondition} AND is_read = false
    `;

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete notification
 * DELETE /api/admin/notifications/:id
 */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const includeShared = canAccessSharedNotifications(req.user?.role);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notificationId = BigInt(id as string);

    // Check ownership
    const visibilityCondition = getVisibilityCondition(userId, includeShared);
    const existing = await prisma.$queryRaw<NotificationData[]>`
      SELECT * FROM notifications WHERE id = ${notificationId} AND ${visibilityCondition}
    `;

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await prisma.$executeRaw`DELETE FROM notifications WHERE id = ${notificationId}`;

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Helper function to create notification
 */
export const createNotification = async (data: {
  user_id?: bigint | null;
  type: string;
  title: string;
  message: string;
  link?: string;
}) => {
  try {
    const resolvedLink = resolveNotificationLink(data.type, data.link, data.message);
    const result = await prisma.$queryRaw<{id: bigint}[]>`
      INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
      VALUES (${data.user_id}, ${data.type}, ${data.title}, ${data.message}, ${resolvedLink}, false, NOW())
      RETURNING id
    `;
    
    const notificationId = result[0]?.id;

    // Emit real-time notification via Socket.io
    try {
      const io = getIO();
      const notificationData = {
        id: notificationId?.toString(),
        type: data.type,
        title: data.title,
        message: data.message,
        link: resolvedLink,
        is_read: false,
        created_at: new Date()
      };

      // 1. If targeted at a specific user
      if (data.user_id) {
        io.to(`user-${data.user_id}`).emit('new-notification', notificationData);
      } else {
        // 2. If it's a system notification (no user_id) AND admin-relevant, send to admin room
        const adminTypes = ['order_new', 'product_low_stock', 'product_out_of_stock', 'system'];
        if (adminTypes.includes(data.type)) {
          io.to('admin-room').emit('new-notification', notificationData);
        }
      }
    } catch (socketErr) {
      console.error('Failed to emit socket notification:', socketErr);
    }

    return true;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};
