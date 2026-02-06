import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { paymentAPI } from '../services/api';

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  const [orderCode, setOrderCode] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = Object.fromEntries(searchParams.entries());
        
        // Call backend to verify signature and update order status
        const res = await paymentAPI.vnpayReturn(params);
        
        if (res.data.success) {
          setStatus('success');
          setMessage('Thanh toán thành công!');
          setOrderCode(res.data.data.order_code);
        } else {
          setStatus('failed');
          setMessage(res.data.message || 'Thanh toán thất bại');
        }
      } catch (error: any) {
        setStatus('failed');
        setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực thanh toán');
      }
    };

    if (searchParams.toString()) {
        verifyPayment();
    } else {
        setStatus('failed');
        setMessage('Không tìm thấy thông tin thanh toán');
    }
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-white dark:bg-secondary-800 p-10 rounded-2xl shadow-xl">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Đang xử lý giao dịch...</h2>
            <p className="text-secondary-500 mt-2">Vui lòng không tắt trình duyệt</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">Thanh toán thành công!</h2>
            <p className="text-secondary-600 dark:text-secondary-300 mb-8">
              Cảm ơn bạn đã mua hàng. Mã đơn hàng của bạn là: <span className="font-bold text-primary-600">{orderCode}</span>
            </p>
            <div className="flex flex-col w-full gap-3">
              <Link to="/orders" className="btn-primary w-full flex justify-center items-center gap-2">
                Xem lại đơn hàng <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/" className="btn-secondary w-full">
                Về trang chủ
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">Thanh toán thất bại</h2>
            <p className="text-secondary-600 dark:text-secondary-300 mb-8">
              {message}. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
            </p>
            <div className="flex flex-col w-full gap-3">
              <Link to="/checkout" className="btn-primary w-full">
                Thử lại
              </Link>
              <Link to="/" className="btn-secondary w-full">
                Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
