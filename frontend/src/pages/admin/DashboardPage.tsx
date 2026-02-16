
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  ArrowUpRight, 
  Plus, 
  List, 
  Truck,
  Download,
  Search,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { adminAPI } from '../../services/api';
import { formatPrice } from '../../hooks/useShop';
import toast from 'react-hot-toast';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import AIInsightPanel from '../../components/common/AIInsightPanel';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboard();
        setStats(response.data.data);
      } catch (error) {
        toast.error('Không thể tải dữ liệu bảng điều khiển');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Đang tải dữ liệu dashboard..." fullScreen={false} />;
  }

  // Format chart data
  const chartData = stats?.salesOverTime?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
    total: Number(item.total)
  })) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Xin chào, Quản trị viên</h1>
          <p className="text-secondary-500 dark:text-secondary-400 mt-1">Dưới đây là tổng quan về hoạt động của cửa hàng hôm nay.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">
                {formatPrice(stats.totalRevenue)}
              </h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>+15% so với tháng trước</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Tổng đơn hàng</p>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">
                {stats.totalOrders}
              </h3>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{stats.pendingOrders} đơn chờ xử lý</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Tổng sản phẩm</p>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">
                {stats.totalProducts}
              </h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12 mới tuần này</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Khách hàng</p>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">
                {stats.totalUsers}
              </h3>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>+8% tăng trưởng</span>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <AIInsightPanel
        title="AI Phân tích tổng quan"
        prompt="Phân tích tổng quan kinh doanh hôm nay cho cửa hàng thời trang. Đánh giá tình trạng đơn hàng, doanh thu, và đề xuất hành động cụ thể để tăng hiệu quả kinh doanh."
        dataContext={stats ? [
          `Tổng đơn hàng: ${stats.totalOrders ?? 0}`,
          `Đơn chờ xử lý: ${stats.pendingOrders ?? 0}`,
          `Đơn đang giao: ${stats.deliveringOrders ?? 0}`,
          `Doanh thu hôm nay: ${(stats.revenueToday ?? 0).toLocaleString('vi-VN')} VNĐ`,
          `Tỷ lệ chờ xử lý: ${stats.totalOrders ? ((stats.pendingOrders / stats.totalOrders) * 100).toFixed(1) : 0}%`,
        ].join('\n') : undefined}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/products/new" className="bg-white dark:bg-secondary-800 p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:border-primary-500 dark:hover:border-primary-500 transition-colors flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 dark:text-white">Thêm sản phẩm</h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Tạo mới sản phẩm</p>
            </div>
          </Link>
          
          <Link to="/admin/categories" className="bg-white dark:bg-secondary-800 p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:border-primary-500 dark:hover:border-primary-500 transition-colors flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <List className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 dark:text-white">Danh mục</h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Quản lý nhóm sản phẩm</p>
            </div>
          </Link>
          
          <Link to="/admin/orders" className="bg-white dark:bg-secondary-800 p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:border-primary-500 dark:hover:border-primary-500 transition-colors flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 dark:text-white">Vận đơn</h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Xử lý đơn hàng chờ giao</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Doanh thu theo thời gian</h2>
            <select className="text-sm border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 rounded-lg text-secondary-600 dark:text-secondary-200 focus:ring-primary-500 focus:border-primary-500">
              <option>30 ngày qua</option>
              <option>7 ngày qua</option>
            </select>
          </div>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: '12px'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: '12px'}} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatPrice(Number(value || 0)), 'Doanh thu']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary-400">
                Chưa có dữ liệu doanh thu
              </div>
            )}
          </div>
        </div>

        {/* Orders This Week (Empty/Placeholder) */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm transition-colors">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-6">Đơn hàng tuần này</h2>
          <div className="h-80 flex items-end justify-between px-2 gap-2">
             {/* Real Bar Chart */}
            {stats.ordersThisWeek && stats.ordersThisWeek.length > 0 ? (
              stats.ordersThisWeek.map((item: any, i: number) => {
                const maxCount = Math.max(...stats.ordersThisWeek.map((d: any) => Number(d.count)));
                const heightPercent = maxCount > 0 ? (Number(item.count) / maxCount) * 80 + 20 : 0; // min 20% height for visibility if > 0
                
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                    <div className="w-full flex justify-center items-end flex-1 group relative">
                      <div 
                        className="w-8 bg-blue-100 dark:bg-blue-900/40 rounded-t-lg transition-all group-hover:bg-blue-200 dark:group-hover:bg-blue-800"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {Number(item.count)}
                      </div>
                    </div>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">{item.day}</span>
                  </div>
                );
              })
            ) : (
               <div className="w-full h-full flex items-center justify-center text-secondary-400 text-sm">
                 Không có đơn hàng tuần này
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Đơn hàng gần đây</h2>
          <Link to="/admin/orders" className="text-sm text-primary-600 font-medium hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Ngày đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
              {stats.recentOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                    <Link to={`/admin/orders/${order.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                      #{order.order_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center text-xs font-bold text-secondary-600 dark:text-secondary-300">
                        {order.user?.username?.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white">{order.user?.username || order.customer_name || 'Khách lẻ'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-secondary-900 dark:text-white">
                    {formatPrice(Number(order.grand_total))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {
                        order.status === 'completed' ? 'Hoàn thành' :
                        order.status === 'pending' ? 'Chờ xử lý' :
                        order.status === 'shipped' ? 'Đang giao' :
                        'Huỷ bỏ'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-secondary-500 dark:text-secondary-400">
                    Không tìm thấy đơn hàng nào gần đây
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
