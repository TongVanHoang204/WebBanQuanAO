import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Lock, Sparkles } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (!token || !email) {
      setError('Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.post('/auth/reset-password', { 
        email, 
        token, 
        newPassword: formData.password 
      });
      setIsSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invalid link
  if (!token || !email) {
    return (
      <>
        <Helmet>
          <title>Link không hợp lệ - Fashion Store</title>
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Link không hợp lệ</h1>
            <p className="text-gray-500 mb-6">
              Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu một link mới.
            </p>
            <Link 
              to="/forgot-password"
              className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors"
            >
              Yêu cầu link mới
            </Link>
            <Link 
              to="/login"
              className="block mt-4 text-blue-600 hover:underline font-medium"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Đặt lại mật khẩu - Fashion Store</title>
      </Helmet>
      
      <div className="min-h-screen flex w-full bg-white">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            
            {/* Header */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-8 text-primary-600">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                   <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">Fashion Store</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h1>
              <p className="text-gray-500">Nhập mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            {!isSuccess ? (
              <>
                {/* Email Display */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Email:</span> {decodeURIComponent(email)}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">Lỗi</p>
                      <p className="text-red-600 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mật khẩu mới *</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        placeholder="Nhập mật khẩu mới"
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
                    <label className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu *</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        placeholder="Nhập lại mật khẩu"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Thành công!</h2>
                <p className="text-gray-500 mb-8">
                  Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-600/30 transition-all"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {/* Footer */}
            <p className="text-center text-sm text-gray-600">
              Nhớ mật khẩu?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl max-w-md w-full text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Bảo mật tài khoản</h2>
              <p className="text-white/80 text-lg">
                Đặt mật khẩu mạnh để bảo vệ tài khoản của bạn. Nên sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
