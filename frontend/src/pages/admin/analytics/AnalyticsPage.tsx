import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  Calendar,
  FileText,
  MoreVertical,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import { endOfDay, format, startOfYear, subDays } from 'date-fns';
import AIInsightPanel from '../../../components/common/AIInsightPanel';
import { adminAPI } from '../../../services/api';

const COLORS = ['#8b5cf6', '#0ea5e9', '#10b981', '#f43f5e', '#f59e0b', '#6366f1'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  unknown: 'Không xác định'
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(value || 0);

const normalizeSparklineSeries = <T extends Record<string, unknown>>(series: T[], key: keyof T) => {
  if (!series.length) return [];
  const values = series.map((item) => Number(item[key] || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return series.map((item) => ({
    ...item,
    sparkValue: range === 0 ? 52 : 18 + ((Number(item[key] || 0) - min) / range) * 64
  }));
};

const translateStatus = (status: string) => STATUS_LABELS[status] || status;

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ color?: string; fill?: string; value: number; name: string }>;
  label?: string;
  formatter?: (value: number | undefined, name: string | undefined) => [string | number, string];
  labelFormatter?: (label: string) => string;
};

function CustomTooltip({ active, payload, label, formatter, labelFormatter }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
        {labelFormatter ? labelFormatter(label || '') : label}
      </p>
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const formatted = formatter ? formatter(item.value, item.name) : [item.value, item.name];
          return (
            <div key={`${item.name}-${index}`} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.color || item.fill || '#8b5cf6' }}
              />
              <span className="capitalize text-gray-500 dark:text-gray-400">{formatted[1]}:</span>
              <span className="font-bold text-gray-800 dark:text-white">{formatted[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  colorClass,
  gradient,
  gradientId,
  sparklineData
}: {
  title: string;
  value: string;
  icon: typeof Activity;
  trend?: number | null;
  colorClass: string;
  gradient: [string, string];
  gradientId: string;
  sparklineData: Array<Record<string, unknown>>;
}) {
  return (
    <div className="flex min-h-[224px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-xl p-2 ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        </div>
        {typeof trend === 'number' && (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              trend >= 0
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mb-5">
        <h3 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">{value}</h3>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">trong khoảng thời gian này</p>
      </div>

      <div className="mt-auto rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/20 via-gray-50/70 to-gray-100/90 px-2 pt-3 pb-2 dark:border-secondary-700 dark:from-secondary-800/20 dark:via-secondary-800/60 dark:to-secondary-900/90">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
            Xu hướng
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">Gần đây</span>
        </div>
        <div className="h-[74px] w-full">
          {sparklineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradient[0]} stopOpacity={0.34} />
                    <stop offset="95%" stopColor={gradient[1]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} horizontal={false} opacity={0.12} />
                <YAxis hide domain={[0, 100]} />
                <Area
                  type="monotone"
                  dataKey="sparkValue"
                  stroke={gradient[0]}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  fillOpacity={1}
                  dot={false}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full animate-pulse rounded-lg bg-gray-50 dark:bg-secondary-700/50" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('30_days');
  const [activeTab, setActiveTab] = useState<'Income' | 'Orders'>('Income');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let start = new Date();
        const end = endOfDay(new Date());

        switch (period) {
          case '7_days':
            start = subDays(new Date(), 7);
            break;
          case '30_days':
            start = subDays(new Date(), 30);
            break;
          case 'this_year':
            start = startOfYear(new Date());
            break;
          case 'all_time':
            start = new Date('2020-01-01');
            break;
          default:
            start = subDays(new Date(), 30);
        }

        const res = await adminAPI.getAnalytics({
          startDate: start.toISOString(),
          endDate: end.toISOString()
        });

        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const summary = data?.summary ?? {};
  const charts = data?.charts ?? {};
  const topProducts = data?.topProducts ?? [];
  const recentCustomers = data?.recentCustomers ?? [];
  const revenueDataList = charts.revenue || [];
  const registrationsDataList = charts.customerRegistrations || [];
  const activeCustomersBase = Math.max((summary.totalCustomers || 0) - (summary.newCustomers || 0), 0);

  const activeCustomersDataList = registrationsDataList.reduce((acc: any[], item: any, index: number) => {
    const previous = index === 0 ? activeCustomersBase : acc[index - 1].customers;
    acc.push({
      date: item.date,
      customers: previous + Number(item.customers || 0)
    });
    return acc;
  }, []);

  const sparklineSeries = useMemo(
    () => ({
      subscriptions: normalizeSparklineSeries(registrationsDataList, 'customers'),
      activeCustomers: normalizeSparklineSeries(activeCustomersDataList, 'customers'),
      revenue: normalizeSparklineSeries(revenueDataList, 'revenue')
    }),
    [registrationsDataList, activeCustomersDataList, revenueDataList]
  );

  const averageRevenuePerDay = Math.round((summary.totalRevenue || 0) / Math.max(revenueDataList.length, 1));
  const averageOrdersPerDay = Math.round((summary.totalOrders || 0) / Math.max(revenueDataList.length, 1));
  const estimatedVisitors = Math.round((summary.totalCustomers || 0) * 2.5);
  const revenueTarget = Math.max((summary.totalRevenue || 0) * 1.2, 10000000);
  const ordersTarget = Math.max(Math.round((summary.totalOrders || 0) * 1.5), 100);
  const revenueProgress = Math.min(100, Math.round(((summary.totalRevenue || 0) / revenueTarget) * 100));
  const ordersProgress = Math.min(100, Math.round(((summary.totalOrders || 0) / ordersTarget) * 100));
  const conversionRate =
    summary.totalCustomers > 0 ? Math.min(100, Math.round((summary.totalOrders / estimatedVisitors) * 100)) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Activity className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8 text-center text-red-500">
        Lỗi tải dữ liệu
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] space-y-6 bg-[#f8f9fc] p-4 font-sans text-gray-800 dark:bg-secondary-900 dark:text-gray-200 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng tin báo cáo</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tổng quan hoạt động kinh doanh.</p>
        </div>

        <div className="relative">
          <select
            className="cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-gray-200"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7_days">7 ngày qua</option>
            <option value="30_days">30 ngày qua</option>
            <option value="this_year">Năm nay</option>
            <option value="all_time">Tất cả</option>
          </select>
          <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <AIInsightPanel
        title="AI Phân tích hiệu suất"
        prompt={`Phân tích dữ liệu trong ${period}. Tổng doanh thu: ${summary?.totalRevenue || 0}, Đơn hàng: ${
          summary?.totalOrders || 0
        }. Đưa ra 3 gạch đầu dòng ngắn gọn về hiệu suất.`}
        style="overview"
        dataContext={JSON.stringify(summary)}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:col-span-3">
          <MetricCard
            title="Đăng ký mới"
            value={(summary.newCustomers || 0).toLocaleString()}
            icon={FileText}
            trend={summary.trends?.newCustomers}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            gradient={['#3b82f6', '#93c5fd']}
            sparklineData={sparklineSeries.subscriptions}
            gradientId="metric-gradient-subscriptions"
          />
          <MetricCard
            title="Đang hoạt động"
            value={(summary.totalCustomers || 0).toLocaleString()}
            icon={Users}
            trend={summary.trends?.activeCustomers}
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            gradient={['#8b5cf6', '#c4b5fd']}
            sparklineData={sparklineSeries.activeCustomers}
            gradientId="metric-gradient-active-customers"
          />
          <MetricCard
            title="Doanh thu ròng"
            value={formatCurrency(summary.totalRevenue || 0)}
            icon={TrendingUp}
            trend={summary.trends?.revenue}
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            gradient={['#10b981', '#6ee7b7']}
            sparklineData={sparklineSeries.revenue}
            gradientId="metric-gradient-revenue"
          />
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800">
          <h3 className="mb-1 font-bold text-gray-800 dark:text-gray-100">Tổng quan dữ liệu</h3>
          <p className="mb-5 text-xs text-gray-400 dark:text-gray-500">Dữ liệu phân bổ cơ bản</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50/50 p-3 dark:bg-secondary-700/50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đơn hàng</span>
              </div>
              <span className="font-bold dark:text-white">{summary.totalOrders}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50/50 p-3 dark:bg-secondary-700/50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Giá trị/Đơn</span>
              </div>
              <span className="font-bold dark:text-white">{formatCurrency(summary.aov || 0)}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50/50 p-3 dark:bg-secondary-700/50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Settings className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Top sản phẩm</span>
              </div>
              <span className="font-bold dark:text-white">{topProducts?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 lg:col-span-5">
          <div className="mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Lưu lượng truy cập</h3>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Doanh thu / ngày</p>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(averageRevenuePerDay)}</h4>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Đơn / ngày</p>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white">{averageOrdersPerDay}</h4>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Khách truy cập</p>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white">{estimatedVisitors}</h4>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueDataList} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenue-main-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => format(new Date(str), 'dd/MM')}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(val) => `${val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val}`}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  labelFormatter={(label) => format(new Date(label as string), 'dd/MM/yyyy')}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    formatCurrency(value || 0),
                    name === 'revenue' ? 'Doanh thu' : name || 'Giá trị'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#6366f1"
                  fill="url(#revenue-main-gradient)"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#fff', strokeWidth: 2, stroke: '#6366f1' }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 lg:col-span-4">
          <div className="mb-6 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Doanh số bán hàng</h3>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(summary.totalRevenue)}</h2>
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 text-sm text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              Doanh thu tổng thể
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categories || []} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(val) => (val === 'Uncategorized' ? 'Chưa phân loại' : val)}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  labelFormatter={(val) => (val === 'Uncategorized' ? 'Chưa phân loại' : val)}
                  formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Doanh thu']}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="revenue" name="Doanh thu" radius={[8, 8, 0, 0]}>
                  {(charts.categories || []).map((_: any, index: number) => (
                    <Cell key={`category-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 lg:col-span-3">
          <div className="border-b border-gray-100 p-5 dark:border-secondary-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Khách hàng tiêu biểu</h3>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Hoạt động mua hàng gần đây</p>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {recentCustomers.length > 0 ? (
              recentCustomers.map((user: any, index: number) => (
                <div
                  key={user.id || index}
                  className="flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-secondary-700/50"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'Khách hàng'}
                        className="h-10 w-10 rounded-full border border-white object-cover shadow-sm dark:border-secondary-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-gradient-to-tr from-purple-100 to-indigo-100 font-bold text-purple-600 shadow-sm dark:border-secondary-700 dark:from-purple-900/40 dark:to-indigo-900/40 dark:text-purple-400">
                        {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'KH'}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {user.full_name || 'Khách hàng ẩn danh'}
                      </h4>
                      <p className={`flex items-center gap-1 text-xs ${user.status === 'active' ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-500'
                          }`}
                        />
                        {user.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                      </p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 lg:col-span-3">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Phân bổ trạng thái</h3>
          </div>

          <div className="relative mb-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.status || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {(charts.status || []).map((_: any, index: number) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={<CustomTooltip />}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    value || 0,
                    translateStatus(name || 'unknown')
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-3">
            {(charts.status || []).map((item: any, index: number) => (
              <div key={`${item.status}-${index}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-300">{translateStatus(item.status)}</span>
                </div>
                <span className="font-semibold text-gray-800 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 lg:col-span-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Tổng quan thu nhập</h3>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">So sánh theo từng mốc thời gian</p>
            </div>
            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-secondary-700">
              {(['Income', 'Orders'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-gray-800 shadow-sm dark:bg-secondary-600 dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {tab === 'Income' ? 'Doanh thu' : 'Đơn hàng'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 min-h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueDataList} margin={{ top: 20, right: 0, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => format(new Date(str), 'dd/MM')}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(val) =>
                    activeTab === 'Income'
                      ? `${val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val}`
                      : `${val}`
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  formatter={(value: number | undefined) => [
                    activeTab === 'Income' ? formatCurrency(value || 0) : value || 0,
                    activeTab === 'Income' ? 'Doanh thu' : 'Đơn hàng'
                  ]}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey={activeTab === 'Income' ? 'revenue' : 'orders'}
                  fill={activeTab === 'Income' ? '#8b5cf6' : '#0ea5e9'}
                  radius={[8, 8, 8, 8]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Thông tin bổ sung</h3>
            <button className="text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
              + Thêm
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mục tiêu doanh thu</span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{revenueProgress}%</span>
              </div>
              <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
                {formatCurrency(summary.totalRevenue)} / {formatCurrency(revenueTarget)}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-secondary-700">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${revenueProgress}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mục tiêu đơn hàng</span>
                <span className="text-xs font-bold text-blue-500 dark:text-blue-400">{ordersProgress}%</span>
              </div>
              <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
                {summary.totalOrders} / {ordersTarget}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-secondary-700">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${ordersProgress}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tỷ lệ chuyển đổi khách</span>
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">{conversionRate}%</span>
              </div>
              <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">Dựa trên người dùng hoạt động</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-secondary-700">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${conversionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
