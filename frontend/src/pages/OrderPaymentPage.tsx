
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  CheckCircle2, 
  Package, 
  Clock,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Building2,
  ChevronLeft,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersAPI, settingsAPI } from '../services/api';
import { formatPrice } from '../hooks/useShop';
import { Order } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const PAYMENT_TIMEOUT_SECONDS = 5 * 60; // 5 minutes

export default function OrderPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_SECONDS);
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  const isPendingPayment = order?.status === 'pending' && 
                           (!order?.payments?.length || (order?.payments[0]?.method !== 'cod'));

  const isCancelled = order?.status === 'cancelled';

  // Initial Fetch
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      if (!orderId) return;
      try {
        const [orderRes, settingsRes] = await Promise.all([
             ordersAPI.getById(orderId),
             settingsAPI.getPublic()
        ]);
        setOrder(orderRes.data.data);
        if (settingsRes.data.success) {
            setPaymentSettings(settingsRes.data.data);
        }
        
        // Calculate remaining time from order creation
        const orderDate = new Date(orderRes.data.data.created_at);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - orderDate.getTime()) / 1000);
        const remaining = Math.max(0, PAYMENT_TIMEOUT_SECONDS - elapsed);
        setTimeLeft(remaining);
      } catch (error) {
        console.error('Failed to fetch order or settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId, isAuthenticated]);

  // Countdown Timer
  useEffect(() => {
    if (!isPendingPayment || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-refresh to get updated order status (should be cancelled by backend)
          ordersAPI.getById(orderId!).then(res => setOrder(res.data.data)).catch(console.error);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPendingPayment, orderId]);

  // Polling for Payment Status
  useEffect(() => {
    let intervalId: any;

    if (order && isPendingPayment && timeLeft > 0) {
        intervalId = setInterval(async () => {
            try {
                const res = await ordersAPI.getById(orderId!); 
                const updatedOrder = res.data.data;
                
                if (updatedOrder.status !== 'pending') {
                    setOrder(updatedOrder);
                    // Clear cart on successful payment
                    if (updatedOrder.status === 'paid' || updatedOrder.status === 'confirmed') {
                      await refreshCart();
                    }
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 4000);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [order?.status, orderId, isPendingPayment, timeLeft, refreshCart]);

  const handleCancelOrder = useCallback(async () => {
    if (!order || isCancelling) return;
    
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.')) {
      return;
    }
    
    setIsCancelling(true);
    try {
      await ordersAPI.cancel(order.id);
      toast.success('Đã hủy đơn hàng');
      // Refresh order to get updated status
      const res = await ordersAPI.getById(orderId!);
      setOrder(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể hủy đơn hàng';
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  }, [order, orderId, isCancelling]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="container-custom py-24 flex flex-col items-center justify-center font-inter">
        <div className="w-12 h-12 border-4 border-secondary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-secondary-500 dark:text-secondary-400 font-medium">Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-24 text-center font-inter">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
           <Package className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4">Lỗi tìm đơn hàng</h1>
        <p className="text-secondary-500 dark:text-secondary-400 mb-8 max-w-md mx-auto">
          Chúng tôi không tìm thấy đơn hàng <span className="font-bold">#{orderId}</span>.
        </p>
        <Link to="/orders" className="btn btn-primary rounded-full px-8">Quay lại lịch sử đơn hàng</Link>
      </div>
    );
  }

  // Order Cancelled View
  if (isCancelled) {
    return (
      <div className="container-custom py-24 text-center font-inter">
        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-2">Đơn hàng đã bị hủy</h1>
        <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-4">
          Đơn hàng <span className="font-bold">#{order.order_code}</span> đã bị hủy do hết thời gian thanh toán hoặc do bạn yêu cầu.
        </p>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-8">
          Sản phẩm trong giỏ hàng của bạn vẫn được giữ nguyên. Bạn có thể đặt lại đơn hàng.
        </p>
        <div className="flex justify-center gap-4">
            <Link to="/cart" className="px-8 py-3 bg-primary-600 text-white font-bold rounded-full hover:bg-primary-700 transition-all shadow-lg shadow-primary-100">
                Quay lại giỏ hàng
            </Link>
            <Link to="/orders" className="px-8 py-3 bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white font-bold rounded-full hover:bg-secondary-200 transition-all">
                Xem lịch sử đơn hàng
            </Link>
        </div>
      </div>
    );
  }

  // If already paid, show success
  if (!isPendingPayment && !isLoading) {
    return (
      <div className="container-custom py-24 text-center font-inter">
        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-short">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-2">Đơn hàng đã thanh toán</h1>
        <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-8">
          Đơn hàng <span className="font-bold">#{order.order_code}</span> đã được xử lý thành công.
        </p>
        <div className="flex justify-center gap-4">
            <Link to={`/order-detail/${order.id}`} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-full hover:bg-primary-700 transition-all shadow-lg shadow-primary-100">
                Xem chi tiết đơn hàng
            </Link>
            <Link to="/orders" className="px-8 py-3 bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white font-bold rounded-full hover:bg-secondary-200 transition-all">
                Về lịch sử mua hàng
            </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Thanh toán đơn hàng #{order.order_code} - Fashion Store</title>
      </Helmet>

      <div className="bg-white dark:bg-secondary-900 min-h-screen py-8 md:py-16 font-inter transition-colors duration-300">
        <div className="container-custom max-w-3xl">
          <div className="mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-secondary-500 hover:text-primary-600 transition-colors group px-4 py-2"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-wider">Quay lại</span>
            </button>
          </div>

          <div className="text-center mb-12">
            {/* Countdown Timer */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              timeLeft <= 60 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'
            }`}>
              {timeLeft <= 60 ? (
                <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
              ) : (
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              )}
            </div>
            
            <h1 className="text-4xl font-black text-secondary-900 dark:text-white mb-4 italic tracking-tight">THANH TOÁN ĐƠN HÀNG</h1>
            
            {/* Time Remaining */}
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6 ${
              timeLeft <= 60 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-bold text-lg">
                Còn lại: <span className="font-mono text-2xl">{formatTime(timeLeft)}</span>
              </span>
            </div>

            <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-6 flex items-center justify-center gap-2">
                 <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                Đang chờ bạn thực hiện chuyển khoản...
            </p>

            <div className="max-w-md mx-auto bg-white dark:bg-secondary-800 border-2 border-primary-100 dark:border-primary-900/50 rounded-3xl p-8 mb-8 shadow-2xl shadow-primary-50 dark:shadow-none">
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-6 flex items-center justify-center gap-3">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                    <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                Quét mã để chuyển khoản
              </h3>
              
              <div className="bg-white p-5 rounded-2xl inline-block mb-6 border border-secondary-100 shadow-sm">
                  <img 
                    src={`https://img.vietqr.io/image/${paymentSettings.payment_bank_id}-${paymentSettings.payment_bank_account}-compact.jpg?amount=${order.grand_total}&addInfo=${order.order_code}&accountName=${encodeURIComponent(paymentSettings.payment_bank_account_name || '')}`}
                    alt="VietQR"
                    className="w-56 h-56 object-contain"
                  />
              </div>
              
              <div className="text-sm text-secondary-600 dark:text-secondary-400 space-y-3 bg-secondary-50 dark:bg-secondary-900/50 p-5 rounded-2xl border border-secondary-100/50 dark:border-secondary-700/50">
                  <div className="flex justify-between items-center">
                     <span className="font-medium">Số tiền:</span>
                     <span className="font-black text-primary-600 dark:text-primary-400 text-2xl">{formatPrice(order.grand_total)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-secondary-200/50 dark:border-secondary-700/50">
                     <span className="font-medium">Nội dung:</span>
                     <span className="font-black text-secondary-900 dark:text-white select-all bg-white dark:bg-secondary-800 px-3 py-1 rounded-lg border border-secondary-200 dark:border-secondary-700 tracking-wider">
                        {order.order_code}
                     </span>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-xs flex gap-3 items-start text-left border border-blue-100 dark:border-blue-900/40">
                      <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                      <span className="leading-relaxed">Hệ thống sẽ <b>tự động xác nhận</b> ngay sau khi bạn chuyển khoản thành công. Đơn hàng sẽ được chuyển sang trạng thái "Đã thanh toán".</span>
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
              <div className="bg-white dark:bg-secondary-800 p-5 rounded-2xl border border-secondary-100 dark:border-secondary-700 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-left font-inter">
                      <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Thanh toán bởi</p>
                      <p className="text-sm font-bold text-secondary-900 dark:text-white">Napas 24/7</p>
                  </div>
              </div>
              <div className="bg-white dark:bg-secondary-800 p-5 rounded-2xl border border-secondary-100 dark:border-secondary-700 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left font-inter">
                      <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Xử lý tự động</p>
                      <p className="text-sm font-bold text-secondary-900 dark:text-white">Hoạt động 24/7</p>
                  </div>
              </div>
            </div>
            
            {/* Cancel Button */}
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-200 dark:border-red-800 disabled:opacity-50"
            >
              {isCancelling ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang hủy...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Hủy đơn hàng
                </span>
              )}
            </button>

            <div className="mt-8">
               <Link to="/orders" className="text-secondary-400 hover:text-primary-600 font-bold text-sm underline underline-offset-4 decoration-2">
                 Quay lại danh sách đơn hàng
               </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
