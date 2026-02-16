import { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  Check, 
  Clock, 
  Package, 
  AlertCircle, 
  Info,
  Trash2,
  Eye,
  Search
} from 'lucide-react';
import { notificationService, NotificationItem } from '@/services/notification.service';
import { toast } from 'react-hot-toast';

const ITEMS_PER_PAGE = 20;

function NotificationPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'order' | 'inventory' | 'customer' | 'system' | 'priority' | '24h'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll();
      setNotifications(res.data.data.notifications || []);
    } catch (error) {
      console.error('Fetch notifications error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications from SocketContext
    const handleNewNotification = () => {
      fetchNotifications();
    };

    window.addEventListener('new_notification_received', handleNewNotification);
    
    const interval = setInterval(fetchNotifications, 60000); // Poll less frequently when real-time is active
    
    return () => {
      window.removeEventListener('new_notification_received', handleNewNotification);
      clearInterval(interval);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      toast.success('Đã đánh dấu tất cả là đã đọc');
      fetchNotifications();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    if (activeTab === 'unread') {
      filtered = notifications.filter(n => !n.is_read);
    } else if (activeTab === 'order') {
      filtered = notifications.filter(n => ['order_new', 'order_status'].includes(n.type));
    } else if (activeTab === 'inventory') {
      filtered = notifications.filter(n => ['product_low_stock', 'product_out_of_stock'].includes(n.type));
    } else if (activeTab === 'system') {
      filtered = notifications.filter(n => n.type === 'system');
    } else if (activeTab === 'priority') {
      filtered = notifications.filter(n => ['order_new', 'product_out_of_stock'].includes(n.type));
    } else if (activeTab === '24h') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = notifications.filter(n => new Date(n.created_at) > oneDayAgo);
    }
    return filtered;
  };

  // Apply search filter on top of tab filter
  const getSearchedNotifications = () => {
    const filtered = getFilteredNotifications();
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.message.toLowerCase().includes(q)
    );
  };

  const getTypeStyles = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'order_new':
        return {
          icon: <Package className="w-5 h-5 text-white" />,
          bg: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30',
          tag: 'ĐƠN HÀNG',
          tagBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        };
      case 'order_status':
        return {
          icon: <Check className="w-5 h-5 text-white" />,
          bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30',
          tag: 'CẬP NHẬT',
          tagBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        };
      case 'product_low_stock':
      case 'product_out_of_stock':
        return {
          icon: <AlertCircle className="w-5 h-5 text-white" />,
          bg: 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30',
          tag: 'KHO HÀNG',
          tagBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        };
      case 'system':
        return {
          icon: <Settings className="w-5 h-5 text-white" />,
          bg: 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30',
          tag: 'HỆ THỐNG',
          tagBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-white" />,
          bg: 'bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-lg shadow-secondary-500/30',
          tag: 'THÔNG TIN',
          tagBg: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
        };
    }
  };

  const filteredList = getSearchedNotifications();
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const unreadCount = notifications.filter(n => !Number(n.is_read)).length;

  const getSidebarItemClasses = (itemColor: string, isActive: boolean) => {
    if (!isActive) {
      return {
        button: 'text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-white',
        icon: itemColor === 'primary' ? 'text-secondary-500' :
          itemColor === 'blue' ? 'text-blue-500' :
          itemColor === 'rose' ? 'text-rose-500' :
          'text-amber-500',
      };
    }

    if (itemColor === 'primary') {
      return {
        button: 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-secondary-900/20 dark:shadow-white/20 transform scale-[1.02]',
        icon: '',
      };
    }

    if (itemColor === 'blue') {
      return {
        button: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]',
        icon: '',
      };
    }

    if (itemColor === 'rose') {
      return {
        button: 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 transform scale-[1.02]',
        icon: '',
      };
    }

    return {
      button: 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 transform scale-[1.02]',
      icon: '',
    };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full bg-secondary-50/50 dark:bg-transparent -m-4 p-4 lg:-m-8 lg:p-8 rounded-3xl overflow-hidden">
      {/* Sidebar Section */}
      <div className="w-full lg:w-72 flex-shrink-0 space-y-8">
        <div className="px-2">
          <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-2 tracking-tight">Trung tâm thông báo</h2>
          <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Tất cả tin tức & hoạt động mới nhất</p>
        </div>

        <div className="bg-white/80 dark:bg-secondary-900/50 backdrop-blur-xl border border-white dark:border-secondary-800 rounded-2xl shadow-xl shadow-secondary-200/50 dark:shadow-none p-3 space-y-2">
          {[
            { id: 'all', label: 'Tất cả', icon: Bell, count: notifications.length, color: 'primary' },
            { id: 'order', label: 'Đơn hàng', icon: Package, count: notifications.filter(n => ['order_new', 'order_status'].includes(n.type)).length, color: 'blue' },
            { id: 'inventory', label: 'Kho hàng', icon: AlertCircle, count: notifications.filter(n => ['product_low_stock', 'product_out_of_stock'].includes(n.type)).length, color: 'rose' },
            { id: 'system', label: 'Hệ thống', icon: Settings, color: 'amber' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${getSidebarItemClasses(item.color, activeTab === item.id).button}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${getSidebarItemClasses(item.color, activeTab === item.id).icon}`} />
                {item.label}
              </div>
              {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === item.id ? 'bg-white/20 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                  }`}>
                      {item.count}
                  </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight">Hoạt động gần đây</h2>
            </div>
            <p className="text-secondary-500 dark:text-secondary-400 font-medium italic">Ghi nhận thông tin từ {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-secondary-800 dark:hover:bg-secondary-100 disabled:bg-secondary-200 dark:disabled:bg-secondary-800 disabled:text-secondary-400 disabled:cursor-not-allowed rounded-full transition-all duration-300 text-sm font-black shadow-xl shadow-secondary-200/50 dark:shadow-none"
          >
            <Check className="w-4 h-4" />
            Đánh dấu đã đọc hết
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full h-11 pl-12 pr-4 bg-white dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-700 rounded-xl text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'unread', label: 'Chưa đọc' },
            { id: 'priority', label: 'Ưu tiên' },
            { id: '24h', label: '24h qua' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveTab(activeTab === filter.id ? 'all' : (filter.id as any))}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                activeTab === filter.id
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg' 
                  : 'bg-white dark:bg-secondary-800 border-white dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-secondary-200 dark:hover:border-secondary-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-12">
          {loading ? (
             <div className="space-y-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="h-28 bg-white/50 dark:bg-secondary-800/50 rounded-2xl animate-pulse border border-white dark:border-secondary-800"></div>
               ))}
             </div>
          ) : filteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/50 dark:bg-secondary-900/30 rounded-3xl border-2 border-dashed border-secondary-200 dark:border-secondary-800">
              <div className="w-24 h-24 bg-gradient-to-tr from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Bell className="w-10 h-10 text-secondary-400 animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-2">Yên bình quá!</h3>
              <p className="text-secondary-500 dark:text-secondary-400 font-medium">Hiện tại không có thông báo nào mới cho bạn.</p>
            </div>
          ) : (
            paginatedList.map((notification) => {
              const style = getTypeStyles(notification);
              const isUnread = !Number(notification.is_read);
              
              return (
                <div 
                  key={notification.id} 
                  className={`group relative bg-white dark:bg-secondary-900/50 hover:bg-secondary-50 dark:hover:bg-secondary-800/80 rounded-2xl p-5 border transition-all duration-500 ${
                    isUnread 
                      ? 'border-l-4 border-l-blue-600 border-white dark:border-secondary-700 shadow-xl shadow-blue-500/5' 
                      : 'border-white dark:border-secondary-800 shadow-sm'
                  }`}
                >
                  <div className="flex gap-5">
                    {/* Icon Box */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden ${style.bg}`}>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {style.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <span className={`self-start text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${style.tagBg}`}>
                          {style.tag}
                        </span>
                        <h4 className={`text-lg font-black text-secondary-900 dark:text-white leading-tight truncate ${isUnread ? 'opacity-100' : 'opacity-70'}`}>
                          {notification.title}
                        </h4>
                      </div>
                      
                      <p className={`text-sm mb-4 leading-relaxed line-clamp-2 font-medium ${isUnread ? 'text-secondary-700 dark:text-secondary-200' : 'text-secondary-500 dark:text-secondary-400'}`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-secondary-400 dark:text-secondary-500 font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(notification.created_at).toLocaleString('vi-VN', { 
                            hour: '2-digit', minute: '2-digit',
                            day: 'numeric', month: 'numeric'
                          })}
                        </div>
                        {isUnread && (
                           <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase">
                             Mới
                           </span>
                        )}
                      </div>
                    </div>

                    {/* Actions (Right Side) */}
                    <div className="flex flex-col items-end justify-between pl-4">
                         <div className="flex items-center gap-1">
                            {isUnread && (
                              <button 
                                className="p-2 text-secondary-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300"
                                title="Đánh dấu đã đọc"
                                onClick={async () => {
                                  try {
                                    await notificationService.markRead(notification.id);
                                    fetchNotifications();
                                  } catch { toast.error('Lỗi đánh dấu đã đọc'); }
                                }}
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                                className="p-2 text-secondary-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all duration-300"
                                title="Xóa thông báo"
                                onClick={async () => {
                                  try {
                                    await notificationService.delete(notification.id);
                                    toast.success('Đã xóa thông báo');
                                    fetchNotifications();
                                  } catch { toast.error('Lỗi xóa thông báo'); }
                                }}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                         
                         {notification.link && (
                           <a 
                             href={notification.link}
                             className="group/btn relative px-5 py-2 overflow-hidden bg-secondary-900 dark:bg-white text-white dark:text-black text-xs font-black rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 whitespace-nowrap uppercase tracking-widest"
                           >
                             <span className="relative z-10 flex items-center gap-2">
                               Chi tiết
                               <Check className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                             </span>
                           </a>
                         )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 disabled:opacity-50 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 disabled:opacity-50 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationPage;
