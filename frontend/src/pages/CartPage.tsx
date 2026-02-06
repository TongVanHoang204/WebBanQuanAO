import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowLeft, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../hooks/useShop';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [discountCode, setDiscountCode] = useState('');

  const handleQuantityChange = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQty);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Không thể cập nhật số lượng';
      toast.error(msg);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await removeItem(itemId);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error: any) {
      toast.error('Không thể xóa sản phẩm');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await clearCart();
      toast.success('Đã xóa toàn bộ giỏ hàng');
    } catch (error) {
      toast.error('Không thể xóa giỏ hàng');
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <div className="w-24 h-24 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-secondary-300 dark:text-secondary-600" />
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Giỏ hàng của bạn đang trống</h1>
        <p className="text-secondary-500 dark:text-secondary-400 mb-8 max-w-md mx-auto">
          Có vẻ như bạn chưa chọn được sản phẩm nào. Hãy khám phá bộ sưu tập mới nhất của chúng tôi ngay!
        </p>
        <Link to="/shop" className="btn btn-primary btn-lg rounded-full px-12">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const shippingFee = cart.subtotal >= 500000 ? 0 : 30000;
  const taxEstimate = Math.round(cart.subtotal * 0.08); 
  const total = cart.subtotal + shippingFee + taxEstimate;

  return (
    <>
      <Helmet>
        <title>Giỏ hàng - Fashion Store</title>
      </Helmet>

      <div className="bg-secondary-50 dark:bg-black/95 min-h-screen py-12">
        <div className="container-custom">
          {/* Breadcrumb-like Home Link */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
            <Link to="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
            <span>›</span>
            <span className="text-secondary-900 dark:text-white font-medium">Giỏ hàng</span>
          </nav>

          <div className="flex justify-between items-end mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Giỏ hàng của bạn</h1>
            <span className="text-secondary-500 dark:text-secondary-400 font-medium">{cart.items.length} loại sản phẩm</span>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-white dark:bg-secondary-900 rounded-2xl p-6 shadow-sm border border-secondary-100 dark:border-secondary-800 flex gap-6 relative transition-all ${
                      updatingItems.has(item.id) ? 'opacity-60 grayscale' : ''
                    }`}
                  >
                    {/* Product Image */}
                    <Link 
                      to={`/products/${item.product?.slug}`} 
                      className="w-24 h-24 sm:w-32 sm:h-32 bg-secondary-50 dark:bg-secondary-800 rounded-xl overflow-hidden flex-shrink-0 border border-secondary-100 dark:border-secondary-700"
                    >
                      <img
                        src={item.product?.image || '/placeholder.jpg'}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col justify-between pt-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <Link 
                            to={`/products/${item.product?.slug}`}
                            className="text-lg font-bold text-secondary-900 dark:text-white hover:text-primary-600 transition-colors line-clamp-1"
                          >
                            {item.product?.name || 'Sản phẩm'}
                          </Link>
                          <span className="text-lg font-bold text-secondary-900 dark:text-white whitespace-nowrap">
                            {formatPrice(item.price)}
                          </span>
                        </div>

                        {/* Options */}
                        {item.options && item.options.length > 0 && (
                          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                            {item.options.map(o => o.value).join(', ')}
                          </p>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {item.qty < item.stock_qty ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-semibold text-green-600">Còn hàng</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-xs font-semibold text-orange-600">Sắp hết hàng</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={updatingItems.has(item.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-secondary-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>

                        {/* Quantity Selector */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center bg-secondary-50 dark:bg-secondary-800 rounded-full border border-secondary-200 dark:border-secondary-700">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.qty, -1)}
                              disabled={item.qty <= 1 || updatingItems.has(item.id)}
                              className="w-8 h-8 flex items-center justify-center dark:text-white hover:text-primary-600 disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.stock_qty}
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 1 && val <= item.stock_qty) {
                                  updateQuantity(item.id, val);
                                }
                              }}
                              className="w-12 bg-transparent text-center text-xs font-bold text-secondary-900 dark:text-white border-0 focus:ring-0 p-0"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.id, item.qty, 1)}
                              disabled={item.qty >= item.stock_qty || updatingItems.has(item.id)}
                              className="w-8 h-8 flex items-center justify-center dark:text-white hover:text-primary-600 disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-medium text-secondary-400">
                            Tổng: {formatPrice(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <div className="pt-4 flex justify-between items-center">
                <Link to="/shop" className="group flex items-center gap-2 text-sm font-bold text-primary-600">
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Tiếp tục mua sắm
                </Link>
                <button 
                  onClick={handleClearCart}
                  className="text-xs font-bold text-secondary-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                >
                  Dọn trống giỏ hàng
                </button>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white dark:bg-secondary-900 rounded-2xl p-8 shadow-sm border border-secondary-100 dark:border-secondary-800 sticky top-24">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-6">Tóm tắt đơn hàng</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500 dark:text-secondary-400">Tạm tính</span>
                    <span className="font-bold text-secondary-900 dark:text-white">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500 dark:text-secondary-400">Phí vận chuyển dự kiến</span>
                    <span className="font-bold text-secondary-900 dark:text-white">
                      {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500 dark:text-secondary-400">Thuế dự kiến (8%)</span>
                    <span className="font-bold text-secondary-900 dark:text-white">{formatPrice(taxEstimate)}</span>
                  </div>
                </div>

                {/* Discount Code */}
                <div className="mb-8">
                  <label className="block text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-3">
                    Mã giảm giá hoặc Thẻ quà tặng
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Nhập mã..." 
                      className="flex-1 bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 rounded-lg px-4 py-2.5 text-sm dark:text-white focus:ring-primary-600 focus:border-primary-600"
                    />
                    <button className="bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-all">
                      Áp dụng
                    </button>
                  </div>
                </div>

                <div className="border-t border-secondary-100 dark:border-secondary-800 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-secondary-900 dark:text-white">Tổng cộng</span>
                    <span className="text-2xl font-black text-secondary-900 dark:text-white">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full btn btn-primary btn-lg rounded-xl h-14 flex items-center justify-center gap-3 font-bold shadow-lg shadow-primary-100 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  <Lock className="w-5 h-5" />
                  Thanh toán 
                </button>

                {/* Trust Badges */}
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-secondary-50 dark:border-secondary-800 pt-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-secondary-300 dark:text-secondary-600" />
                    Bảo mật SSL
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">
                    <RotateCcw className="w-4 h-4 text-secondary-300 dark:text-secondary-600" />
                    Đổi trả miễn phí
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
