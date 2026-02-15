import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, ShoppingBag, DollarSign, Activity, Users, FolderOpen, ArrowUpRight, ArrowDownRight, Package, CreditCard, UserPlus } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar,
  TooltipProps
} from 'recharts';
import { adminAPI } from '../../../services/api';
import { format, subDays, startOfMonth, startOfYear, endOfDay } from 'date-fns';
import AIInsightPanel from '../../../components/common/AIInsightPanel';

// Simple formatter for currency
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

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

// Custom Card Component
const StatCard = ({ title, value, icon: Icon, colorClass, trend }: any) => (
  <div className="group relative overflow-hidden bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass.replace('text-', 'text-')}`}>
       <Icon className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
    </div>
    
    <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '50')} dark:bg-opacity-20 ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            {trend && (
                <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'}`}>
                    {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-secondary-900 dark:text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('30_days'); 

  const getDateRange = () => {
    let start = new Date();
    const end = endOfDay(new Date()); 
    
    switch (period) {
      case '7_days': start = subDays(new Date(), 7); break;
      case '30_days': start = subDays(new Date(), 30); break;
      case 'this_month': start = startOfMonth(new Date()); break;
      case 'this_year': start = startOfYear(new Date()); break;
      case 'all_time': start = new Date('2020-01-01'); break;
    }
    return { start, end };
  };
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-secondary-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
        </div>
    </div>
  );
  
  if (!data) return <div className="p-8 text-center text-rose-500">Failed to load data</div>;

  const { summary, charts, topProducts } = data;

  // Custom Toolkit for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-secondary-800/95 backdrop-blur-sm p-4 rounded-xl border border-secondary-100 dark:border-secondary-700 shadow-xl ring-1 ring-black/5">
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-2 font-medium">
             {label !== undefined ? (typeof label === 'string' && label.includes('-') ? format(new Date(label), 'dd/MM/yyyy') : label) : ''}
          </p>
          {payload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                 <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    {entry.name === 'revenue' ? 'Doanh thu' : entry.name === 'count' ? 'Số lượng' : entry.name}:
                 </span>
                 <span className="text-sm font-bold text-secondary-900 dark:text-white ml-auto">
                    {entry.name === 'revenue' ? formatCurrency(entry.value) : entry.value}
                 </span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white tracking-tight">Tổng Quan</h1>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Cập nhật realtime từ hệ thống
          </p>
        </div>
        
        <div className="bg-white dark:bg-secondary-800 p-1.5 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm flex items-center gap-2">
            <div className="relative">
                <select 
                   className="appearance-none bg-transparent pl-4 pr-10 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-200 focus:outline-none cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                   value={period}
                   onChange={e => setPeriod(e.target.value)}
                >
                   <option value="7_days">7 ngày qua</option>
                   <option value="30_days">30 ngày qua</option>
                   <option value="this_month">Tháng này</option>
                   <option value="this_year">Năm nay</option>
                   <option value="all_time">Tất cả</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
            </div>
            
            <div className="w-px h-6 bg-secondary-200 dark:bg-secondary-700 mx-1"></div>

            <button 
                onClick={async () => {
                    try {
                        const { start, end } = getDateRange();
                        const response = await adminAPI.exportRevenue({
                            start_date: start.toISOString(),
                            end_date: end.toISOString()
                        });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `ShopFeshen_Report_${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}.xlsx`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                    } catch (error) {
                        console.error('Export failed:', error);
                    }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
            >
                <Download className="w-4 h-4" />
                <span>Xuất Excel</span>
            </button>
        </div>
      </div>

      {/* Bento Grid Layout - Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
         <StatCard 
            title="Tổng doanh thu" 
            value={formatCurrency(summary.totalRevenue)} 
            icon={DollarSign} 
            colorClass="text-indigo-600"
            trend={12.5} // Mock trend
         />
         <StatCard 
            title="Đơn hàng" 
            value={summary.totalOrders} 
            icon={Package} 
            colorClass="text-blue-600"
            trend={5.2}
         />
         <StatCard 
            title="Giá trị TB/Đơn" 
            value={formatCurrency(summary.aov)} 
            icon={CreditCard} 
            colorClass="text-emerald-600"
            trend={-2.1} 
         />
         <StatCard 
            title="Khách hàng" 
            value={summary.totalCustomers || 0} 
            icon={Users} 
            colorClass="text-purple-600"
            trend={8.4}
         />
         <StatCard 
            title="Khách mới" 
            value={summary.newCustomers || 0} 
            icon={UserPlus} 
            colorClass="text-orange-600"
            trend={15.3}
         />
      </div>

      {/* AI Analytics Narrative */}
      <div className="mb-8">
        <AIInsightPanel
          title="📊 AI Phân tích & Dự báo"
          cacheKey="analytics_narrative"
          onAnalyze={async () => {
            const { start, end } = getDateRange();
            const res = await adminAPI.aiAnalyticsNarrative(start.toISOString(), end.toISOString());
            return res.data.data.narrative;
          }}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Revenue Chart - Large */}
         <div className="lg:col-span-2 bg-white dark:bg-secondary-800 p-8 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Biểu đồ doanh thu</h3>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">Xu hướng doanh thu theo thời gian đã chọn</p>
                 </div>
                 <div className="flex gap-2">
                     <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        Doanh thu
                     </span>
                 </div>
             </div>
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-secondary-100 dark:text-secondary-700/50" />
                        <XAxis 
                           dataKey="date" 
                           tickFormatter={(str) => format(new Date(str), 'dd/MM')} 
                           tick={{fontSize: 12, fill: '#94a3b8'}}
                           axisLine={false}
                           tickLine={false}
                           dy={10}
                           minTickGap={30}
                        />
                        <YAxis 
                           tick={{fontSize: 12, fill: '#94a3b8'}} 
                           tickFormatter={(val) => `${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : (val/1000).toFixed(0) + 'k'}`} 
                           axisLine={false}
                           tickLine={false}
                           dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                           type="monotone" 
                           dataKey="revenue" 
                           stroke="#6366f1" 
                           fillOpacity={1} 
                           fill="url(#colorRevenue)" 
                           strokeWidth={3}
                           activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
         </div>

         {/* Order Status Chart - Side */}
         <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm flex flex-col">
             <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">Trạng thái đơn hàng</h3>
             <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-6">Tỷ lệ các trạng thái xử lý</p>
             
             <div className="flex-1 min-h-[300px] w-full relative flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                      <span className="text-secondary-400 dark:text-secondary-500 text-xs font-semibold uppercase tracking-wider mb-1">Tổng</span>
                      <span className="text-3xl font-extrabold text-secondary-900 dark:text-white">
                          {charts.status.reduce((sum: number, item: any) => sum + (item.count || 0), 0)}
                      </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={charts.status}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={105}
                            paddingAngle={4}
                            dataKey="count"
                            nameKey="status"
                            cornerRadius={6}
                        >
                            {charts.status.map((entry: any, index: number) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                  strokeWidth={0}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            layout="horizontal"
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ paddingTop: '24px' }}
                            formatter={(val) => <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400 ml-1 mr-3">{translateStatus(String(val))}</span>} 
                        />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
         </div>
      </div>

      {/* Bottom Grid: Category & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Sales Chart */}
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                     <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Doanh thu theo danh mục</h3>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">Danh mục nào đang bán chạy nhất?</p>
                  </div>
              </div>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.categories || []} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-secondary-100 dark:text-secondary-800" />
                       <XAxis type="number" hide />
                       <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100} 
                          tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} 
                          axisLine={false} 
                          tickLine={false} 
                       />
                       <Tooltip 
                          cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }}
                          content={<CustomTooltip />}
                       />
                       <Bar dataKey="revenue" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                          {charts.categories?.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-2xl shadow-sm flex flex-col">
              <div className="px-8 py-6 border-b border-secondary-100 dark:border-secondary-700 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                         <ShoppingBag className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Top Sản phẩm</h3>
                     </div>
                 </div>
                 <span className="text-xs font-bold px-3 py-1 bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-700">Top 10</span>
              </div>
              <div className="flex-1 overflow-auto">
                 <table className="w-full text-left">
                    <thead className="bg-secondary-50/50 dark:bg-secondary-800/50 text-secondary-500 dark:text-secondary-400 text-xs font-semibold uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th className="px-6 py-3 pl-8">Sản phẩm</th>
                            <th className="px-6 py-3 text-right">Đã bán</th>
                            <th className="px-6 py-3 text-right pr-8">Doanh thu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
                        {topProducts.map((prod: any, idx: number) => (
                            <tr key={idx} className="group hover:bg-secondary-50/50 dark:hover:bg-secondary-700/30 transition-colors">
                                <td className="px-6 py-4 pl-8">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-secondary-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{prod.name}</span>
                                        <span className="text-xs text-secondary-500 font-mono mt-0.5">{prod.sku}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <div className="flex flex-col items-end gap-1">
                                      <span className="text-sm font-semibold text-secondary-900 dark:text-white">{prod.sold}</span>
                                      <div className="w-20 h-1.5 bg-secondary-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                                         <div 
                                            className="h-full bg-emerald-500 rounded-full" 
                                            style={{ width: `${Math.min(100, (prod.sold / (topProducts[0]?.sold || 1)) * 100)}%` }}
                                         ></div>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 pr-8 text-right font-bold text-secondary-900 dark:text-white text-sm">
                                    {formatCurrency(prod.revenue)}
                                </td>
                            </tr>
                        ))}
                        {topProducts.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    Chưa có dữ liệu bán hàng
                                </td>
                            </tr>
                        )}
                    </tbody>
                 </table>
              </div>
          </div>
      </div>
    </div>
  );
}
