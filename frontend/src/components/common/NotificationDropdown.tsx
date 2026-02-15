
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin');
  const viewAllLink = isAdminPath ? '/admin/notifications' : '/profile';

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on mount and every 2 minutes
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications
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
    // Determine icon based on type if needed, currently generic Bell
    // Can map 'order_new' to ShoppingCart, etc.
    return <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
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
    const isUnread = !notification.is_read;
    const itemContent = (
      <div className="flex gap-4 p-3 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors relative group rounded-lg mx-1">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isUnread 
              ? 'bg-primary-100 dark:bg-primary-900/30' 
              : 'bg-secondary-100 dark:bg-secondary-800'
            }
          `}>
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-sm ${isUnread ? 'font-bold text-secondary-900 dark:text-white' : 'font-medium text-secondary-700 dark:text-secondary-300'} truncate`}>
              {notification.title}
            </h4>
            {isUnread && (
              <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5"></span>
            )}
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-1.5 messages-content">
            {notification.message}
          </p>
          <span className="text-xs text-secondary-500 dark:text-secondary-500 flex items-center gap-1">
            {getTimeDiff(notification.created_at)}
          </span>
        </div>

        {/* Actions (Absolute positioned or flex) */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-white dark:bg-secondary-800 shadow-sm rounded-lg p-1 border border-secondary-100 dark:border-secondary-700">
           {isUnread && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMarkAsRead(notification.id);
                }}
                className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-md transition-colors"
                title="Đã đọc"
              >
                <Check className="w-4 h-4" />
              </button>
           )}
           <button
              onClick={(e) => handleDelete(notification.id, e)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-md transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>
    );

    if (notification.link) {
      return (
        <Link
          key={notification.id}
          to={notification.link}
          onClick={() => handleNotificationClick(notification)}
          className="block"
        >
          {itemContent}
        </Link>
      );
    }

    return (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className="cursor-pointer"
      >
        {itemContent}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-secondary-800 rounded-xl shadow-xl border border-secondary-100 dark:border-secondary-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-700 flex items-center justify-between bg-white dark:bg-secondary-800">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[70vh] overflow-y-auto py-2">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
                </div>
                <p className="text-secondary-900 dark:text-white font-medium mb-1">Không có thông báo nào</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Bạn sẽ nhận được thông báo khi có cập nhật mới.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map(notification => renderNotificationItem(notification))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-secondary-100 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50">
            <Link
              to={viewAllLink}
              onClick={() => setIsOpen(false)}
              className="block w-full py-2 text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
            >
              Xem tất cả
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
