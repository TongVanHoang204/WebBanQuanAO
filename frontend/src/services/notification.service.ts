import api from './api';

export interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: 'order_new' | 'order_status' | 'product_low_stock' | 'product_out_of_stock' | 'system';
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    getAll: async () => {
        return api.get('/admin/notifications');
    },
    getUnread: async () => {
        return api.get('/admin/notifications?unread=true');
    },
    markRead: async (id: number) => {
        return api.patch(`/admin/notifications/${id}/read`);
    },
    markAllRead: async () => {
        return api.patch('/admin/notifications/read-all');
    },
    delete: async (id: number) => {
        return api.delete(`/admin/notifications/${id}`);
    }
};
