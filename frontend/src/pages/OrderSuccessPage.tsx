
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  RotateCcw, 
  FileText, 
  ShoppingBag, 
  MapPin, 
  PhoneCall,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  XCircle,
  Building2
} from 'lucide-react';
import { ordersAPI, settingsAPI } from '../services/api';
import { formatPrice } from '../hooks/useShop';
import { Order } from '../types';

export default function OrderSuccessPage() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showItems, setShowItems] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>({});
  const [isPolling, setIsPolling] = useState(false);

  const isPendingPayment = order?.status === 'pending' && 
                           (!order?.payments?.length || (order?.payments[0]?.method !== 'cod'));

  // Initial Fetch
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderCode) return;
      try {
        const [orderRes, settingsRes] = await Promise.all([
             ordersAPI.getByCode(orderCode),
             settingsAPI.getPublic()
        ]);
        console.log("DEBUG ORDER:", orderRes.data.data); // Debug logging
        setOrder(orderRes.data.data);
        if (settingsRes.data.success) {
            setPaymentSettings(settingsRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch order or settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderCode]);

  // Polling for Payment Status
  useEffect(() => {
    let intervalId: any;

    if (order && isPendingPayment) {
        setIsPolling(true);
        intervalId = setInterval(async () => {
            try {
                const res = await ordersAPI.getByCode(orderCode!); 
                const updatedOrder = res.data.data;
                
                if (updatedOrder.status !== 'pending') {
                    setOrder(updatedOrder);
                    setIsPolling(false);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [order?.status, orderCode, isPendingPayment]);


  if (isLoading) {
    return (
      <div className="container-custom py-24 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-secondary-500 dark:text-secondary-400 font-medium font-inter">Đang xác nhận đơn hàng...</p>
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
          Chúng tôi không tìm thấy đơn hàng <span className="font-bold">#{orderCode}</span>.
        </p>
        <Link to="/shop" className="btn btn-primary rounded-full px-8">Quay lại cửa hàng</Link>
      </div>
    );
  }

  // Removed duplicate definition

  const isCOD = order?.payments?.[0]?.method === 'cod';

  const steps = [
    { label: 'Đặt hàng', status: 'completed', icon: CheckCircle2 },
    { 
      label: isCOD ? 'Xác nhận' : 'Thanh toán', 
      status: (order.status === 'pending' && !isCOD) ? 'active' : 'completed', 
      icon: isCOD ? FileText : ShieldCheck 
    },
    { 
      label: 'Xử lý', 
      status: (order.status === 'processing' || (order.status === 'pending' && isCOD)) ? 'active' : (['paid', 'confirmed', 'shipped', 'completed'].includes(order.status) ? 'completed' : 'pending'), 
      icon: Package 
    },
    { 
      label: 'Đang giao', 
      status: order.status === 'shipped' ? 'active' : (order.status === 'completed' ? 'completed' : 'pending'), 
      icon: Truck 
    },
    { label: 'Hoàn tất', status: order.status === 'completed' ? 'completed' : 'pending', icon: RotateCcw },
  ];

  return (
    <>
      <Helmet>
        <title>{isPendingPayment ? 'Thanh toán đơn hàng' : 'Đặt hàng thành công!'} - #{order.order_code}</title>
      </Helmet>

      <div className="bg-white dark:bg-secondary-900 min-h-screen py-8 md:py-16 print:py-0 print:bg-white font-inter transition-colors duration-300">
        <div className="container-custom max-w-3xl">
          {/* Header - Invoice Header for Print */}
          <div className="hidden print:flex justify-between items-center mb-10 border-b-2 border-secondary-100 pb-6">
            <div>
              <h2 className="text-2xl font-black text-secondary-900 italic">FASHION STORE</h2>
              <p className="text-secondary-500 text-xs uppercase tracking-widest">Hóa đơn điện tử</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">#{order.order_code}</p>
              <p className="text-[10px] text-secondary-400">{new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="text-center mb-12 print:hidden ">
            
            {/* Conditional Icon & Title */}
            {isPendingPayment ? (
                <>
                    <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    </div>
                    <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-2">Thanh toán đơn hàng</h1>
                    <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-6 flex items-center justify-center gap-2">
                         <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                        Đang chờ xác nhận thanh toán...
                    </p>
                </>
            ) : order.status === 'cancelled' ? (
                <>
                    <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-2">Đơn hàng đã hủy</h1>
                    <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-6">
                      Rất tiếc, đơn hàng này đã bị hủy.
                    </p>
                </>
            ) : order.status === 'refunded' ? (
                <>
                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
                        <RotateCcw className="w-12 h-12 text-gray-500" />
                    </div>
                    <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-2">Đã hoàn tiền</h1>
                    <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-6">
                      Đơn hàng đã được hoàn tiền thành công.
                    </p>
                </>
            ) : (
                <>
                    <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-short">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-2">Tuyệt vời!</h1>
                    <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-6">
                      {order?.payments?.[0]?.method === 'cod' 
                        ? 'Đơn hàng của bạn đã được ghi nhận thành công.' 
                        : 'Đơn hàng của bạn đã được đặt thành công.'}
                    </p>
                    {order?.payments?.[0]?.method === 'cod' && (
                      <div className="max-w-md mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-6 mb-8 text-blue-800 dark:text-blue-300">
                        <p className="font-bold flex items-center justify-center gap-2 mb-2">
                          <PhoneCall className="w-5 h-5" />
                          Lưu ý cho khách hàng COD
                        </p>
                        <p className="text-sm">
                          Vui lòng giữ điện thoại để nhân viên giao hàng có thể liên hệ với bạn. Bạn sẽ thanh toán <b>{formatPrice(order.grand_total)}</b> bằng tiền mặt khi nhận hàng.
                        </p>
                      </div>
                    )}
                </>
            )}


            {/* Payment Section (ONLY for Pending) */}
            {isPendingPayment && (
               <div className="max-w-md mx-auto bg-white dark:bg-secondary-800 border-2 border-primary-100 dark:border-primary-900/50 rounded-2xl p-6 mb-8 shadow-xl shadow-primary-50 dark:shadow-none">
                  {/* ... QR Code Generation ... */}
                  <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                       {order?.payments?.[0]?.method === 'momo' ? (
                         <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" className="w-6 h-6 object-contain" />
                       ) : (
                         <Building2 className="w-6 h-6 text-primary-600" />
                       )}
                    </div>
                    {order?.payments?.[0]?.method === 'momo' ? 'Quét mã MoMo' : 'Thông tin chuyển khoản'}
                  </h3>
                  
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 border border-secondary-100 dark:border-secondary-700">
                      {(!order?.payments?.length || order?.payments?.[0]?.method === 'bank_transfer') ? (
                          <img 
                            src={`https://img.vietqr.io/image/${paymentSettings.payment_bank_id}-${paymentSettings.payment_bank_account}-compact.jpg?amount=${order.grand_total}&addInfo=${order.order_code}&accountName=${encodeURIComponent(paymentSettings.payment_bank_account_name || '')}`}
                            alt="VietQR"
                            className="w-48 h-48 object-contain"
                          />
                      ) : (
                          <img 
                            src={paymentSettings.payment_momo_qrcode || '/placeholder-qr.png'}
                            alt="MoMo QR"
                            className="w-48 h-48 object-contain"
                          />
                      )}
                  </div>
                  
                  <div className="text-sm text-secondary-600 dark:text-secondary-400 space-y-2 bg-secondary-50 dark:bg-secondary-900/50 p-4 rounded-lg">
                      <div className="flex justify-between">
                         <span>Số tiền:</span>
                         <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">{formatPrice(order.grand_total)}</span>
                      </div>
                      <div className="flex justify-between">
                         <span>Nội dung:</span>
                         <span className="font-bold text-secondary-900 dark:text-white select-all">{order.order_code}</span>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs flex gap-2 items-start text-left">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Hệ thống sẽ <b>tự động xác nhận</b> ngay sau khi bạn chuyển khoản thành công. (Không cần chụp màn hình)</span>
                      </div>
                  </div>
               </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link 
                to="/shop" 
                className="btn btn-primary rounded-full px-8 py-3.5 font-bold shadow-xl shadow-primary-100 dark:shadow-primary-900/20 hover:-translate-y-0.5 transition-all order-1 sm:order-2"
              >
                {isPendingPayment ? 'Mua thêm đơn khác' : 'Tiếp tục mua sắm'}
              </Link>
              {/* Only show Print Invoice if NOT pending payment */}
              {!isPendingPayment && (
                  <button 
                    onClick={() => window.print()}
                    className="btn bg-secondary-50 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-full px-8 py-3.5 font-bold flex items-center justify-center gap-2 order-2 sm:order-1 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    In hóa đơn
                  </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Status & Info Card */}
            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl p-6 md:p-8 shadow-sm print:border-none print:shadow-none transition-colors duration-300">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-10 pb-6 border-b border-secondary-50 dark:border-secondary-800">
                <div>
                  <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1">Mã đơn hàng</p>
                  <p className="text-xl font-black text-secondary-900 dark:text-white">#{order.order_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1">Ngày đặt</p>
                  <p className="font-bold text-secondary-900 dark:text-white">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Progress Tracking - Adapted for Payment Flow */}
              {!['cancelled', 'refunded'].includes(order.status) && (
                <div className="relative mb-8 print:hidden">
                  <div className="absolute top-[15px] left-[5%] right-[5%] h-0.5 bg-secondary-50 dark:bg-secondary-800">
                    <div 
                      className={`h-full bg-primary-600 transition-all duration-700`}
                      style={{ width: `${(steps.findIndex(s => s.status === 'active') === -1 ? 4 : steps.findIndex(s => s.status === 'active')) * 25}%` }} 
                    />
                  </div>
                  <div className="flex justify-between relative">
                    {steps.map((step, i) => (
                      <div key={i} className="flex flex-col items-center group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                          step.status === 'completed' 
                            ? 'bg-primary-600 border-primary-100 dark:border-primary-900 text-white' 
                            : step.status === 'active'
                              ? 'bg-white dark:bg-secondary-800 border-primary-600 text-primary-600 animate-pulse'
                              : 'bg-white dark:bg-secondary-800 border-secondary-100 dark:border-secondary-700 text-secondary-300 dark:text-secondary-600'
                        }`}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 mt-2 uppercase tracking-tighter">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Summary Grid */}
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                {/* Shipping Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    Địa chỉ giao nhận
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-secondary-900 dark:text-white mb-1">{order.customer_name}</p>
                    <p className="text-secondary-500 dark:text-secondary-400 leading-relaxed mb-1">
                      {order.ship_address_line1}, {order.ship_city}, {order.ship_province}
                    </p>
                    <p className="text-secondary-700 dark:text-secondary-300 font-medium flex items-center gap-2">
                       <PhoneCall className="w-3.5 h-3.5 text-secondary-400" />
                       {order.customer_phone}
                    </p>
                  </div>
                </div>

                {/* Costs info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                    Thanh toán
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-500 dark:text-secondary-400">Tạm tính:</span>
                      <span className="font-medium text-secondary-900 dark:text-white">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-500 dark:text-secondary-400">Phí giao hàng:</span>
                      <span className="font-medium text-secondary-900 dark:text-white">{formatPrice(order.shipping_fee)}</span>
                    </div>
                    {order.discount_total > 0 && (
                      <div className="flex justify-between text-sm text-red-500 dark:text-red-400">
                        <span>Giảm giá:</span>
                        <span>-{formatPrice(order.discount_total)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-500 dark:text-secondary-400">Phương thức:</span>
                      <span className="font-bold text-secondary-900 dark:text-white uppercase">
                        {order.payments?.[0]?.method === 'cod' ? 'Thanh toán khi nhận hàng' : 
                         order.payments?.[0]?.method === 'bank_transfer' ? 'Chuyển khoản' : 
                         order.payments?.[0]?.method === 'vnpay' ? 'VNPay' : 
                         order.payments?.[0]?.method === 'momo' ? 'MoMo' : order.payments?.[0]?.method}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-primary-600 dark:text-primary-400 pt-2 border-t border-secondary-50 dark:border-secondary-800 mt-2">
                      <span>Tổng cộng:</span>
                      <span>{formatPrice(order.grand_total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Card - Collapsible for neatness */}
            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl overflow-hidden shadow-sm print:border-none print:shadow-none transition-colors duration-300">
              <button 
                onClick={() => setShowItems(!showItems)}
                className="w-full p-6 flex items-center justify-between hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors print:hidden"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-800 rounded-xl flex items-center justify-center transition-colors">
                      <ShoppingBag className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                   </div>
                   <div className="text-left font-inter">
                     <p className="text-sm font-bold text-secondary-900 dark:text-white">Chi tiết sản phẩm</p>
                     <p className="text-xs text-secondary-500 dark:text-secondary-500">{order.order_items?.length} sản phẩm đã chọn</p>
                   </div>
                </div>
                {showItems ? <ChevronUp className="w-5 h-5 text-secondary-400 dark:text-secondary-500" /> : <ChevronDown className="w-5 h-5 text-secondary-400 dark:text-secondary-500" />}
              </button>

              <div className={`print:block ${showItems ? 'block' : 'hidden'}`}>
                <div className="divide-y divide-secondary-50 dark:divide-secondary-800 bg-secondary-50/30 dark:bg-secondary-800/50">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="p-6 flex gap-4 items-center">
                      <div className="w-16 h-16 bg-white dark:bg-secondary-800 rounded-xl overflow-hidden flex-shrink-0 border border-secondary-100 dark:border-secondary-700 transition-colors">
                        <img 
                          src={item.product?.product_images?.[0]?.url || '/placeholder.jpg'} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 font-inter">
                        <h4 className="font-bold text-secondary-900 dark:text-white text-sm truncate">{item.name}</h4>
                        <p className="text-[10px] text-secondary-400 dark:text-secondary-500 font-medium mb-1">{item.options_text}</p>
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-secondary-600 dark:text-secondary-400">x{item.qty}</span>
                           <span className="text-sm font-black text-secondary-900 dark:text-white">{formatPrice(item.unit_price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Support footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 pt-4 print:hidden">
              <p className="text-xs text-secondary-400 dark:text-secondary-500 font-medium">Bạn cần giúp đỡ? Truy cập <Link to="/contact" className="text-primary-600 dark:text-primary-400 hover:underline">Trung tâm hỗ trợ</Link></p>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-300 dark:text-secondary-700 uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Bảo mật 100%
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-300 dark:text-secondary-700 uppercase tracking-widest">
                    <RotateCcw className="w-4 h-4" />
                    30 ngày đổi trả
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
