import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import LoadingScreen from '../components/common/LoadingScreen';
import { 
  Minus, 
  Plus, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Check, 
  Loader2, 
  Truck, 
  Shield, 
  RefreshCw, 
  Star,
  ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageGallery from '../components/common/ImageGallery';
import ReviewsSection from '../components/common/ReviewsSection';
import VariantSelector from '../components/common/VariantSelector';
import ProductCard from '../components/common/ProductCard';
import { Product, ProductVariant } from '../types';
import { productsAPI } from '../services/api';
import { formatPrice, getDiscountPercent } from '../hooks/useShop';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { toMediaUrl } from '../services/api';


export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'shipping'>('details');

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const response = await productsAPI.getBySlug(slug);
        const productData = response.data.data;
        setProduct(productData);
        
        // Load related products
        if (productData.category) {
          const relatedRes = await productsAPI.getAll({
            category: productData.category.slug,
            limit: 4
          });
          setRelatedProducts(
            relatedRes.data.data.products.filter((p: Product) => p.id !== productData.id)
          );
        }

        // Auto-select if only 1 variant (Simple Product)
        if (productData.product_variants?.length === 1) {
          setSelectedVariant(productData.product_variants[0]);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleAddToCart = async () => {
    // Check authentication
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập hoặc đăng ký để mua hàng');
      navigate('/login');
      return;
    }

    // Validate variant selection
    if (!selectedVariant) {
      toast.error('Vui lòng chọn phân loại sản phẩm (Màu sắc / Kích thước)');
      // Optional: Scroll to variant selector or highlight it
      return;
    }
    
    setIsAddingToCart(true);
    try {
      await addToCart(Number(selectedVariant.id), quantity);
      setAddedToCart(true);
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Không thể thêm vào giỏ hàng';
      toast.error(msg);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && (!selectedVariant || newQty <= selectedVariant.stock_qty)) {
      setQuantity(newQty);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    const productId = product.id.toString();
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: product.description?.replace(/<[^>]*>/g, '').slice(0, 100),
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết vào bộ nhớ tạm');
      } catch (err) {
        toast.error('Không thể sao chép liên kết');
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary-800 mb-4">Sản phẩm không tồn tại</h1>
        <Link to="/shop" className="btn btn-primary rounded-full">Quay lại cửa hàng</Link>
      </div>
    );
  }

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.base_price);
  const comparePrice = selectedVariant?.compare_at_price 
    ? Number(selectedVariant.compare_at_price) 
    : product.compare_at_price 
      ? Number(product.compare_at_price) 
      : null;
  const discountPercent = getDiscountPercent(currentPrice, comparePrice);
  const isOutOfStock = selectedVariant 
    ? selectedVariant.stock_qty <= 0 
    : product.product_variants?.every(v => v.stock_qty <= 0);

  return (
    <>
      <SEO 
        title={product.name} 
        description={product.description?.replace(/<[^>]*>/g, '').slice(0, 160) || product.name}
        image={toMediaUrl(product.product_images?.[0]?.url)}
        url={`/products/${product.slug}`}
        type="product"
      />

      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center gap-2 text-secondary-500 dark:text-secondary-400">
            <li><Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">Trang chủ</Link></li>
            <li>/</li>
            <li><Link to="/shop" className="hover:text-primary-600 dark:hover:text-primary-400">Cửa hàng</Link></li>
            {product.category && (
              <>
                <li>/</li>
                <li>
                  <Link to={`/shop?category=${product.category.slug}`} className="hover:text-primary-600 dark:hover:text-primary-400 uppercase tracking-tighter">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-secondary-900 dark:text-white font-medium truncate max-w-[200px]">{product.name}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <ImageGallery 
                images={product.product_images || []} 
                productName={product.name} 
              />
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              {/* Rating & Sold */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-secondary-900 underline underline-offset-4 decoration-primary-500 decoration-2">
                    {product.rating_avg || 5.0}
                  </span>
                  <div className="flex text-yellow-400">
                     {[1, 2, 3, 4, 5].map((s) => (
                       <Star 
                        key={s} 
                        className={`w-4 h-4 ${s <= Math.round(product.rating_avg || 5) ? 'fill-current' : 'text-gray-300'}`} 
                       />
                     ))}
                  </div>
                </div>
                
                <div className="w-px h-4 bg-secondary-300 dark:bg-secondary-700"></div>

                <div className="text-secondary-600 dark:text-secondary-400">
                  <span className="font-bold text-secondary-900 dark:text-white underline underline-offset-4 decoration-secondary-300 dark:decoration-secondary-600 decoration-2">
                    {product.rating_count || 0}
                  </span> đánh giá
                </div>

                <div className="w-px h-4 bg-secondary-300 dark:bg-secondary-700"></div>

                <div className="text-secondary-600 dark:text-secondary-400">
                  <span className="font-bold text-secondary-900 dark:text-white">
                    {product.sold_count ? (product.sold_count > 1000 ? `${(product.sold_count / 1000).toFixed(1)}k` : product.sold_count) : 0}
                  </span> đã bán
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-extrabold text-secondary-900 dark:text-white">
                  {formatPrice(currentPrice)}
                </span>
                {comparePrice && comparePrice > currentPrice && (
                  <>
                    <span className="text-xl text-secondary-400 line-through">
                      {formatPrice(comparePrice)}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded uppercase">
                      Giảm {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* Short Description */}
              <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                {product.description?.replace(/<[^>]*>/g, '').slice(0, 200)}...
              </p>
            </div>

            {/* Variant Selectors */}
            <div>
              {product.product_variants && product.product_variants.length > 0 && (
                <VariantSelector
                  variants={product.product_variants}
                  selectedVariant={selectedVariant}
                  onVariantSelect={setSelectedVariant}
                />
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className={isOutOfStock ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
              </span>
            </div>

            {/* Actions: Qty + Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
              <div className="flex items-center border border-secondary-200 dark:border-secondary-700 rounded-full bg-secondary-50 dark:bg-secondary-800 px-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-12 flex items-center justify-center hover:text-primary-600 disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-secondary-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={selectedVariant ? quantity >= selectedVariant.stock_qty : undefined}
                  className="w-10 h-12 flex items-center justify-center hover:text-primary-600 disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className={`flex-1 min-h-[48px] btn btn-primary rounded-full flex items-center justify-center gap-3 font-bold transition-all ${
                  addedToCart ? 'bg-accent-green border-accent-green hover:bg-accent-green grayscale-0' : ''
                } disabled:opacity-50 disabled:grayscale`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Đã thêm vào giỏ
                  </>
                ) : isAddingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Thêm vào giỏ hàng
                  </>
                )}
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2">
              <button 
                onClick={handleToggleWishlist}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                  isInWishlist(product.id.toString()) ? 'text-primary-600' : 'text-secondary-600 dark:text-secondary-400 hover:text-primary-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id.toString()) ? 'fill-current' : ''}`} />
                {isInWishlist(product.id.toString()) ? 'Đã thêm vào yêu thích' : 'Thêm vào danh sách yêu thích'}
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-semibold text-secondary-600 dark:text-secondary-400 hover:text-primary-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Chia sẻ
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 border-t border-secondary-100 dark:border-secondary-800 space-y-4">
              <div className="flex items-center gap-4 text-sm text-secondary-700 dark:text-secondary-300">
                <Truck className="w-5 h-5 text-primary-600" />
                <span>Miễn phí giao hàng cho đơn từ 500k</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-secondary-700 dark:text-secondary-300">
                <Shield className="w-5 h-5 text-primary-600" />
                <span>Bảo hành chính hãng 2 năm</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-secondary-700 dark:text-secondary-300">
                <RefreshCw className="w-5 h-5 text-primary-600" />
                <span>7 ngày đổi trả miễn phí</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div className="mt-20">
          <div className="flex border-b border-secondary-200 dark:border-secondary-800 mb-8 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-6 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === 'details' ? 'text-primary-600' : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
              }`}
            >
              Chi tiết sản phẩm
              {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600" />}
            </button>
            <button 
              onClick={() => setActiveTab('specs')}
              className={`pb-4 px-6 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === 'specs' ? 'text-primary-600' : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
              }`}
            >
              Thông số kỹ thuật
              {activeTab === 'specs' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600" />}
            </button>
            <button 
              onClick={() => setActiveTab('shipping')}
              className={`pb-4 px-6 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === 'shipping' ? 'text-primary-600' : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
              }`}
            >
              Giao hàng & Đổi trả
              {activeTab === 'shipping' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600" />}
            </button>
          </div>

          <div className="max-w-4xl">
             {activeTab === 'details' && (
                <div className="animate-fade-in space-y-6">
                  <div 
                    className="prose prose-secondary dark:prose-invert max-w-none text-secondary-600 dark:text-secondary-400 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description || '' }}
                  />
                </div>
             )}
             {activeTab === 'specs' && (
                <div className="animate-fade-in space-y-4">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                      <tr>
                        <th className="py-3 font-semibold text-secondary-900 dark:text-white w-1/3">Mã sản phẩm</th>
                        <td className="py-3 text-secondary-600 dark:text-secondary-400">{product.sku}</td>
                      </tr>
                      <tr>
                        <th className="py-3 font-semibold text-secondary-900 dark:text-white">Thương hiệu</th>
                        <td className="py-3 text-secondary-600 dark:text-secondary-400">Fashion Store</td>
                      </tr>
                      <tr>
                        <th className="py-3 font-semibold text-secondary-900 dark:text-white">Danh mục</th>
                        <td className="py-3 text-secondary-600 dark:text-secondary-400">{product.category?.name}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
             )}
             {activeTab === 'shipping' && (
                <div className="animate-fade-in text-secondary-600 dark:text-secondary-400 space-y-4 leading-relaxed text-sm">
                  <p>Chúng tôi cung cấp dịch vụ giao hàng toàn quốc nhanh chóng và tin cậy.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Miễn phí vận chuyển cho đơn hàng trên 500,000đ.</li>
                    <li>Thời gian giao hàng: 2-3 ngày làm việc trong nội thành, 3-5 ngày khu vực khác.</li>
                    <li>Đổi trả miễn phí trong vòng 7 ngày nếu phát hiện lỗi nhà sản xuất hoặc không vừa ý.</li>
                  </ul>
                </div>
             )}
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection productId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-secondary-100 dark:border-secondary-800">
            <div className="flex justify-between items-end mb-10">
              <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">Có thể bạn cũng thích</h2>
              <Link to="/shop" className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
