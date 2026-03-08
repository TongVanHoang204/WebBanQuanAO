import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { 
  Heart, 
  Trash2, 
  ShoppingCart, 
  ChevronRight, 
  Bell, 
  Eye,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { formatPrice } from '../hooks/useShop';
import { toast } from 'react-hot-toast';
import { Product } from '../types';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const [isMovingAll, setIsMovingAll] = useState(false);
  const { recentProducts, getProductProps } = useRecentlyViewed();
  const recentlyViewedProducts = getProductProps();

  const handleMoveAllToCart = async () => {
    if (wishlist.length === 0) return;
    setIsMovingAll(true);
    try {
      for (const item of wishlist) {
        const firstVariant = item.product_variants?.[0];
        if (firstVariant && firstVariant.stock_qty > 0) {
          await addToCart(parseInt(firstVariant.id), 1);
        }
      }
      toast.success('Đã chuyển tất cả sản phẩm còn hàng vào giỏ hàng');
    } catch (error) {
      toast.error('Có lỗi khi chuyển sản phẩm vào giỏ hàng');
    } finally {
      setIsMovingAll(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
       </div>
     );
  }

  return (
    <>
      <Helmet>
        <title>Sản phẩm yêu thích - Fashion Store</title>
      </Helmet>

      <div className="bg-secondary-50 dark:bg-secondary-900 min-h-screen py-8 md:py-12 transition-colors duration-300 font-inter">
        <div className="container-custom max-w-7xl">
          {/* Breadcrumbs */}
          <nav className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary-400 dark:text-secondary-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-secondary-900 dark:text-white">Sản phẩm yêu thích</span>
          </nav>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-secondary-900 dark:text-white uppercase italic tracking-tighter mb-2">Danh sách yêu thích</h1>
              <p className="text-secondary-500 dark:text-secondary-400 font-medium">
                Bạn đang có <span className="text-primary-600 dark:text-primary-400 font-bold">{wishlist.length} sản phẩm</span> được lưu lại.
              </p>
            </div>
            
            {wishlist.length > 0 && (
              <button 
                onClick={handleMoveAllToCart}
                disabled={isMovingAll}
                className="btn btn-primary rounded-full px-8 py-4 flex items-center gap-2 shadow-lg shadow-primary-100 dark:shadow-none hover:scale-105 transition-transform disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                {isMovingAll ? 'Đang chuyển...' : 'Chuyển tất cả vào giỏ'}
              </button>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-[2.5rem] py-24 text-center shadow-sm">
              <div className="w-20 h-20 bg-secondary-50 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary-200 dark:text-secondary-700">
                <Heart className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">Chưa có sản phẩm nào</h2>
              <p className="text-secondary-500 dark:text-secondary-400 mb-8 max-w-sm mx-auto">
                Hãy dạo quanh cửa hàng và chọn những món đồ bạn yêu thích nhất nhé!
              </p>
              <Link to="/shop" className="btn btn-primary rounded-full px-12">Khám phá ngay</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {wishlist.map((item) => {
                // Map WishlistItem (backend shape) directly to Product for ProductCard
                const productProp: Product = {
                  id: item.id,
                  category_id: null,
                  sku: '',
                  name: item.name,
                  slug: item.slug,
                  description: item.description,
                  base_price: item.base_price,
                  compare_at_price: item.compare_at_price,
                  is_active: true,
                  created_at: item.added_at,
                  updated_at: null,
                  product_images: item.product_images?.map(img => ({
                    id: img.id?.toString() || '',
                    product_id: img.product_id?.toString() || item.id,
                    url: img.url,
                    alt_text: img.alt_text,
                    is_primary: img.is_primary,
                    sort_order: img.sort_order
                  })) || [],
                  product_variants: item.product_variants?.map(v => ({
                    id: v.id?.toString() || '',
                    product_id: item.id,
                    variant_sku: '',
                    price: Number(v.price),
                    compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
                    cost: null,
                    stock_qty: v.stock_qty,
                    is_active: true
                  })) || []
                };

                return (
                  <div key={item.wishlist_item_id} className="relative">
                    <ProductCard product={productProp} />
                    
                    {/* Overlay Trash Button */}
                    <button 
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-sm rounded-full text-secondary-400 hover:text-accent-red hover:scale-110 transition-all shadow-md z-20"
                      title="Xóa khỏi yêu thích"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recently Viewed */}
          <div className="pt-12 border-t border-secondary-100 dark:border-secondary-800 mb-20">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                   <Eye className="w-5 h-5 text-primary-600" />
                   Sản phẩm đã xem gần đây
                </h2>
                <Link to="/shop" className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline uppercase tracking-widest">
                   Xem tất cả
                   <ArrowRight className="w-3 h-3" />
                </Link>
             </div>
             
             {recentlyViewedProducts.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {recentlyViewedProducts.slice(0, 6).map((p) => (
                     <ProductCard key={p.id} product={p} showQuickAdd={false} />
                  ))}
               </div>
             ) : (
               <div className="text-center py-12 bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-100 dark:border-secondary-700">
                 <ShoppingBag className="w-10 h-10 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                 <p className="text-sm text-secondary-400 dark:text-secondary-500">
                   Hãy duyệt qua vài sản phẩm để xem lại ở đây.
                 </p>
               </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
}
