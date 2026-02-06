import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';

interface Notification {
  id: string;
  type: 'order_new' | 'order_status' | 'product_low_stock' | 'product_out_of_stock' | 'system';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on mount and every 2 minutes (longer now that we have socket)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications via custom event from SocketContext
  useEffect(() => {
    const handleNewNotification = (event: any) => {
      const newNotif = event.detail;
      setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('new_notification_received', handleNewNotification);
    return () => window.removeEventListener('new_notification_received', handleNewNotification);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getNotifications({ limit: 10 });
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await notificationsAPI.deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
      case 'order_new':
      case 'order_status':
        return <Bell className={iconClass} />;
      case 'product_low_stock':
      case 'product_out_of_stock':
        return <Bell className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getTimeDiff = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
  };

  const renderNotificationItem = (notification: Notification) => {
    const baseClassName = `
      block px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors relative group
      ${!notification.is_read ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''}
    `;

    const content = (
      <div className="flex gap-3">
        <div className={`
          mt-1 p-2 rounded-lg flex-shrink-0
          ${!notification.is_read 
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
            : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400'
          }
        `}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`
              text-sm truncate
              ${!notification.is_read 
                ? 'font-semibold text-secondary-900 dark:text-white' 
                : 'font-medium text-secondary-700 dark:text-secondary-300'
              }
            `}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></span>
            )}
          </div>
          
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-secondary-500 dark:text-secondary-500">
              {getTimeDiff(notification.created_at)}
            </span>
            
            <div className="flex items-center gap-1">
              {!notification.is_read && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkAsRead(notification.id);
                  }}
                  className="p-1.5 hover:bg-white dark:hover:bg-secondary-600 rounded-full transition-colors text-primary-600 dark:text-primary-400"
                  title="Đánh dấu đã đọc"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => handleDelete(notification.id, e)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors text-red-500 dark:text-red-400 opacity-60 hover:opacity-100"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    // Use Link if notification has a link, otherwise use div
    if (notification.link) {
      return (
        <Link
          key={notification.id}
          to={notification.link}
          onClick={() => handleNotificationClick(notification)}
          className={baseClassName}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        key={notification.id}
        className={baseClassName}
        onClick={() => handleNotificationClick(notification)}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-lg transition-colors"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center font-bold shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-100 dark:border-secondary-700 overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-700 flex items-center justify-between">
            <h3 className="font-semibold text-secondary-900 dark:text-white">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đọc tất cả
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-2">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Không có thông báo
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Bạn sẽ nhận được thông báo ở đây
                </p>
              </div>
            ) : (
              <div className="divide-y divide-secondary-100 dark:divide-secondary-700">
                {notifications.map(notification => renderNotificationItem(notification))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-secondary-100 dark:border-secondary-700 text-center">
              <Link
                to="/profile"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                onClick={() => setIsOpen(false)}
              >
                Xem tất cả trong Hồ sơ
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
