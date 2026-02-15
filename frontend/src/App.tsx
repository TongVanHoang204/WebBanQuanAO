import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SalePage from './pages/SalePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PolicyPage from './pages/PolicyPage';
import { useAuth } from './contexts/AuthContext';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderPaymentPage from './pages/OrderPaymentPage';
import MaintenancePage from './pages/MaintenancePage';
import { adminAPI } from './services/api';
import { useState, useEffect } from 'react';


import AdminLayout from './components/layout/AdminLayout';
// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProductListPage from './pages/admin/products/ProductListPage';
import CategoryPage from './pages/admin/categories/CategoryPage';
import AddProductPage from './pages/admin/products/AddProductPage';
import EditProductPage from './pages/admin/products/EditProductPage';
import OrderListPage from './pages/admin/orders/OrderListPage';
import AdminOrderDetailPage from './pages/admin/orders/OrderDetailPage';
import CustomerListPage from './pages/admin/customers/CustomerListPage';
import CustomerDetailPage from './pages/admin/customers/CustomerDetailPage';
import AnalyticsPage from './pages/admin/analytics/AnalyticsPage';
import SettingsPage from './pages/admin/settings/SettingsPage';
import NotificationPage from './pages/admin/notifications/NotificationPage';
import CouponListPage from './pages/admin/coupons/CouponListPage';
import CouponDetailPage from './pages/admin/coupons/CouponDetailPage';
import BrandListPage from './pages/admin/brands/BrandListPage';
import BrandDetailPage from './pages/admin/brands/BrandDetailPage';
import ReviewListPage from './pages/admin/reviews/ReviewListPage';
import ShippingPage from './pages/admin/shipping/ShippingPage';
import BannerListPage from './pages/admin/banners/BannerListPage';
import StaffListPage from './pages/admin/staff/StaffListPage';
import ActivityLogPage from './pages/admin/logs/ActivityLogPage';
import TransactionListPage from './pages/admin/transactions/TransactionListPage';
import ApiTestPage from './pages/admin/ApiTestPage';
import AdminChatPage from './pages/admin/chat/AdminChatPage';

import { toast } from 'react-hot-toast';
import { LoadingScreen } from './components/common/LoadingScreen';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen message="Đang xác thực..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.status === 'blocked') {
    toast.error('Tài khoản của bạn đã bị khóa');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Role-Based Route Component
function RoleRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen message="Đang kiểm tra quyền truy cập..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.status === 'blocked') {
    toast.error('Tài khoản của bạn đã bị khóa');
    return <Navigate to="/login" replace />;
  }

  // If no roles specified, just check auth (though ProtectedRoute does that)
  if (allowedRoles && allowedRoles.length > 0) {
      // Assuming 'admin' role has access to everything effectively, or strict role check
      // Current logic: strict check
      if (!user?.role || !allowedRoles.includes(user.role)) {
          return <Navigate to="/" replace />;
      }
  }
  
  return <>{children}</>;
}

export default function App() {
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await adminAPI.getPublicSettings();
        if (res.data.success) {
          setMaintenance(res.data.data.maintenance_mode === 'true');
        } else {
          setMaintenance(false);
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
        setMaintenance(false);
      }
    };
    checkMaintenance();
  }, []);

  // If loading maintenance status, show nothing or small loader
  if (maintenance === null) {
    return <LoadingScreen message="Đang tải..." />;
  }

  return (
    <Routes>
      {/* Maintenance Page */}
      <Route path="/maintenance" element={<MaintenancePage />} />

      {/* Global Hack: If maintenance is ON and user is NOT an admin/staff, 
          redirect almost everything to /maintenance.
          Except /admin paths (so admins can still log in and turn it off).
      */}
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={['admin', 'manager', 'staff']}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Product Management */}
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/new" element={<AddProductPage />} />
        <Route path="products/:id" element={<EditProductPage />} />
        <Route path="orders" element={<OrderListPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="categories" element={<CategoryPage />} />
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="coupons" element={<CouponListPage />} />
        <Route path="coupons/:id" element={<CouponDetailPage />} />
        <Route path="brands" element={<BrandListPage />} />
        <Route path="brands/:id" element={<BrandDetailPage />} />
        <Route path="reviews" element={<ReviewListPage />} />
        <Route path="shipping" element={<ShippingPage />} />
        <Route path="banners" element={<BannerListPage />} />
        <Route path="staff" element={<StaffListPage />} />
        <Route path="transactions" element={<TransactionListPage />} />
        <Route path="api-test" element={<ApiTestPage />} />
        <Route path="logs" element={<ActivityLogPage />} />
        <Route path="chat" element={<AdminChatPage />} />
      </Route>

      {/* Auth Routes (No Header/Footer) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/"
        element={
          maintenance && !['admin', 'manager', 'staff'].includes(user?.role || '') ? (
            <Navigate to="/maintenance" replace />
          ) : (
            <Layout />
          )
        }
      >
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="sale" element={<SalePage />} />

        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        
        {/* Protected Routes */}
        <Route path="checkout" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        
        {/* Order Success */}
        <Route path="order-success/:orderCode" element={<OrderSuccessPage />} />
        <Route path="checkout/payment/:orderId" element={<OrderPaymentPage />} />
        <Route path="payment/vnpay-return" element={<PaymentReturnPage />} />

        {/* Static Pages */}
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="policy" element={<PolicyPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

// Simple 404 Page
function NotFoundPage() {
  return (
    <div className="container-custom py-16 text-center">
      <h1 className="text-6xl font-bold text-secondary-300 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-secondary-800 mb-4">Trang không tồn tại</h2>
      <p className="text-secondary-500 mb-8">Xin lỗi, trang bạn tìm kiếm không tồn tại.</p>
      <a href="/" className="btn btn-primary rounded-full">Về trang chủ</a>
    </div>
  );
}
