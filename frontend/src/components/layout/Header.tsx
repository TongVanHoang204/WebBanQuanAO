import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  Package,
  Settings,
  Heart,
  Sun, 
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useShop } from '../../hooks/useShop';
import { useSettings } from '../../contexts/SettingsContext';
import { Product } from '../../types';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { toMediaUrl } from '../../services/api';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const { categories, fetchCategories, searchProducts } = useShop();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories().then(() => {});
  }, [fetchCategories]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchProducts(searchQuery);
        setSearchResults(results);
        setIsSearchOpen(true);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchProducts]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-secondary-900 dark:text-white shadow-sm transition-colors duration-300 print:hidden">
      {/* Top Bar */}
      <div className="bg-secondary-900 dark:bg-black text-white text-sm py-2">
        <div className="container-custom flex justify-between items-center">
          <p>Miễn phí vận chuyển cho đơn từ 500.000đ</p>
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:1900xxxx" className="hover:text-primary-300">Hotline: 1900-xxxx</a>
            <span>|</span>
            <Link to="/order-tracking" className="hover:text-primary-300">Theo dõi đơn hàng</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            {settings?.store_logo ? (
               <img src={toMediaUrl(settings.store_logo)} alt={settings.store_name} className="h-10 object-contain" />
            ) : (
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {settings?.store_name || 'Fashion'}
                {!settings?.store_name && <span className="text-secondary-800 dark:text-white">Store</span>}
              </h1>
            )}
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xl relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
                  className="input pl-12 pr-4 rounded-full"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              </div>
            </form>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-100 dark:border-secondary-700 max-h-96 overflow-y-auto z-50">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                  >
                    <img
                      src={toMediaUrl(product.product_images?.[0]?.url || '/placeholder.jpg')}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-secondary-800 dark:text-white">{product.name}</p>
                      <p className="text-sm text-primary-600 dark:text-primary-400">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.base_price)}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  to={`/shop?search=${encodeURIComponent(searchQuery)}`}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="block p-3 text-center text-primary-600 dark:text-primary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 font-medium border-t dark:border-secondary-700"
                >
                  Xem tất cả kết quả
                </Link>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Toggle */}
            <button
              className="md:hidden p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full dark:text-white"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification - Only for logged in users */}
            {isAuthenticated && (
              <div className="hidden md:block">
                <NotificationDropdown />
              </div>
            )}

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="hidden md:flex p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full relative dark:text-white"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full relative dark:text-white"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Dark Mode Toggle */}
            <button
               onClick={toggleDarkMode}
               className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full relative text-gray-500 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white transition-colors"
               title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            >
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center gap-2 p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full dark:text-white"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {user?.avatar_url ? (
                  <img 
                    src={toMediaUrl(user.avatar_url)} 
                    alt={user.full_name || user.username} 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="hidden md:block text-sm font-medium">
                  {isAuthenticated ? user?.full_name || user?.username : 'Đăng nhập'}
                </span>
                <ChevronDown className="hidden md:block w-4 h-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-100 dark:border-secondary-700 py-2 z-50 animate-fade-in text-secondary-900 dark:text-white">
                  {isAuthenticated ? (
                    <>
                      <div className="p-4 border-b dark:border-secondary-700 flex items-center gap-3">
                        {user?.avatar_url ? (
                          <img 
                            src={toMediaUrl(user.avatar_url)} 
                            alt={user?.full_name || user?.username} 
                            className="w-10 h-10 rounded-full object-cover border border-secondary-200 dark:border-secondary-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                            {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-secondary-900 dark:text-white truncate">{user?.full_name || user?.username}</p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="p-1">
                      {['admin', 'manager', 'staff'].includes(user?.role || '') && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Trang quản trị</span>
                        </Link>
                      )}
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        <span>Đơn hàng</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Tài khoản</span>
                      </Link>
                      <hr className="my-2 dark:border-secondary-700" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-700 w-full text-left text-accent-red"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-secondary-700 dark:text-secondary-300">Đăng xuất</span>
                      </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Đăng ký
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full dark:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search - Expanded */}
        {isSearchOpen && (
          <div className="md:hidden mt-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 dark:text-secondary-500" />
              </div>
            </form>
            <div className="flex justify-around mt-4">
              <NavLink to="/shop" className={({isActive}) => `text-sm font-medium hover:text-primary-600 transition-colors ${isActive ? 'text-primary-600' : 'text-secondary-600 dark:text-gray-300'}`}>
                Sản phẩm
              </NavLink>
              <NavLink to="/sale" className={({isActive}) => `text-sm font-medium hover:text-primary-600 transition-colors ${isActive ? 'text-primary-600' : 'text-secondary-600 dark:text-gray-300'}`}>
                Sale
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="hidden md:block border-t border-secondary-100 dark:border-secondary-800">
        <div className="container-custom">
          <ul className="flex items-center gap-8 py-3">
            <li>
              <Link to="/shop" className="font-medium hover:text-primary-600 dark:text-gray-300 dark:hover:text-white transition-colors">
                Tất cả sản phẩm
              </Link>
            </li>
            {categories.slice(0, 5).map((category) => (
              <li key={category.id} className="relative group">
                <Link
                  to={`/shop?category=${category.slug}`}
                  className="font-medium hover:text-primary-600 dark:text-gray-300 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Link>
                {category.children && category.children.length > 0 && (
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40">
                    <ul className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-100 dark:border-secondary-700 py-2 min-w-48">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={`/shop?category=${child.slug}`}
                            className="block px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-white transition-colors"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}

            <li>
              <Link to="/sale" className="font-medium text-accent-red hover:text-red-700 dark:hover:text-red-400 transition-colors">
                🔥 Sale
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[120px] bg-white z-40 overflow-y-auto animate-slide-down">
          <nav className="container-custom py-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/shop"
                  className="block py-3 px-4 rounded-lg hover:bg-secondary-50 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tất cả sản phẩm
                </Link>
              </li>

              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/shop?category=${category.slug}`}
                    className="block py-3 px-4 rounded-lg hover:bg-secondary-50 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                  {category.children && category.children.length > 0 && (
                    <ul className="pl-4">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={`/shop?category=${child.slug}`}
                            className="block py-2 px-4 text-secondary-600 hover:text-primary-600"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
