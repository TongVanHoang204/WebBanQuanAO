import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Upload,
  Edit, 
  Trash2, 
  Eye,
  X,
  AlertTriangle,
  ChevronDown,
  LayoutGrid,
  RefreshCcw,
  Ticket,
  Package
} from 'lucide-react';
import { adminAPI, categoriesAPI, toMediaUrl } from '../../../services/api';
import { Product } from '../../../types';
import { formatPrice } from '../../../hooks/useShop';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/common/ConfirmModal';
import AIInsightPanel from '../../../components/common/AIInsightPanel';
import Pagination from '../../../components/common/Pagination';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null }>({
    isOpen: false,
    productId: null
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
        category: category || undefined
      });
      setProducts(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || '';
    const statusFromUrl = searchParams.get('status') || '';
    const categoryFromUrl = searchParams.get('category') || '';
    const pageFromUrl = Math.max(1, Number(searchParams.get('page') || 1) || 1);

    setSearch(prev => (prev === searchFromUrl ? prev : searchFromUrl));
    setStatus(prev => (prev === statusFromUrl ? prev : statusFromUrl));
    setCategory(prev => (prev === categoryFromUrl ? prev : categoryFromUrl));
    setPagination(prev => (prev.page === pageFromUrl ? prev : { ...prev, page: pageFromUrl }));
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (status) next.set('status', status);
    if (category) next.set('category', category);
    if (pagination.page > 1) {
      next.set('page', String(pagination.page));
    }

    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [search, status, category, pagination.page, searchParams, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, status, category, pagination.page]);

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
    adminAPI.exportProducts().catch(() => {
      toast.error('Không thể xuất danh sách sản phẩm');
    });
  };

  const currentQueryString = searchParams.toString();
  const listQuery = currentQueryString ? `?${currentQueryString}` : '';

  // Flatten categories into a list with level indicators for the dropdown
  const flattenCategories = (cats: any[], level = 0): any[] => {
    let result: any[] = [];
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result = [...result, ...flattenCategories(cat.children, level + 1)];
      }
    });
    return result;
  };

  const flattenedCategories = flattenCategories(categories);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white tracking-tight">Sản phẩm</h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-sm mt-1">Quản lý kho hàng và danh mục sản phẩm</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-sm">
             <Link 
                to="/admin/products/import"
                className="flex items-center gap-2 px-4 py-2 border-r border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors font-medium text-sm rounded-l-lg"
                title="Nhập Excel"
             >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Nhập</span>
             </Link>
             <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors font-medium text-sm rounded-r-lg"
                title="Xuất Excel"
             >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất</span>
             </button>
          </div>
          <Link 
            to={`/admin/products/new${listQuery}`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white dark:bg-secondary-800 p-1.5 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm flex flex-col sm:flex-row gap-2 transition-all">
        {/* Search Input */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-secondary-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border-none bg-transparent rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 focus:ring-0 sm:text-sm"
            placeholder="Tìm kiếm theo tên, SKU hoặc mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
             <button 
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 cursor-pointer"
             >
                <X className="h-4 w-4" />
             </button>
          )}
        </div>

        <div className="h-px sm:h-auto sm:w-px bg-secondary-200 dark:bg-secondary-700 mx-1"></div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 p-1 overflow-x-auto">
            {/* Category Filter */}
            <div className="relative min-w-[160px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LayoutGrid className="h-4 w-4 text-secondary-400" />
                </div>
                 <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="appearance-none block w-full pl-9 pr-10 py-2 bg-secondary-50 dark:bg-secondary-700/50 border border-transparent hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl text-secondary-700 dark:text-secondary-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-secondary-800 transition-all cursor-pointer"
                 >
                    <option value="">Tất cả danh mục</option>
                    {flattenedCategories.map((cat: any) => (
                       <option key={cat.id} value={cat.slug}>
                         {Array.from({ length: cat.level }).map(() => '—').join(' ')} {cat.name}
                       </option>
                    ))}
                 </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-3.5 w-3.5 text-secondary-400" />
                </div>
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[150px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-secondary-400" />
                </div>
                <select 
                   value={status}
                   onChange={(e) => setStatus(e.target.value)}
                   className="appearance-none block w-full pl-9 pr-10 py-2 bg-secondary-50 dark:bg-secondary-700/50 border border-transparent hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl text-secondary-700 dark:text-secondary-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-secondary-800 transition-all cursor-pointer"
                >
                   <option value="">Tất cả trạng thái</option>
                   <option value="active">Đang bán</option>
                   <option value="inactive">Bản nháp</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-3.5 w-3.5 text-secondary-400" />
                </div>
            </div>

            <button 
               onClick={() => {
                  setSearch('');
                  setStatus('');
                  setCategory('');
                  setPagination(prev => ({ ...prev, page: 1 }));
               }}
               className="p-2 text-secondary-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
               title="Xóa bộ lọc"
            >
               <RefreshCcw className="h-4 w-4" />
            </button>
        </div>
      </div>

      {/* AI Insight */}
      <AIInsightPanel
        title="AI Phân tích sản phẩm"
        prompt="Phân tích danh mục sản phẩm hiện tại. Đánh giá tình trạng tồn kho, giá bán, và đề xuất chiến lược quản lý kho hàng cùng tối ưu danh mục sản phẩm."
        dataContext={(() => {
          const lines: string[] = [
            `Tổng sản phẩm: ${pagination.total}`,
            `Số danh mục: ${categories.length}`,
          ];
          if (products.length > 0) {
            const outOfStock = products.filter((p: any) => (p.stock ?? p.quantity ?? 0) <= 0).length;
            const lowStock = products.filter((p: any) => { const s = p.stock ?? p.quantity ?? 0; return s > 0 && s <= 10; }).length;
            lines.push(`Hết hàng (trang hiện tại): ${outOfStock}`);
            lines.push(`Sắp hết (<= 10): ${lowStock}`);
            const prices = products.map((p: any) => Number(p.price ?? 0)).filter(Boolean);
            if (prices.length) {
              lines.push(`Giá thấp nhất: ${Math.min(...prices).toLocaleString('vi-VN')} VNĐ`);
              lines.push(`Giá cao nhất: ${Math.max(...prices).toLocaleString('vi-VN')} VNĐ`);
              lines.push(`Giá trung bình: ${Math.round(prices.reduce((a,b) => a + b, 0) / prices.length).toLocaleString('vi-VN')} VNĐ`);
            }
            lines.push(`Mẫu sản phẩm (5 đầu): ${products.slice(0, 5).map((p: any) => `${p.name} - ${Number(p.price ?? 0).toLocaleString('vi-VN')}đ (tồn: ${p.stock ?? p.quantity ?? '?'})`).join('; ')}`);
          }
          return lines.join('\n');
        })()}
      />

      {/* Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Kho</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700/50 bg-white dark:bg-secondary-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-secondary-500">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="group hover:bg-secondary-50 dark:hover:bg-secondary-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-secondary-100 dark:bg-secondary-700 overflow-hidden border border-secondary-200 dark:border-secondary-600">
                          {product.product_images && product.product_images.length > 0 ? (
                            <img 
                              src={toMediaUrl(product.product_images.find(i => i.is_primary)?.url || product.product_images[0].url)} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-secondary-400">
                              <Package className="w-5 h-5 opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-secondary-900 dark:text-white max-w-[200px] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={product.name}>
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-secondary-500 dark:text-secondary-400">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300">
                         {product.category?.name || 'Chưa phân loại'}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-secondary-900 dark:text-white">
                      {formatPrice(product.base_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                       <span className={`inline-flex items-center gap-1.5 ${(product as any)._count?.product_variants > 0 ? 'text-secondary-700 dark:text-secondary-300' : 'text-amber-600 dark:text-amber-400'}`}>
                          {(product as any)._count?.product_variants || 0} phiên bản
                          {(product as any)._count?.product_variants === 0 && <AlertTriangle className="w-3 h-3" />}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                        product.is_active 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400' 
                          : 'bg-secondary-100 text-secondary-700 ring-secondary-600/20 dark:bg-secondary-700/50 dark:text-secondary-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-secondary-500'}`}></span>
                        {product.is_active ? 'Đang bán' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link 
                          to={`/products/${product.slug}`} 
                          target="_blank"
                          className="p-1.5 text-secondary-400 hover:text-indigo-600 dark:text-secondary-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Xem trên web"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/admin/products/${product.id}${listQuery}`}
                          className="p-1.5 text-secondary-400 hover:text-blue-600 dark:text-secondary-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, productId: product.id })}
                          className="p-1.5 text-secondary-400 hover:text-red-600 dark:text-secondary-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                  <td colSpan={7} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-10 h-10 text-secondary-300 dark:text-secondary-600 mb-2" />
                        <p className="font-medium">Không tìm thấy sản phẩm nào</p>
                        <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Modern Pagination */}
        <div className="bg-white dark:bg-secondary-800 px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
             Hiển thị <span className="font-medium text-secondary-900 dark:text-white">{(pagination.page - 1) * pagination.limit + 1}</span> đến <span className="font-medium text-secondary-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong tổng số <span className="font-medium text-secondary-900 dark:text-white">{pagination.total}</span> kết quả
          </p>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
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
    </div>
  );
}
