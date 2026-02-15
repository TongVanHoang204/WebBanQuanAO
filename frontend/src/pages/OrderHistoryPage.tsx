import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  Eye, 
  ChevronRight, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  CreditCard,
  ShoppingBag,
  Search,
  Filter,
  Star,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { Order } from '../types';
import { ordersAPI, toMediaUrl } from '../services/api';
import { formatPrice } from '../hooks/useShop';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingScreen from '../components/common/LoadingScreen';

type TabType = 'all' | 'ongoing' | 'completed' | 'cancelled';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Chờ thanh toán', color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30', icon: Clock },
  paid: { label: 'Đã thanh toán', color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30', icon: CheckCircle2 },
  processing: { label: 'Đang xử lý', color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30', icon: Package },
  shipped: { label: 'Đang vận chuyển', color: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-900/30', icon: Truck },
  completed: { label: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30', icon: XCircle },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-900/30', icon: RotateCcw },
  confirmed: { label: 'Đã xác nhận', color: 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/30', icon: ShieldCheck }
};

export default function OrderHistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadOrders = async () => {
      try {
        const response = await ordersAPI.getAll();
        setOrders(response.data.data.orders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [isAuthenticated]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') return ['pending', 'confirmed', 'paid', 'processing', 'shipped'].includes(order.status);
    if (activeTab === 'completed') return order.status === 'completed';
    if (activeTab === 'cancelled') return ['cancelled', 'refunded'].includes(order.status);
    return true;
  });

  const handleCancelOrder = async () => {
    if (!cancelModal.orderId) return;
    
    try {
      await ordersAPI.cancel(cancelModal.orderId);
      toast.success('Đã hủy đơn hàng thành công');
      // Refresh orders
      const response = await ordersAPI.getAll();
      setOrders(response.data.data.orders);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể hủy đơn hàng');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-24 text-center font-inter">
        <div className="w-20 h-20 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary-300">
           <Package className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-4">Bạn chưa đăng nhập</h1>
        <p className="text-secondary-500 dark:text-secondary-400 mb-8 max-w-md mx-auto">
          Vui lòng đăng nhập để xem lịch sử đơn hàng và theo dõi quá trình vận chuyển.
        </p>
        <Link to="/login" className="btn btn-primary rounded-full px-12">Đăng nhập ngay</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Đơn hàng của tôi - Fashion Store</title>
      </Helmet>

      <div className="bg-secondary-50 dark:bg-secondary-900 min-h-screen py-8 md:py-12 transition-colors duration-300 font-inter">
        <div className="container-custom">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <nav className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary-400 dark:text-secondary-500">
                <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Trang chủ</Link>
                <span>/</span>
                <span className="text-secondary-900 dark:text-white">Đơn hàng của tôi</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-black text-secondary-900 dark:text-white uppercase italic tracking-tighter">Lịch sử đơn hàng</h1>
            </div>
            
            {/* Search/Filter bar mockup feel */}
            <div className="flex gap-2">
              <button className="p-3 bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-xl text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-xl text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 border-b border-secondary-200 dark:border-secondary-700 mb-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'ongoing', label: 'Đang xử lý' },
              { id: 'completed', label: 'Hoàn thành' },
              { id: 'cancelled', label: 'Đã hủy' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab.id 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 dark:bg-primary-400 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <LoadingScreen fullScreen={false} />
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl py-24 text-center shadow-sm">
              <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary-300 dark:text-secondary-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-secondary-500 dark:text-secondary-400 font-medium">Bạn không có đơn hàng nào trong mục này.</p>
              <Link to="/shop" className="text-primary-600 dark:text-primary-400 font-bold hover:underline mt-4 inline-block">Khám phá sản phẩm ngay</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-6 md:p-8 flex flex-wrap justify-between items-start gap-4">
                    <div className="flex gap-10">
                       <div>
                         <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-1">Mã đơn hàng</p>
                         <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tighter text-lg">#{order.order_code}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-1">
                            {order.status === 'completed' ? 'Đã giao ngày' : 'Đặt ngày'}
                         </p>
                         <p className="font-bold text-secondary-900 dark:text-white">
                            {new Date(order.created_at).toLocaleDateString('vi-VN')}
                         </p>
                       </div>
                    </div>

                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${statusConfig[order.status]?.color || ''}`}>
                       {(() => {
                         const StatusIcon = statusConfig[order.status]?.icon;
                         return StatusIcon ? <StatusIcon className="w-3.5 h-3.5" /> : null;
                       })()}
                       {statusConfig[order.status]?.label || order.status}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 md:px-8 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1 flex gap-6 items-center">
                      {/* Thumbnail Stack */}
                      <div className="flex -space-x-4">
                        {order.order_items?.slice(0, 3).map((item, i) => (
                          <div key={item.id} className="w-20 h-20 bg-white dark:bg-secondary-700 rounded-2xl overflow-hidden border-4 border-white dark:border-secondary-800 shadow-sm relative" style={{ zIndex: 10 - i }}>
                            <img 
                              src={toMediaUrl(item.product?.product_images?.[0]?.url || '/placeholder.jpg')} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {order.order_items && order.order_items.length > 3 && (
                          <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-700 rounded-2xl border-4 border-white dark:border-secondary-800 flex items-center justify-center text-secondary-500 dark:text-secondary-400 font-bold text-lg z-0">
                            +{order.order_items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Item Content Summary */}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-secondary-900 dark:text-white line-clamp-1 mb-1">
                          Sản phẩm: {order.order_items?.[0]?.name} {order.order_items && order.order_items.length > 1 ? `+ ${order.order_items.length - 1} mặt hàng khác` : ''}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {order.status === 'shipped' ? (
                            <>
                              <Truck className="w-3.5 h-3.5" />
                              Đang trên đường giao đến bạn
                            </>
                          ) : order.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Kiện hàng đã được bàn giao thành công
                            </>
                          ) : order.status === 'pending' ? (
                            <p className="text-amber-500 flex items-center gap-1.5">
                               <Clock className="w-3.5 h-3.5" />
                               Vui lòng hoàn tất thanh toán trong 24h
                            </p>
                          ) : (
                            <p className="text-secondary-400">Chúng tôi đang chuẩn bị hàng cho bạn</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                       <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-1">Tổng cộng đơn hàng</p>
                       <p className="text-2xl font-black text-secondary-900 dark:text-white">{formatPrice(order.grand_total)}</p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-6 md:px-8 py-5 bg-secondary-50/50 dark:bg-secondary-900/40 border-t border-secondary-50 dark:border-secondary-700 flex flex-wrap justify-between items-center gap-4">
                     {/* Info message based on status */}
                     <div className="flex items-center gap-2">
                        {order.status === 'shipped' && (
                           <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              Đang vận chuyển: TP. Hồ Chí Minh
                           </span>
                        )}
                        {order.status === 'completed' && (
                           <div className="flex text-amber-400 dark:text-amber-500 gap-0.5">
                              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                              <span className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest ml-2">Đã đánh giá</span>
                           </div>
                        )}
                     </div>

                     <div className="flex flex-wrap gap-3">
                         {['pending', 'confirmed'].includes(order.status) && (
                           <>
                             <button 
                               onClick={() => setCancelModal({ isOpen: true, orderId: order.id })}
                               className="px-5 py-2 text-xs font-bold rounded-xl border border-secondary-200 dark:border-secondary-700 hover:bg-white dark:hover:bg-secondary-700 transition-all text-secondary-700 dark:text-secondary-300"
                             >
                               Hủy đơn hàng
                             </button>
                             {order.status === 'pending' && order.payments?.[0]?.method !== 'cod' && (
                               <button 
                                 onClick={() => navigate(`/checkout/payment/${order.id}`)}
                                 className="px-6 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-100 dark:shadow-none transition-all flex items-center gap-2"
                               >
                                 <CreditCard className="w-4 h-4" />
                                 Thanh toán ngay
                               </button>
                             )}
                           </>
                         )}

                        {order.status === 'shipped' && (
                           <button className="px-6 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-100 dark:shadow-none transition-all">
                               Tra cứu vận chuyển
                           </button>
                        )}

                        {order.status === 'completed' && (
                           <>
                              <button className="px-5 py-2 text-xs font-bold rounded-xl border border-secondary-200 dark:border-secondary-700 hover:bg-white dark:hover:bg-secondary-700 transition-all text-secondary-700 dark:text-secondary-300">
                                Trả hàng / Hoàn tiền
                              </button>
                              <button className="px-6 py-2 text-xs font-bold rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all">
                                Mua lại sản phẩm
                              </button>
                           </>
                        )}

                        <Link 
                          to={`/orders/${order.id}`}
                          className="px-5 py-2 text-xs font-bold rounded-xl border border-secondary-200 dark:border-secondary-700 hover:bg-white dark:hover:bg-secondary-700 transition-all text-secondary-700 dark:text-secondary-300 flex items-center gap-2"
                        >
                          Xem chi tiết
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, orderId: null })}
        onConfirm={handleCancelOrder}
        title="Xác nhận hủy đơn"
        message="Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."
        confirmText="Đồng ý hủy"
        cancelText="Để em xem lại"
        isDestructive={true}
      />
    </>
  );
}

