import { useState, useEffect, useRef, useCallback } from 'react';
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
  Ticket,
  Tag,
  MessageSquare,
  Truck,
  Image,
  UserCog,
  Activity,
  CreditCard,

  Headphones,
  Command,
  X,
  Hash,
  User,
  ArrowRight,
  Clock
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
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'orders' | 'customers'>('all');
  const [searchResults, setSearchResults] = useState<{ products: any[], orders: any[], customers: any[] }>({ products: [], orders: [], customers: [] });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_recent_searches') || '[]'); } catch { return []; }
  });

  // Quick navigation pages
  const quickPages = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin/dashboard' },
    { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
    { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders' },
    { icon: Users, label: 'Khách hàng', path: '/admin/customers' },
    { icon: Tag, label: 'Thương hiệu', path: '/admin/brands' },
    { icon: Ticket, label: 'Khuyến mãi', path: '/admin/coupons' },
    { icon: BarChart, label: 'Báo cáo', path: '/admin/analytics' },
    { icon: Settings, label: 'Cài đặt', path: '/admin/settings' },
  ];

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 5);
      localStorage.setItem('admin_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('admin_recent_searches');
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const [productsRes, ordersRes, usersRes] = await Promise.all([
            adminAPI.getProducts({ search: searchQuery, limit: 5 }),
            adminAPI.getOrders({ search: searchQuery, limit: 5 }),
            adminAPI.getUsers({ search: searchQuery, limit: 5, role: 'customer' })
          ]);
          
          const products = productsRes?.data?.success && productsRes?.data?.data?.products 
            ? productsRes.data.data.products : [];
          const orders = ordersRes?.data?.success && ordersRes?.data?.data?.orders 
            ? ordersRes.data.data.orders : [];
          const customers = usersRes?.data?.success && usersRes?.data?.data?.users 
            ? usersRes.data.data.users : [];
          
          setSearchResults({
            products: Array.isArray(products) ? products : [],
            orders: Array.isArray(orders) ? orders : [],
            customers: Array.isArray(customers) ? customers : []
          });
          saveRecentSearch(searchQuery);
        } catch (error) {
          console.error('Search failed', error);
          setSearchResults({ products: [], orders: [], customers: [] });
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ products: [], orders: [], customers: [] });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, saveRecentSearch]);

  // Reset tab selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
    setActiveTab('all');
  }, [searchQuery]);

  // Close search modal on navigation
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [pathname]);

  // Filter results by active tab
  const getFilteredResults = () => {
    if (activeTab === 'products') return { products: searchResults.products, orders: [], customers: [] };
    if (activeTab === 'orders') return { products: [], orders: searchResults.orders, customers: [] };
    if (activeTab === 'customers') return { products: [], orders: [], customers: searchResults.customers };
    return searchResults;
  };

  const totalResults = searchResults.products.length + searchResults.orders.length + searchResults.customers.length;
  const filtered = getFilteredResults();

  // Navigate to result
  const handleResultClick = (path: string) => {
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              <span className="text-xl font-bold text-secondary-900 dark:text-white">Quản Trị Viên</span>
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
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {user?.full_name || 'Admin User'}
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

            {/* Search Trigger Button */}
            <button
              onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
              className="hidden md:flex items-center gap-3 bg-secondary-50 dark:bg-secondary-700/50 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl py-2.5 pl-4 pr-3 text-sm w-80 lg:w-96 transition-all group border border-secondary-200/60 dark:border-secondary-600/40 hover:border-secondary-300 dark:hover:border-secondary-500"
            >
              <Search className="w-4 h-4 text-secondary-400 group-hover:text-secondary-500" />
              <span className="flex-1 text-left text-secondary-400 group-hover:text-secondary-500">Tìm kiếm...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white dark:bg-secondary-600 border border-secondary-200 dark:border-secondary-500 rounded-md text-[10px] font-medium text-secondary-400 dark:text-secondary-300 shadow-sm">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
            {/* Mobile search icon */}
            <button
              onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
              className="md:hidden p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-full"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <AdminMessageDropdown />
            <NotificationDropdown />
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

      {/* Search Modal (Full-screen overlay) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
          />
          
          {/* Modal */}
          <div className="relative flex items-start justify-center pt-[10vh] px-4">
            <div 
              ref={searchRef}
              className="w-full max-w-2xl bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden animate-fade-in"
              style={{ maxHeight: '70vh' }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-secondary-100 dark:border-secondary-700">
                <Search className="w-5 h-5 text-secondary-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm sản phẩm, đơn hàng, khách hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-base text-secondary-900 dark:text-white placeholder-secondary-400 focus:ring-0 p-0"
                  autoComplete="off"
                />
                {isSearching && <Loader2 className="w-5 h-5 animate-spin text-primary-500 flex-shrink-0" />}
                {searchQuery && !isSearching && (
                  <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-md transition-colors">
                    <X className="w-4 h-4 text-secondary-400" />
                  </button>
                )}
                <button 
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="flex-shrink-0 text-xs text-secondary-400 bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Tabs - only show when we have results */}
              {searchQuery.length >= 2 && totalResults > 0 && (
                <div className="flex items-center gap-1 px-5 pt-3 pb-2 border-b border-secondary-100 dark:border-secondary-700">
                  {[
                    { key: 'all' as const, label: 'Tất cả', count: totalResults },
                    { key: 'products' as const, label: 'Sản phẩm', count: searchResults.products.length, icon: Package },
                    { key: 'orders' as const, label: 'Đơn hàng', count: searchResults.orders.length, icon: ShoppingCart },
                    { key: 'customers' as const, label: 'Khách hàng', count: searchResults.customers.length, icon: Users },
                  ].filter(t => t.key === 'all' || t.count > 0).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === tab.key
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'text-secondary-500 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                      }`}
                    >
                      {tab.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === tab.key
                          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                          : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Results Area */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 160px)' }}>
                {/* Loading */}
                {isSearching && (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-3" />
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">Đang tìm kiếm...</p>
                  </div>
                )}

                {/* Results */}
                {!isSearching && searchQuery.length >= 2 && totalResults > 0 && (
                  <div className="py-2">
                    {/* Products */}
                    {filtered.products.length > 0 && (
                      <div className="px-3">
                        <div className="flex items-center gap-2 px-2 py-2">
                          <Package className="w-3.5 h-3.5 text-secondary-400" />
                          <h4 className="text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Sản phẩm</h4>
                        </div>
                        {filtered.products.map(product => (
                          <button
                            key={product.id}
                            onClick={() => handleResultClick(`/admin/products/edit/${product.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary-50 dark:hover:bg-secondary-700/70 rounded-xl group transition-colors text-left"
                          >
                            {product.product_images?.[0]?.url ? (
                              <img src={toMediaUrl(product.product_images[0].url)} alt="" className="w-11 h-11 rounded-lg object-cover bg-secondary-100 dark:bg-secondary-700 flex-shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-secondary-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-secondary-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.sku && <span className="text-xs text-secondary-400 dark:text-secondary-500">SKU: {product.sku}</span>}
                                {product.base_price && (
                                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                    {Number(product.base_price).toLocaleString('vi-VN')}đ
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-secondary-300 dark:text-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Orders */}
                    {filtered.orders.length > 0 && (
                      <div className={`px-3 ${filtered.products.length > 0 ? 'mt-1 pt-1 border-t border-secondary-100 dark:border-secondary-700/50' : ''}`}>
                        <div className="flex items-center gap-2 px-2 py-2">
                          <ShoppingCart className="w-3.5 h-3.5 text-secondary-400" />
                          <h4 className="text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Đơn hàng</h4>
                        </div>
                        {filtered.orders.map(order => {
                          const statusColors: Record<string, string> = {
                            pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                            confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                            processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                            shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                            completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          };
                          const statusLabels: Record<string, string> = {
                            pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', processing: 'Đang xử lý',
                            shipped: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy',
                          };
                          return (
                            <button
                              key={order.id}
                              onClick={() => handleResultClick(`/admin/orders/${order.id}`)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary-50 dark:hover:bg-secondary-700/70 rounded-xl group transition-colors text-left"
                            >
                              <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                <Hash className="w-5 h-5 text-primary-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{order.order_code}</p>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[order.status] || 'bg-secondary-100 text-secondary-600'}`}>
                                    {statusLabels[order.status] || order.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-secondary-400 dark:text-secondary-500">{order.customer_name}</span>
                                  {order.total_amount && (
                                    <span className="text-xs font-medium text-secondary-600 dark:text-secondary-300">
                                      {Number(order.total_amount).toLocaleString('vi-VN')}đ
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-secondary-300 dark:text-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Customers */}
                    {filtered.customers.length > 0 && (
                      <div className={`px-3 ${(filtered.products.length > 0 || filtered.orders.length > 0) ? 'mt-1 pt-1 border-t border-secondary-100 dark:border-secondary-700/50' : ''}`}>
                        <div className="flex items-center gap-2 px-2 py-2">
                          <Users className="w-3.5 h-3.5 text-secondary-400" />
                          <h4 className="text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Khách hàng</h4>
                        </div>
                        {filtered.customers.map((customer: any) => (
                          <button
                            key={customer.id}
                            onClick={() => handleResultClick(`/admin/customers/${customer.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary-50 dark:hover:bg-secondary-700/70 rounded-xl group transition-colors text-left"
                          >
                            <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-secondary-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                {customer.full_name || customer.username}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-secondary-400 dark:text-secondary-500">{customer.email}</span>
                                {customer.phone && <span className="text-xs text-secondary-400 dark:text-secondary-500">• {customer.phone}</span>}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-secondary-300 dark:text-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!isSearching && searchQuery.length >= 2 && totalResults === 0 && (
                  <div className="py-12 text-center px-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
                      <Search className="w-8 h-8 text-secondary-300 dark:text-secondary-500" />
                    </div>
                    <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Không tìm thấy kết quả cho "{searchQuery}"
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả
                    </p>
                  </div>
                )}

                {/* Default State - Quick Navigation + Recent Searches */}
                {searchQuery.length < 2 && (
                  <div className="py-3">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="px-3 mb-2">
                        <div className="flex items-center justify-between px-2 py-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-secondary-400" />
                            <h4 className="text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Tìm kiếm gần đây</h4>
                          </div>
                          <button onClick={clearRecentSearches} className="text-[10px] text-secondary-400 hover:text-red-500 transition-colors">Xóa</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-2">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => setSearchQuery(term)}
                              className="px-3 py-1.5 bg-secondary-50 dark:bg-secondary-700/50 hover:bg-secondary-100 dark:hover:bg-secondary-700 text-xs text-secondary-600 dark:text-secondary-300 rounded-lg transition-colors border border-secondary-200/50 dark:border-secondary-600/30"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Navigation */}
                    <div className="px-3">
                      <div className="flex items-center gap-2 px-2 py-2">
                        <ArrowRight className="w-3.5 h-3.5 text-secondary-400" />
                        <h4 className="text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Truy cập nhanh</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {quickPages.map(page => (
                          <button
                            key={page.path}
                            onClick={() => handleResultClick(page.path)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                              pathname === page.path
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700/70'
                            }`}
                          >
                            <page.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{page.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-secondary-100 dark:border-secondary-700 flex items-center justify-between text-[11px] text-secondary-400 dark:text-secondary-500 bg-secondary-50/50 dark:bg-secondary-800/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-secondary-700 rounded border border-secondary-200 dark:border-secondary-600 text-[10px] font-medium">↑↓</kbd> di chuyển</span>
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-secondary-700 rounded border border-secondary-200 dark:border-secondary-600 text-[10px] font-medium">↵</kbd> chọn</span>
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-secondary-700 rounded border border-secondary-200 dark:border-secondary-600 text-[10px] font-medium">esc</kbd> đóng</span>
                </div>
                {searchQuery.length >= 2 && !isSearching && (
                  <span>{totalResults} kết quả</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Modal code omitted here for brevity (it remains above) */}

      {/* Global AI Assistant Button for Admin */}
      <AIAssistant />
    </div>
  );
}
