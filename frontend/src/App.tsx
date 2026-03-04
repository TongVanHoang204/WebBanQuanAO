import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LoadingScreen } from './components/common/LoadingScreen';

// Lazy Load Pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ShopPage = React.lazy(() => import('./pages/ShopPage'));
const SalePage = React.lazy(() => import('./pages/SalePage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const OrderHistoryPage = React.lazy(() => import('./pages/OrderHistoryPage'));
const OrderDetailPage = React.lazy(() => import('./pages/OrderDetailPage'));
const PaymentReturnPage = React.lazy(() => import('./pages/PaymentReturnPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const PolicyPage = React.lazy(() => import('./pages/PolicyPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage'));
const OrderPaymentPage = React.lazy(() => import('./pages/OrderPaymentPage'));

// Lazy Load Admin Pages
const DashboardPage = React.lazy(() => import('./pages/admin/DashboardPage'));
const ProductListPage = React.lazy(() => import('./pages/admin/products/ProductListPage'));
const ProductImportPage = React.lazy(() => import('./pages/admin/products/ProductImportPage'));
const CategoryPage = React.lazy(() => import('./pages/admin/categories/CategoryPage'));
const AddProductPage = React.lazy(() => import('./pages/admin/products/AddProductPage'));
const EditProductPage = React.lazy(() => import('./pages/admin/products/EditProductPage'));
const OrderListPage = React.lazy(() => import('./pages/admin/orders/OrderListPage'));
const AdminOrderDetailPage = React.lazy(() => import('./pages/admin/orders/OrderDetailPage'));
const CustomerListPage = React.lazy(() => import('./pages/admin/customers/CustomerListPage'));
const CustomerDetailPage = React.lazy(() => import('./pages/admin/customers/CustomerDetailPage'));
const AnalyticsPage = React.lazy(() => import('./pages/admin/analytics/AnalyticsPage'));
const SettingsPage = React.lazy(() => import('./pages/admin/settings/SettingsPage'));
const NotificationPage = React.lazy(() => import('./pages/admin/notifications/NotificationPage'));
const CouponListPage = React.lazy(() => import('./pages/admin/coupons/CouponListPage'));
const CouponDetailPage = React.lazy(() => import('./pages/admin/coupons/CouponDetailPage'));
const BrandListPage = React.lazy(() => import('./pages/admin/brands/BrandListPage'));
const BrandDetailPage = React.lazy(() => import('./pages/admin/brands/BrandDetailPage'));
const ReviewListPage = React.lazy(() => import('./pages/admin/reviews/ReviewListPage'));
const ShippingPage = React.lazy(() => import('./pages/admin/shipping/ShippingPage'));
const BannerListPage = React.lazy(() => import('./pages/admin/banners/BannerListPage'));
const StaffListPage = React.lazy(() => import('./pages/admin/staff/StaffListPage'));
const ActivityLogPage = React.lazy(() => import('./pages/admin/logs/ActivityLogPage'));
const TransactionListPage = React.lazy(() => import('./pages/admin/transactions/TransactionListPage'));
const ApiTestPage = React.lazy(() => import('./pages/admin/ApiTestPage'));
const AdminChatPage = React.lazy(() => import('./pages/admin/chat/AdminChatPage'));
const MaintenancePage = React.lazy(() => import('./pages/MaintenancePage'));

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

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingScreen message="Đang tải dữ liệu, vui lòng đợi..." />}>
        <Routes>
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
            <Route path="products/import" element={<ProductImportPage />} />
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
          <Route path="/maintenance" element={<MaintenancePage />} />

          <Route path="/" element={<Layout />}>
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
      </Suspense>
    </QueryClientProvider>
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
