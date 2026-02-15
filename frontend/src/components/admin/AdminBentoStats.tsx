import { useState, useEffect, useMemo } from "react";
import {
  ArrowUpRight,
  Brain,
  Cpu,
  Globe,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  Package,
  ShoppingCart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BentoGrid } from "@/components/ui/bento-grid";
import { NumberCounter } from "@/components/ui/number-counter";
import { formatPrice } from "@/hooks/useShop";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  ordersThisWeek: any[];
  recentOrders: any[];
  salesOverTime: any[];
  topProducts: any[];
}

interface AdminBentoStatsProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export function AdminBentoStats({ stats, isLoading }: AdminBentoStatsProps) {
  if (isLoading || !stats) {
     return (
        <div className="w-full h-96 flex items-center justify-center">
            <div className="animate-spin text-primary-600">
                <RefreshCw className="w-8 h-8" />
            </div>
        </div>
     )
  }

  // === COMPUTE REAL GROWTH FROM salesOverTime DATA ===
  const revenueGrowth = useMemo(() => {
    if (!stats.salesOverTime || stats.salesOverTime.length < 2) return 0;
    const sales = stats.salesOverTime;
    const mid = Math.floor(sales.length / 2);
    const firstHalf = sales.slice(0, mid).reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
    const secondHalf = sales.slice(mid).reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }, [stats.salesOverTime]);

  // Compute weekly order growth from ordersThisWeek
  const orderGrowth = useMemo(() => {
    if (!stats.ordersThisWeek || stats.ordersThisWeek.length < 2) return 0;
    const orders = stats.ordersThisWeek;
    const mid = Math.floor(orders.length / 2);
    const firstHalf = orders.slice(0, mid).reduce((sum: number, o: any) => sum + Number(o.count || 0), 0);
    const secondHalf = orders.slice(mid).reduce((sum: number, o: any) => sum + Number(o.count || 0), 0);
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }, [stats.ordersThisWeek]);

  // Product capacity (total vs max capacity)
  const maxProductCapacity = 1000;
  const productCapacityPercent = Math.min(Math.round((stats.totalProducts / maxProductCapacity) * 100), 100);

  // === MINI CHART DATA from ordersThisWeek ===
  const miniChartData = useMemo(() => {
    if (!stats.ordersThisWeek || stats.ordersThisWeek.length === 0) {
      return [40, 70, 45, 90, 65, 80, 50]; // fallback
    }
    const maxCount = Math.max(...stats.ordersThisWeek.map((o: any) => Number(o.count || 0)), 1);
    return stats.ordersThisWeek.map((o: any) => Math.max(10, Math.round((Number(o.count || 0) / maxCount) * 100)));
  }, [stats.ordersThisWeek]);

  // === SYSTEM AGENTS (simulation) ===
  const [agents, setAgents] = useState([
    { name: "OrderSync", status: "Running", role: "Đồng bộ đơn hàng", color: "bg-emerald-500", shadow: "shadow-emerald-500/50", load: 24 },
    { name: "EmailServer", status: "Running", role: "Gửi thông báo", color: "bg-emerald-500", shadow: "shadow-emerald-500/50", load: 18 },
    { name: "PaymentGateway", status: "Running", role: "Cổng thanh toán", color: "bg-emerald-500", shadow: "shadow-emerald-500/50", load: 45 },
  ]);

