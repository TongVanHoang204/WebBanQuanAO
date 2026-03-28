export type NotificationType =
  | 'order_new'
  | 'order_status'
  | 'product_low_stock'
  | 'product_out_of_stock'
  | 'system';

export type NotificationCategory = 'all' | 'unread' | 'order' | 'inventory' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  is_read: boolean | number;
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  orders: number;
  inventory: number;
  system: number;
}

const extractInventorySku = (message: string): string | null => {
  const match = message.match(/SKU:\s*([^).,\s]+)/i);
  return match?.[1] || null;
};

export const getNotificationLink = (notification: Pick<NotificationItem, 'type' | 'link' | 'message'>): string | null => {
  if (notification.type === 'product_low_stock' || notification.type === 'product_out_of_stock') {
    const sku = extractInventorySku(notification.message);
    if (sku) {
      return `/admin/inventory?lowStock=true&sku=${encodeURIComponent(sku)}&open=true`;
    }

    return '/admin/inventory?lowStock=true';
  }

  return notification.link || null;
};

export const normalizeNotification = (notification: NotificationItem): NotificationItem => ({
  ...notification,
  id: String(notification.id),
  link: getNotificationLink(notification),
  is_read: Boolean(Number(notification.is_read))
});

export const getNotificationCategory = (type: NotificationType): Exclude<NotificationCategory, 'all' | 'unread'> => {
  if (type === 'order_new' || type === 'order_status') {
    return 'order';
  }

  if (type === 'product_low_stock' || type === 'product_out_of_stock') {
    return 'inventory';
  }

  return 'system';
};

export const matchesNotificationCategory = (
  notification: NotificationItem,
  category: NotificationCategory
): boolean => {
  const normalized = normalizeNotification(notification);

  if (category === 'all') {
    return true;
  }

  if (category === 'unread') {
    return !normalized.is_read;
  }

  return getNotificationCategory(normalized.type) === category;
};

export const formatNotificationRelativeTime = (dateString: string): string => {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const buildEmptySummary = (): NotificationSummary => ({
  total: 0,
  unread: 0,
  orders: 0,
  inventory: 0,
  system: 0
});

export const notificationEvents = {
  created: 'new_notification_received',
  markedRead: 'notification_marked_read',
  markedAllRead: 'notifications_marked_all_read',
  deleted: 'notification_deleted'
} as const;

export const emitNotificationMarkedRead = (id: string) => {
  window.dispatchEvent(new CustomEvent(notificationEvents.markedRead, { detail: { id } }));
};

export const emitNotificationsMarkedAllRead = () => {
  window.dispatchEvent(new CustomEvent(notificationEvents.markedAllRead));
};

export const emitNotificationDeleted = (id: string) => {
  window.dispatchEvent(new CustomEvent(notificationEvents.deleted, { detail: { id } }));
};
