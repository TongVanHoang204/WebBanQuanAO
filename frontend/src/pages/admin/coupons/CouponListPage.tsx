import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Loader2,
  Ticket,
  Calendar,
  MoreVertical,
  Sparkles
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { couponService } from '../../../services/coupon.service';
import { adminAPI } from '../../../services/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Pagination from '../../../components/common/Pagination';
import AIInsightPanel from '../../../components/common/AIInsightPanel';
import AIPromptModal from '../../../components/common/AIPromptModal';
import { useAuth } from '../../../contexts/AuthContext';

export default function CouponListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; couponId: number | null }>({
    isOpen: false,
    couponId: null
  });
  const { isAdmin } = useAuth();
  
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const handleAIGenerate = async (topic: string) => {
    if (!topic) return;

    setAiLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const msgs = [
      { role: 'system', content: `Bạn là trợ lý Marketing. Hôm nay là ${today}. Chỉ trả về duy nhất một mảng JSON Array (bắt đầu bằng [ và kết thúc bằng ]) chứa các object mã khuyến mãi. Dù tạo 1 mã cũng phải bọc trong Array. Không giải thích, không dùng markdown block. Các key bắt buộc cho mỗi object:
{
  "code": "MÃ IN HOA (VD: TINKY50)",
  "type": "percent" hoặc "fixed",
  "value": (số, ví dụ percent thì 5-30, fixed thì 20000, 50000),
  "min_subtotal": (tối thiểu đơn hàng ví dụ 100000),
  "usage_limit": (giới hạn lượt dùng vd: 50),
  "start_at": "YYYY-MM-DD" (mặc định hôm nay),
  "end_at": "YYYY-MM-DD" (sau ngày bắt đầu vài ngày)
}` },
      { role: 'user', content: `Yêu cầu tạo mã: "${topic}"` }
    ];

    try {
      const res = await adminAPI.chat(msgs);
      if (res.data?.success && res.data?.data?.message) {
        let cleanStr = res.data.data.message.trim();
        console.log("Raw AI Response:", cleanStr);
        
        // Strip out markdown code blocks if the AI decided to ignore instructions
        if (cleanStr.includes('```json')) {
            cleanStr = cleanStr.split('```json')[1].split('```')[0].trim();
        } else if (cleanStr.includes('```')) {
            cleanStr = cleanStr.split('```')[1].split('```')[0].trim();
        }

        // 1. Try to find the bounds of a JSON Array [ ... ]
        const firstBracket = cleanStr.indexOf('[');
        const lastBracket = cleanStr.lastIndexOf(']');
        
        let aiDataArray = null;

        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
           const jsonStr = cleanStr.substring(firstBracket, lastBracket + 1);
           try {
               const parsed = JSON.parse(jsonStr);
               if (Array.isArray(parsed)) aiDataArray = parsed;
           } catch (parseError) {
               console.error("JSON Parse Error (Array):", jsonStr, parseError);
           }
        }
        
        // 2. Fallback to single Object { ... } if AI ignored the Array instruction
        if (!aiDataArray) {
            const firstBrace = cleanStr.indexOf('{');
            const lastBrace = cleanStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
               const jsonStr = cleanStr.substring(firstBrace, lastBrace + 1);
               try {
                   const parsed = JSON.parse(jsonStr);
                   if (parsed && typeof parsed === 'object') aiDataArray = [parsed];
               } catch (parseError) {
                   console.error("JSON Parse Error (Object):", jsonStr, parseError);
               }
            }
        }

        // Process data and auto-save
        if (aiDataArray && aiDataArray.length > 0) {
            let successCount = 0;
            for (const aiData of aiDataArray) {
               if (!aiData.code) continue;
               const payload = {
                  code: String(aiData.code).toUpperCase().replace(/\s+/g, ''),
                  type: aiData.type === 'percent' || aiData.type === 'fixed' ? aiData.type : 'percent',
                  value: Number(aiData.value) || 0,
                  min_subtotal: Number(aiData.min_subtotal) || 0,
                  usage_limit: aiData.usage_limit ? Number(aiData.usage_limit) : null,
                  start_at: aiData.start_at || today,
                  end_at: aiData.end_at || null,
                  is_active: true
               };
               try {
                  await couponService.createCoupon(payload);
                  successCount++;
               } catch (err: any) {
                  const errMsg = err.response?.data?.message || err.message || 'Unknown error';
                  console.error(`Failed to create coupon ${payload.code}: ${errMsg}`, payload);
                  toast.error(`Lỗi tạo mã ${payload.code}: ${errMsg}`);
               }
            }
            
            if (successCount > 0) {
               toast.success(`Đã tự động tạo và lưu ${successCount} mã khuyến mãi!`);
               fetchCoupons();
               return;
            } else {
               throw new Error("Không có mã nào hợp lệ được tạo.");
            }
        }

        throw new Error("Format Invalid");
      } else {
        throw new Error("Lỗi phản hồi từ AI");
      }
    } catch (err: any) {
       console.error("AI Generation Error:", err);
       toast.error(err.response?.data?.message || "AI từ chối hoặc trả về sai định dạng, vui lòng thử lại!");
    } finally {
       setAiLoading(false);
       setIsAiModalOpen(false);
    }
  };

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

  useEffect(() => {
    const queryFromUrl = searchParams.get('query') || '';
    const pageFromUrl = Math.max(1, Number(searchParams.get('page') || 1) || 1);
    setSearchQuery(prev => (prev === queryFromUrl ? prev : queryFromUrl));
    setPage(prev => (prev === pageFromUrl ? prev : pageFromUrl));
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (searchQuery) next.set('query', searchQuery);
    if (page > 1) next.set('page', String(page));
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [searchQuery, page, searchParams, setSearchParams]);

  const listQuery = searchParams.toString() ? `?${searchParams.toString()}` : '';

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
        
        <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Tạo tự động bằng AI
              </button>
            )}
            <Link
              to={`/admin/coupons/new${listQuery}`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Tạo mã mới
            </Link>
        </div>
      </div>
      
      <AIPromptModal
         isOpen={isAiModalOpen}
         onClose={() => setIsAiModalOpen(false)}
         onSubmit={handleAIGenerate}
         isLoading={aiLoading}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-white"
          />
        </div>
      </div>

      {/* AI Insight */}
      <AIInsightPanel
        title="AI Phân tích khuyến mãi"
        prompt="Phân tích hiệu quả các mã khuyến mãi. Đánh giá tỷ lệ sử dụng, mã sắp hết hạn, và đề xuất chiến lược khuyến mãi hiệu quả hơn."
        dataContext={(() => {
          const lines: string[] = [`Tổng mã khuyến mãi: ${coupons.length}`];
          if (coupons.length > 0) {
            const active = coupons.filter((c: any) => c.is_active !== false && (!c.expires_at || new Date(c.expires_at) > new Date()));
            const expiring = coupons.filter((c: any) => {
              if (!c.expires_at) return false;
              const diff = new Date(c.expires_at).getTime() - Date.now();
              return diff > 0 && diff < 7 * 86400000;
            });
            lines.push(`Mã đang hoạt động: ${active.length}`);
            lines.push(`Mã sắp hết hạn (7 ngày): ${expiring.length}`);
            const totalUsed = coupons.reduce((sum: number, c: any) => sum + (c.used_count ?? c.times_used ?? 0), 0);
            lines.push(`Tổng lượt sử dụng: ${totalUsed}`);
            lines.push(`Danh sách mã: ${coupons.slice(0, 5).map((c: any) => `${c.code} (giảm ${c.discount_value ?? c.discount ?? '?'}${c.discount_type === 'percentage' || c.type === 'percentage' ? '%' : 'đ'}, dùng ${c.used_count ?? c.times_used ?? 0}/${c.max_usage ?? c.usage_limit ?? '∞'} lần)`).join('; ')}`);
          }
          return lines.join('\n');
        })()}
      />

      {/* List */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Mã / Loại</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Giá trị</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Đã dùng</th>
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
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-secondary-500 dark:text-secondary-400">
                    Chưa có mã giảm giá nào
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
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
                    <td className="px-6 py-4">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300 font-medium">
                        {coupon.used_count ?? coupon.times_used ?? 0}
                      </span>
                      <span className="text-xs text-secondary-400"> / {coupon.usage_limit ?? '∞'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/coupons/${coupon.id}${listQuery}`}
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
          <div className="bg-white dark:bg-secondary-800 px-4 py-3 border-t border-secondary-200 dark:border-secondary-700 flex flex-col sm:flex-row items-center justify-between gap-4 sm:px-6 transition-colors">
            <div className="text-sm text-secondary-500 dark:text-secondary-400">
               Hiển thị trang <span className="font-medium text-secondary-900 dark:text-white">{page}</span> trên <span className="font-medium text-secondary-900 dark:text-white">{totalPages}</span>
            </div>
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
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
