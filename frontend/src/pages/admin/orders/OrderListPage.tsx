
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  Truck,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { adminAPI } from '../../../services/api';
import { formatPrice } from '../../../hooks/useShop';
import toast from 'react-hot-toast';

export default function OrderListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    pendingOrders: 0,
    deliveringOrders: 0,
    revenueToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all'); // all, new (pending), processing, delivering (shipped), completed
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
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
        search: search || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      
      const data = response.data.data;
      setOrders(data.orders);
      setStats(data.stats);
      
      // Pagination is inside data.data, not data directly
      if (data.pagination) {
        setPagination(prev => ({ 
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
  }, [search, status, startDate, endDate, pagination.page]);

  const getPageItems = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
  };

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'new', label: 'Mới' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'processing', label: 'Đang xử lý' },
    { id: 'delivering', label: 'Đang giao' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Quản lý đơn hàng</h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-sm">Xem và quản lý đơn hàng của khách hàng</p>
        </div>

        <button 
          onClick={() => {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
            window.open(`${apiUrl}/admin/export/orders?token=${token}&status=${status === 'all' ? '' : status}&search=${search}&start_date=${startDate}&end_date=${endDate}`, '_blank');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 text-sm font-medium hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
        >
          <Package className="w-4 h-4" />
          Xuất đơn hàng
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
             <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Tổng đơn hàng</p>
             <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                <Package className="w-5 h-5" />
             </div>
          </div>
          <div className="flex items-end justify-between">
             <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.totalOrders}</h3>
             {stats.trends?.orders !== undefined && (
               <div className="flex flex-col items-end">
                 <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stats.trends.orders >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                 }`}>
                    {stats.trends.orders > 0 ? '+' : ''}{stats.trends.orders}%
                 </span>
                 <span className="text-[10px] text-secondary-400 mt-1">vs hôm qua</span>
               </div>
             )}
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
             <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Chờ xử lý</p>
             <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                <Clock className="w-5 h-5" />
             </div>
          </div>
          <div className="flex items-end justify-between">
             <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.pendingOrders}</h3>
             {stats.trends?.pending !== undefined && (
               <div className="flex flex-col items-end">
                 <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stats.trends.pending >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                 }`}>
                    {stats.trends.pending > 0 ? '+' : ''}{stats.trends.pending}%
                 </span>
                 <span className="text-[10px] text-secondary-400 mt-1">vs hôm qua</span>
               </div>
             )}
          </div>
        </div>

        {/* Delivering Orders */}
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
             <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Đang giao</p>
             <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                <Truck className="w-5 h-5" />
             </div>
          </div>
          <div className="flex items-end justify-between">
             <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.deliveringOrders}</h3>
             {stats.trends?.delivering !== undefined && (
               <div className="flex flex-col items-end">
                 <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stats.trends.delivering === 0 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                    stats.trends.delivering > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                 }`}>
                    {stats.trends.delivering > 0 ? '+' : ''}{stats.trends.delivering}%
                 </span>
                 <span className="text-[10px] text-secondary-400 mt-1">vs hôm qua</span>
               </div>
             )}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-2">
             <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Doanh thu hôm nay</p>
             <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                <DollarSign className="w-5 h-5" />
             </div>
          </div>
          <div className="flex items-end justify-between">
             <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{formatPrice(stats.revenueToday)}</h3>
             {stats.trends?.revenue !== undefined && (
               <div className="flex flex-col items-end">
                 <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stats.trends.revenue >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                 }`}>
                    {stats.trends.revenue > 0 ? '+' : ''}{stats.trends.revenue}%
                 </span>
                 <span className="text-[10px] text-secondary-400 mt-1">vs hôm qua</span>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-secondary-200 dark:border-secondary-700">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => { setStatus(tab.id); setPagination(prev => ({...prev, page: 1})); }}
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

        {/* Search Toolbar */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50/40 dark:bg-secondary-700/20 flex flex-col sm:flex-row justify-between gap-4">
           <div className="relative flex-1 max-w-lg">
             <Search className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input
               type="text"
               placeholder="Tìm kiếm mã đơn, khách hàng..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full h-11 pl-10 pr-4 bg-white dark:bg-secondary-900/70 border border-secondary-200 dark:border-secondary-700 rounded-xl text-sm text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
             />
           </div>
           <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="h-11 px-3 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-white dark:bg-secondary-900/70 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" />
              <span className="text-secondary-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="h-11 px-3 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-white dark:bg-secondary-900/70 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" />
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                disabled={!startDate && !endDate}
                className="h-11 px-3 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-white dark:bg-secondary-900/70 text-secondary-700 dark:text-secondary-300 text-sm font-medium hover:bg-secondary-50 dark:hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Xóa bộ lọc ngày
              </button>
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Ngày đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thanh toán</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700 bg-white dark:bg-secondary-800">
              {isLoading ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center">
                     <div className="flex justify-center">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                     </div>
                   </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-primary-600 dark:text-primary-400">#{order.order_code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                       <div className="flex flex-col">
                          <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                          <span className="text-xs text-secondary-400">{new Date(order.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
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
                       <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          order.payments?.[0]?.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-900/30 dark:text-emerald-300' 
                            : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300'
                       }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${order.payments?.[0]?.status === 'paid' ? 'bg-emerald-500' : 'bg-secondary-400'}`} />
                          {order.payments?.[0]?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                         order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                         order.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                         order.status === 'confirmed' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' :
                         order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                         order.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                         order.status === 'shipped' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                         order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                         order.status === 'refunded' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                         'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                       }`}>
                         {
                           order.status === 'completed' ? 'Hoàn thành' :
                           order.status === 'paid' ? 'Đã thanh toán' :
                           order.status === 'confirmed' ? 'Đã xác nhận' :
                           order.status === 'pending' ? 'Mới' :
                           order.status === 'processing' ? 'Đang xử lý' :
                           order.status === 'shipped' ? 'Đang giao' :
                           order.status === 'cancelled' ? 'Đã hủy' :
                           order.status === 'refunded' ? 'Hoàn tiền' :
                           order.status
                         }
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex justify-end gap-2">
                         <Link 
                           to={`/admin/orders/${order.id}`}
                           className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                         >
                           <Eye className="w-4 h-4" />
                           Chi tiết
                         </Link>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                      Không tìm thấy đơn hàng nào
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Only show if there are orders */}
        {!isLoading && orders.length > 0 && (
          <div className="bg-white dark:bg-secondary-800 px-4 py-3 border-t border-secondary-200 dark:border-secondary-700 flex items-center justify-between sm:px-6 transition-colors">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-secondary-700 dark:text-secondary-300">
                  Hiển thị trang <span className="font-medium">{pagination.page}</span> trên <span className="font-medium">{Math.max(1, pagination.totalPages)}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-sm font-medium text-secondary-500 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {getPageItems(pagination.page, Math.max(1, pagination.totalPages)).map((item, index) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-3 py-2 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-sm text-secondary-500 dark:text-secondary-300"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPagination(prev => ({ ...prev, page: item }))}
                        className={`relative inline-flex items-center px-3 py-2 border border-secondary-300 dark:border-secondary-600 text-sm font-medium transition-colors ${
                          pagination.page === item
                            ? 'z-10 bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-sm font-medium text-secondary-500 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
