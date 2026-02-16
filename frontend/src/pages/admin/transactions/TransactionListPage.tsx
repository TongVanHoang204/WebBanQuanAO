import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Search, 
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  Download
} from 'lucide-react';
import { paymentAPI } from '../../../services/api';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  order_id: string;
  order_code: string;
  method: string;
  status: string;
  amount: number;
  transaction_ref: string | null;
  paid_at: string | null;
  created_at: string;
  customer_name: string;
}

export default function TransactionListPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await paymentAPI.getTransactions({ 
        search, 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      
      if (res.data.success) {
        setTransactions(res.data.data);
        setPage(1);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, dateFrom, dateTo]);

  // Computed stats
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const paidCount = transactions.filter(tx => tx.status === 'paid').length;
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
  const failedCount = transactions.filter(tx => tx.status === 'failed').length;
  const successRate = transactions.length > 0 ? ((paidCount / transactions.length) * 100).toFixed(1) : '0';

  // Client-side pagination
  const totalPages = Math.ceil(transactions.length / limit);
  const paginatedTransactions = transactions.slice((page - 1) * limit, page * limit);

  const handleExport = () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    params.append('token', token || '');
    window.open(`${apiUrl}/admin/export/transactions?${params}`, '_blank');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const getPageItems = (currentPage: number, total: number): Array<number | 'ellipsis'> => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
    if (currentPage >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', total];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Giao dịch thanh toán</h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-sm">Lịch sử thanh toán và đối soát</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium text-sm shadow-sm shadow-primary-600/25 hover:shadow-md"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Tổng giá trị</p>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{formatCurrency(totalAmount)}</h3>
        </div>
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Thành công</p>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{paidCount}</h3>
            <span className="text-xs font-medium text-emerald-600 mb-0.5">{successRate}%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Đang chờ</p>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{pendingCount}</h3>
        </div>
        <div className="bg-white dark:bg-secondary-800 p-5 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">Thất bại</p>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{failedCount}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800/80 p-4 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Tìm mã giao dịch, mã đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-sm"
          />
        </div>
        <div className="relative sm:w-52">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full h-11 pl-10 pr-10 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="paid">Thành công</option>
            <option value="pending">Đang chờ</option>
            <option value="failed">Thất bại</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="h-11 px-3 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-sm" />
          <span className="text-secondary-400">—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="h-11 px-3 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-secondary-800/80 rounded-2xl shadow-sm border border-secondary-200/80 dark:border-secondary-700/60 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4 px-6 py-2">
                <div className="h-4 w-24 bg-secondary-200 dark:bg-secondary-700 rounded" />
                <div className="h-4 w-20 bg-secondary-200 dark:bg-secondary-700 rounded" />
                <div className="h-4 w-32 bg-secondary-200 dark:bg-secondary-700 rounded flex-1" />
                <div className="h-4 w-24 bg-secondary-200 dark:bg-secondary-700 rounded" />
                <div className="h-4 w-20 bg-secondary-200 dark:bg-secondary-700 rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-secondary-700/50 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-secondary-300 dark:text-secondary-500" />
            </div>
            <p className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Chưa có giao dịch nào</p>
            <p className="text-xs text-secondary-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-secondary-50/80 dark:bg-secondary-900/50 border-b border-secondary-200/60 dark:border-secondary-700/40">
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Mã GD</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Đơn hàng</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Số tiền</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Phương thức</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-secondary-600 dark:text-secondary-300">
                        {tx.transaction_ref || '---'}
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/admin/orders/${tx.order_id}`} className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline">
                          {tx.order_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-secondary-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-secondary-400" />
                          {tx.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-secondary-900 dark:text-white tabular-nums">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-100 text-secondary-600 dark:bg-secondary-700/50 dark:text-secondary-300 capitalize">
                          {tx.method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${tx.status === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                            tx.status === 'failed' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/10 dark:bg-red-900/30 dark:text-red-300' : 
                            'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'paid' ? 'bg-emerald-500' : tx.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {tx.status === 'paid' ? 'Thành công' : tx.status === 'failed' ? 'Thất bại' : 'Đang chờ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-secondary-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-secondary-200/60 dark:border-secondary-700/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Trang <span className="font-semibold text-secondary-700 dark:text-secondary-200">{page}</span> / <span className="font-semibold text-secondary-700 dark:text-secondary-200">{totalPages}</span>
                  <span className="ml-1.5 text-secondary-400">· {transactions.length} giao dịch</span>
                </p>
                <nav className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageItems(page, totalPages).map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${index}`} className="w-9 h-9 inline-flex items-center justify-center text-sm text-secondary-400 select-none">···</span>
                    ) : (
                      <button key={item} onClick={() => setPage(item)}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                          page === item ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                            : 'border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                        }`}>
                        {item}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
