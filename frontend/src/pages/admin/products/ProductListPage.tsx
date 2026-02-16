
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download,
  Upload,
  Edit, 
  Trash2, 
  ChevronRight,
  Package,
  Ticket,
  Eye,
  ChevronLeft,
  X,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { adminAPI, toMediaUrl } from '../../../services/api';
import { Product } from '../../../types';
import { formatPrice } from '../../../hooks/useShop';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/common/ConfirmModal';

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null }>({
    isOpen: false,
    productId: null
  });

  // Import Modal State
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    created: number;
    updated: number;
    errors: { row: number; sku: string; error: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined
      });
      setProducts(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, status, pagination.page]);

  const getPageItems = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
  };

  const handleDelete = async () => {
    if (!deleteModal.productId) return;
    try {
      await adminAPI.deleteProduct(deleteModal.productId);
      toast.success('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error) {
      toast.error('Xóa sản phẩm thất bại');
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    window.open(`${apiUrl}/admin/export/products?token=${token}`, '_blank');
  };

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    window.open(`${apiUrl}/admin/import/products/template?token=${token}`, '_blank');
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await adminAPI.importProducts(formData);
      setImportResult(response.data.data);
      
      if (response.data.data.errors.length === 0) {
        toast.success(`Nhập thành công: ${response.data.data.created} mới, ${response.data.data.updated} cập nhật`);
      } else {
        toast.error(`Có ${response.data.data.errors.length} lỗi khi nhập`);
      }
      
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Nhập Excel thất bại');
    } finally {
      setIsImporting(false);
    }
  };

  const closeImportModal = () => {
    setImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Sản phẩm</h1>
            {pagination.total > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 tabular-nums">
                {pagination.total}
              </span>
            )}
          </div>
          <p className="text-secondary-500 dark:text-secondary-400 text-sm mt-0.5">Quản lý kho hàng và danh mục sản phẩm</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all font-medium text-sm shadow-sm hover:shadow"
          >
            <Upload className="w-4 h-4" />
            <span>Nhập Excel</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all font-medium text-sm shadow-sm hover:shadow"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <Link 
            to="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium text-sm shadow-sm shadow-primary-600/25 hover:shadow-md hover:shadow-primary-600/30"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800/80 p-4 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm flex flex-col sm:flex-row gap-4 transition-colors">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/70 rounded-xl text-sm text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <Filter className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none w-full h-11 pl-10 pr-10 border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/70 rounded-xl text-sm text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Bản nháp</option>
          </select>
          <ChevronRight className="w-4 h-4 text-secondary-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-secondary-800/80 rounded-2xl border border-secondary-200/80 dark:border-secondary-700/60 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50/80 dark:bg-secondary-900/50 border-b border-secondary-200/60 dark:border-secondary-700/40">
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider min-w-[300px]">Sản phẩm</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider min-w-[120px]">Trạng thái</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider min-w-[250px]">Kho & Biến thể</th>
                <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider sticky right-0 bg-secondary-50 dark:bg-secondary-800 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700/50 bg-white dark:bg-secondary-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-secondary-200 dark:bg-secondary-700 flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-3/4" />
                          <div className="h-3 bg-secondary-100 dark:bg-secondary-700/50 rounded-lg w-1/2" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-secondary-200 dark:bg-secondary-700 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 w-20 bg-secondary-200 dark:bg-secondary-700 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 w-24 bg-secondary-200 dark:bg-secondary-700 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 w-20 bg-secondary-200 dark:bg-secondary-700 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 w-16 bg-secondary-200 dark:bg-secondary-700 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 w-16 bg-secondary-200 dark:bg-secondary-700 rounded-lg" /></td>
                  </tr>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-secondary-100 dark:bg-secondary-700 overflow-hidden ring-1 ring-secondary-200/50 dark:ring-secondary-600/30">
                          {product.product_images && product.product_images.length > 0 ? (
                            <img 
                              src={toMediaUrl(product.product_images.find(i => i.is_primary)?.url || product.product_images[0].url)} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-secondary-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-secondary-900 dark:text-white line-clamp-2" title={product.name}>
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        product.is_active 
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20' 
                          : 'bg-secondary-100 text-secondary-600 ring-1 ring-secondary-300/30 dark:bg-secondary-700 dark:text-secondary-400 dark:ring-secondary-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-secondary-400 dark:bg-secondary-500'}`} />
                        {product.is_active ? 'Đang bán' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-100 text-secondary-600 dark:bg-secondary-700/50 dark:text-secondary-300">
                        {product.category?.name || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                      {formatPrice(product.base_price)}
                    </td>
                     <td className="px-6 py-4 text-sm text-secondary-500 dark:text-secondary-400">
                       {product.product_variants && product.product_variants.length > 0 ? (
                         <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-2">
                           {product.product_variants.map(v => (
                             <div key={v.id} className="flex items-center justify-between gap-3 text-xs">
                               <span className="font-medium text-secondary-700 dark:text-secondary-300 truncate" title={v.variant_sku}>
                                 {v.variant_sku}
                               </span>
                               <span className={`flex-shrink-0 inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                                 v.stock_qty > 10 
                                   ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                                   : v.stock_qty > 0 
                                     ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                     : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                               }`}>
                                 {v.stock_qty ?? 0}
                               </span>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-700 dark:text-secondary-300">
                            <Layers className="w-3.5 h-3.5 text-secondary-400" />
                            {product.product_variants?.reduce((acc, v) => acc + v.stock_qty, 0) || product.stock_qty || 0}
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-secondary-50 dark:bg-secondary-800 dark:group-hover:bg-secondary-700/50 transition-colors z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]">
                      <div className="flex justify-end items-center gap-1">
                        <Link 
                          to={`/products/${product.slug}`} 
                          target="_blank"
                          className="p-2 text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                          title="Xem trên web"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/admin/products/${product.id}`}
                          className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, productId: product.id })}
                          className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-secondary-700/50 flex items-center justify-center">
                        <Package className="w-8 h-8 text-secondary-300 dark:text-secondary-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Không tìm thấy sản phẩm nào</p>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white dark:bg-secondary-800/80 px-5 py-4 border-t border-secondary-200/60 dark:border-secondary-700/40 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            Trang <span className="font-semibold text-secondary-700 dark:text-secondary-200">{pagination.page}</span> / <span className="font-semibold text-secondary-700 dark:text-secondary-200">{pagination.totalPages}</span>
            <span className="ml-1.5 text-secondary-400 dark:text-secondary-500">· {pagination.total} sản phẩm</span>
          </p>
          <nav className="flex items-center gap-1.5" aria-label="Pagination">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageItems(pagination.page, Math.max(1, pagination.totalPages)).map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="w-9 h-9 inline-flex items-center justify-center text-sm text-secondary-400 dark:text-secondary-500 select-none"
                >
                  ···
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPagination(prev => ({ ...prev, page: item }))}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    pagination.page === item
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                      : 'border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  }`}
                >
                  {item}
                </button>
              )
            )}
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này sẽ gỡ sản phẩm khỏi hệ thống."
        confirmText="Đồng ý xóa"
        cancelText="Để em xem lại"
        isDestructive={true}
      />

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Nhập sản phẩm từ Excel</h3>
              </div>
              <button onClick={closeImportModal} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!importResult ? (
                <>
                  {/* Download Template */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Tải mẫu Excel để nhập đúng định dạng
                    </p>
                    <button 
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Download className="w-4 h-4" />
                      Tải mẫu nhập sản phẩm
                    </button>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Chọn file Excel
                    </label>
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        importFile 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                          : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      />
                      {importFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileSpreadsheet className="w-8 h-8 text-primary-600" />
                          <div className="text-left">
                            <p className="font-medium text-secondary-900 dark:text-white">{importFile.name}</p>
                            <p className="text-sm text-secondary-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-secondary-400 mx-auto mb-3" />
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Click để chọn file hoặc kéo thả vào đây
                          </p>
                          <p className="text-xs text-secondary-400 mt-1">
                            Hỗ trợ: .xlsx, .xls (tối đa 5MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Import Results */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
                      <Check className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                      <p className="text-xs text-green-700 dark:text-green-400">Tạo mới</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                      <Edit className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">Cập nhật</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center">
                      <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                      <p className="text-xs text-red-700 dark:text-red-400">Lỗi</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl max-h-48 overflow-y-auto">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Chi tiết lỗi:</p>
                      <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>
                            Dòng {err.row} (SKU: {err.sku}): {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-secondary-200 dark:border-secondary-700">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-full font-medium transition-colors"
              >
                {importResult ? 'Đóng' : 'Hủy'}
              </button>
              {!importResult && (
                <button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang nhập...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Nhập sản phẩm
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
