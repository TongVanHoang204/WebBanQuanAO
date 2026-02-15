import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, Check, CreditCard, Truck, MapPin, Building2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, ordersAPI, paymentAPI, couponsAPI, settingsAPI, toMediaUrl } from '../services/api';
import { formatPrice } from '../hooks/useShop';
import AddressSelector from '../components/common/AddressSelector';

export default function CheckoutPage() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState({
     payment_cod_enabled: 'true',
     payment_bank_enabled: 'false',
     payment_bank_info: '',
     payment_bank_id: '',
     payment_bank_account: '',
     payment_bank_account_name: '',
     payment_momo_enabled: 'false',
     payment_momo_qrcode: '',
     payment_vnpay_enabled: 'false',
     payment_vnpay_tmn_code: '',
  });

  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    customer_name: user?.full_name || '',
    email: user?.email || '',
    customer_phone: user?.phone || '',
    ship_address_line1: '',
    ship_address_line2: '',
    ship_city: '',
    ship_province: '',
    ship_postal_code: '',
    note: '',
    payment_method: 'cod',
    coupon_code: ''
  });

  // Fetch addresses and settings on mount
  useEffect(() => {
     // Fetch Settings
     settingsAPI.getPublic().then(res => {
         if (res.data.success) {
            const settings = res.data.data;
            setPaymentSettings(settings);

             // Set default payment method if COD is disabled
            if (settings.payment_cod_enabled !== 'true' && formData.payment_method === 'cod') {
               if (settings.payment_vnpay_enabled === 'true') {
                  setFormData(prev => ({ ...prev, payment_method: 'vnpay' }));
               } else if (settings.payment_bank_enabled === 'true') {
                  setFormData(prev => ({ ...prev, payment_method: 'bank_transfer' }));
               } else if (settings.payment_momo_enabled === 'true') {
                  setFormData(prev => ({ ...prev, payment_method: 'momo' }));
               }
            }
         }
     }).catch(console.error);

     if (user) {
        authAPI.getAddresses().then(res => {
           if (res.data.success) {
              setAddresses(res.data.data);
              const defaultAddr = res.data.data.find((a: any) => a.is_default);
              if (defaultAddr && !formData.ship_address_line1) {
                 handleSelectAddress(defaultAddr);
              }
           }
        }).catch(err => console.error("Failed to load addresses", err));
     }
  }, [user]);

  const handleSelectAddress = (addr: any) => {
     setFormData(prev => ({
        ...prev,
        customer_name: addr.full_name || prev.customer_name,
        customer_phone: addr.phone || prev.customer_phone,
        ship_address_line1: addr.address_line1 || prev.ship_address_line1,
        ship_city: addr.city || prev.ship_city,
        ship_province: addr.province || prev.ship_province
     }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async () => {
    if (!formData.coupon_code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await couponsAPI.apply(formData.coupon_code, cart!.subtotal);
      const { discount_amount } = response.data.data;
      setDiscountAmount(discount_amount);
      toast.success(`Đã áp dụng mã giảm giá: -${formatPrice(discount_amount)}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mã giảm giá không hợp lệ';
      setDiscountAmount(0);
      toast.error(msg);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setError('');
    
    // Validate Form
    if (!formData.customer_phone || formData.customer_phone.length < 10) {
        toast.error('Vui lòng nhập số điện thoại hợp lệ');
        isSubmittingRef.current = false;
        return;
    }
    if (!formData.ship_province || !formData.ship_city || !formData.ship_address_line1) {
        toast.error('Vui lòng điền đầy đủ thông tin địa chỉ giao hàng');
        isSubmittingRef.current = false;
        return;
    }

    setIsLoading(true);

    let orderResponse;

    try {
      // 1. Create Order
      const response = await ordersAPI.checkout(formData);
      orderResponse = response.data.data;
      
      // 2. Handle Payment (if applicable)
      if (formData.payment_method === 'vnpay') {
        try {
           const paymentRes = await paymentAPI.createUrl(orderResponse.id);
           if (paymentRes.data.success) {
             window.location.href = paymentRes.data.data.url;
             return;
           }
        } catch (payErr: any) {
           console.error("Payment Gateway Error:", payErr);
           const payMsg = payErr.response?.data?.error?.message || 'Không thể khởi tạo cổng thanh toán VNPay.';
           toast.error(`${payMsg}. Vui lòng thanh toán lại trong chi tiết đơn hàng.`);
           // Don't return, proceed to success page so user isn't stuck
        }
      }

      // 3. Cleanup and Navigate
      const shouldClearCart = formData.payment_method === 'cod' || formData.payment_method === 'vnpay';
      if (shouldClearCart) {
        await refreshCart();
      }
      const needsPayment = ['bank_transfer', 'momo'].includes(formData.payment_method);
      if (needsPayment) {
          toast('Vui lòng hoàn tất thanh toán trong 5 phút!', { icon: '⏰' });
          navigate(`/checkout/payment/${orderResponse.id}`);
      } else {
          toast.success('Đặt hàng thành công!');
          navigate(`/order-success/${orderResponse.order_code}`);
      }
    } catch (err: any) {
      // Only handle checkout errors here
      const msg = err.response?.data?.error?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      setError(msg);
      toast.error(msg);
      isSubmittingRef.current = false; // Reset on checkout error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  if (!cart || cart.items.length === 0) {
     return null;
  }

  const shippingFee = cart.subtotal >= 500000 ? 0 : 30000;
  const total = cart.subtotal + shippingFee - discountAmount;

  // Check if current user is a staff member (admin, manager, staff)
  const isStaffRole = user && ['admin', 'manager', 'staff'].includes(user.role || '');

  return (
    <>
      <Helmet>
        <title>Thanh toán - Fashion Store</title>
      </Helmet>

      <div className="container-custom py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white mb-8">Thanh toán</h1>

        {/* Staff Role Warning */}
        {isStaffRole && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">Không thể đặt hàng</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                Tài khoản nhân viên ({user?.role}) không được phép đặt hàng. Vui lòng đăng xuất và sử dụng tài khoản khách hàng để mua sắm.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Info */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-secondary-800 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    Thông tin giao hàng
                  </h2>
                  
                  {/* Saved Addresses */}
                  {addresses.length > 0 && (
                     <div className="mb-6">
                        <label className="text-sm font-semibold text-secondary-600 dark:text-secondary-300 mb-3 block">Chọn từ sổ địa chỉ</label>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                           <button
                              type="button"
                              onClick={() => {
                                 setFormData(prev => ({
                                    ...prev,
                                    customer_name: '',
                                    customer_phone: '',
                                    ship_address_line1: '',
                                    ship_city: '',
                                    ship_province: ''
                                 }));
                              }}
                              className={`flex-shrink-0 w-40 p-4 rounded-2xl border-2 border-dashed border-secondary-300 dark:border-secondary-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex flex-col items-center justify-center gap-2 text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400`}
                           >
                              <div className="w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                              </div>
                              <span className="text-xs font-bold">Địa chỉ mới</span>
                           </button>

                           {addresses.map(addr => {
                              const isSelected = 
                                 formData.ship_address_line1 === addr.address_line1 && 
                                 formData.customer_phone === addr.phone;
                              
                              return (
                                 <button
                                    key={addr.id}
                                    type="button"
                                    onClick={() => handleSelectAddress(addr)}
                                    className={`relative flex-shrink-0 w-64 p-4 rounded-2xl border-2 text-left transition-all ${
                                       isSelected 
                                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500 shadow-sm' 
                                          : 'border-secondary-100 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-500 bg-white dark:bg-secondary-800'
                                    }`}
                                 >
                                    {isSelected && (
                                       <div className="absolute top-3 right-3 text-primary-600 dark:text-primary-400">
                                          <Check className="w-4 h-4" />
                                       </div>
                                    )}
                                    <div className="flex items-center gap-2 mb-2">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                          addr.type === 'Nhà riêng' 
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                       }`}>
                                          {addr.type}
                                       </span>
                                       {addr.is_default && <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold">Mặc định</span>}
                                    </div>
                                    <p className="font-bold text-secondary-900 dark:text-white text-sm truncate">{addr.full_name}</p>
                                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">{addr.phone}</p>
                                    <p className="text-xs text-secondary-600 dark:text-secondary-300 line-clamp-2">
                                       {addr.address_line1}, {addr.city}, {addr.province}
                                    </p>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 pl-2">Họ tên *</label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 pl-2">Email (để nhận đơn hàng)</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input"
                      placeholder="example@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 pl-2">Số điện thoại *</label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*$/.test(val)) {
                              handleChange(e);
                          }
                      }}
                      className="input"
                      placeholder="0900xxxxxx"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 pl-2">Địa chỉ *</label>
                    <input
                      type="text"
                      name="ship_address_line1"
                      value={formData.ship_address_line1}
                      onChange={handleChange}
                      className="input"
                      placeholder="Số nhà, tên đường"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <AddressSelector 
                        province={formData.ship_province}
                        district={formData.ship_city}
                        specificAddress={formData.ship_address_line1}
                        onChange={(data) => {
                            setFormData(prev => ({
                                ...prev,
                                ship_province: data.province,
                                ship_city: data.district,
                                // Optionally append ward to address line 1 if you want to save it there, 
                                // but for now let's keep line 1 as street info.
                            }));
                        }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 pl-2">Ghi chú</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      className="input !rounded-2xl px-4 py-3"
                      rows={3}
                      placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  Phương thức thanh toán
                </h2>
                
                <div className="space-y-3">
                  {/* COD */}
                  {paymentSettings.payment_cod_enabled === 'true' && (
                      <label className={`flex flex-col gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.payment_method === 'cod'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:border-secondary-300 dark:border-secondary-700 dark:hover:border-secondary-500'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="payment_method"
                            value="cod"
                            checked={formData.payment_method === 'cod'}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600"
                          />
                          <Truck className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                          <span className="font-medium text-secondary-900 dark:text-white">Thanh toán khi nhận hàng (Ship COD)</span>
                        </div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 ml-8">
                          Quý khách sẽ thanh toán tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được gói hàng.
                        </p>
                      </label>
                  )}

                  {/* VNPay */}
                  {paymentSettings.payment_vnpay_enabled === 'true' && (
                    <label className={`flex flex-col gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.payment_method === 'vnpay'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:border-secondary-300 dark:border-secondary-700 dark:hover:border-secondary-500'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="payment_method"
                          value="vnpay"
                          checked={formData.payment_method === 'vnpay'}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600"
                        />
                        <CreditCard className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                        <span className="font-medium text-secondary-900 dark:text-white">Thanh toán VNPay (ATM / QR / Credit)</span>
                      </div>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 ml-8">
                        Thanh toán an toàn qua cổng VNPay bằng thẻ ATM, tài khoản ngân hàng hoặc thẻ tín dụng.
                      </p>
                    </label>
                  )}

                   {/* Bank Transfer */}
                   {paymentSettings.payment_bank_enabled === 'true' && (
                     <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.payment_method === 'bank_transfer'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:border-secondary-300 dark:border-secondary-700 dark:hover:border-secondary-500'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <input
                            type="radio"
                            name="payment_method"
                            value="bank_transfer"
                            checked={formData.payment_method === 'bank_transfer'}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600"
                            />
                            <Building2 className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                            <span className="font-medium text-secondary-900 dark:text-white">Chuyển khoản ngân hàng (VietQR)</span>
                        </div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 ml-8">
                          Quét mã VietQR để thanh toán nhanh chóng. Đơn hàng sẽ được xác nhận tự động.
                        </p>
                      </div>
                    </label>
                   )}

                  {/* MoMo */}
                  {paymentSettings.payment_momo_enabled === 'true' && (
                    <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.payment_method === 'momo'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:border-secondary-300 dark:border-secondary-700 dark:hover:border-secondary-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="momo"
                        checked={formData.payment_method === 'momo'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600"
                      />
                      <CreditCard className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                      <span className="font-medium text-secondary-900 dark:text-white">Ví MoMo</span>
                    </label>
                  )}
                </div>
              </div>


            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">Đơn hàng của bạn</h2>
                
                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={toMediaUrl(item.product.image || '/placeholder.jpg')}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-secondary-900 dark:text-white">{item.product.name}</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          {item.options.map(o => o.value).join(' / ')} × {item.qty}
                        </p>
                        <p className="text-sm font-semibold text-primary-600">
                          {formatPrice(item.line_total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

          
                <hr className="my-4" />

                {/* Coupon Input */}
                <div className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="coupon_code"
                            value={formData.coupon_code}
                            onChange={handleChange}
                            className="input flex-1 text-sm py-2"
                            placeholder="Mã giảm giá"
                        />
                        <button 
                            type="button" 
                            className="btn btn-secondary rounded-lg px-4 py-2 text-sm whitespace-nowrap"
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon || !formData.coupon_code}
                        >
                            {isApplyingCoupon ? '...' : 'Áp dụng'}
                        </button>
                    </div>
                </div>

                <hr className="my-4" />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Tạm tính</span>
                    <span className="text-secondary-900 dark:text-white">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Phí vận chuyển</span>
                    <span className="text-secondary-900 dark:text-white">{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-accent-green">
                      <span>Giảm giá</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>

                <hr className="my-4 border-secondary-200 dark:border-secondary-700" />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-secondary-900 dark:text-white">Tổng cộng</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !!isStaffRole}
                  className="w-full btn btn-primary btn-lg rounded-full mt-6 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Đặt hàng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