  // === GENERATE REAL AI INSIGHTS from stats ===
  const insights = useMemo(() => {
    const items: { type: string; title: string; content: string }[] = [];

    // Pending orders warning
    if (stats.pendingOrders > 0) {
      items.push({
        type: 'warning',
        title: 'Đơn hàng chờ xử lý',
        content: `Hiện có ${stats.pendingOrders} đơn hàng đang chờ xử lý. Hãy xử lý sớm để đảm bảo trải nghiệm khách hàng.`
      });
    }

    // Revenue insight
    if (revenueGrowth > 0) {
      items.push({
        type: 'optimization',
        title: 'Doanh thu tăng trưởng',
        content: `Doanh thu tăng ${revenueGrowth}% trong nửa cuối kỳ. Tiếp tục duy trì chiến lược hiện tại.`
      });
    } else if (revenueGrowth < 0) {
      items.push({
        type: 'warning',
        title: 'Doanh thu giảm',
        content: `Doanh thu giảm ${Math.abs(revenueGrowth)}% trong nửa cuối kỳ. Cân nhắc các chương trình khuyến mãi.`
      });
    }

    // Product capacity
    if (productCapacityPercent > 80) {
      items.push({
        type: 'warning',
        title: 'Sắp đầy kho hàng',
        content: `Kho hàng đã đạt ${productCapacityPercent}% công suất (${stats.totalProducts}/${maxProductCapacity}). Cân nhắc mở rộng.`
      });
    }

    // Total customers insight
    items.push({
      type: 'prediction',
      title: 'Phân tích khách hàng',
      content: `Tổng ${stats.totalUsers} khách hàng đã đăng ký. Tỷ lệ chuyển đổi đơn hàng: ${stats.totalUsers > 0 ? Math.round((stats.totalOrders / stats.totalUsers) * 100) : 0}%.`
    });

    // Order count insight
    items.push({
      type: 'optimization',
      title: 'Tổng quan đơn hàng',
      content: `${stats.totalOrders} đơn hàng đã hoàn thành với doanh thu trung bình ${stats.totalOrders > 0 ? formatPrice(Math.round(stats.totalRevenue / stats.totalOrders)) : '0đ'}/đơn.`
    });

    return items.length > 0 ? items : [{ type: 'optimization', title: 'Hệ thống ổn định', content: 'Không có cảnh báo nào. Hệ thống hoạt động bình thường.' }];
  }, [stats, revenueGrowth, productCapacityPercent]);

