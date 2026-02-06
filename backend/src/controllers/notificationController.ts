import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getIO } from '../socket.js';

const prisma = new PrismaClient();

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

/**
 * Get all notifications for current user
 * GET /api/admin/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { page = 1, limit = 20, unread_only = 'false' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { user_id: userId };
    if (unread_only === 'true') {
      where.is_read = false;
    }

    // Use raw query since notifications model might not be generated yet
    let notifications: NotificationData[];
    let total: number;
    
    if (unread_only === 'true') {
      notifications = await prisma.$queryRaw<NotificationData[]>`
        SELECT * FROM notifications 
        WHERE (user_id = ${userId} OR user_id IS NULL) AND is_read = false
        ORDER BY created_at DESC 
        LIMIT ${Number(limit)} OFFSET ${skip}
      `;
      const countResult = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count FROM notifications WHERE (user_id = ${userId} OR user_id IS NULL) AND is_read = false
      `;
      total = Number(countResult[0]?.count || 0);
    } else {
      notifications = await prisma.$queryRaw<NotificationData[]>`
        SELECT * FROM notifications 
        WHERE (user_id = ${userId} OR user_id IS NULL)
        ORDER BY created_at DESC 
        LIMIT ${Number(limit)} OFFSET ${skip}
      `;
      const countResult = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count FROM notifications WHERE (user_id = ${userId} OR user_id IS NULL)
      `;
      total = Number(countResult[0]?.count || 0);
    }

    // Convert BigInt to string for JSON serialization
    const serializedNotifications = notifications.map((n: NotificationData) => ({
      ...n,
      id: n.id.toString(),
      user_id: n.user_id?.toString(),
      is_read: Boolean(Number(n.is_read)) // Robust conversion for raw query results
    }));

    res.json({
      success: true,
      data: {
        notifications: serializedNotifications,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM notifications 
      WHERE (user_id = ${userId} OR user_id IS NULL) AND is_read = false
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

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notificationId = BigInt(id as string);

    // Check ownership
    const existing = await prisma.$queryRaw<NotificationData[]>`
      SELECT * FROM notifications WHERE id = ${notificationId} AND user_id = ${userId}
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
        ...existing[0],
        id: existing[0].id.toString(),
        user_id: existing[0].user_id?.toString(),
        is_read: true,
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

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.$executeRaw`
      UPDATE notifications SET is_read = true 
      WHERE (user_id = ${userId} OR user_id IS NULL) AND is_read = false
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

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notificationId = BigInt(id as string);

    // Check ownership
    const existing = await prisma.$queryRaw<NotificationData[]>`
      SELECT * FROM notifications WHERE id = ${notificationId} AND user_id = ${userId}
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
    const result = await prisma.$queryRaw<{id: bigint}[]>`
      INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
      VALUES (${data.user_id}, ${data.type}, ${data.title}, ${data.message}, ${data.link || null}, false, NOW())
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
        link: data.link,
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
