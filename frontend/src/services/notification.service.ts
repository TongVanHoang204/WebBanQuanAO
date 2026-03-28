import api from './api';
import { NotificationItem, NotificationSummary } from '../utils/notifications';

export interface NotificationListParams {
    page?: number;
    limit?: number;
    unread_only?: boolean;
    category?: 'order' | 'inventory' | 'system';
    search?: string;
    recent_hours?: number;
}

export interface NotificationListResponse {
    notifications: NotificationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: NotificationSummary;
}

export const notificationService = {
    getAll: async (params?: NotificationListParams) => {
        return api.get<{ success: boolean; data: NotificationListResponse }>('/admin/notifications', {
            params: {
                ...params,
                unread_only: params?.unread_only ? 'true' : undefined,
            }
        });
    },
    getUnread: async () => {
        return api.get('/admin/notifications', { params: { unread_only: 'true' } });
    },
    markRead: async (id: string) => {
        return api.patch(`/admin/notifications/${id}/read`);
    },
    markAllRead: async () => {
        return api.patch('/admin/notifications/read-all');
    },
    delete: async (id: string) => {
        return api.delete(`/admin/notifications/${id}`);
    }
};
