import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Eye,
  Package,
  Clock,
  Truck,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../services/api';
import { formatPrice } from '../../../hooks/useShop';
import Pagination from '../../../components/common/Pagination';
import AIInsightPanel from '../../../components/common/AIInsightPanel';

const tabs = [
  { id: 'all', label: 'Tất cả' },
  { id: 'new', label: 'Mới' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'delivering', label: 'Đang giao' },
  { id: 'refund_requested', label: 'Yêu cầu hoàn tiền' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'refunded', label: 'Hoàn tiền' },
  { id: 'cancelled', label: 'Đã hủy' }
];

const getOrderBadge = (order: any) => {
  if (order.refund_requested && order.status === 'completed') {
    return {
      label: 'Yêu cầu hoàn tiền',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };
  }

  switch (order.status) {
    case 'completed':
      return { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
    case 'paid':
      return { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' };
    case 'confirmed':
      return { label: 'Đã xác nhận', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' };
    case 'pending':
      return { label: 'Mới', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
    case 'processing':
      return { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
    case 'shipped':
      return { label: 'Đang giao', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' };
    case 'cancelled':
      return { label: 'Đã hủy', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    case 'refunded':
      return { label: 'Hoàn tiền', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    default:
      return { label: order.status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  }
};

export default function OrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    pendingOrders: 0,
    deliveringOrders: 0,
    revenueToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [pagination, setPagination] = useState({
    page: Math.max(1, Number(searchParams.get('page') || 1) || 1),
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: status === 'all' ? undefined : status,
        search: search || undefined
      });

      const data = response.data.data;
      setOrders(data.orders || []);
      setStats(data.stats || {});
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, pagination.page]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (status !== 'all') next.set('status', status);
    if (pagination.page > 1) next.set('page', String(pagination.page));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [search, status, pagination.page, searchParams, setSearchParams]);

  const listQuery = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Quản lý đơn hàng</h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-sm">Xem và quản lý đơn hàng của khách hàng</p>
        </div>

        <button
          onClick={() =>
            adminAPI.exportOrders({
              status: status === 'all' ? undefined : status,
              search: search || undefined
            }).catch(() => {
              toast.error('Không thể xuất đơn hàng');
            })
          }
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 text-sm font-medium hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
        >
          <Package className="w-4 h-4" />
          Xuất đơn hàng
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Tổng đơn hàng</p>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.totalOrders || 0}</h3>
        </div>

        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Chờ xử lý</p>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.pendingOrders || 0}</h3>
        </div>

        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Đang giao</p>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.deliveringOrders || 0}</h3>
        </div>

        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Doanh thu hôm nay</p>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{formatPrice(stats.revenueToday || 0)}</h3>
        </div>
      </div>

      <AIInsightPanel
        title="AI Phân tích đơn hàng"
        prompt="Phân tích chi tiết tình hình đơn hàng. Đánh giá tỷ lệ xử lý, tốc độ giao hàng, yêu cầu hoàn tiền và đề xuất cải thiện."
        dataContext={[
          `Tổng đơn hàng: ${stats?.totalOrders ?? 0}`,
          `Đơn chờ xử lý: ${stats?.pendingOrders ?? 0}`,
          `Đơn đang giao: ${stats?.deliveringOrders ?? 0}`,
          `Doanh thu hôm nay: ${(stats?.revenueToday ?? 0).toLocaleString('vi-VN')} VNĐ`,
          `Tab đang lọc: ${status}`
        ].join('\n')}
      />

      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
        <div className="flex overflow-x-auto border-b border-secondary-200 dark:border-secondary-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatus(tab.id);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                status === tab.id
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-secondary-500 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-secondary-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-700/20">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn, khách hàng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm text-secondary-900 dark:text-white placeholder-secondary-400 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Ngày đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700 bg-white dark:bg-secondary-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const badge = getOrderBadge(order);
                  return (
                    <tr key={order.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">#{order.order_code}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        <div className="flex flex-col">
                          <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                          <span className="text-xs text-secondary-400">
                            {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900 dark:text-white">{order.customer_name}</div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">{order.user?.email || order.customer_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-secondary-900 dark:text-white">
                        {formatPrice(order.grand_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/orders/${order.id}${listQuery}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && orders.length > 0 && (
          <div className="bg-white dark:bg-secondary-800 px-4 py-3 border-t border-secondary-200 dark:border-secondary-700 flex flex-col sm:flex-row items-center justify-between gap-4 sm:px-6 transition-colors">
            <div className="text-sm text-secondary-500 dark:text-secondary-400">
              Hiển thị trang <span className="font-medium text-secondary-900 dark:text-white">{pagination.page}</span> trên{' '}
              <span className="font-medium text-secondary-900 dark:text-white">{Math.max(1, pagination.totalPages)}</span>
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
