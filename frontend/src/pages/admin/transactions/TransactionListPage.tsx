import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  User
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

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await paymentAPI.getTransactions({ 
        search, 
        status: statusFilter !== 'all' ? statusFilter : undefined 
      });
      
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
        fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Giao dịch thanh toán</h1>
          <p className="text-secondary-500 dark:text-secondary-400">Lịch sử thanh toán và đối soát</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <ArrowDownLeft className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>

      <div className="bg-white dark:bg-secondary-800 p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Tìm mã giao dịch, mã đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="paid">Thành công</option>
          <option value="pending">Đang chờ</option>
          <option value="failed">Thất bại</option>
        </select>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-secondary-500">Đang tải dữ liệu...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-secondary-300 mb-4" />
            <p className="text-secondary-500">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary-50 dark:bg-secondary-900 text-secondary-500 dark:text-secondary-400 font-medium">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap">Mã GD</th>
                  <th className="px-6 py-3 whitespace-nowrap">Đơn hàng</th>
                  <th className="px-6 py-3 whitespace-nowrap">Khách hàng</th>
                  <th className="px-6 py-3 whitespace-nowrap">Số tiền</th>
                  <th className="px-6 py-3 whitespace-nowrap">Phương thức</th>
                  <th className="px-6 py-3 whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50">
                    <td className="px-6 py-4 font-mono text-secondary-600 dark:text-secondary-300">
                      {tx.transaction_ref || '---'}
                    </td>
                    <td className="px-6 py-4 font-medium text-primary-600">
                      {tx.order_code}
                    </td>
                    <td className="px-6 py-4 text-secondary-900 dark:text-white">
                      <div className="flex items-center gap-2">
                         <User className="w-4 h-4 text-secondary-400" />
                         {tx.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {tx.method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${tx.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          tx.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {tx.status === 'paid' ? <CheckCircle className="w-3 h-3" /> :
                        tx.status === 'failed' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tx.status === 'paid' ? 'Thành công' : tx.status === 'failed' ? 'Thất bại' : 'Đang chờ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-secondary-500 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
