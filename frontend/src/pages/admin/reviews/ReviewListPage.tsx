import { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Check, 
  X, 
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  author_name: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    product_images: { url: string }[];
  };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  hidden: number;
}

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ratingFilter) params.append('rating', ratingFilter);

      const res = await fetch(`/api/admin/reviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, ratingFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/reviews/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchReviews();
      } else {
        toast.error(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'hide' | 'delete') => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 đánh giá');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (action === 'delete') {
        if (!confirm(`Xóa ${selectedIds.length} đánh giá đã chọn?`)) return;
        
        const res = await fetch('/api/admin/reviews/bulk', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ids: selectedIds })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message);
          setSelectedIds([]);
          fetchReviews();
        }
      } else {
        const statusMap = { approve: 'approved', reject: 'rejected', hide: 'hidden' };
        const res = await fetch('/api/admin/reviews/bulk-status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ids: selectedIds, status: statusMap[action] })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message);
          setSelectedIds([]);
          fetchReviews();
        }
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa đánh giá này?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Đã xóa đánh giá');
        fetchReviews();
      }
    } catch (error) {
      toast.error('Lỗi xóa đánh giá');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map(r => r.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      hidden: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300'
    };
    const labels: Record<string, string> = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      hidden: 'Đã ẩn'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-secondary-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Quản lý Đánh giá
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          Duyệt và quản lý đánh giá sản phẩm từ khách hàng
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Chờ duyệt', value: stats.pending, color: 'bg-yellow-500', filter: 'pending' },
          { label: 'Đã duyệt', value: stats.approved, color: 'bg-green-500', filter: 'approved' },
          { label: 'Từ chối', value: stats.rejected, color: 'bg-red-500', filter: 'rejected' },
          { label: 'Đã ẩn', value: stats.hidden, color: 'bg-secondary-500', filter: 'hidden' }
        ].map(stat => (
          <button
            key={stat.filter}
            onClick={() => setStatusFilter(statusFilter === stat.filter ? 'all' : stat.filter)}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === stat.filter
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <div className="text-left">
                <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm border border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đánh giá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>{r} sao</option>
            ))}
          </select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Đã chọn {selectedIds.length}
              </span>
              <button
                onClick={() => handleBulkAction('approve')}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                title="Duyệt"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Từ chối"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('hide')}
                className="p-2 text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg"
                title="Ẩn"
              >
                <EyeOff className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400">
              Chưa có đánh giá nào
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {/* Header */}
            <div className="px-6 py-3 bg-secondary-50 dark:bg-secondary-900 flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedIds.length === reviews.length && reviews.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-secondary-500 uppercase">
                {reviews.length} đánh giá
              </span>
            </div>

            {/* Items */}
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-secondary-50 dark:hover:bg-secondary-900/50 transition-colors">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(review.id)}
                    onChange={() => toggleSelect(review.id)}
                    className="mt-1 w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  />
                  
                  {/* Product Image */}
                  {review.product?.product_images?.[0]?.url ? (
                    <img
                      src={review.product.product_images[0].url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover bg-secondary-100 dark:bg-secondary-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-secondary-100 dark:bg-secondary-700" />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating)}
                          {getStatusBadge(review.status)}
                          {review.is_verified && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Đã mua
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-secondary-900 dark:text-white">
                          {review.title || '(Không có tiêu đề)'}
                        </h4>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1 line-clamp-2">
                          {review.content || '(Không có nội dung)'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-secondary-500">
                          <span>Bởi: {review.author_name || 'Ẩn danh'}</span>
                          <span>•</span>
                          <span>{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <span>Sản phẩm: {review.product?.name}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {review.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'approved')}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Duyệt"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Từ chối"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {review.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(review.id, 'hidden')}
                            className="p-2 text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                            title="Ẩn"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        {review.status === 'hidden' && (
                          <button
                            onClick={() => handleUpdateStatus(review.id, 'approved')}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Hiện lại"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
