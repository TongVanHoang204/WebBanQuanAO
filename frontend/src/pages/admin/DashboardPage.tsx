
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ArrowUpRight, 
  Plus, 
  List, 
  Truck,
  BarChart3,
  Settings,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Timer,
  XCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { adminAPI } from '../../services/api';
import { formatPrice } from '../../hooks/useShop';
import toast from 'react-hot-toast';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { NumberCounter } from '../../components/ui/number-counter';
import { AdminBentoStats } from '../../components/admin/AdminBentoStats';
import AIInsightPanel from '../../components/common/AIInsightPanel';
import { useAuth } from '../../contexts/AuthContext';

// Status config for order badges
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; text: string; dot: string }> = {
  completed: { label: 'Hoàn thành', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  pending: { label: 'Chờ xử lý', icon: Timer, bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  shipped: { label: 'Đang giao', icon: Truck, bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  cancelled: { label: 'Huỷ bỏ', icon: XCircle, bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
};

// Quick actions config
const QUICK_ACTIONS = [
  { to: '/admin/products/new', icon: Plus, label: 'Thêm sản phẩm', desc: 'Tạo mới sản phẩm', gradient: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-50 dark:bg-blue-500/10' },
  { to: '/admin/categories', icon: List, label: 'Danh mục', desc: 'Quản lý nhóm sản phẩm', gradient: 'from-purple-500 to-pink-500', lightBg: 'bg-purple-50 dark:bg-purple-500/10' },
  { to: '/admin/orders', icon: Truck, label: 'Vận đơn', desc: 'Xử lý đơn hàng chờ giao', gradient: 'from-orange-500 to-red-500', lightBg: 'bg-orange-50 dark:bg-orange-500/10' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Phân tích', desc: 'Xem báo cáo chi tiết', gradient: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { to: '/admin/products', icon: Eye, label: 'Sản phẩm', desc: 'Quản lý kho hàng', gradient: 'from-indigo-500 to-violet-500', lightBg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  { to: '/admin/settings', icon: Settings, label: 'Cài đặt', desc: 'Tuỳ chỉnh hệ thống', gradient: 'from-slate-500 to-zinc-600', lightBg: 'bg-slate-100 dark:bg-slate-500/10' },
];

// Color palette for bar chart
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6366f1', '#4f46e5'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

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

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const displayName = user?.full_name || user?.username || 'Quản trị viên';

  if (isLoading) {
    return <LoadingScreen message="Đang tải dữ liệu dashboard..." fullScreen={false} />;
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-secondary-400 dark:text-secondary-500" />
        </div>
        <h2 className="text-xl font-bold text-secondary-700 dark:text-secondary-300 mb-2">Không thể tải dữ liệu</h2>
        <p className="text-secondary-500 dark:text-secondary-400 mb-6 max-w-md">Máy chủ không phản hồi. Vui lòng kiểm tra backend đang chạy.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 active:scale-[0.98]"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Format chart data
  const chartData = stats?.salesOverTime?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    total: Number(item.total),
    shortDate: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
  })) || [];

  // Weekly orders bar data
  const weeklyBarData = stats?.ordersThisWeek?.map((item: any) => ({
    day: item.day,
    count: Number(item.count),
  })) || [];

  // Summary counters for welcome header
  const todayRevenue = chartData.length > 0 ? chartData[chartData.length - 1]?.total || 0 : 0;
  const yesterdayRevenue = chartData.length > 1 ? chartData[chartData.length - 2]?.total || 0 : 0;
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      {/* ═══════════ WELCOME HEADER ═══════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 md:p-8 shadow-xl shadow-indigo-500/20">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-pink-400/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{todayStr}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {greeting}, {displayName} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-white/70 mt-1.5 text-sm md:text-base">
              Tổng quan hoạt động cửa hàng hôm nay
            </p>
          </div>

          {/* Mini stats pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Đơn chờ</p>
                <p className="text-white font-black text-lg leading-tight">
                  <NumberCounter value={stats.pendingOrders} duration={1} />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${Number(revenueChange) >= 0 ? 'bg-emerald-400/30' : 'bg-rose-400/30'}`}>
                {Number(revenueChange) >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-300" /> : <TrendingDown className="w-4 h-4 text-rose-300" />}
              </div>
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Hôm nay</p>
                <p className={`font-black text-lg leading-tight ${Number(revenueChange) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {Number(revenueChange) >= 0 ? '+' : ''}{revenueChange}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Doanh thu</p>
                <p className="text-white font-black text-lg leading-tight">{formatPrice(todayRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ BENTO GRID STATS ═══════════ */}
      <AdminBentoStats stats={stats} isLoading={isLoading} />

      {/* ═══════════ AI DASHBOARD INSIGHT ═══════════ */}
      <AIInsightPanel
        title="🤖 AI Phân tích tình hình kinh doanh"
        cacheKey="dashboard_insight"
        onAnalyze={async () => {
          const res = await adminAPI.aiDashboardInsight();
          return res.data.data.insight;
        }}
      />

      {/* ═══════════ QUICK ACTIONS ═══════════ */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Thao tác nhanh</h2>
          </div>
          <span className="text-xs text-secondary-400 dark:text-secondary-500">
            {QUICK_ACTIONS.length} lối tắt
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group relative bg-white dark:bg-secondary-800/80 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 p-4 hover:border-transparent hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] dark:group-hover:opacity-[0.08] transition-opacity`} />
                
                <div className={`w-11 h-11 rounded-xl ${action.lightBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 bg-gradient-to-br ${action.gradient} bg-clip-text`} style={{ color: 'inherit' }} />
                </div>
                <h3 className="font-semibold text-sm text-secondary-900 dark:text-white mb-0.5">{action.label}</h3>
                <p className="text-[11px] text-secondary-400 dark:text-secondary-500 leading-tight">{action.desc}</p>
                
                <ArrowUpRight className="absolute top-4 right-4 w-3.5 h-3.5 text-secondary-300 dark:text-secondary-600 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════════ CHARTS SECTION ═══════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-7 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Biểu đồ & Phân tích</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-secondary-800/80 p-6 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Doanh thu theo thời gian
                </h3>
                <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-0.5">30 ngày gần nhất</p>
              </div>
              {chartData.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">Doanh thu</span>
                  </div>
                </div>
              )}
            </div>
            <div className="h-80 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenueDash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-secondary-100 dark:text-secondary-700/50" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 11 }} 
                      dy={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 11 }} 
                      tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)'
                      }}
                      formatter={(value: any) => [formatPrice(Number(value || 0)), 'Doanh thu']}
                      labelStyle={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#6366f1" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorRevenueDash)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#6366f1' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-secondary-400 gap-3">
                  <BarChart3 className="w-12 h-12 text-secondary-200 dark:text-secondary-700" />
                  <p className="text-sm">Chưa có dữ liệu doanh thu</p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Orders Bar Chart */}
          <div className="bg-white dark:bg-secondary-800/80 p-6 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className="mb-6">
              <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                Đơn hàng tuần này
              </h3>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-0.5">7 ngày gần nhất</p>
            </div>

            <div className="flex-1 min-h-[280px]">
              {weeklyBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyBarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-secondary-100 dark:text-secondary-700/50" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      dy={5}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)'
                      }}
                      formatter={(value: any) => [`${value} đơn`, 'Số lượng']}
                      labelStyle={{ fontWeight: 600, color: '#374151' }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={40}
                    >
                      {weeklyBarData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-secondary-400 gap-3">
                  <BarChart3 className="w-12 h-12 text-secondary-200 dark:text-secondary-700" />
                  <p className="text-sm">Không có đơn hàng tuần này</p>
                </div>
              )}
            </div>

            {/* Weekly summary */}
            {weeklyBarData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-700/50 flex items-center justify-between">
                <span className="text-xs text-secondary-400 dark:text-secondary-500">Tổng tuần</span>
                <span className="text-sm font-bold text-secondary-900 dark:text-white">
                  {weeklyBarData.reduce((sum: number, d: any) => sum + d.count, 0)} đơn
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ RECENT ORDERS ═══════════ */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Đơn hàng gần đây</h2>
          </div>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="bg-white dark:bg-secondary-800/80 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-100 dark:border-secondary-700/50">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Ngày đặt</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700/40">
                {stats.recentOrders.map((order: any, idx: number) => {
                  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.cancelled;
                  const StatusIcon = statusCfg.icon;
                  const avatarColors = ['bg-gradient-to-br from-blue-400 to-indigo-500', 'bg-gradient-to-br from-purple-400 to-pink-500', 'bg-gradient-to-br from-emerald-400 to-teal-500', 'bg-gradient-to-br from-orange-400 to-red-500', 'bg-gradient-to-br from-cyan-400 to-blue-500'];
                  
                  return (
                    <tr
                      key={order.id}
                      className="group hover:bg-secondary-50/80 dark:hover:bg-secondary-700/30 transition-colors"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors font-mono"
                        >
                          #{order.order_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 h-9 w-9 rounded-xl ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
                            {order.user?.username?.charAt(0).toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-secondary-900 dark:text-white">{order.user?.username || order.customer_name || 'Khách lẻ'}</p>
                            {order.user?.email && (
                              <p className="text-[11px] text-secondary-400 dark:text-secondary-500 truncate max-w-[160px]">{order.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-secondary-500 dark:text-secondary-400">
                          {new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-secondary-900 dark:text-white font-mono">
                          {formatPrice(Number(order.grand_total))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Xem
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {stats.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="w-10 h-10 text-secondary-200 dark:text-secondary-700 mx-auto mb-3" />
                      <p className="text-sm text-secondary-400 dark:text-secondary-500">Không tìm thấy đơn hàng nào gần đây</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
