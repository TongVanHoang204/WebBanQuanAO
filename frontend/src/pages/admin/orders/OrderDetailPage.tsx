import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Save
} from 'lucide-react';
import { adminAPI, toMediaUrl } from '../../../services/api';
import { formatPrice } from '../../../hooks/useShop';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'pending', label: 'Mới', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'confirmed', label: 'Đã xác nhận', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { value: 'processing', label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'shipped', label: 'Đang giao', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'completed', label: 'Hoàn thành', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'refunded', label: 'Hoàn tiền', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300' },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await adminAPI.getOrderById(id);
      setOrder(response.data.data);
      setSelectedStatus(response.data.data.status);
    } catch (error) {
      toast.error('Không thể tải thông tin đơn hàng');
      navigate('/admin/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!id || selectedStatus === order?.status) return;
    setIsUpdating(true);
    try {
      await adminAPI.updateOrderStatus(id, selectedStatus);
      toast.success('Cập nhật trạng thái thành công');
      fetchOrder(); // Refresh data
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option || { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500 dark:text-secondary-400">Không tìm thấy đơn hàng</p>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/orders" 
            className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Đơn hàng #{order.order_code}
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm">
              Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 text-sm font-semibold rounded-full ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-2">
              <Package className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
              <h2 className="font-semibold text-secondary-900 dark:text-white">Sản phẩm đặt mua</h2>
            </div>
            <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.product_images?.[0]?.url ? (
                      <img 
                        src={toMediaUrl(item.product.product_images[0].url)} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-secondary-900 dark:text-white truncate">{item.name}</h3>
                    {item.options_text && (
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">{item.options_text}</p>
                    )}
                    <p className="text-xs text-secondary-400 dark:text-secondary-500">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-secondary-900 dark:text-white">{formatPrice(item.unit_price)}</p>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">x{item.qty}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="font-bold text-secondary-900 dark:text-white">{formatPrice(item.line_total)}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Order Summary */}
            <div className="p-4 bg-secondary-50 dark:bg-secondary-700/30 border-t border-secondary-200 dark:border-secondary-700 space-y-2 transition-colors">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Tạm tính</span>
                <span className="text-secondary-900 dark:text-white">{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discount_total) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Giảm giá</span>
                  <span className="text-green-600 dark:text-green-400">-{formatPrice(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Phí vận chuyển</span>
                <span className="text-secondary-900 dark:text-white">{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-secondary-200 dark:border-secondary-700">
                <span className="text-secondary-900 dark:text-white">Tổng cộng</span>
                <span className="text-primary-600 dark:text-primary-400">{formatPrice(order.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.note && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm p-4 transition-colors">
              <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">Ghi chú của khách hàng</h3>
              <p className="text-secondary-600 dark:text-secondary-300 text-sm">{order.note}</p>
            </div>
          )}
        </div>

        {/* Right Column - Customer & Status */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-2">
              <User className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
              <h2 className="font-semibold text-secondary-900 dark:text-white">Thông tin khách hàng</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Họ tên</p>
                <p className="font-medium text-secondary-900 dark:text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Số điện thoại</p>
                <p className="font-medium text-secondary-900 dark:text-white">{order.customer_phone}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
              <h2 className="font-semibold text-secondary-900 dark:text-white">Địa chỉ giao hàng</h2>
            </div>
            <div className="p-4">
              <p className="text-secondary-900 dark:text-white">{order.ship_address_line1}</p>
              {order.ship_address_line2 && (
                <p className="text-secondary-600 dark:text-secondary-300">{order.ship_address_line2}</p>
              )}
              <p className="text-secondary-600 dark:text-secondary-300">
                {order.ship_city}, {order.ship_province}
              </p>
              {order.ship_postal_code && (
                <p className="text-secondary-500 dark:text-secondary-400 text-sm">{order.ship_postal_code}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
              <h2 className="font-semibold text-secondary-900 dark:text-white">Thanh toán</h2>
            </div>
            <div className="p-4 space-y-2">
              {order.payments?.map((payment: any) => (
                <div key={payment.id}>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Phương thức</span>
                    <span className="font-medium text-secondary-900 dark:text-white uppercase">{payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Trạng thái</span>
                    <span className={`font-medium ${payment.status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {payment.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
              <h2 className="font-semibold text-secondary-900 dark:text-white">Cập nhật trạng thái</h2>
            </div>
            <div className="p-4 space-y-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white rounded-full px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || selectedStatus === order.status}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>

          {/* Shipment Info */}
          {order.shipments?.[0] && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
              <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-2">
                <Truck className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                <h2 className="font-semibold text-secondary-900 dark:text-white">Vận chuyển</h2>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Trạng thái</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {order.shipments[0].status === 'pending' ? 'Chờ lấy hàng' :
                     order.shipments[0].status === 'shipping' ? 'Đang vận chuyển' :
                     order.shipments[0].status === 'delivered' ? 'Đã giao' : order.shipments[0].status}
                  </span>
                </div>
                {order.shipments[0].tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Mã vận đơn</span>
                    <span className="font-medium text-secondary-900 dark:text-white">{order.shipments[0].tracking_number}</span>
                  </div>
                )}
                {order.shipments[0].carrier && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Đơn vị vận chuyển</span>
                    <span className="font-medium text-secondary-900 dark:text-white">{order.shipments[0].carrier}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
