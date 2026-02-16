import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart, 
  Settings, 
  Search, 
  Bell, 
  Plus,
  LogOut,
  Menu,
  Sun,
  Moon,
  Loader2,
  ChevronRight,
  Ticket,
  Tag,
  MessageSquare,
  Truck,
  Image,
  UserCog,
  Activity,
  CreditCard,
  Code2,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { adminAPI, toMediaUrl } from '../../services/api';
import { NotificationDropdown } from '../common/NotificationDropdown';
import AdminMessageDropdown from '../chat/AdminMessageDropdown';
import AdminChatManager from '../chat/AdminChatManager';

import AIAssistant from '../common/AIAssistant';
import { useSettings } from '../../contexts/SettingsContext';
import { useSocket } from '../../contexts/SocketContext';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { settings } = useSettings();
  const { isConnected, joinAdminRoom } = useSocket();

  // Auto-join admin-room for real-time notifications
  useEffect(() => {
    if (isConnected) {
      joinAdminRoom();
    }
  }, [isConnected, joinAdminRoom]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ products: any[], orders: any[] }>({ products: [], orders: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setIsSearchOpen(true);
        try {
          const [productsRes, ordersRes] = await Promise.all([
            adminAPI.getProducts({ search: searchQuery, limit: 5 }),
            adminAPI.getOrders({ search: searchQuery, limit: 5 })
          ]);
          
          // Safe null checks to prevent undefined errors
          const products = productsRes?.data?.success && productsRes?.data?.data?.products 
            ? productsRes.data.data.products 
            : [];
          const orders = ordersRes?.data?.success && ordersRes?.data?.data?.orders 
            ? ordersRes.data.data.orders 
            : [];
          
          setSearchResults({
            products: Array.isArray(products) ? products : [],
            orders: Array.isArray(orders) ? orders : []
          });
        } catch (error) {
          console.error('Search failed', error);
          // Reset to empty arrays on error to prevent crashes
          setSearchResults({ products: [], orders: [] });
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ products: [], orders: [] });
        setIsSearchOpen(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.full_name || user?.username || 'Quản trị viên';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const navItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin/dashboard', roles: ['admin', 'manager'] },
    { icon: Package, label: 'Sản phẩm', path: '/admin/products', roles: ['admin', 'manager', 'staff'] },
    { icon: Plus, label: 'Danh mục', path: '/admin/categories', roles: ['admin', 'manager', 'staff'] },
    { icon: Tag, label: 'Thương hiệu', path: '/admin/brands', roles: ['admin', 'manager', 'staff'] },
    { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders', roles: ['admin', 'manager', 'staff'] },
    { icon: Users, label: 'Khách hàng', path: '/admin/customers', roles: ['admin', 'manager', 'staff'] },
    { icon: Ticket, label: 'Khuyến mãi', path: '/admin/coupons', roles: ['admin', 'manager'] },
    { icon: BarChart, label: 'Báo cáo', path: '/admin/analytics', roles: ['admin', 'manager'] },
    { icon: Bell, label: 'Thông báo', path: '/admin/notifications', roles: ['admin', 'manager', 'staff'] },
    { icon: MessageSquare, label: 'Đánh giá', path: '/admin/reviews', roles: ['admin', 'manager', 'staff'] },
    { icon: Headphones, label: 'Chat', path: '/admin/chat', roles: ['admin', 'manager', 'staff'] },
    { icon: Truck, label: 'Vận chuyển', path: '/admin/shipping', roles: ['admin', 'manager', 'staff'] },
    { icon: Image, label: 'Banner', path: '/admin/banners', roles: ['admin', 'manager', 'staff'] },
    { icon: UserCog, label: 'Nhân viên', path: '/admin/staff', roles: ['admin', 'manager'] },
    { icon: CreditCard, label: 'Giao dịch', path: '/admin/transactions', roles: ['admin', 'manager'] },
    { icon: Activity, label: 'Nhật ký hoạt động', path: '/admin/logs', roles: ['admin', 'manager'] },
    { icon: Code2, label: 'API Tester', path: '/admin/api-test', roles: ['admin'] },
    { icon: Settings, label: 'Cài đặt', path: '/admin/settings', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    // If no user role, default to empty to match nothing (or handle unauthorized logic elsewhere)
    return item.roles.includes(user?.role || '');
  });

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside 
        className={`bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-secondary-100 dark:border-secondary-700">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              {settings?.store_logo ? (
                <img src={toMediaUrl(settings.store_logo)} alt="Admin" className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
              )}
              <span
                className="text-xl font-bold text-secondary-900 dark:text-white truncate max-w-[170px]"
                title={displayName}
              >
                {displayName}
              </span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 hover:text-secondary-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-secondary-100 dark:border-secondary-700">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center text-secondary-600 dark:text-secondary-300 font-bold">
                {displayInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">Quản lý cửa hàng</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-full text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-secondary-50 dark:bg-secondary-900 transition-colors duration-200">
        {/* Header */}
        <header className="bg-white dark:bg-secondary-800 h-16 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between px-4 lg:px-8 transition-colors duration-200">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block relative w-96 z-50 transition-all" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng, sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
                  className="bg-secondary-50 dark:bg-secondary-700/50 border-none focus:ring-2 focus:ring-primary-500 rounded-full py-2 pl-10 pr-4 text-sm w-full text-secondary-900 dark:text-white placeholder-secondary-400 transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary-500" />
                )}
              </div>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-100 dark:border-secondary-700 overflow-hidden animate-fade-in max-h-96 overflow-y-auto">
                  {/* Loading State */}
                  {isSearching && (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">Đang tìm kiếm...</p>
                    </div>
                  )}

                  {/* Results */}
                  {!isSearching && (searchResults.orders.length > 0 || searchResults.products.length > 0) && (
                    <>
                      {searchResults.orders.length > 0 && (
                        <div className="p-2">
                           <h4 className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase px-2 mb-1">Đơn hàng</h4>
                           {searchResults.orders.map(order => (
                             <Link 
                               key={order.id} 
                               to={`/admin/orders/${order.id}`}
                               onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                               className="flex items-center justify-between p-2 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-md group transition-colors"
                             >
                               <div>
                                 <p className="text-sm font-medium text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{order.order_code}</p>
                                 <p className="text-xs text-secondary-500 dark:text-secondary-400">{order.customer_name}</p>
                               </div>
                               <ChevronRight className="w-4 h-4 text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </Link>
                           ))}
                        </div>
                      )}
                      
                      {searchResults.products.length > 0 && (
                        <div className={`p-2 ${searchResults.orders.length > 0 ? 'border-t border-secondary-100 dark:border-secondary-700' : ''}`}>
                           <h4 className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase px-2 mb-1 mt-1">Sản phẩm</h4>
                           {searchResults.products.map(product => (
                             <Link 
                               key={product.id} 
                               to={`/admin/products/edit/${product.id}`}
                               onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                               className="flex items-center gap-3 p-2 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-md group transition-colors"
                             >
                               {product.product_images?.[0]?.url ? (
                                 <img src={toMediaUrl(product.product_images[0].url)} alt="" className="w-10 h-10 rounded object-cover bg-secondary-100 dark:bg-secondary-700" />
                               ) : (
                                 <div className="w-10 h-10 rounded bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
                                   <Package className="w-5 h-5 text-secondary-400" />
                                 </div>
                               )}
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium text-secondary-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{product.name}</p>
                                 <p className="text-xs text-secondary-500 dark:text-secondary-400">{product.sku}</p>
                               </div>
                             </Link>
                           ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Empty State */}
                  {!isSearching && searchQuery.length >= 2 && searchResults.orders.length === 0 && searchResults.products.length === 0 && (
                    <div className="p-8 text-center">
                      <Search className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Không tìm thấy kết quả</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

            <div className="flex items-center gap-4">
            {/* Message Dropdown */}
            <AdminMessageDropdown />

            {/* Notification Bell */}
            <NotificationDropdown />
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-full transition-colors"
              title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AIAssistant />
      <AdminChatManager />
    </div>
  );
}
