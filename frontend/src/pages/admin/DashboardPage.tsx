import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  ArrowUpRight, 
  Plus, 
  Truck,
  TrendingUp,
  CreditCard,
  Target,
  Crown,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
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

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await adminAPI.getDashboard(dateRange);
        setStats(response.data.data);
      } catch (error) {
        toast.error('Không thể tải dữ liệu bảng điều khiển');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  if (isLoading) {
    return <LoadingScreen message="Đang tải dữ liệu dashboard..." fullScreen={false} />;
  }

  // Format chart data
  const chartData = stats?.salesOverTime?.map((item: any) => {
    let formattedDate = item.date;
    if (dateRange === '7days' || dateRange === '30days' || dateRange === 'this_month') {
      formattedDate = new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    }
    return {
      date: formattedDate,
      total: Number(item.total)
    };
  }) || [];

  const topProducts = stats?.topProducts || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Tổng quan hệ thống <Target className="w-6 h-6 text-indigo-500" />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi hiệu suất cửa hàng, doanh thu và các chỉ số quan trọng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm mr-2">
            <Calendar className="w-4 h-4 text-gray-500 ml-3" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 py-2 pl-2 pr-8 focus:ring-0 cursor-pointer"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="this_month">Tháng này</option>
              <option value="this_year">Năm nay</option>
              <option value="all">Tất cả thời gian</option>
            </select>
          </div>
          
          <Link to="/admin/orders" className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Xử lý đơn
          </Link>
          <Link to="/admin/products/new" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Stats Cards - Upgraded modern style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">Tổng doanh thu</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats?.totalRevenue ? stats.totalRevenue.toLocaleString('vi-VN') + ' đ' : '0 đ'}
              </h3>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              Hôm nay: {stats?.revenueToday ? stats.revenueToday.toLocaleString('vi-VN') + ' đ' : '0 đ'}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">Cầu xử lý</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats?.pendingOrders || 0} <span className="text-lg font-medium text-gray-400">/ {stats?.totalOrders || 0}</span>
              </h3>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
              Cập nhật liên tục
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">Sản phẩm</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats?.totalProducts || 0}
              </h3>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-md">
              Đang kinh doanh
            </span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-rose-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">Khách hàng</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats?.totalUsers || 0}
              </h3>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40 rounded-xl text-orange-600 dark:text-orange-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" />
              Thành viên
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Doanh thu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Thống kê theo thời gian đã chọn</p>
            </div>
            <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 w-full relative min-h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: '12px'}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: '12px'}} 
                    tickFormatter={(value) => `${value / 1000}k`} 
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                    labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}
                    itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                    formatter={(value: any) => [Number(value || 0).toLocaleString('vi-VN') + ' đ', 'Doanh thu']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Chưa có dữ liệu doanh thu
              </div>
            )}
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="col-span-1 lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col min-h-[400px]">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lượng đơn hàng</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Xu hướng theo thời gian đã chọn</p>
          </div>
          <div className="flex-1 w-full relative min-h-[300px]">
            {stats?.ordersThisWeek && stats.ordersThisWeek.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ordersThisWeek.map((d: any) => ({
                    day: d.day,
                    count: d.count
                  }))} 
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: '12px'}} 
                    dy={10} 
                    tickFormatter={(val) => {
                      if (dateRange === '7days' || dateRange === '30days' || dateRange === 'this_month') {
                        return new Date(val).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
                      }
                      return val;
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: '12px'}} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [value, 'Đơn']} 
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Không có đơn hàng tuần này
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-500" /> Đơn hàng mới
            </h2>
            <Link to="/admin/orders" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 transition-colors px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto flex-1 p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Mã đơn</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Khách hàng</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Tổng tiền</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {stats?.recentOrders?.slice(0, 6).map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/admin/orders/${order.id}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        #{order.order_code}
                      </Link>
                      <div className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs ring-2 ring-white dark:ring-gray-800">
                          {order.user?.username?.charAt(0).toUpperCase() || order.customer_name?.charAt(0).toUpperCase() || 'G'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.user?.username || order.customer_name || 'Khách lẻ'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                      {Number(order.grand_total).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        order.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        order.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        order.status === 'processing' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        order.status === 'shipped' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {
                          order.status === 'completed' ? 'Hoàn thành' :
                          order.status === 'pending' ? 'Chờ xử lý' :
                          order.status === 'processing' ? 'Đang xử lý' :
                          order.status === 'shipped' ? 'Đang giao' : 'Đã huỷ'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="col-span-1 lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Sản phẩm HOT
            </h2>
          </div>
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                        idx === 0 ? 'bg-amber-100 text-amber-600' : 
                        idx === 1 ? 'bg-gray-200 text-gray-600' : 
                        idx === 2 ? 'bg-orange-100 text-orange-600' : 
                        'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 max-w-[150px]" title={p.name}>
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.sold} đã bán</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {Number(p.revenue).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                  <Package className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Chưa có số liệu sản phẩm</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
