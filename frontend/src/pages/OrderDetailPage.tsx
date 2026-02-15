import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  CreditCard, 
  FileText, 
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  HelpCircle,
  RotateCcw,
  Printer
} from 'lucide-react';
import { ordersAPI, settingsAPI } from '../services/api';
import { formatPrice } from '../hooks/useShop';
import { Order } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Banknote, QrCode, Building2, Wallet } from 'lucide-react';
import { toMediaUrl } from '../services/api';
import LoadingScreen from '../components/common/LoadingScreen';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId, isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!order) {
    return (
      <div className="container-custom py-24 text-center">
        <div className="w-20 h-20 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary-300">
           <Package className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4">Không tìm thấy đơn hàng</h1>
        <p className="text-secondary-500 dark:text-secondary-400 mb-8 max-w-md mx-auto">
          Chúng tôi xin lỗi, đơn hàng bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link to="/orders" className="btn btn-primary rounded-full px-8">Quay lại danh sách</Link>
      </div>
    );
  }

  const steps = [
    { label: 'Đã đặt hàng', date: new Date(order.created_at).toLocaleString('vi-VN'), completed: true, icon: Clock },
    { label: 'Đang xử lý', date: order.status !== 'pending' ? 'Hôm nay' : 'Dự kiến', completed: order.status !== 'pending', icon: Package },
    { label: 'Đang giao hàng', date: order.status === 'shipped' || order.status === 'completed' ? 'Đã gửi' : 'Dự kiến', completed: order.status === 'shipped' || order.status === 'completed', icon: Truck },
    { label: 'Đã nhận hàng', date: order.status === 'completed' ? 'Thành công' : 'Dự kiến', completed: order.status === 'completed', icon: CheckCircle2 },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Chi tiết đơn hàng #{order.order_code}</title>
      </Helmet>

      <div className="bg-secondary-50 dark:bg-secondary-900 min-h-screen py-8 md:py-12 transition-colors duration-300 font-inter print:bg-white">
        <div className="container-custom max-w-5xl">
          {/* Breadcrumbs & Navigation */}
          <div className="flex items-center justify-between mb-8 print:hidden">
            <Link to="/orders" className="flex items-center gap-2 text-sm font-bold text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Quay lại danh sách
            </Link>
          </div>

          {/* Header Card */}
          <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl p-6 md:p-8 shadow-sm mb-6 transition-colors print:border-none print:shadow-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter">Đơn hàng #{order.order_code}</h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    order.status === 'paid' || order.status === 'completed' 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  }`}>
                    {order.status === 'paid' || order.status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                </div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Đặt ngày {new Date(order.created_at).toLocaleDateString('vi-VN')} lúc {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2.5 bg-secondary-50 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-100 rounded-xl font-bold text-sm hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-all border border-secondary-100 dark:border-secondary-600"
                >
                  <Printer className="w-4 h-4" />
                  In hóa đơn
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-secondary-50 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-100 rounded-xl font-bold text-sm hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-all border border-secondary-100 dark:border-secondary-600">
                  <Truck className="w-4 h-4" />
                  Tra cứu vận chuyển
                </button>
                {order.status === 'pending' && order.payments?.[0]?.method !== 'cod' && (
                  <button 
                    onClick={() => navigate(`/checkout/payment/${order.id}`)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 dark:shadow-none"
                  >
                    <CreditCard className="w-4 h-4" />
                    Thanh toán ngay
                  </button>
                )}
              </div>
            </div>

            {/* Print-only Header */}
            <div className="hidden print:block border-b-2 border-secondary-100 pb-6 mt-4">
              <h2 className="text-xl font-black italic">FASHION STORE</h2>
              <p className="text-xs text-secondary-500 uppercase">Hóa đơn bán hàng</p>
            </div>
          </div>

          {/* Shipping Status Tracking */}
          <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl p-6 md:p-8 shadow-sm mb-6 transition-colors print:hidden">
            <h3 className="text-sm font-bold text-secondary-900 dark:text-white uppercase tracking-widest mb-10">Trạng thái vận chuyển</h3>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-[18px] left-[5%] right-[5%] h-1 bg-secondary-50 dark:bg-secondary-700 rounded-full">
                <div 
                  className="h-full bg-primary-600 transition-all duration-1000"
                  style={{ width: `${(steps.filter(s => s.completed).length - 1) * 33.33}%` }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center max-w-[100px]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 transition-all duration-500 ${
                      step.completed 
                      ? 'bg-primary-600 border-primary-100 dark:border-primary-900 text-white shadow-lg shadow-primary-100 dark:shadow-none' 
                      : 'bg-white dark:bg-secondary-700 border-secondary-50 dark:border-secondary-700 text-secondary-200 dark:text-secondary-500'
                    }`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div className="mt-4">
                      <p className={`text-xs font-bold leading-tight mb-1 ${step.completed ? 'text-secondary-900 dark:text-white' : 'text-secondary-300'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-secondary-400 font-medium">
                        {step.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl p-6 shadow-sm transition-colors print:border-none print:shadow-none">
               <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <MapPin className="w-4 h-4" />
                 </div>
                 <h4 className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-widest">Địa chỉ nhận hàng</h4>
               </div>
               <div className="text-sm">
                 <p className="font-bold text-secondary-900 dark:text-white mb-2">{order.customer_name}</p>
                 <p className="text-secondary-500 dark:text-secondary-400 leading-relaxed">
                   {order.ship_address_line1}<br />
                   {order.ship_city}, {order.ship_province}<br />
                   Việt Nam
                 </p>
                 <p className="mt-3 text-secondary-700 dark:text-secondary-300 font-medium">{order.customer_phone}</p>
               </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl p-6 shadow-sm transition-colors print:border-none print:shadow-none">
               <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                    {order.payments?.[0]?.method === 'cod' ? (
                      <Banknote className="w-4 h-4" />
                    ) : order.payments?.[0]?.method === 'bank_transfer' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                 </div>
                 <h4 className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-widest">Phương thức thanh toán</h4>
               </div>
               <div className="text-sm">
                 {order.payments?.[0]?.method === 'cod' ? (
                   <div className="py-1">
                     <p className="font-bold text-secondary-900 dark:text-white mb-1">Thanh toán khi nhận hàng (COD)</p>
                     <p className="text-secondary-400 dark:text-secondary-500 text-xs">
                       Vui lòng chuẩn bị sẵn số tiền <span className="text-primary-600 font-bold">{formatPrice(order.grand_total)}</span> khi nhận hàng.
                     </p>
                   </div>
                 ) : order.payments?.[0]?.method === 'bank_transfer' ? (
                   <div className="space-y-1">
                     <p className="font-bold text-secondary-900 dark:text-white mb-1">Chuyển khoản ngân hàng</p>
                     {paymentSettings ? (
                       <div className="text-[11px] text-secondary-600 dark:text-secondary-400 leading-tight bg-secondary-50 dark:bg-secondary-900/40 p-2 rounded-lg border border-secondary-100 dark:border-secondary-800">
                         <p><span className="font-medium">Ngân hàng:</span> {paymentSettings.payment_bank_id}</p>
                         <p><span className="font-medium">Số TK:</span> <span className="select-all font-bold text-secondary-900 dark:text-white">{paymentSettings.payment_bank_account}</span></p>
                         <p><span className="font-medium">Chủ TK:</span> {paymentSettings.payment_bank_account_name}</p>
                       </div>
                     ) : (
                       <p className="text-secondary-400 text-xs italic">Đang tải thông tin chuyển khoản...</p>
                     )}
                   </div>
                 ) : order.payments?.[0]?.method === 'momo' || order.payments?.[0]?.method === 'vnpay' ? (
                   <div className="flex items-center gap-3 py-1">
                     <div className="w-8 h-8 bg-secondary-50 dark:bg-secondary-900 rounded-lg flex items-center justify-center p-1.5 border border-secondary-100 dark:border-secondary-800">
                        <Wallet className="w-4 h-4 text-primary-500" />
                     </div>
                     <div>
                       <p className="font-bold text-secondary-900 dark:text-white uppercase">{order.payments[0].method}</p>
                       <p className="text-[10px] text-emerald-500 font-bold">Thanh toán trực tuyến</p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-1 px-2 border dark:border-secondary-600 rounded text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase">Thanh toán</div>
                      <p className="font-medium text-secondary-700 dark:text-secondary-200 tracking-wider uppercase">{order.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                   </div>
                 )}
                 <p className="text-secondary-400 dark:text-secondary-500 text-[10px] leading-relaxed mt-2 border-t border-secondary-50 dark:border-secondary-800 pt-2 italic">
                   Địa chỉ thanh toán trùng khớp với địa chỉ giao hàng
                 </p>
               </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl p-6 shadow-sm transition-colors print:border-none print:shadow-none">
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Truck className="w-4 h-4" />
                 </div>
                 <h4 className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-widest">Vận chuyển</h4>
               </div>
               <div className="text-sm">
                 <p className="font-bold text-secondary-900 dark:text-white mb-1">Giao hàng nhanh (2-4 ngày)</p>
                 <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold mb-3">
                   Mã tra cứu: FS-{order.order_code}
                   <ExternalLink className="w-3.5 h-3.5" />
                 </div>
                 <p className="text-[10px] font-bold text-secondary-300 dark:text-secondary-600 uppercase tracking-widest">Vận chuyển bởi FASHION EXPRESS</p>
               </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl overflow-hidden shadow-sm mb-6 transition-colors print:border-none print:shadow-none">
             <div className="p-6 md:p-8 border-b border-secondary-50 dark:border-secondary-700">
               <h3 className="text-sm font-bold text-secondary-900 dark:text-white uppercase tracking-widest">Sản phẩm trong đơn hàng</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left font-inter">
                 <thead>
                   <tr className="bg-secondary-50 dark:bg-secondary-900/40 text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest print:bg-transparent">
                     <th className="px-8 py-4">Sản phẩm</th>
                     <th className="px-8 py-4 text-center">Số lượng</th>
                     <th className="px-8 py-4 text-right">Đơn giá</th>
                     <th className="px-8 py-4 text-right">Tổng tiền</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-secondary-50 dark:divide-secondary-700">
                   {order.order_items?.map((item) => (
                     <tr key={item.id} className="group">
                       <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-white dark:bg-secondary-700 rounded-2xl overflow-hidden border border-secondary-100 dark:border-transparent flex-shrink-0 transition-colors">
                             <img 
                               src={toMediaUrl(item.product?.product_images?.[0]?.url || '/placeholder.jpg')} 
                               alt={item.name} 
                               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                             />
                           </div>
                           <div className="min-w-0">
                             <p className="text-sm font-bold text-secondary-900 dark:text-white line-clamp-1 mb-1">{item.name}</p>
                             <p className="text-[10px] text-secondary-400 dark:text-secondary-500 font-medium uppercase tracking-tighter">{item.options_text}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-6 text-center text-sm font-bold text-secondary-600 dark:text-secondary-400">
                         {item.qty}
                       </td>
                       <td className="px-8 py-6 text-right text-sm font-medium text-secondary-900 dark:text-white">
                         {formatPrice(item.unit_price)}
                       </td>
                       <td className="px-8 py-6 text-right text-sm font-black text-secondary-900 dark:text-white">
                         {formatPrice(item.unit_price * item.qty)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Footer Grid */}
          <div className="grid md:grid-cols-12 gap-6 items-end">
            {/* Help & Actions */}
            <div className="md:col-span-7 print:hidden">
               <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 px-6 py-5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-[2rem] font-bold text-sm text-secondary-700 dark:text-secondary-300 hover:border-primary-600 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-all shadow-sm group">
                     <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
                     Mua lại đơn hàng
                  </button>
                  <button className="flex items-center justify-center gap-3 px-6 py-5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-[2rem] font-bold text-sm text-secondary-700 dark:text-secondary-300 hover:border-primary-600 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-all shadow-sm group">
                     <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                     Cần trợ giúp?
                  </button>
               </div>
            </div>

            {/* Price Summary */}
            <div className="md:col-span-5">
              <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl p-8 shadow-sm transition-colors print:border-none print:shadow-none">
                <h4 className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-widest mb-6 border-b border-secondary-50 dark:border-secondary-700 pb-4">Tóm tắt đơn hàng</h4>
                <div className="space-y-4 font-medium">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-400 dark:text-secondary-500">Tạm tính:</span>
                    <span className="text-secondary-900 dark:text-white">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-400 dark:text-secondary-500">Phí vận chuyển dự kiến:</span>
                    <span className="text-secondary-900 dark:text-white">{formatPrice(order.shipping_fee)}</span>
                  </div>
                  {order.discount_total > 0 && (
                    <div className="flex justify-between text-sm text-red-500 font-bold">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(order.discount_total)}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t border-secondary-50 dark:border-secondary-700 flex justify-between items-end">
                    <span className="text-lg font-black text-secondary-900 dark:text-white uppercase italic tracking-tighter">Tổng cộng</span>
                    <span className="text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tighter">
                      {formatPrice(order.grand_total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-[10px] font-bold text-secondary-300 dark:text-secondary-700 uppercase tracking-widest print:hidden">
            © 2024 Fashion Store Inc. Mọi quyền được bảo lưu.
          </div>
        </div>
      </div>
    </>
  );
}
