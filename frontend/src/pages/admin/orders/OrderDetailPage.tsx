import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Edit3,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../services/api';
import { formatPrice } from '../../../hooks/useShop';
import { useAuth } from '../../../contexts/AuthContext';

const statusOptions = [
  { value: 'pending', label: 'Mới', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'confirmed', label: 'Đã xác nhận', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { value: 'paid', label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'processing', label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'shipped', label: 'Đang giao', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'completed', label: 'Hoàn thành', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'refunded', label: 'Hoàn tiền', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300' }
];

const allowedStatusTransitions: Record<string, string[]> = {
  pending: ['pending', 'confirmed', 'paid', 'cancelled'],
  confirmed: ['confirmed', 'paid', 'processing', 'cancelled'],
  paid: ['paid', 'processing', 'cancelled'],
  processing: ['processing', 'shipped', 'cancelled'],
  shipped: ['shipped', 'completed', 'cancelled'],
  completed: ['completed', 'refunded'],
  cancelled: ['cancelled'],
  refunded: ['refunded']
};

const getApiErrorMessage = (error: any) => {
  const message = error?.response?.data?.error?.message || error?.response?.data?.message;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  switch (error?.response?.status) {
    case 400:
      return 'Không thể cập nhật trạng thái. Đơn hàng chỉ được chuyển sang bước hợp lệ tiếp theo.';
    case 403:
      return 'Bạn không có quyền cập nhật trạng thái đơn hàng này.';
    case 404:
      return 'Không tìm thấy đơn hàng để cập nhật.';
    default:
      return 'Cập nhật thất bại. Vui lòng kiểm tra lại trạng thái hợp lệ của đơn hàng.';
  }
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const backToList = `/admin/orders${location.search || ''}`;
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
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
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      navigate(backToList);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!id || selectedStatus === order?.status) return;

    if (selectedStatus === 'refunded' && !['admin', 'manager'].includes(user?.role || '')) {
      toast.error('Chỉ admin hoặc manager mới được xác nhận hoàn tiền');
      return;
    }

    setIsUpdating(true);
    try {
      await adminAPI.updateOrderStatus(id, selectedStatus);
      toast.success('Cập nhật trạng thái thành công');
      fetchOrder();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestockOrder = async () => {
    if (!id) return;

    setIsRestocking(true);
    try {
      await adminAPI.restockOrder(id);
      toast.success('Đã nhập lại kho cho đơn hoàn tiền');
      fetchOrder();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsRestocking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (order?.refund_requested && status === 'completed') {
      return {
        label: 'Yêu cầu hoàn tiền',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      };
    }

    const option = statusOptions.find((item) => item.value === status);
    return option || { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
  };

  const availableStatusOptions = order
    ? statusOptions.filter((option) => {
        if (option.value === order.status) {
          return true;
        }

        if (option.value === 'refunded') {
          return ['admin', 'manager'].includes(user?.role || '') && order.refund_requested && order.status === 'completed';
        }

        return (allowedStatusTransitions[order.status] || [order.status]).includes(option.value);
      })
    : statusOptions;

  const canProcessRefund = ['admin', 'manager'].includes(user?.role || '');

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={backToList}
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
        <div className="lg:col-span-2 space-y-6">
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
                        src={item.product.product_images[0].url}
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

          {order.note && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm p-4 transition-colors">
              <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">Ghi chú của khách hàng</h3>
              <p className="text-secondary-600 dark:text-secondary-300 text-sm">{order.note}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
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
                    <span
                      className={`font-medium ${
                        payment.status === 'paid'
                          ? 'text-green-600 dark:text-green-400'
                          : payment.status === 'refunded'
                            ? 'text-gray-600 dark:text-gray-300'
                            : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {payment.status === 'paid'
                        ? 'Đã thanh toán'
                        : payment.status === 'refunded'
                          ? 'Đã hoàn tiền'
                          : 'Chờ thanh toán'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                {availableStatusOptions.map((option) => (
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

          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="font-semibold text-secondary-900 dark:text-white">Quy trình hoàn tiền</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-secondary-600 dark:text-secondary-400">Khách đã gửi yêu cầu</span>
                <span className={`font-medium ${order.refund_requested ? 'text-orange-600 dark:text-orange-400' : 'text-secondary-900 dark:text-white'}`}>
                  {order.refund_requested ? 'Đã gửi' : 'Chưa có'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-secondary-600 dark:text-secondary-400">Hoàn tiền</span>
                <span className={`font-medium ${order.refund_processed ? 'text-emerald-600 dark:text-emerald-400' : 'text-secondary-900 dark:text-white'}`}>
                  {order.refund_processed ? 'Đã hoàn tiền' : 'Chưa hoàn tiền'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-secondary-600 dark:text-secondary-400">Nhập lại kho</span>
                <span className={`font-medium ${order.refund_restocked ? 'text-blue-600 dark:text-blue-400' : 'text-secondary-900 dark:text-white'}`}>
                  {order.refund_restocked ? 'Đã nhập lại kho' : 'Chưa nhập lại kho'}
                </span>
              </div>

              {canProcessRefund && order.status === 'refunded' && !order.refund_restocked && (
                <button
                  onClick={handleRestockOrder}
                  disabled={isRestocking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white rounded-full hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isRestocking ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  Xác nhận đã nhập lại kho
                </button>
              )}
            </div>
          </div>

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
                    {order.shipments[0].status === 'pending'
                      ? 'Chờ lấy hàng'
                      : order.shipments[0].status === 'shipping'
                        ? 'Đang vận chuyển'
                        : order.shipments[0].status === 'delivered'
                          ? 'Đã giao'
                          : order.shipments[0].status}
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
