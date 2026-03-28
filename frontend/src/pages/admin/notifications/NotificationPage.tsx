import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  Clock3,
  ExternalLink,
  Package,
  Search,
  Settings,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../../components/common/Pagination';
import { notificationService } from '../../../services/notification.service';
import {
  buildEmptySummary,
  emitNotificationDeleted,
  emitNotificationMarkedRead,
  emitNotificationsMarkedAllRead,
  formatNotificationRelativeTime,
  getNotificationCategory,
  matchesNotificationCategory,
  normalizeNotification,
  notificationEvents,
  type NotificationCategory,
  type NotificationItem,
  type NotificationSummary
} from '../../../utils/notifications';

const PAGE_SIZE = 12;

const TABS: Array<{
  id: NotificationCategory;
  label: string;
  summaryKey?: keyof NotificationSummary;
  icon: typeof Bell;
}> = [
  { id: 'all', label: 'Tất cả', summaryKey: 'total', icon: Bell },
  { id: 'unread', label: 'Chưa đọc', summaryKey: 'unread', icon: CheckCheck },
  { id: 'order', label: 'Đơn hàng', summaryKey: 'orders', icon: Package },
  { id: 'inventory', label: 'Kho hàng', summaryKey: 'inventory', icon: AlertCircle },
  { id: 'system', label: 'Hệ thống', summaryKey: 'system', icon: Settings }
];

const getNotificationMeta = (type: NotificationItem['type']) => {
  switch (type) {
    case 'order_new':
      return {
        icon: Package,
        badge: 'Đơn mới',
        accent: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30'
      };
    case 'order_status':
      return {
        icon: Check,
        badge: 'Trạng thái',
        accent: 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30'
      };
    case 'product_low_stock':
    case 'product_out_of_stock':
      return {
        icon: AlertCircle,
        badge: 'Kho hàng',
        accent: 'text-rose-600 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30'
      };
    default:
      return {
        icon: Settings,
        badge: 'Hệ thống',
        accent: 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30'
      };
  }
};

const getNotificationAction = (notification: NotificationItem) => {
  if (notification.type === 'product_low_stock' || notification.type === 'product_out_of_stock') {
    return {
      label: 'Mở kho',
      className: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400'
    };
  }

  if (notification.type === 'order_new' || notification.type === 'order_status') {
    return {
      label: 'Mở đơn',
      className: 'bg-secondary-900 text-white dark:bg-white dark:text-secondary-900'
    };
  }

  return {
    label: 'Mở chi tiết',
    className: 'bg-secondary-900 text-white dark:bg-white dark:text-secondary-900'
  };
};

