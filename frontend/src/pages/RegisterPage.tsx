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
        
        {/* Left Side: Image & Content (Matching Login Page Style) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
          <div className="absolute inset-0">
             <img 
               src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop" 
               alt="Fashion Lifestyle" 
               className="w-full h-full object-cover opacity-80"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>

          <div className="relative z-10 w-full h-full flex flex-col justify-end p-12 text-white">
             <div className="mb-8">
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 text-white border border-white/20">
                  <Sparkles className="w-6 h-6" />
               </div>
               <h2 className="text-4xl font-light font-serif leading-tight mb-4">
                 "Thời trang là cách bạn giới thiệu mình với thế giới."
               </h2>
               <div className="space-y-4 mt-8">
                  {[
                    'Miễn phí vận chuyển đơn đầu tiên',
                    'Đổi trả dễ dàng trong 30 ngày',
                    'Ưu đãi độc quyền cho thành viên'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-white/90">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium tracking-wide">{item}</span>
                    </div>
                  ))}
               </div>
             </div>
             <p className="text-xs text-white/50">Photo by Unsplash</p>
          </div>
        </div>

        {/* Right Side: Form */}
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
              <p className="text-gray-500">Nhập thông tin của bạn để đăng ký thành viên.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-3 animate-in slide-in-from-top-2">
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 text-xs uppercase tracking-wider">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social Auth */}
            <button 
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                  />
                  <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                  />
                  <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                  />
                  <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                  />
              </svg>
              Google
            </button>

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
      </div>
    </>
  );
}
