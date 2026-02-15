import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, getDiscountPercent } from '../../hooks/useShop';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useState } from 'react';
import { toMediaUrl } from '../../services/api';

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
}

export default function ProductCard({ product, showQuickAdd = true }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isInList = isInWishlist(product.id);

  const primaryImage = product.product_images?.find(img => img.is_primary)?.url 
    || product.product_images?.[0]?.url 
    || '/placeholder.jpg';
  
  const minPrice = product.product_variants?.length 
    ? Math.min(...product.product_variants.map(v => Number(v.price)))
    : Number(product.base_price);
  
  const comparePrice = product.product_variants?.[0]?.compare_at_price 
    || product.compare_at_price;
  
  const discountPercent = getDiscountPercent(minPrice, comparePrice ? Number(comparePrice) : null);
  
  const hasStock = product.product_variants?.some(v => v.stock_qty > 0) ?? true;
  
  const firstVariant = product.product_variants?.[0];

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant || isAdding) return;
    
    setIsAdding(true);
    try {
      await addToCart(Number(firstVariant.id), 1);
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInList) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  return (
    <div 
      className="group card dark:bg-secondary-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.slug}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-secondary-50 dark:bg-secondary-700">
          <img
            src={toMediaUrl(primaryImage)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          
          {/* Discount Badge */}
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 bg-accent-red text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          
          {/* Out of Stock Overlay */}
          {!hasStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-secondary-800 px-4 py-2 rounded-lg font-medium">
                Hết hàng
              </span>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className={`absolute right-3 top-3 flex flex-col gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-colors ${
                isInList ? 'bg-accent-red text-white' : 'bg-white hover:bg-primary-600 hover:text-white dark:bg-secondary-800 dark:text-white dark:hover:bg-white dark:hover:text-black'
              }`}
              onClick={handleToggleWishlist}
            >
              <Heart className={`w-4 h-4 ${isInList ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          {/* Quick Add Button */}
          {showQuickAdd && hasStock && firstVariant && (
            <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-200 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="w-full btn btn-primary py-2.5 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
              </button>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-secondary-500 dark:text-gray-400 mb-1">{product.category.name}</p>
          )}
          
          {/* Name */}
          <h3 className="font-medium text-secondary-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-gray-300 transition-colors line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600 dark:text-white">
              {formatPrice(minPrice)}
            </span>
            {comparePrice && Number(comparePrice) > minPrice && (
              <span className="text-sm text-secondary-400 line-through">
                {formatPrice(Number(comparePrice))}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="mt-2">
              {hasStock ? (
                <span className="text-xs text-accent-green">Còn hàng</span>
              ) : (
                <span className="text-xs text-accent-red">Hết hàng</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
