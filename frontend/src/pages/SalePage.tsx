import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Filter, X, ChevronDown, Grid3X3, LayoutGrid, Tag } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import { useShop } from '../hooks/useShop';
import { Category } from '../types';
import { categoriesAPI } from '../services/api';

import { bannersAPI, toMediaUrl } from '../services/api';
import { Banner } from '../types';

export default function SalePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, isLoading, pagination, fetchProducts } = useShop();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [banner, setBanner] = useState<Banner | null>(null);

  // Get current filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || 'discount_desc';
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    categoriesAPI.getAll().then(res => setCategories(res.data.data));
    
    // Fetch Sale Banner
    bannersAPI.getAll({ position: 'sale_hero' }).then(res => {
        if (res.data.success && res.data.data.length > 0) {
            setBanner(res.data.data[0]);
        }
    }).catch(err => console.error('Failed to fetch sale banner', err));
  }, []);

  useEffect(() => {
    fetchProducts({
      page: currentPage,
      limit: 12,
      search: currentSearch || undefined,
      category: currentCategory || undefined,
      sort: currentSort,
      min_price: currentMinPrice ? parseFloat(currentMinPrice) : undefined,
      max_price: currentMaxPrice ? parseFloat(currentMaxPrice) : undefined,
      on_sale: true, // Force on_sale filter
      min_discount: 30 // Force 30% discount filter
    });
  }, [searchParams, fetchProducts]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.delete('page'); // Reset page when filter changes
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = currentSearch || currentCategory || currentMinPrice || currentMaxPrice;

  return (
    <>
      <Helmet>
        <title>Săn Sale Giá Sốc - Fashion Store</title>
        <meta name="description" content="Khám phá các sản phẩm giảm giá cực sốc tại Fashion Store. Cơ hội sở hữu hàng hiệu với giá tốt nhất." />
      </Helmet>

      {/* Sale Banner - Dynamic or Fallback */}
      {banner ? (
        <div className="mb-8 relative group">
          <div className="aspect-[21/9] md:aspect-[3/1] w-full relative overflow-hidden">
            <a href={banner.link_url || '#'}>
                <img 
                src={toMediaUrl(banner.image_url)} 
                alt={banner.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16 mb-8 relative overflow-hidden shadow-lg">
            {/* Abstract Pattern Background */}
            <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-yellow-300 blur-3xl mix-blend-overlay animate-pulse"></div>
            </div>
            
            <div className="container-custom text-center relative z-10">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 flex items-center justify-center gap-4 animate-fade-in-up">
                    <Tag className="w-12 h-12 md:w-16 md:h-16 rotate-12" />
                    <span className="drop-shadow-md">Săn Sale Giá Sốc</span>
                </h1>
                <p className="text-red-100 text-xl md:text-2xl max-w-2xl mx-auto drop-shadow-sm">
                    Giảm giá lên đến <span className="font-bold text-yellow-300">50%</span> cho các sản phẩm hot nhất mùa này!
                </p>
            </div>
        </div>
      )}

      <div className="container-custom py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-secondary-800 dark:text-white mb-3">Danh mục</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => updateFilter('category', '')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        !currentCategory 
                          ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' 
                          : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 dark:text-gray-300'
                      }`}
                    >
                      Tất cả
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category.id}>
                      <button
                        onClick={() => updateFilter('category', category.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          currentCategory === category.slug 
                            ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' 
                            : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 dark:text-gray-300'
                        }`}
                      >
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold text-secondary-800 dark:text-white mb-3">Khoảng giá</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={currentMinPrice}
                      onChange={(e) => updateFilter('min_price', e.target.value)}
                      className="input text-sm dark:bg-secondary-800 dark:border-secondary-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Đến"
                      value={currentMaxPrice}
                      onChange={(e) => updateFilter('max_price', e.target.value)}
                      className="input text-sm dark:bg-secondary-800 dark:border-secondary-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full btn btn-secondary"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b dark:border-secondary-800">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg dark:border-secondary-700 dark:text-white"
              >
                <Filter className="w-4 h-4" />
                Lọc
              </button>

              {/* Sort */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <select
                    value={currentSort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="appearance-none bg-white dark:bg-secondary-800 border dark:border-secondary-700 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  >
                    <option value="discount_desc">Giảm giá nhiều nhất</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                    <option value="name_asc">Tên A-Z</option>
                    <option value="name_desc">Tên Z-A</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 dark:text-secondary-500 pointer-events-none" />
                </div>

                {/* Grid Toggle */}
                <div className="hidden md:flex items-center gap-1 border dark:border-secondary-700 rounded-lg p-1">
                  <button
                    onClick={() => setGridCols(3)}
                    className={`p-1.5 rounded transition-colors ${
                       gridCols === 3 
                       ? 'bg-secondary-100 dark:bg-secondary-700 dark:text-white' 
                       : 'hover:bg-secondary-50 dark:hover:bg-secondary-800 dark:text-secondary-400'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`p-1.5 rounded transition-colors ${
                       gridCols === 4 
                       ? 'bg-secondary-100 dark:bg-secondary-700 dark:text-white' 
                       : 'hover:bg-secondary-50 dark:hover:bg-secondary-800 dark:text-secondary-400'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {currentSearch && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-full text-sm dark:text-white">
                    Tìm: {currentSearch}
                    <button onClick={() => updateFilter('search', '')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {currentCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-full text-sm dark:text-white">
                    {categories.find(c => c.slug === currentCategory)?.name}
                    <button onClick={() => updateFilter('category', '')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className={`grid grid-cols-2 md:grid-cols-${gridCols} gap-4 md:gap-6`}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="card animate-pulse dark:bg-secondary-800">
                    <div className="aspect-square bg-secondary-200 dark:bg-secondary-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
                      <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-secondary-500 dark:text-secondary-400 mb-4">
                  Không có sản phẩm nào đang giảm giá
                </p>
                <button onClick={() => navigate('/shop')} className="btn btn-primary">
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${gridCols} gap-4 md:gap-6`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => updateFilter('page', page.toString())}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
