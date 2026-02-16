
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  Edit, 
  Trash2, 
  Tag,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { brandsAPI } from '../../../services/api';
import ConfirmModal from '../../../components/common/ConfirmModal';

const ITEMS_PER_PAGE = 15;

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  _count: { products: number };
}

export default function BrandListPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  // ConfirmModal state
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
    onConfirm: () => {},
  });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await brandsAPI.getAll(params);
      const data = res.data;
      if (data.success) {
        setBrands(data.data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Không thể tải danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrands();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa thương hiệu?',
      message: `Bạn có chắc muốn xóa thương hiệu "${name}"? Thao tác không thể hoàn tác.`,
      confirmText: 'Xóa',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await brandsAPI.delete(id);
          const data = res.data;
          if (data.success) {
            toast.success('Đã xóa thương hiệu');
            fetchBrands();
          } else {
            toast.error(data.error?.message || 'Không thể xóa');
          }
        } catch (error) {
          toast.error('Có lỗi xảy ra');
        }
      }
    });
  };

  const handleToggleActive = async (brand: Brand) => {
    try {
      await brandsAPI.update(brand.id, { is_active: !brand.is_active });
      toast.success(brand.is_active ? 'Đã tắt thương hiệu' : 'Đã bật thương hiệu');
      fetchBrands();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const totalPages = Math.ceil(brands.length / ITEMS_PER_PAGE);
  const paginatedBrands = brands.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Quản lý Thương hiệu
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            Quản lý các thương hiệu sản phẩm của cửa hàng
          </p>
        </div>
        <Link
          to="/admin/brands/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm thương hiệu
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800/80 rounded-2xl p-4 shadow-sm border border-secondary-200/80 dark:border-secondary-700/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none w-full h-11 pl-10 pr-10 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400">
              {search ? 'Không tìm thấy thương hiệu nào' : 'Chưa có thương hiệu nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Thương hiệu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {paginatedBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-10 h-10 rounded-lg object-contain bg-secondary-100 dark:bg-secondary-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-secondary-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-secondary-900 dark:text-white">
                            {brand.name}
                          </p>
                          {brand.description && (
                            <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate max-w-xs">
                              {brand.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded">
                        {brand.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {brand._count.products} sản phẩm
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(brand)}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                        style={{ backgroundColor: brand.is_active ? '#16a34a' : '#d1d5db' }}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${brand.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/brands/${brand.id}`}
                          className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(brand.id, brand.name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
            <span className="text-sm text-secondary-500 dark:text-secondary-400">
              Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, brands.length)} / {brands.length} thương hiệu
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 disabled:opacity-50 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                Trước
              </button>
              <span className="px-3 py-1.5 text-sm text-secondary-700 dark:text-secondary-300">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 disabled:opacity-50 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}
