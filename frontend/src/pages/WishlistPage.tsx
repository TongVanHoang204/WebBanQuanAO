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
import { formatPrice } from '../hooks/useShop';
import { toMediaUrl } from '../services/api';
import { toast } from 'react-hot-toast';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const [isMovingAll, setIsMovingAll] = useState(false);

  const handleMoveAllToCart = async () => {
    if (wishlist.length === 0) return;
    setIsMovingAll(true);
    try {
      for (const item of wishlist) {
        if (item.stock_qty > 0 && item.variant_id) {
          await addToCart(parseInt(item.variant_id), 1);
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
              {wishlist.map((item) => (
                <div key={item.id} className="group bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 relative flex flex-col">
                  {/* Image Container */}
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={toMediaUrl(item.image || '/placeholder.jpg')} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Trash Button */}
                    <button 
                      onClick={() => removeFromWishlist(item.product_id)}
                      className="absolute top-4 right-4 p-2.5 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-sm rounded-full text-secondary-400 hover:text-accent-red hover:scale-110 transition-all shadow-lg z-10"
                      title="Xóa khỏi yêu thích"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Stock Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 shadow-sm ${
                      item.stock_qty > 0 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-rose-500 text-white'
                    }`}>
                      {item.stock_qty > 0 ? `Còn ${item.stock_qty} SP` : 'Hết hàng'}
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-6 flex flex-col flex-1">
                    <Link to={`/products/${item.slug}`} className="block mb-2">
                       <h3 className="text-sm font-bold text-secondary-900 dark:text-white line-clamp-2 hover:text-primary-600 transition-colors">
                          {item.name}
                       </h3>
                    </Link>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-lg font-black text-primary-600 dark:text-primary-400 tracking-tighter">
                        {formatPrice(item.price)}
                      </span>
                      {item.compare_at_price && item.compare_at_price > item.price && (
                        <span className="text-xs text-secondary-400 line-through">
                          {formatPrice(item.compare_at_price)}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-secondary-400 dark:text-secondary-500 mb-6 line-clamp-2 italic leading-relaxed">
                      {item.description || 'Thiết kế cao cấp, chất liệu thoáng mát phù hợp cho phong cách hằng ngày.'}
                    </p>

                    {/* Action Button */}
                    <div className="mt-auto">
                      {item.stock_qty > 0 ? (
                        <button 
                          onClick={() => item.variant_id && addToCart(parseInt(item.variant_id), 1)}
                          className="w-full btn btn-secondary dark:bg-secondary-700 dark:border-secondary-600 rounded-2xl py-3 flex items-center justify-center gap-2 text-xs font-bold hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all group/btn"
                        >
                          <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          Thêm vào giỏ
                        </button>
                      ) : (
                        <button className="w-full btn bg-secondary-50 dark:bg-secondary-900/50 text-secondary-400 dark:text-secondary-600 border-none rounded-2xl py-3 flex items-center justify-center gap-2 text-xs font-bold cursor-not-allowed">
                          <Bell className="w-4 h-4" />
                          Nhận thông báo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recently Viewed Mockup */}
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
             
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="group">
                      <div className="aspect-square rounded-[1.5rem] bg-secondary-100 dark:bg-secondary-800 overflow-hidden mb-3 border border-secondary-50 dark:border-secondary-700">
                         <div className="w-full h-full bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-700 animate-pulse-slow flex items-center justify-center text-secondary-300 dark:text-secondary-600">
                            <ShoppingBag className="w-8 h-8" />
                         </div>
                      </div>
                      <div className="h-3 bg-secondary-100 dark:bg-secondary-800 rounded-full w-3/4 mb-2 animate-pulse-slow"></div>
                      <div className="h-3 bg-secondary-50 dark:bg-secondary-900 rounded-full w-1/2 animate-pulse-slow"></div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
