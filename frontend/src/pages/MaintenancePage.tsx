import { useState } from 'react';
import { Settings, Wrench, Clock, ShieldAlert } from 'lucide-react';
import { adminAPI } from '../services/api';

export default function MaintenancePage() {
  const [retryStatus, setRetryStatus] = useState<'idle' | 'checking' | 'online'>('idle');

  const checkStatus = async () => {
    try {
      setRetryStatus('checking');
      const res = await adminAPI.getPublicSettings();
      // If we reach here successfully and maintenance_mode is false or not 503
      if (res.data?.success && res.data?.data?.maintenance_mode !== 'true') {
        setRetryStatus('online');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setRetryStatus('idle');
      }
    } catch (error: any) {
      setRetryStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-2 bg-primary-100 dark:bg-primary-900/50 rounded-full"></div>
          <Settings className="w-16 h-16 text-primary-600 animate-[spin_4s_linear_infinite] relative z-10" />
          <Wrench className="w-8 h-8 text-secondary-500 absolute bottom-4 right-4 z-20" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Hệ Thống Đang Bảo Trì
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Chúng tôi đang nâng cấp hệ thống để mang lại trải nghiệm mua sắm tuyệt vời hơn cho bạn. 
          Quá trình này sẽ diễn ra nhanh chóng, vui lòng quay lại sau ít phút nhé! Cảm ơn sự kiên nhẫn của bạn.
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-500 mb-2" />
              <span className="text-sm font-medium text-orange-700">Thời gian dự kiến</span>
              <span className="text-xs text-orange-600 mt-1">15 - 30 Phút</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-blue-700">Dữ liệu an toàn</span>
              <span className="text-xs text-blue-600 mt-1">Không bị ảnh hưởng</span>
            </div>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={retryStatus !== 'idle'}
          className="w-full sm:w-auto px-8 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          {retryStatus === 'checking' && (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
          {retryStatus === 'online' ? 'Hệ thống đã online!' : 'Thử tải lại trang'}
        </button>
      </div>
    </div>
  );
}
