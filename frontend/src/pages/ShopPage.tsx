import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Filter, X, ChevronDown, Grid3X3, LayoutGrid } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import { useShop } from '../hooks/useShop';
import LoadingScreen from '../components/common/LoadingScreen';
import { Category } from '../types';
import { categoriesAPI } from '../services/api';

import { bannersAPI, toMediaUrl } from '../services/api';
import { Banner } from '../types';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, pagination, fetchProducts, brands, fetchBrands } = useShop();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [banner, setBanner] = useState<Banner | null>(null);

  // Get current filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    categoriesAPI.getAll().then(res => setCategories(res.data.data));
    fetchBrands();

    // Fetch Shop Banner
    bannersAPI.getAll({ position: 'shop_hero' }).then(res => {
        if (res.data.success && res.data.data.length > 0) {
            setBanner(res.data.data[0]);
        }
    }).catch(err => console.error('Failed to fetch shop banner', err));
  }, [fetchBrands]);

  useEffect(() => {
    fetchProducts({
      page: currentPage,
      limit: 12,
      search: currentSearch || undefined,
      category: currentCategory || undefined,
      brand: currentBrand || undefined,
      sort: currentSort,
      min_price: currentMinPrice ? parseFloat(currentMinPrice) : undefined,
      max_price: currentMaxPrice ? parseFloat(currentMaxPrice) : undefined
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

  const hasActiveFilters = currentSearch || currentCategory || currentMinPrice || currentMaxPrice || currentBrand;

  return (
    <>
      <Helmet>
        <title>Cửa hàng - Fashion Store</title>
        <meta name="description" content="Khám phá bộ sưu tập thời trang đa dạng với nhiều mẫu mã và kích cỡ phù hợp." />
      </Helmet>
      
      {/* Shop Banner */}
      {banner && (
        <div className="mb-8 relative group">
          <div className="aspect-[21/9] md:aspect-[4/1] w-full relative overflow-hidden">
            <img 
              src={toMediaUrl(banner.image_url)} 
              alt={banner.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-6">
              <div className="max-w-2xl text-white">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">{banner.title}</h1>
                {banner.subtitle && (
                  <p className="text-lg md:text-xl text-gray-100">{banner.subtitle}</p>
                )}
                 {banner.link_url && (
                    <a 
                      href={banner.link_url} 
                      className="mt-6 inline-block px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-primary-500 hover:text-white transition-all"
                    >
                      {banner.button_text || 'Xem ngay'}
                    </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            {currentCategory 
              ? categories.find(c => c.slug === currentCategory)?.name || 'Sản phẩm'
              : currentSearch 
                ? `Kết quả tìm kiếm: "${currentSearch}"`
                : (banner ? '' : 'Tất cả sản phẩm')}
          </h1>
          {pagination && (
            <p className="text-secondary-500 dark:text-gray-400 mt-2">
              Hiển thị {products.length} / {pagination.total} sản phẩm
            </p>
          )}
        </div>

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
                          : 'hover:bg-secondary-100 dark:text-gray-300 dark:hover:bg-secondary-800'
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
                            : 'hover:bg-secondary-100 dark:text-gray-300 dark:hover:bg-secondary-800'
                        }`}
                      >
                        {category.name}
                      </button>
                      {category.children && category.children.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {category.children.map(child => (
                            <li key={child.id}>
                              <button
                                onClick={() => updateFilter('category', child.slug)}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                  currentCategory === child.slug 
                                    ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' 
                                    : 'text-secondary-600 dark:text-gray-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                                }`}
                              >
                                {child.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>


              {/* Brands */}
              <div>
                <h3 className="font-semibold text-secondary-800 dark:text-white mb-3">Thương hiệu</h3>
                <ul className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  <li>
                    <button
                      onClick={() => updateFilter('brand', '')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        !currentBrand 
                          ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' 
                          : 'hover:bg-secondary-100 dark:text-gray-300 dark:hover:bg-secondary-800'
                      }`}
                    >
                      Tất cả
                    </button>
                  </li>
                  {brands.map(brand => (
                    <li key={brand.id}>
                      <button
                        onClick={() => updateFilter('brand', brand.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          currentBrand === brand.slug 
                            ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' 
                            : 'hover:bg-secondary-100 dark:text-gray-300 dark:hover:bg-secondary-800'
                        }`}
                      >
                        {brand.name}
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
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Dưới 100K', min: '', max: '100000' },
                      { label: '100K - 200K', min: '100000', max: '200000' },
                      { label: '200K - 500K', min: '200000', max: '500000' },
                      { label: 'Trên 500K', min: '500000', max: '' }
                    ].map((range) => (
                      <button
                        key={range.label}
                        onClick={() => {
                          updateFilter('min_price', range.min);
                          updateFilter('max_price', range.max);
                        }}
                        className="text-xs px-3 py-1.5 border dark:border-secondary-700 rounded-full hover:border-primary-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        {range.label}
                      </button>
                    ))}
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
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
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
                {currentBrand && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-full text-sm dark:text-white">
                    {brands.find(b => b.slug === currentBrand)?.name || currentBrand}
                    <button onClick={() => updateFilter('brand', '')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <LoadingScreen fullScreen={false} />
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-secondary-500 dark:text-secondary-400 mb-4">Không tìm thấy sản phẩm nào</p>
                <button onClick={clearFilters} className="btn btn-primary">
                  Xóa bộ lọc
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

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-secondary-900 p-6 overflow-y-auto animate-slide-down">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold dark:text-white">Bộ lọc</h2>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Same filter content as desktop sidebar */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-secondary-800 mb-3">Danh mục</h3>
                <ul className="space-y-2">
                  {categories.map(category => (
                    <li key={category.id}>
                      <button
                        onClick={() => {
                          updateFilter('category', category.slug);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          currentCategory === category.slug ? 'bg-primary-100 text-primary-700' : 'hover:bg-secondary-100'
                        }`}
                      >
                        {category.name}
                      </button>
                      {category.children && category.children.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {category.children.map(child => (
                            <li key={child.id}>
                              <button
                                onClick={() => {
                                  updateFilter('category', child.slug);
                                  setIsSidebarOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                  currentCategory === child.slug 
                                    ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' 
                                    : 'text-secondary-600 dark:text-gray-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                                }`}
                              >
                                {child.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile Brands */}
              <div>
                <h3 className="font-semibold text-secondary-800 dark:text-white mb-3">Thương hiệu</h3>
                <ul className="space-y-2">
                  <li key="all-brands">
                      <button
                        onClick={() => {
                          updateFilter('brand', '');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          !currentBrand ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' : 'hover:bg-secondary-100 dark:text-gray-400 dark:hover:bg-secondary-800'
                        }`}
                      >
                        Tất cả
                      </button>
                    </li>
                  {brands.map(brand => (
                    <li key={brand.id}>
                      <button
                        onClick={() => {
                          updateFilter('brand', brand.slug);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          currentBrand === brand.slug ? 'bg-primary-100 text-primary-700 dark:bg-white dark:text-black' : 'hover:bg-secondary-100 dark:text-gray-400 dark:hover:bg-secondary-800'
                        }`}
                      >
                        {brand.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
