import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, ShoppingBag, DollarSign, Activity, Users, FolderOpen } from 'lucide-react';
import AIInsightPanel from '../../../components/common/AIInsightPanel';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { adminAPI } from '../../../services/api';
import { format, subDays, startOfMonth, startOfYear, endOfDay } from 'date-fns';

// Simple formatter for currency
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];
const GRADIENTS = [
  'from-indigo-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600'
];

// Vietnamese status translations
const STATUS_LABELS: { [key: string]: string } = {
  'pending': 'Chờ xử lý',
  'paid': 'Đã thanh toán',
  'processing': 'Đang xử lý',
  'shipped': 'Đang giao',
  'delivered': 'Đã giao',
  'completed': 'Hoàn thành',
  'cancelled': 'Đã hủy',
  'unknown': 'Không xác định'
};

const translateStatus = (status: string) => STATUS_LABELS[status] || status;

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('30_days'); 
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      let start = new Date();
      const end = endOfDay(new Date()); // End of today
      
      switch (period) {
        case '7_days':
            start = subDays(new Date(), 7);
            break;
        case '30_days':
            start = subDays(new Date(), 30);
            break;
        case 'this_month':
            start = startOfMonth(new Date());
            break;
        case 'this_year':
            start = startOfYear(new Date());
            break;
        case 'all_time':
            start = new Date('2020-01-01'); // Far past
            break;
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

  useEffect(() => {
    fetchData();
  }, [period]);

  if (loading) return <div className="p-8 flex justify-center"><Activity className="w-8 h-8 animate-spin text-primary-600" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  const { summary, charts, topProducts } = data;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo & Thống kê</h1>
          <p className="text-sm text-gray-500 dark:text-secondary-400 mt-1">Tổng quan hiệu quả kinh doanh của cửa hàng.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <select 
                   className="appearance-none bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-700 rounded-lg py-2 pl-4 pr-10 text-gray-700 dark:text-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                   value={period}
                   onChange={e => setPeriod(e.target.value)}
                >
                   <option value="7_days">7 ngày qua</option>
                   <option value="30_days">30 ngày qua</option>
                   <option value="this_month">Tháng này</option>
                   <option value="this_year">Năm nay</option>
                   <option value="all_time">Tất cả</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-secondary-400 pointer-events-none" />
            </div>
            {/*<button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-700 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-secondary-300 transition-colors">
                <Download className="w-4 h-4" />
                <span>Xuất báo cáo</span>
            </button>*/}
        </div>
      </div>

      {/* AI Insight */}
      <AIInsightPanel
        title="AI Phân tích doanh thu"
        prompt={`Phân tích chi tiết doanh thu và hiệu suất bán hàng trong khoảng ${period === '7_days' ? '7 ngày' : period === '30_days' ? '30 ngày' : period}. So sánh các chỉ số, nhận diện xu hướng, và đề xuất hành động tăng doanh thu.`}
        dataContext={data ? [
          `Tổng doanh thu: ${(data.summary?.totalRevenue ?? 0).toLocaleString('vi-VN')} VNĐ`,
          `Tổng đơn hàng: ${data.summary?.totalOrders ?? 0}`,
          `Giá trị đơn trung bình (AOV): ${(data.summary?.aov ?? 0).toLocaleString('vi-VN')} VNĐ`,
          `Tổng khách hàng: ${data.summary?.totalCustomers ?? 0}`,
          `Khách mới: ${data.summary?.newCustomers ?? 0}`,
          data.topProducts?.length ? `Top sản phẩm bán chạy: ${data.topProducts.slice(0, 5).map((p: any) => `${p.name} (${p.total_sold ?? p.quantity ?? 0} đã bán)`).join(', ')}` : '',
          data.charts?.status?.length ? `Phân bổ trạng thái đơn: ${data.charts.status.map((s: any) => `${s.status}: ${s.count}`).join(', ')}` : '',
          data.charts?.categories?.length ? `Doanh thu theo danh mục: ${data.charts.categories.slice(0, 5).map((c: any) => `${c.name}: ${Number(c.revenue ?? 0).toLocaleString('vi-VN')} VNĐ`).join(', ')}` : '',
        ].filter(Boolean).join('\n') : undefined}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
         <div className="group bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <DollarSign className="w-6 h-6" />
                </div>
            </div>
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Tổng doanh thu</p>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{formatCurrency(summary.totalRevenue)}</h3>
         </div>

         <div className="group bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <ShoppingBag className="w-6 h-6" />
                </div>
            </div>
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Tổng đơn hàng</p>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{summary.totalOrders}</h3>
         </div>

         <div className="group bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Giá trị đơn TB</p>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{formatCurrency(summary.aov)}</h3>
         </div>

         <div className="group bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Users className="w-6 h-6" />
                </div>
            </div>
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Tổng khách hàng</p>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{summary.totalCustomers || 0}</h3>
         </div>

         <div className="group bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    <Users className="w-6 h-6" />
                </div>
            </div>
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Khách mới</p>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{summary.newCustomers || 0}</h3>
         </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Revenue Chart */}
         <div className="lg:col-span-2 bg-white dark:bg-secondary-800 p-6 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm transition-colors">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Biểu đồ doanh thu</h3>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-secondary-200 dark:text-secondary-700" />
                        <XAxis 
                           dataKey="date" 
                           tickFormatter={(str) => format(new Date(str), 'dd/MM')} 
                           tick={{fontSize: 12, fill: '#94a3b8'}}
                           axisLine={false}
                           tickLine={false}
                           dy={10}
                        />
                        <YAxis 
                           tick={{fontSize: 12, fill: '#94a3b8'}} 
                           tickFormatter={(val) => `${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : (val/1000).toFixed(0) + 'k'}`} 
                           axisLine={false}
                           tickLine={false}
                           dx={-10}
                        />
                        <Tooltip 
                           content={({ active, payload, label }) => {
                             if (active && payload && payload.length) {
                               return (
                                 <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 shadow-lg">
                                   <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">{label !== undefined ? format(new Date(label as string | number | Date), 'dd/MM/yyyy') : ''}</p>
                                   <p className="text-sm font-bold text-secondary-900 dark:text-white">{formatCurrency(payload[0].value as number)}</p>
                                 </div>
                               );
                             }
                             return null;
                           }}
                        />
                        <Area 
                           type="monotone" 
                           dataKey="revenue" 
                           stroke="#6366f1" 
                           fillOpacity={1} 
                           fill="url(#colorRevenue)" 
                           strokeWidth={3}
                           dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                           activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
         </div>

         {/* Order Status Chart */}
         <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm transition-colors">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Trạng thái đơn hàng</h3>
              <div className="h-80 w-full relative flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-secondary-500 dark:text-secondary-400 text-xs font-medium uppercase tracking-wider">Tổng cộng</span>
                      <span className="text-2xl font-bold text-secondary-900 dark:text-white">
                          {charts.status.reduce((sum: number, item: any) => sum + (item.count || 0), 0)}
                      </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={charts.status}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            fill="#8884d8"
                            paddingAngle={8}
                            dataKey="count"
                            nameKey="status"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {charts.status.map((entry: any, index: number) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                  stroke="transparent"
                                />
                            ))}
                        </Pie>
                        <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 shadow-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
                                      <span className="text-sm font-bold text-secondary-900 dark:text-white">{translateStatus(payload[0].name)}</span>
                                    </div>
                                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                      Số lượng: <span className="font-semibold text-secondary-700 dark:text-secondary-300">{payload[0].value}</span>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(val) => <span className="text-[11px] font-medium text-secondary-600 dark:text-secondary-400">{translateStatus(String(val))}</span>} 
                        />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
         </div>
      </div>

      {/* Category Sales Chart */}
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm mb-8 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
              Doanh thu theo danh mục
          </h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.categories || []} layout="vertical" margin={{ left: 20, right: 30 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-secondary-100 dark:text-secondary-800" />
                   <XAxis type="number" tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                   <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                   <Tooltip 
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 shadow-lg">
                              <p className="text-sm font-bold text-secondary-900 dark:text-white mb-1">{payload[0].payload.name}</p>
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                   />
                   <Bar dataKey="revenue" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
             </ResponsiveContainer>
          </div>
      </div>

      <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-5 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
             <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Sản phẩm bán chạy</h3>
             <span className="text-xs font-medium px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">Top 10</span>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-secondary-50 dark:bg-secondary-700/30 text-secondary-500 dark:text-secondary-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Sản phẩm</th>
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-6 py-3">Số lượng đã bán</th>
                        <th className="px-6 py-3 text-right">Doanh thu</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                    {topProducts.map((prod: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{prod.name}</td>
                            <td className="px-6 py-4 text-secondary-500 dark:text-secondary-400 font-mono text-xs">{prod.sku}</td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                  <span className="text-secondary-900 dark:text-white font-medium">{prod.sold}</span>
                                  <div className="w-16 h-1.5 bg-secondary-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-emerald-500 rounded-full" 
                                        style={{ width: `${Math.min(100, (prod.sold / topProducts[0].sold) * 100)}%` }}
                                     ></div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-secondary-900 dark:text-white">
                                {formatCurrency(prod.revenue)}
                            </td>
                        </tr>
                    ))}
                    {topProducts.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                                <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                Chưa có dữ liệu bán hàng
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
