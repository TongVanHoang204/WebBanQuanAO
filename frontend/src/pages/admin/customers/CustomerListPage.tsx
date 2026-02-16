import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Pencil, Trash2, Loader2, Eye, UserX, UserCheck } from 'lucide-react';
import { adminAPI, toMediaUrl } from '../../../services/api';
import Pagination from '../../../components/common/Pagination';
import CustomerModal from './CustomerModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import AIInsightPanel from '../../../components/common/AIInsightPanel';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, new_this_week: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    isDestructive: false,
    onConfirm: () => {},
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers({ 
          page, 
          limit: 10, 
          search: search || undefined,
          role: 'customer'
      });
      
      setCustomers(res.data.data.users);
      setTotalPages(res.data.data.pagination.totalPages);
      if (res.data.data.stats) {
          setStats(res.data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (customer: any) => {
    const isBlocking = customer.status === 'active';
    const action = isBlocking ? 'khóa' : 'mở khóa';
    
    setConfirmModal({
      isOpen: true,
      title: isBlocking ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
      message: `Bạn có chắc chắn muốn ${action} khách hàng "${customer.full_name || customer.username}"? ${isBlocking ? 'Khách hàng sẽ không thể đăng nhập.' : ''}`,
      confirmText: isBlocking ? 'Khóa tài khoản' : 'Mở khóa',
      isDestructive: isBlocking,
      onConfirm: async () => {
        try {
          // Check if admin is blocking themselves (sanity check, though unlikely in customer list)
          // const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          // if (customer.id === currentUser.id) ... 

          const newStatus = customer.status === 'active' ? 'blocked' : 'active';
          await adminAPI.updateUser(customer.id, { status: newStatus });
          
          toast.success(newStatus === 'active' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
          fetchCustomers();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.error?.message || 'Có lỗi xảy ra');
        }
      }
    });
  };

  const handleView = (customer: any) => {
    navigate(`/admin/customers/${customer.id}`);
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    window.open(`${apiUrl}/admin/export/customers?token=${token}&search=${search}&role=customer`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý khách hàng</h1>
          <p className="text-sm text-gray-500 dark:text-secondary-400 mt-1">Quản lý và xem tất cả người dùng đã đăng ký.</p>
        </div>
        <button 
           onClick={handleAddNew}
           className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-secondary-400">Tổng khách hàng</h3>
            <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
         </div>
         <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-secondary-400">Đang hoạt động</h3>
            <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</span>
                <div className="flex -space-x-2">
                   {/* Avatars placeholder */}
                   {[1,2,3].map(i => (
                       <div key={i} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-secondary-600 border-2 border-white dark:border-secondary-800" />
                   ))}
                </div>
            </div>
         </div>
         <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-secondary-400">Mới tuần này</h3>
            <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.new_this_week}</span>
            </div>
         </div>
      </div>

      {/* AI Customer Segmentation */}
      <div className="mb-8">
        <AIInsightPanel
          title="🎯 AI Phân tích khách hàng"
          cacheKey="customer_analysis"
          onAnalyze={async () => {
            const res = await adminAPI.aiCustomerAnalyze();
            return res.data.data;
          }}
          renderContent={(data) => (
            <div className="space-y-3">
              {data.summary && <p className="font-medium">{data.summary}</p>}
              {data.segments?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {data.segments.map((s: any, i: number) => (
                    <div key={i} className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs">{s.name}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{s.count}</span>
                      </div>
                      <p className="text-[11px] text-secondary-500">{s.description}</p>
                      {s.action && <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">→ {s.action}</p>}
                    </div>
                  ))}
                </div>
              )}
              {data.insights?.length > 0 && (
                <div className="space-y-1">
                  {data.insights.map((ins: string, i: number) => (
                    <p key={i} className="text-xs text-secondary-600 dark:text-secondary-400">💡 {ins}</p>
                  ))}
                </div>
              )}
              {data.recommendations?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Đề xuất:</p>
                  {data.recommendations.map((r: string, i: number) => (
                    <p key={i} className="text-xs text-secondary-600 dark:text-secondary-400">✅ {r}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800/80 p-4 rounded-2xl border border-gray-200 dark:border-secondary-700/60 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between transition-colors">
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-secondary-500" />
            <input 
               type="text"
               placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            className="w-full h-11 pl-10 pr-4 border border-gray-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-900/70 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3">
             <button 
                onClick={handleExport}
             className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-secondary-900/70 border border-gray-300 dark:border-secondary-600 rounded-xl hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-secondary-300 transition-colors"
             >
                <Download className="w-4 h-4" />
                <span>Xuất file</span>
             </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl shadow-sm overflow-hidden transition-colors">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 dark:bg-secondary-700/50 border-b border-gray-200 dark:border-secondary-700 text-gray-500 dark:text-secondary-400 font-medium">
                  <tr>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Số điện thoại</th>
                    <th className="px-6 py-4">Đơn hàng</th>
                    <th className="px-6 py-4">Tổng chi tiêu</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
                  {loading ? (
                      <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
                          </td>
                      </tr>
                  ) : customers.length === 0 ? (
                      <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-secondary-400">
                              Không tìm thấy khách hàng nào.
                          </td>
                      </tr>
                  ) : (
                      customers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700/50 transition-colors">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold overflow-hidden">
                                      {user.avatar_url ? (
                                        <img 
                                          src={toMediaUrl(user.avatar_url)} 
                                          alt={user.full_name || 'User'} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerText = (user.full_name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase();
                                          }}
                                        />
                                      ) : (
                                        (user.full_name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()
                                      )}
                                   </div>
                                   <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{user.full_name || 'No Name'}</p>
                                      <p className="text-gray-500 dark:text-secondary-400 text-xs">{user.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-gray-600 dark:text-secondary-300">
                                {user.phone || '---'}
                             </td>
                             <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {user.orders_count || 0}
                             </td>
                             <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.total_spent || 0)}
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                    ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                    {user.status === 'active' ? 'Hoạt động' : 'Đã chặn'}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleView(user)}
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Xem">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleEdit(user)}
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Chỉnh sửa"
                                  >
                                     <Pencil className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleStatus(user)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        user.status === 'active' 
                                          ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/30' 
                                          : 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/30'
                                    }`}
                                    title={user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                                  >
                                     {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                  </button>
                                </div>
                             </td>
                          </tr>
                      ))
                  )}
               </tbody>
            </table>
         </div>
         
         {/* Pagination */}
         {!loading && customers.length > 0 && (
             <div className="border-t border-gray-200 dark:border-secondary-700">
                <Pagination 
                   currentPage={page}
                   totalPages={totalPages}
                   onPageChange={setPage}
                />
             </div>
         )}
      </div>

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
        customer={selectedCustomer}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}
