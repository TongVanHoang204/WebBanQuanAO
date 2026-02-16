import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Loader2,
  Ticket,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { couponService } from '../../../services/coupon.service';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { adminAPI } from '../../../services/api';
import AIInsightPanel from '../../../components/common/AIInsightPanel';

export default function CouponListPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'upcoming' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; couponId: number | null }>({
    isOpen: false,
    couponId: null
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponService.getCoupons({ 
        page, 
        limit: 10,
        query: searchQuery 
      });
      setCoupons(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch coupons', error);
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchQuery]);

  // Client-side status filter (since backend pagination is already in place)
  const filteredCoupons = statusFilter === 'all' ? coupons : coupons.filter(coupon => {
    const now = new Date();
    switch (statusFilter) {
      case 'active':
        return coupon.is_active && (!coupon.start_at || new Date(coupon.start_at) <= now) && (!coupon.end_at || new Date(coupon.end_at) >= now);
      case 'expired':
        return coupon.end_at && new Date(coupon.end_at) < now;
      case 'upcoming':
        return coupon.start_at && new Date(coupon.start_at) > now;
      case 'disabled':
        return !coupon.is_active;
      default: return true;
    }
  });

  const handleDelete = async () => {
    if (!deleteModal.couponId) return;
    try {
      await couponService.deleteCoupon(deleteModal.couponId);
      toast.success('Xóa mã giảm giá thành công');
      fetchCoupons();
    } catch (error: any) {
      console.error('Delete coupon error:', error);
      toast.error('Xóa thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (coupon: any) => {
    if (!coupon.is_active) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    const now = new Date();
    if (coupon.start_at && new Date(coupon.start_at) > now) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (coupon.end_at && new Date(coupon.end_at) < now) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  };

  const getStatusText = (coupon: any) => {
    if (!coupon.is_active) return 'Đã tắt';
    const now = new Date();
    if (coupon.start_at && new Date(coupon.start_at) > now) return 'Sắp diễn ra';
    if (coupon.end_at && new Date(coupon.end_at) < now) return 'Hết hạn';
    return 'Đang chạy';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary-600" />
            Quản lý khuyến mãi
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 mt-1">
            Tạo và quản lý các mã giảm giá cho khách hàng
          </p>
        </div>
        
        <Link
          to="/admin/coupons/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Tạo mã mới
        </Link>
      </div>

      {/* AI Coupon Strategy */}
      <AIInsightPanel
        title="🎯 AI Chiến lược khuyến mãi"
        cacheKey="coupon_strategy"
        onAnalyze={async () => {
          const res = await adminAPI.aiCouponSuggest();
          return res.data.data;
        }}
        renderContent={(data) => (
          <div className="space-y-3">
            {data.strategy && <p className="font-medium">{data.strategy}</p>}
            {data.suggestions?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold">Gợi ý mã khuyến mãi:</p>
                {data.suggestions.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded font-mono text-xs font-bold">{s.code}</span>
                    <span className="text-xs">{s.type === 'percent' ? `${s.value}%` : `${Number(s.value).toLocaleString('vi-VN')}đ`}</span>
                    {s.min_subtotal && <span className="text-xs text-secondary-500">Min: {Number(s.min_subtotal).toLocaleString('vi-VN')}đ</span>}
                    <span className="text-xs text-secondary-500 ml-auto">{s.reason}</span>
                  </div>
                ))}
              </div>
            )}
            {data.tips?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold">Mẹo:</p>
                {data.tips.map((t: string, i: number) => (
                  <p key={i} className="text-xs text-secondary-600 dark:text-secondary-400">💡 {t}</p>
                ))}
              </div>
            )}
          </div>
        )}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800/80 p-4 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-secondary-50 dark:bg-secondary-900/70 border border-secondary-200 dark:border-secondary-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-secondary-900 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-4 bg-secondary-50 dark:bg-secondary-900/70 border border-secondary-200 dark:border-secondary-700 rounded-xl text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang chạy</option>
            <option value="expired">Hết hạn</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="disabled">Đã tắt</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Mã / Loại</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Giá trị</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Sử dụng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-secondary-500 dark:text-secondary-400">
                    Chưa có mã giảm giá nào
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded w-fit text-sm">
                          {coupon.code}
                        </span>
                        <span className="text-xs text-secondary-500 mt-1 capitalize">
                          {coupon.type === 'percent' ? 'Phần trăm' : 'Số tiền cố định'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-900 dark:text-white font-medium">
                      {coupon.type === 'percent' ? `${Number(coupon.value)}%` : `${Number(coupon.value).toLocaleString('vi-VN')}đ`}
                      <div className="text-xs text-secondary-500 font-normal">
                        Min: {Number(coupon.min_subtotal).toLocaleString('vi-VN')}đ
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-secondary-900 dark:text-white">
                        {coupon.used_count ?? 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                      </div>
                      <div className="text-xs text-secondary-500">đã dùng</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm text-secondary-500 dark:text-secondary-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {coupon.start_at ? new Date(coupon.start_at).toLocaleDateString('vi-VN') : 'Bắt đầu'} 
                          {' - '}
                          {coupon.end_at ? new Date(coupon.end_at).toLocaleDateString('vi-VN') : 'Vô hạn'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(coupon)}`}>
                        {getStatusText(coupon)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/coupons/${coupon.id}`}
                          className="p-2 text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, couponId: coupon.id })}
                          className="p-2 text-secondary-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 flex justify-center">
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-secondary-200 dark:border-secondary-700 disabled:opacity-50 text-secondary-700 dark:text-secondary-300"
              >
                Trước
              </button>
              <span className="px-3 py-1 text-secondary-700 dark:text-secondary-300">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-secondary-200 dark:border-secondary-700 disabled:opacity-50 text-secondary-700 dark:text-secondary-300"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, couponId: null })}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa mã giảm giá này không? Khách hàng sẽ không thể sử dụng mã này nữa."
        confirmText="Đồng ý xóa"
        cancelText="Để em xem lại"
        isDestructive={true}
      />
    </div>
  );
}
