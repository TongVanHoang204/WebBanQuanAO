import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Direct call to API since we didn't add it to authAPI object yet 
      // or we can assume we will update authAPI
      await api.post('/auth/forgot-password', { email });
      setIsSuccess(true);
      toast.success('Yêu cầu đã được gửi!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Quên mật khẩu - Fashion Store</title>
      </Helmet>
      
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-secondary-100">
          <h1 className="text-2xl font-bold text-center text-secondary-900 mb-2">Quên mật khẩu?</h1>
          <p className="text-center text-secondary-500 mb-8">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
          </p>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 pl-2">Email đăng ký</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary btn-lg rounded-full"
              >
                {isSubmitting ? 'Đăng gửi...' : 'Gửi yêu cầu'}
              </button>
            </form>
          ) : (
            <div className="text-center bg-accent-green/10 p-6 rounded-lg">
              <p className="text-accent-green font-medium mb-4">
                Đã gửi thành công!
              </p>
              <p className="text-sm text-secondary-600 mb-6">
                Vui lòng kiểm tra email (bao gồm cả hộp thư rác) để lấy mã xác nhận/liên kết đặt lại mật khẩu.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="text-primary-600 font-medium hover:underline"
              >
                Gửi lại
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
