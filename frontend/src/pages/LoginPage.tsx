import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'; // Added Sparkles for logo
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA State
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  const { login, googleLogin, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';

  const handleLoginSuccess = (user: any) => {
      toast.success('Chào mừng trở lại!');
      let target = from;
      
      if (target === '/' && user) {
          if (user.role === 'staff') {
              target = '/admin/products'; // Logic adjusted based on new roles
          } else if (['admin', 'manager'].includes(user.role)) {
              target = '/admin/dashboard';
          }
      }
      navigate(target, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(username, password);
      
      if (res.require2fa) {
         setShowOTP(true);
         setTempUserId(res.userId);
         setMaskedEmail(res.email);
         toast('Vui lòng nhập mã OTP đã gửi về email', { icon: '📧' });
      } else {
         // User is set in context by login function
         const userStr = localStorage.getItem('user');
         const user = userStr ? JSON.parse(userStr) : null;
         handleLoginSuccess(user);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Đăng nhập thất bại';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
          await verifyOTP(tempUserId, otp);
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          handleLoginSuccess(user);
      } catch (err: any) {
          const msg = err.response?.data?.error?.message || 'Mã OTP không hợp lệ';
          setError(msg);
          toast.error(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        await googleLogin(tokenResponse.access_token || '');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        handleLoginSuccess(user);
      } catch (err) {
        toast.error('Google Sign-In Failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error('Google Sign-In Failed'),
  });

  return (
    <>
      <Helmet>
        <title>Đăng nhập - Fashion Store</title>
      </Helmet>

      {/* Main Container: Full Screen Split Layout */}
      <div className="min-h-screen flex w-full bg-white">
        
        {/* Left Side: Image & Quote */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
            alt="Shopping Woman" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="relative z-10 w-full h-full flex flex-col justify-end p-12 text-white">
            <h2 className="text-3xl font-light font-serif leading-tight mb-4 max-w-lg">
              "Phong cách là một phương thức để nói lên bạn là ai mà không cần phải mở lời."
            </h2>
            <p className="text-sm font-medium tracking-wider opacity-90">— RACHEL ZOE</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-md space-y-8">
            
            {/* Header / Logo */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-8 text-primary-600">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                   <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">Fashion Store</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {showOTP ? 'Xác thực 2 bước' : 'Chào mừng trở lại'}
              </h1>
              <p className="text-gray-500">
                  {showOTP 
                      ? `Vui lòng nhập mã OTP đã gửi đến email ${maskedEmail}` 
                      : 'Vui lòng nhập thông tin để đăng nhập.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            {showOTP ? (
                // OTP Form
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Mã OTP (6 chữ số)</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all tracking-widest text-center text-xl"
                          placeholder="------"
                          required
                          maxLength={6}
                          autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || otp.length < 6}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác thực'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowOTP(false)}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Quay lại đăng nhập
                    </button>
                </form>
            ) : (
                // Login Form
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nhập tên đăng nhập của bạn"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nhập mật khẩu"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-600 font-medium">Ghi nhớ đăng nhập</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng nhập'}
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 text-xs uppercase tracking-wider">Hoặc tiếp tục với</span>
                    </div>
                  </div>

                    <button onClick={() => loginWithGoogle()} type="button" className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-gray-700 w-full col-span-2">
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
                </form>
            )}

            {!showOTP && (
                <p className="text-center text-sm text-gray-600 mt-8">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
