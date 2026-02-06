import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get all notifications for current user
 * GET /api/admin/notifications
 */
export declare const getNotifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get unread notification count
 * GET /api/admin/notifications/unread-count
 */
export declare const getUnreadCount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Mark notification as read
 * PATCH /api/admin/notifications/:id/read
 */
export declare const markAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Mark all notifications as read
 * PATCH /api/admin/notifications/read-all
 */
export declare const markAllAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete notification
 * DELETE /api/admin/notifications/:id
 */
export declare const deleteNotification: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Helper function to create notification
 */
export declare const createNotification: (data: {
    user_id?: bigint | null;
    type: string;
    title: string;
    message: string;
    link?: string;
}) => Promise<boolean>;
//# sourceMappingURL=notificationController.d.ts.map