  // Live Transactions: Hybird Real-time + Recent Orders
  const [liveTransaction, setLiveTransaction] = useState({ amount: 0, time: 'Just now', id: '---' });
  const [showTransaction, setShowTransaction] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  
  // Rotate AI Insights (Used in bottom card)
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  // 1. Listen for Real-time Socket Events
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
        const data = event.detail;
        if (data.type === 'order_new') {
            // Priority: Add to queue to show immediately
            setQueue(prev => [...prev, {
                amount: data.amount || 0, // Ensure backend sends amount or fetch it
                id: data.orderCode ? `#${data.orderCode}` : (data.orderId || 'NEW'),
                time: 'Vừa xong',
                isRealtime: true
            }]);
        }
    };

    window.addEventListener('new_notification_received' as any, handleNewNotification);
    return () => window.removeEventListener('new_notification_received' as any, handleNewNotification);
  }, []);

  // 2. Process Queue or Replay Recent Orders
  useEffect(() => {
    const processTicker = () => {
        let nextItem;

        // Priority 1: Queue (Real-time events)
        if (queue.length > 0) {
            nextItem = queue[0];
            setQueue(prev => prev.slice(1));
        } 
        // Priority 2: Replay Recent Orders (Simulate activity from real history)
        else if (stats.recentOrders && stats.recentOrders.length > 0) {
            // Pick a random recent order to display
            const randomOrder = stats.recentOrders[Math.floor(Math.random() * stats.recentOrders.length)];
            nextItem = {
                amount: Number(randomOrder.grand_total || randomOrder.totalAmount || 0),
                id: randomOrder.order_code ? `#${randomOrder.order_code}` : `#${(randomOrder.id || randomOrder._id || 'ORD').toString().slice(-6).toUpperCase()}`,
                time: 'Gần đây',
            };
        }

        if (nextItem) {
            setLiveTransaction({
                amount: nextItem.amount,
                id: nextItem.id,
                time: nextItem.time
            });
            setShowTransaction(true);
            setTimeout(() => setShowTransaction(false), 3000);
        }
    };

    // Speed up if we have a queue
    const delay = queue.length > 0 ? 3500 : 5000;
    const interval = setInterval(processTicker, delay);
    
    // Run immediately once on mount if we have data
    if (stats.recentOrders?.length > 0) {
        setTimeout(processTicker, 1000);
    }

    return () => clearInterval(interval);
  }, [queue, stats.recentOrders]);

  // Insights Rotation
  useEffect(() => {
    const insightInterval = setInterval(() => {
        setCurrentInsightIndex(prev => (prev + 1) % insights.length);
    }, 5000);
    return () => clearInterval(insightInterval);
  }, [insights.length]);

  const currentInsight = insights[currentInsightIndex % insights.length];

  return (
    <BentoGrid className="mx-auto max-w-full gap-5">
      {/* ... (Previous Cards remain unchanged) ... */}

      {/* REVENUE CARD */}
      <Card className="relative overflow-hidden border-0 shadow-2xl md:col-span-2 lg:row-span-2 group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 animate-gradient-xy"></div>
        {/* ... (Existing background effects) ... */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 bg-repeat"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]"></div>

        <CardHeader className="relative z-10 pb-3">
            {/* ... (Header content) ... */}
            <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Tổng Doanh Thu</span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
          <CardTitle className="mt-2 font-black text-4xl md:text-5xl tracking-tight text-white drop-shadow-xl">
            <div className="flex items-baseline gap-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                <NumberCounter 
                  value={stats.totalRevenue} 
                  decimals={0} 
                  suffix=" đ" 
                  separator="."
                  duration={2.5}
                />
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 pt-2">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
             {/* ... (Stats content) ... */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group/stat">
              <p className="text-indigo-300 text-[10px] uppercase tracking-wider font-bold mb-1">Tăng trưởng</p>
              <p className={`font-mono text-xl font-bold flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
                {revenueGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group/stat">
              <p className="text-indigo-300 text-[10px] uppercase tracking-wider font-bold mb-1">Đơn hàng</p>
              <p className="font-mono text-xl font-bold text-blue-300">
                 <NumberCounter value={stats.totalOrders} duration={1.5} />
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group/stat">
              <p className="text-indigo-300 text-[10px] uppercase tracking-wider font-bold mb-1">Chờ xử lý</p>
              <p className={`font-mono text-xl font-bold ${stats.pendingOrders > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                <NumberCounter value={stats.pendingOrders} duration={1} />
              </p>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-indigo-300 text-xs font-medium">Giá trị đơn trung bình</span>
            <span className="font-mono text-sm font-bold text-white">
              {stats.totalOrders > 0 ? formatPrice(Math.round(stats.totalRevenue / stats.totalOrders)) : '0đ'}
            </span>
          </div>

          {/* AI Active Model Animation & Live Ticker */}
          <div className="h-40 w-full mt-4 flex items-center justify-between px-4 relative overflow-hidden rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
             {/* Background Grid Animation */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]"></div>
             
             {/* Text Info: Live Transactions */}
             <div className="relative z-10 space-y-2 w-full max-w-[180px]">
                <div className="text-xs font-medium text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Live Giao Dịch
                </div>
                
                <div className="relative h-12">
                    <div className={`absolute transition-all duration-500 transform ${showTransaction ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <div className="flex items-center gap-2 mb-1">
                             <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                 <ShoppingCart className="w-3 h-3" />
                             </div>
                             <span className="text-xs font-mono text-indigo-100">{liveTransaction.id}</span>
                        </div>
                        <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            +{formatPrice(liveTransaction.amount)}
                        </div>
                    </div>
                     <div className={`absolute transition-all duration-500 transform ${!showTransaction ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                        <div className="flex flex-col gap-1">
                            <div className="h-2 w-24 bg-white/10 rounded animate-pulse"></div>
                            <div className="h-4 w-32 bg-white/5 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className={`text-[10px] font-mono flex items-center gap-1 ${liveTransaction.time === 'Vừa xong' ? 'text-emerald-400 font-bold' : 'text-indigo-400/80'}`}>
                   <Activity className="w-3 h-3 animate-bounce" /> {liveTransaction.time || 'Processing...'}
                </div>
             </div>

             {/* The 3D-like Animation */}
             <div className="relative w-24 h-24 flex items-center justify-center">
               {/* Rings */}
               <div className="absolute inset-0 border-[3px] border-cyan-500/30 border-t-cyan-400/80 rounded-full animate-[spin_3s_linear_infinite]"></div>
               <div className="absolute inset-2 border-[3px] border-purple-500/30 border-r-purple-400/80 rounded-full animate-[spin_4s_linear_infinite_reverse]"></div>
               <div className="absolute inset-4 border-[3px] border-indigo-500/30 border-b-indigo-400/80 rounded-full animate-[spin_5s_linear_infinite]"></div>
               
               {/* Core */}
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 bg-white/10 rounded-full backdrop-blur-md flex items-center justify-center animate-pulse border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <Brain className="w-4 h-4 text-white" />
                 </div>
               </div>

               {/* Particles (CSS dots) */}
               <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full animate-ping opacity-75"></div>
               <div className="absolute bottom-0 right-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-700 opacity-75"></div>
             </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button size="sm" className="!bg-white !text-indigo-900 hover:!bg-indigo-50 font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 !border-0">
              Xem chi tiết
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="!bg-transparent border-indigo-500/30 text-indigo-100 hover:!bg-indigo-500/20 hover:text-white hover:border-indigo-400 backdrop-blur-md transition-all">
              Xuất báo cáo (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Traffic / Users */}
      <Card className="relative border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden group hover:shadow-2xl transition-all duration-300 dark:shadow-purple-900/10">
         <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Globe className="w-24 h-24 text-blue-600 dark:text-blue-500" />
         </div>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Globe className="h-4 w-4 text-blue-500" />
            Khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <span className="font-black text-4xl text-slate-900 dark:text-white tracking-tight">
                <NumberCounter value={stats.totalUsers} duration={2} />
            </span>
            <Badge variant="secondary" className={`${orderGrowth >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
               {orderGrowth >= 0 ? '+' : ''}{orderGrowth}%
            </Badge>
          </div>
          
          {/* Mini Chart Visualization */}
          <div className="mt-6 flex h-16 items-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            {miniChartData.map((h: number, i: number) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500/20 to-blue-500/60 dark:from-blue-600/20 dark:to-blue-600/80 transition-all duration-500 hover:to-blue-500 dark:hover:to-blue-400"
                style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
 
      {/* System Health / Products */}
      <Card className="relative border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden group hover:shadow-2xl transition-all duration-300 dark:shadow-purple-900/10">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="w-24 h-24 text-purple-600 dark:text-purple-500" />
         </div>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Cpu className="h-4 w-4 text-purple-500" />
            Kho hàng & Vận hành
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Tổng sản phẩm</span>
                <span><NumberCounter value={stats.totalProducts} /> / {maxProductCapacity}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${productCapacityPercent}%` }}></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Đơn chờ xử lý</span>
                <span className="text-orange-500 font-bold">{stats.pendingOrders}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                    style={{ width: `${Math.min((stats.pendingOrders / 10) * 100, 100)}%` }}
                ></div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <div className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
                <Activity className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">System OK</span>
            </div>
             <div className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
                <Zap className="w-4 h-4 text-yellow-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Fast Mode</span>
            </div>
          </div>
        </CardContent>
      </Card>
 
      {/* Recent Activity / Agents - AI POWERED */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 md:col-span-2 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
        {/* Background circuit effect */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Layers className="h-4 w-4 text-amber-500" />
              Hoạt động hệ thống AI
            </CardTitle>
            <div className="flex items-center gap-2">
                 <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono text-emerald-500">SYSTEM ACTIVE</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-4 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group/agent relative overflow-hidden"
              >
                {/* Progress bar background for load */}
                <div 
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-all duration-1000 opacity-20"
                    style={{ width: `${agent.load}%` }}
                />

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className={`absolute inline-flex h-full w-full rounded-full opacity-0 ${agent.status === 'Running' ? 'group-hover/agent:opacity-75 group-hover/agent:animate-ping' : ''} ${agent.color}`}></span>
                        <div className={`h-3 w-3 rounded-full ${agent.color} ${agent.shadow} shadow-lg relative z-10`} />
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate font-bold text-sm text-slate-900 dark:text-white">{agent.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium font-mono">
                            Load: {agent.load.toFixed(0)}%
                        </p>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {agent.status}
                    </div>
                </div>
                
                {/* Mini Graph simulation */}
                 <div className="flex items-end gap-0.5 h-4 mt-1 opacity-30">
                    {[...Array(10)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-full rounded-sm ${agent.status === 'Running' ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            style={{ height: `${Math.random() * 100}%` }}
                        ></div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
 
      {/* AI Insights - AI POWERED */}
      <Card className="border-0 shadow-lg bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 dark:text-white group hover:shadow-xl transition-all relative overflow-hidden">
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    AI Insights Generative
                </CardTitle>
                <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
            </div>
        </CardHeader>
        <CardContent className="h-full flex flex-col justify-center min-h-[140px]">
             <div key={currentInsightIndex} className="animate-fade-in">
                 <div className={`rounded-xl border p-4 backdrop-blur-sm relative overflow-hidden 
                    ${currentInsight.type === 'warning' ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-500/20' : 
                      currentInsight.type === 'optimization' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/20' :
                      'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-500/20'}
                 `}>
                    <p className={`font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2 
                         ${currentInsight.type === 'warning' ? 'text-rose-600 dark:text-rose-400' : 
                          currentInsight.type === 'optimization' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-blue-600 dark:text-blue-400'}
                    `}>
                        <Brain className="w-3 h-3" />
                        {currentInsight.title}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed">
                       {currentInsight.content}
                       <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-slate-400 animate-pulse"></span>
                    </p>
                 </div>
             </div>
             
             <div className="mt-4 flex gap-1 justify-center">
                {insights.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-1 rounded-full transition-all duration-300 ${idx === currentInsightIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}
                    />
                ))}
             </div>
        </CardContent>
      </Card>
    </BentoGrid>
  );
}
