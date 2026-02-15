import { Construction, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center px-4 transition-colors">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
          <Construction className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
          Website Đang Bảo Trì
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-secondary-400 mb-8">
          Chúng tôi đang nâng cấp hệ thống để mang lại trải nghiệm tốt hơn. 
          Vui lòng quay lại sau ít phút nữa!
        </p>
        
        <div className="space-y-4">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-700 text-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-secondary-700 transition-all"
          >
            <Home className="w-5 h-5" />
            Vào Trang Quản Trị
          </Link>
          
          <p className="text-sm text-gray-500 dark:text-secondary-500">
            Cảm ơn bạn đã kiên nhẫn!
          </p>
        </div>
      </div>
    </div>
  );
}
