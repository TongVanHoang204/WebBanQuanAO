import { useState, useEffect } from 'react';
import { 
  Calendar, UploadCloud, TrendingUp, ShoppingBag, 
  Activity, Users, FileText, Settings, ArrowUpRight, ArrowDownRight, MoreVertical 
} from 'lucide-react';
import AIInsightPanel from '../../../components/common/AIInsightPanel';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { adminAPI } from '../../../services/api';
import { format, subDays, startOfMonth, startOfYear, endOfDay } from 'date-fns';

// Simple formatter for currency
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);

const COLORS = ['#8b5cf6', '#0ea5e9', '#10b981', '#f43f5e', '#f59e0b', '#6366f1'];

// Vietnamese translations
const STATUS_LABELS: Record<string, string> = {
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
  const [activeTab, setActiveTab] = useState('Income');
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      let start = new Date();
      const end = endOfDay(new Date()); 
      
      switch (period) {
        case '7_days': start = subDays(new Date(), 7); break;
        case '30_days': start = subDays(new Date(), 30); break;
        case 'this_year': start = startOfYear(new Date()); break;
        case 'all_time': start = new Date('2020-01-01'); break;
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

  if (loading) return <div className="p-8 flex justify-center min-h-[60vh] items-center"><Activity className="w-8 h-8 animate-spin text-purple-600" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500 min-h-[60vh] flex items-center justify-center">Lỗi tải dữ liệu</div>;

  const { summary, charts, topProducts, recentCustomers = [] } = data;

  // Custom Tooltip specific for dark/light mode support
  const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white dark:bg-secondary-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-secondary-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
           {labelFormatter ? labelFormatter(label) : label}
        </p>
        {payload.map((p: any, idx: number) => {
            const formatted = formatter ? formatter(p.value, p.name) : [p.value, p.name];
            return (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color || p.fill }} />
                <span className="text-gray-500 dark:text-gray-400 capitalize">{formatted[1]}:</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {typeof formatted[0] === 'number' && p.name === 'revenue' ? formatCurrency(formatted[0]) : formatted[0]}
                </span>
              </div>
            );
        })}
      </div>
    );
  };

  // Transform data for the UI
  const processMockRevenue = () => {
     if(!charts.revenue || charts.revenue.length === 0) return [];
     return charts.revenue.map((item: any) => ({
         ...item,
         valueObj: { value: item.revenue }
     }));
  };

  const revenueDataList = processMockRevenue();

  // Metric Card Component
  const MetricCard = ({ title, value, icon: Icon, trend, colorClass, gradient, dataKey }: any) => (
    <div className={`bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-secondary-700 flex flex-col`}>
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
               <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-4 h-4" />
               </div>
               <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">{title}</span>
            </div>
            {trend != null && (
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30'}`}>
                    {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">trong khoảng thời gian này</span>
        </div>
        
        <div className="h-12 w-full mt-auto">
            {revenueDataList.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueDataList}>
                        <defs>
                            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={gradient[0]} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={gradient[1]} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={gradient[0]} 
                            fillOpacity={1} 
                            fill={`url(#color-${dataKey})`} 
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : <div className="h-full bg-gray-50 dark:bg-secondary-700/50 rounded-lg animate-pulse" />}
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#f8f9fc] dark:bg-secondary-900 min-h-[calc(100vh-64px)] font-sans text-gray-800 dark:text-gray-200 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng tin báo cáo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng quan hoạt động kinh doanh.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <select 
                   className="appearance-none bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl py-2 pl-4 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm"
                   value={period}
                   onChange={e => setPeriod(e.target.value)}
                >
                   <option value="7_days">7 ngày qua</option>
                   <option value="30_days">30 ngày qua</option>
                   <option value="this_year">Năm nay</option>
                   <option value="all_time">Tất cả</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
        </div>
      </div>

      <div className="mb-6">
          <AIInsightPanel
            title="AI Phân tích hiệu suất"
            prompt={`Phân tích dữ liệu trong ${period}. Tổng doanh thu: ${summary?.totalRevenue || 0}, Đơn hàng: ${summary?.totalOrders || 0}. Đưa ra 3 gạch đầu dòng ngắn gọn về hiệu suất.`}
            style="overview"
            dataContext={JSON.stringify(summary)}
          />
      </div>

      {/* Row 1: KPI Cards & Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
             <MetricCard 
                title="Đăng ký mới" 
                value={(summary.newCustomers || 0).toLocaleString()} 
                icon={FileText} 
                trend={summary.trends?.newCustomers}
                colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                gradient={['#3b82f6', '#93c5fd']} 
                dataKey="subs"
            />
            <MetricCard 
                title="Đang hoạt động" 
                value={(summary.totalCustomers || 0).toLocaleString()} 
                icon={Users} 
                trend={summary.trends?.activeCustomers}
                colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" 
                gradient={['#8b5cf6', '#c4b5fd']} 
                dataKey="active"
            />
            <MetricCard 
                title="Doanh thu ròng" 
                value={formatCurrency(summary.totalRevenue || 0)} 
                icon={TrendingUp} 
                trend={summary.trends?.revenue}
                colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                gradient={['#10b981', '#6ee7b7']} 
                dataKey="rev"
            />
         </div>
         
         {/* Data Overview Side Panel */}
         <div className="bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-secondary-700 flex flex-col justify-center">
             <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Tổng quan dữ liệu</h3>
             <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Dữ liệu phân bổ cơ bản</p>
             
             <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-secondary-700/50">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"><ShoppingBag className="w-4 h-4" /></div>
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đơn hàng</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="font-bold dark:text-white">{summary.totalOrders}</span>
                     </div>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-secondary-700/50">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Activity className="w-4 h-4" /></div>
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Giá trị/Đơn</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="font-bold dark:text-white">{formatCurrency(summary.aov || 0)}</span>
                     </div>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-secondary-700/50">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Settings className="w-4 h-4" /></div>
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Top SP</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="font-bold dark:text-white">{topProducts?.length || 0}</span>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* Row 2: Analytics & Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Web Analytics Chart */}
         <div className="lg:col-span-5 bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-secondary-700 flex flex-col justify-between">
             <div className="flex items-center gap-2 mb-6">
                 <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                 <h3 className="font-bold text-gray-800 dark:text-gray-100">Lưu lượng truy cập</h3>
             </div>
             
             <div className="grid grid-cols-3 gap-4 mb-6">
                 <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Doanh thu / ngày</p>
                     <div className="flex items-baseline gap-2">
                         <h4 className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(summary.totalRevenue / (charts.revenue?.length || 1))}</h4>
                     </div>
                 </div>
                 <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Đơn / ngày</p>
                     <div className="flex items-baseline gap-2">
                         <h4 className="text-xl font-bold text-gray-800 dark:text-white">{Math.round(summary.totalOrders / (charts.revenue?.length || 1))}</h4>
                     </div>
                 </div>
                 <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Khách truy cập</p>
                     <div className="flex items-baseline gap-2">
                         <h4 className="text-xl font-bold text-gray-800 dark:text-white">{(summary.totalCustomers * 2.5).toFixed(0)}</h4> {/* Mock visitor metric */}
                     </div>
                 </div>
             </div>

             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueDataList} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:opacity-10" />
                        <XAxis 
                           dataKey="date" 
                           tickFormatter={(str) => format(new Date(str), 'MMM')} 
                           tick={{fontSize: 11, fill: '#9ca3af'}}
                           axisLine={false}
                           tickLine={false}
                           dy={10}
                           minTickGap={30}
                        />
                        <YAxis 
                           tick={{fontSize: 11, fill: '#9ca3af'}} 
                           tickFormatter={(val) => `${val >= 1000000 ? (val/1000000).toFixed(0) + 'M' : val}`} 
                           axisLine={false}
                           tickLine={false}
                        />
                        <RechartsTooltip 
                           content={<CustomTooltip />}
                           labelFormatter={(label) => format(new Date(label as string), 'dd MMM yyyy')}
                        />
                        <Area 
                           type="monotone" 
                           dataKey="revenue" 
                           name="Doanh thu"
                           stroke="#6366f1" 
                           fillOpacity={0.1} 
                           fill="#6366f1" 
                           strokeWidth={3}
                           dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#6366f1' }}
                           activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
         </div>

         {/* Sales Overview */}
         <div className="lg:col-span-4 bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-secondary-700 flex flex-col justify-between">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2">
                     <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                     <h3 className="font-bold text-gray-800 dark:text-gray-100">Doanh số bán hàng</h3>
                 </div>
             </div>

             <div className="mb-6">
                 <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(summary.totalRevenue)}</h2>
                 <p className="inline-flex mt-1 items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 rounded-md">
                     <TrendingUp className="w-3 h-3" />
                     Doanh thu tổng thể
                 </p>
             </div>

             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.categories || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#9ca3af'}} tickFormatter={(val) => val === 'Uncategorized' ? 'Chưa phân loại' : val} axisLine={false} tickLine={false} dy={10} />
                        <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} labelFormatter={(val) => val === 'Uncategorized' ? 'Chưa phân loại' : val} content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Doanh thu" radius={[6, 6, 0, 0]}>
                            {
                                (charts.categories || []).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
         </div>

         {/* Contacts List */}
         <div className="lg:col-span-3 bg-white dark:bg-secondary-800 rounded-2xl p-0 shadow-sm border border-gray-100 dark:border-secondary-700 overflow-hidden flex flex-col">
             <div className="p-5 border-b border-gray-100 dark:border-secondary-700">
                 <h3 className="font-bold text-gray-800 dark:text-gray-100">Khách hàng tiêu biểu</h3>
                 <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hoạt động mua hàng gần đây</p>
             </div>
             <div className="flex-1 overflow-y-auto p-2">
                 {recentCustomers.map((user: any, idx: number) => (
                     <div key={user.id || idx} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-secondary-700/50 rounded-xl transition-colors cursor-pointer">
                         <div className="flex items-center gap-3">
                             {user.avatar_url ? (
                                 <img src={user.avatar_url} alt={user.full_name || 'Khách hàng'} className="w-10 h-10 rounded-full object-cover border border-white dark:border-secondary-700 shadow-sm" />
                             ) : (
                                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold border border-white dark:border-secondary-700 shadow-sm">
                                     {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'KH'}
                                 </div>
                             )}
                             <div>
                                 <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.full_name || 'Khách hàng ẩn danh'}</h4>
                                 <p className={`text-xs flex items-center gap-1 ${user.status === 'active' ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-500'}`}/> 
                                    {user.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                                 </p>
                             </div>
                         </div>
                         <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                             <MoreVertical className="w-4 h-4" />
                         </button>
                     </div>
                 ))}
                 {recentCustomers.length === 0 && (
                     <div className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm">Không có dữ liệu</div>
                 )}
             </div>
         </div>
      </div>

      {/* Row 3: Detail Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Order Status Timeline / Chart */}
         <div className="lg:col-span-3 bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-secondary-700 flex flex-col justify-between">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-800 dark:text-gray-100">Phân bổ trạng thái</h3>
             </div>
             
             <div className="h-48 w-full relative mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={charts.status}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="status"
                        >
                            {charts.status.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent"/>
                            ))}
                        </Pie>
                        <RechartsTooltip 
                           content={<CustomTooltip />}
                           formatter={(value: any, name: any) => [value, translateStatus(name as string)]}
                        />
                    </PieChart>
                  </ResponsiveContainer>
             </div>

             <div className="space-y-3 mt-4">
                 {charts.status.map((item: any, i: number) => (
                     <div key={i} className="flex justify-between items-center text-sm">
                         <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                             <span className="text-gray-600 dark:text-gray-300">{translateStatus(item.status)}</span>
                         </div>
                         <span className="font-semibold text-gray-800 dark:text-white">{item.count}</span>
                     </div>
                 ))}
             </div>
         </div>

         {/* Overview Income / Stacked Chart Area */}
         <div className="lg:col-span-6 bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-secondary-700 flex flex-col justify-between">
             <div className="flex justify-between items-center mb-6">
                 <div>
                     <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Tổng quan thu nhập</h3>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">So sánh theo từng mốc thời gian</p>
                 </div>
                 <div className="flex bg-gray-100 dark:bg-secondary-700 rounded-lg p-1">
                     {['Income', 'Orders'].map(tab => (
                         <button 
                             key={tab}
                             onClick={() => setActiveTab(tab)}
                             className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                 activeTab === tab ? 'bg-white dark:bg-secondary-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                             }`}
                         >
                             {tab === 'Income' ? 'Doanh thu' : 'Đơn hàng'}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="flex-1 min-h-[300px] w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={revenueDataList} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:opacity-10" />
                         <XAxis 
                             dataKey="date" 
                             tickFormatter={(str) => format(new Date(str), 'MMM dd')} 
                             tick={{fontSize: 11, fill: '#9ca3af'}}
                             axisLine={false}
                             tickLine={false}
                             dy={10}
                         />
                         <YAxis 
                             tick={{fontSize: 11, fill: '#9ca3af'}} 
                             tickFormatter={(val) => activeTab === 'Income' ? `$${val>=1000000?(val/1000000)+'M':val}` : val} 
                             axisLine={false}
                             tickLine={false}
                         />
                         <RechartsTooltip 
                             cursor={{fill: 'rgba(255,255,255,0.05)'}}
                             content={<CustomTooltip />}
                         />
                         <Bar 
                             dataKey={activeTab === 'Income' ? 'revenue' : 'orders'} 
                             fill={activeTab === 'Income' ? '#8b5cf6' : '#0ea5e9'} 
                             radius={[4, 4, 4, 4]} 
                             barSize={12}
                         />
                     </BarChart>
                 </ResponsiveContainer>
             </div>
         </div>

         {/* Account Limit / Info */}
         <div className="lg:col-span-3 bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-secondary-700 flex flex-col justify-between">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-800 dark:text-gray-100">Thông tin bổ sung</h3>
                 <button className="text-purple-600 dark:text-purple-400 text-xs font-medium hover:text-purple-700 dark:hover:text-purple-300">+ Thêm</button>
             </div>
             
             <div className="space-y-6">
                 <div>
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mục tiêu Doanh thu</span>
                         <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                             {Math.min(100, Math.round((summary.totalRevenue / Math.max(summary.totalRevenue * 1.2, 10000000)) * 100))}%
                         </span>
                     </div>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{formatCurrency(summary.totalRevenue)} / {formatCurrency(Math.max(summary.totalRevenue * 1.2, 10000000))}</p>
                     <div className="w-full h-2 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                         <div className="h-full bg-purple-500 rounded-full" style={{width: `${Math.min(100, Math.round((summary.totalRevenue / Math.max(summary.totalRevenue * 1.2, 10000000)) * 100))}%`}} />
                     </div>
                 </div>

                 <div>
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mục tiêu Đơn hàng</span>
                         <span className="text-xs font-bold text-blue-500 dark:text-blue-400">
                             {Math.min(100, Math.round((summary.totalOrders / Math.max(Math.round(summary.totalOrders * 1.5), 100)) * 100))}%
                         </span>
                     </div>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{summary.totalOrders} / {Math.max(Math.round(summary.totalOrders * 1.5), 100)}</p>
                     <div className="w-full h-2 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full" style={{width: `${Math.min(100, Math.round((summary.totalOrders / Math.max(Math.round(summary.totalOrders * 1.5), 100)) * 100))}%`}} />
                     </div>
                 </div>
                 
                 <div>
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tỷ lệ chuyển đổi khách</span>
                         <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                             {summary.totalCustomers > 0 ? Math.min(100, Math.round((summary.totalOrders / (summary.totalCustomers * 2.5)) * 100)) : 0}%
                         </span>
                     </div>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Dựa trên người dùng hoạt động</p>
                     <div className="w-full h-2 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{width: `${summary.totalCustomers > 0 ? Math.min(100, Math.round((summary.totalOrders / (summary.totalCustomers * 2.5)) * 100)) : 0}%`}} />
                     </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}