export default function NotificationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [search, setSearch] = useState('');
  const [recentOnly, setRecentOnly] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>(buildEmptySummary());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getAll({
        page,
        limit: PAGE_SIZE,
        unread_only: activeTab === 'unread',
        category: activeTab === 'order' || activeTab === 'inventory' || activeTab === 'system' ? activeTab : undefined,
        search: search.trim() || undefined,
        recent_hours: recentOnly ? 24 : undefined
      });
      const payload = response.data.data;
      setNotifications((payload.notifications || []).map(normalizeNotification));
      setSummary(payload.summary || buildEmptySummary());
      setTotalPages(Math.max(1, payload.totalPages || 1));
    } catch (error) {
      console.error('Fetch notifications error', error);
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchNotifications();
    }, 250);

    return () => clearTimeout(debounce);
  }, [activeTab, page, recentOnly, search]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, recentOnly]);

  useEffect(() => {
    const handleNewNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationItem>).detail;
      if (!detail) {
        fetchNotifications();
        return;
      }

      const incoming = normalizeNotification(detail);
      setSummary((prev) => ({
        total: prev.total + 1,
        unread: prev.unread + 1,
        orders: prev.orders + (getNotificationCategory(incoming.type) === 'order' ? 1 : 0),
        inventory: prev.inventory + (getNotificationCategory(incoming.type) === 'inventory' ? 1 : 0),
        system: prev.system + (getNotificationCategory(incoming.type) === 'system' ? 1 : 0)
      }));

      if (page !== 1) {
        return;
      }

      const matchesSearch = !search.trim() || [incoming.title, incoming.message].join(' ').toLowerCase().includes(search.trim().toLowerCase());
      const matchesRecent = !recentOnly || Date.now() - new Date(incoming.created_at).getTime() <= 24 * 60 * 60 * 1000;
      const matchesTab = matchesNotificationCategory(incoming, activeTab);

      if (!matchesSearch || !matchesRecent || !matchesTab) {
        return;
      }

      setNotifications((prev) => [incoming, ...prev.filter((item) => item.id !== incoming.id)].slice(0, PAGE_SIZE));
    };

    const handleMarkedRead = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setSummary((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    };

    const handleMarkedAllRead = () => {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setSummary((prev) => ({ ...prev, unread: 0 }));
    };

    const handleDeleted = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;

      setNotifications((prev) => prev.filter((item) => item.id !== id));
      fetchNotifications();
    };

    window.addEventListener(notificationEvents.created, handleNewNotification as EventListener);
    window.addEventListener(notificationEvents.markedRead, handleMarkedRead as EventListener);
    window.addEventListener(notificationEvents.markedAllRead, handleMarkedAllRead as EventListener);
    window.addEventListener(notificationEvents.deleted, handleDeleted as EventListener);

    return () => {
      window.removeEventListener(notificationEvents.created, handleNewNotification as EventListener);
      window.removeEventListener(notificationEvents.markedRead, handleMarkedRead as EventListener);
      window.removeEventListener(notificationEvents.markedAllRead, handleMarkedAllRead as EventListener);
      window.removeEventListener(notificationEvents.deleted, handleDeleted as EventListener);
    };
  }, [activeTab, page, recentOnly, search]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setSummary((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      emitNotificationMarkedRead(id);
    } catch (error) {
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      emitNotificationDeleted(id);
      toast.success('Đã xóa thông báo');
      fetchNotifications();
    } catch (error) {
      toast.error('Không thể xóa thông báo');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setSummary((prev) => ({ ...prev, unread: 0 }));
      emitNotificationsMarkedAllRead();
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Không thể cập nhật toàn bộ thông báo');
    }
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.link) {
      return;
    }

    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    navigate(notification.link);
  };

  const activeTabLabel = TABS.find((tab) => tab.id === activeTab)?.label || 'Tất cả';

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Thông báo</h1>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
            Một nơi gọn để theo dõi đơn hàng, kho hàng và cảnh báo hệ thống.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-secondary-500 dark:text-secondary-400">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-100 dark:bg-secondary-800 px-3 py-1.5">
              Đang xem
              <span className="font-semibold text-secondary-900 dark:text-white">{activeTabLabel}</span>
            </span>
            {recentOnly && (
              <span className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-950/30 px-3 py-1.5 font-medium text-primary-700 dark:text-primary-300">
                24 giờ gần nhất
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-sm text-secondary-700 dark:text-secondary-200">
            <Clock3 className="w-4 h-4" />
            {summary.unread} chưa đọc
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={summary.unread === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 disabled:bg-secondary-200 dark:disabled:bg-secondary-800 disabled:text-secondary-400 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            Đọc hết
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200 dark:border-secondary-700 p-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tiêu đề hoặc nội dung..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRecentOnly((value) => !value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                recentOnly
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/20 dark:text-primary-300'
                  : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-300'
              }`}
            >
              24 giờ gần nhất
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.summaryKey ? summary[tab.summaryKey] : 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary-900 text-white shadow-sm dark:bg-white dark:text-secondary-900'
                    : 'bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-950'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={`inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-[11px] ${
                    isActive
                      ? 'bg-white/15 text-white dark:bg-secondary-200 dark:text-secondary-900'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 rounded-2xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 py-20 text-center">
            <Bell className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Không có thông báo phù hợp</h2>
            <p className="mt-2 text-secondary-500 dark:text-secondary-400">
              Thử đổi bộ lọc hoặc đợi hệ thống phát sinh thông báo mới.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const meta = getNotificationMeta(notification.type);
            const action = getNotificationAction(notification);
            const Icon = meta.icon;
            const isUnread = !notification.is_read;
            const content = (
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-2">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-secondary-900 dark:text-white truncate">
                            {notification.title}
                          </h3>
                          {isUnread && <span className="inline-flex h-2 w-2 rounded-full bg-primary-500" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.accent}`}>
                            {meta.badge}
                          </span>
                          {isUnread && (
                            <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                              Mới
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-full bg-secondary-100 dark:bg-secondary-900 px-2 py-1 text-[11px] font-medium text-secondary-500 dark:text-secondary-400">
                            {formatNotificationRelativeTime(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-secondary-400 dark:text-secondary-500 whitespace-nowrap">
                        #{notification.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
                    {notification.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-secondary-700 text-xs font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Đánh dấu đã đọc
                      </button>
                    )}

                    {notification.link ? (
                      <button
                        onClick={() => handleOpenNotification(notification)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${action.className}`}
                      >
                        {action.label}
                        <ArrowRight className="w-3.5 h-3.5" />
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );

            return (
              <div
                key={notification.id}
                className={`rounded-2xl border p-4 bg-white dark:bg-secondary-800 transition-colors ${
                  isUnread
                    ? 'border-primary-200 dark:border-primary-900/30 shadow-sm'
                    : 'border-secondary-200 dark:border-secondary-700'
                }`}
              >
                {content}
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-center">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
