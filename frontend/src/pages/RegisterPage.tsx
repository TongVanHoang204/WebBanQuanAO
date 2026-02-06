import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Loader2, Sparkles, Check, ShoppingBag, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        await googleLogin(tokenResponse.access_token || '');
        toast.success('Đăng nhập Google thành công!');
        navigate('/');
      } catch (err: any) {
        toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error('Đăng nhập Google thất bại'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation - All Vietnamese
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (!acceptTerms) {
      setError('Vui lòng đồng ý với Điều khoản sử dụng');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined
      });
      toast.success('Tạo tài khoản thành công! Chào mừng bạn.');
      navigate('/');
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message || err.response?.data?.message || '';
      
      // Map English error messages to Vietnamese
      let msg = 'Đăng ký thất bại. Vui lòng thử lại.';
      if (serverMsg.toLowerCase().includes('email already')) {
        msg = 'Email này đã được sử dụng. Vui lòng dùng email khác.';
      } else if (serverMsg.toLowerCase().includes('username already')) {
        msg = 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.';
      } else if (serverMsg) {
        msg = serverMsg;
      }
      
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Tạo tài khoản - Fashion Store</title>
      </Helmet>

      {/* Main Container */}
      <div className="min-h-screen flex w-full bg-white">
        
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-lg space-y-8">
            
            {/* Header */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-8 text-primary-600">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                   <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">Fashion Store</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản mới</h1>
              <p className="text-gray-500">Bắt đầu mua sắm với những ưu đãi tốt nhất ngay hôm nay.</p>
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => loginWithGoogle()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors font-medium text-gray-700"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc đăng ký bằng email</span>
              </div>
            </div>

            {/* Error Message - Premium UI */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium">Lỗi đăng ký</p>
                  <p className="text-red-600 mt-0.5">{error}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setError('')}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Họ và tên</label>
                <input
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              {/* Username & Email Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Tên đăng nhập *</label>
                  <input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="nguyenvana"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Địa chỉ Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu</label>
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-snug cursor-pointer">
                  Tôi đồng ý với <Link to="/terms" className="text-blue-600 hover:underline font-medium">Điều khoản sử dụng</Link> và <Link to="/privacy" className="text-blue-600 hover:underline font-medium">Chính sách bảo mật</Link>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng ký'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-8">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Đăng nhập
              </Link>
            </p>

            <div className="pt-8 mt-8 border-t border-gray-100 text-center text-xs text-gray-400">
              &copy; 2024 Fashion Store Inc. All rights reserved.
            </div>

          </div>
        </div>

        {/* Right Side: Image & Content */}
        <div className="hidden lg:block lg:w-1/2 relative bg-[#FDF8F3]">
          <div className="absolute inset-0">
             <img 
               src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" 
               alt="Workspace" 
               className="w-full h-full object-cover opacity-80"
             />
             <div className="absolute inset-0 bg-[#D2B48C]/30 mix-blend-multiply" /> {/* Warm overlay */}
          </div>

          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-8 rounded-3xl max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mb-6 text-white backdrop-blur-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                Gia nhập cộng đồng mua sắm
              </h2>
              <p className="text-white/90 mb-8 text-lg leading-relaxed">
                Mở khóa các ưu đãi độc quyền, theo dõi đơn hàng và nhận gợi ý dành riêng cho bạn.
              </p>

              <div className="space-y-4">
                {[
                  'Miễn phí vận chuyển đơn đầu tiên',
                  'Hoàn tiền trong 30 ngày',
                  'Hỗ trợ khách hàng 24/7'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
