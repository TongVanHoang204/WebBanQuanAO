
import { useState } from 'react';
import { 
  adminAPI, 
  productsAPI, 
  categoriesAPI, 
  cartAPI, 
  ordersAPI, 
  paymentAPI, 
  authAPI, 
  chatAPI, 
  uploadAPI,
  brandsAPI,
  couponsAPI,
  reviewsAPI,
  bannersAPI
} from '../../services/api';
import { Loader2, Play, CheckCircle, XCircle, ChevronDown, ChevronRight, Copy, Code } from 'lucide-react';
import toast from 'react-hot-toast';

type ApiGroup = {
  name: string;
  endpoints: ApiEndpoint[];
};

type ApiEndpoint = {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  defaultParams?: any;
  execute: (params?: any) => Promise<any>;
};

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [endpointParams, setEndpointParams] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Xác thực (Auth)': true,
    'Sản phẩm (Products)': true,
    'Danh mục (Categories)': true,
    'Giỏ hàng (Cart)': true,
    'Đơn hàng (Orders)': true,
    'Thanh toán (Payment)': true,
    'Admin Sản phẩm': false,
    'Admin Đơn hàng': false,
    'Admin Người dùng': false,
    'Admin Tùy chọn': false,
    'Admin Hệ thống': false,
    'Admin Khác': false,

    'Chat & Upload': false,
    'Thương hiệu (Brands)': false,
    'Mã giảm giá (Coupons)': false,
    'Đánh giá (Reviews)': false,
    'Banner': false
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const getParams = (key: string, defaultParams: any) => {
    if (endpointParams[key] !== undefined) return endpointParams[key];
    return defaultParams ? JSON.stringify(defaultParams, null, 2) : '';
  };

  const updateParams = (key: string, value: string) => {
    setEndpointParams(prev => ({ ...prev, [key]: value }));
  };

  const executeApi = async (groupName: string, endpoint: ApiEndpoint) => {
    const key = `${groupName}-${endpoint.name}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    setResults(prev => ({ ...prev, [key]: null }));
    
    try {
      let params = undefined;
      const paramsStr = getParams(key, endpoint.defaultParams);
      
      if (paramsStr && paramsStr.trim()) {
        try {
          params = JSON.parse(paramsStr);
        } catch (e) {
          toast.error('JSON không hợp lệ');
          setLoading(prev => ({ ...prev, [key]: false }));
          return;
        }
      }

      const response = await endpoint.execute(params);
      setResults(prev => ({ 
        ...prev, 
        [key]: { 
          success: true, 
          status: response.status, 
          data: response.data 
        } 
      }));
      toast.success(`${endpoint.name} thành công`);
    } catch (error: any) {
      console.error(error);
      setResults(prev => ({ 
        ...prev, 
        [key]: { 
          success: false, 
          status: error.response?.status || 500, 
          message: error.message,
          data: error.response?.data 
        } 
      }));
      toast.error(`${endpoint.name} thất bại`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Đã sao chép vào clipboard');
  };

  // Mock ID for testing
  const TEST_ID = '1';
  const TEST_SLUG = 'ao-thun';

  const groups: ApiGroup[] = [
    {
      name: 'Xác thực (Auth)',
      endpoints: [
        {
          name: 'Đăng ký (Demo)',
          method: 'POST',
          path: '/auth/register',
          description: 'Đăng ký user mới',
          defaultParams: {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            full_name: 'Test API User'
          },
          execute: (params) => authAPI.register(params)
        },
        {
          name: 'Đăng nhập (Demo)',
          method: 'POST',
          path: '/auth/login',
          description: 'Đăng nhập',
          defaultParams: {
             username: 'admin',
             password: 'password123'
          },
          execute: (params) => authAPI.login(params.username, params.password) 
        },
        {
          name: 'Lấy thông tin (Me)',
          method: 'GET',
          path: '/auth/me',
          description: 'Lấy thông tin user hiện tại',
          execute: () => authAPI.getMe()
        },
        {
          name: 'Cập nhật Profile',
          method: 'PUT',
          path: '/auth/profile',
          description: 'Cập nhật thông tin profile',
          defaultParams: { full_name: 'Updated Name API' },
          execute: (params) => authAPI.updateProfile(params)
        }
      ]
    },
    {
      name: 'Sản phẩm (Products)',
      endpoints: [
        {
          name: 'Lấy tất cả',
          method: 'GET',
          path: '/products',
          description: 'Lấy danh sách sản phẩm',
          defaultParams: { limit: 5 },
          execute: (params) => productsAPI.getAll(params)
        },
        {
          name: 'Lấy theo Slug',
          method: 'GET',
          path: `/products/:slug`,
          description: `Lấy sản phẩm theo slug`,
          defaultParams: { slug: TEST_SLUG },
          execute: (params) => productsAPI.getBySlug(params.slug)
        },
        {
          name: 'Lấy theo ID',
          method: 'GET',
          path: `/products/id/:id`,
          description: `Lấy sản phẩm theo ID`,
          defaultParams: { id: TEST_ID },
          execute: (params) => productsAPI.getById(params.id)
        },
        {
          name: 'Hàng mới về',
          method: 'GET',
          path: '/products/new-arrivals',
          description: 'Sản phẩm mới nhất',
          defaultParams: { limit: 4 },
          execute: (params) => productsAPI.getNewArrivals(params.limit)
        },
        {
          name: 'Tìm kiếm',
          method: 'GET',
          path: '/products/search',
          description: 'Tìm kiếm từ khóa',
          defaultParams: { query: 'ao' },
          execute: (params) => productsAPI.search(params.query)
        }
      ]
    },
    {
      name: 'Danh mục (Categories)',
      endpoints: [
        {
          name: 'Lấy tất cả',
          method: 'GET',
          path: '/categories',
          description: 'Danh sách danh mục',
          execute: () => categoriesAPI.getAll()
        },
        {
          name: 'Lấy theo Slug',
          method: 'GET',
          path: `/categories/:slug`,
          description: `Chi tiết danh mục`,
          defaultParams: { slug: TEST_SLUG },
          execute: (params) => categoriesAPI.getBySlug(params.slug)
        },
        {
          name: 'Sản phẩm theo danh mục',
          method: 'GET',
          path: `/categories/:slug/products`,
          description: 'Lấy ds sản phẩm trong danh mục',
          defaultParams: { slug: TEST_SLUG, limit: 5 },
          execute: (params) => categoriesAPI.getProducts(params.slug, { limit: params.limit })
        }
      ]
    },
    {
      name: 'Giỏ hàng (Cart)',
      endpoints: [
        {
          name: 'Xem giỏ hàng',
          method: 'GET',
          path: '/cart',
          description: 'Lấy giỏ hàng hiện tại',
          execute: () => cartAPI.get()
        }
      ]
    },
    {
      name: 'Đơn hàng (Orders)',
      endpoints: [
        {
          name: 'Checkout (Test Only)',
          method: 'POST',
          path: '/orders/checkout',
          description: 'Thử đặt hàng',
          defaultParams: {
            customer_name: "Test API",
            customer_phone: "0900000000",
            ship_address_line1: "123 Test St",
            ship_city: "HCM",
            ship_province: "HCM"
          },
          execute: (params) => ordersAPI.checkout(params)
        },
        {
          name: 'Lịch sử mua hàng',
          method: 'GET',
          path: '/orders',
          description: 'Đơn hàng của user hiện tại',
          defaultParams: { limit: 5 },
          execute: (params) => ordersAPI.getAll(params)
        }
      ]
    },
    {
      name: 'Thanh toán (Payment)',
      endpoints: [
        {
          name: 'Tạo link thanh toán',
          method: 'POST',
          path: '/payment/create_url',
          description: 'Tạo URL VNPay',
          defaultParams: { orderId: TEST_ID },
          execute: (params) => paymentAPI.createUrl(params.orderId) 
        },
        {
          name: 'Lịch sử giao dịch',
          method: 'GET',
          path: '/payment/transactions',
          description: 'Log giao dịch thanh toán',
          execute: () => paymentAPI.getTransactions()
        }
      ]
    },
    {
      name: 'Chat & Upload',
      endpoints: [
        {
          name: 'Kiểm tra Chat AI',
          method: 'GET',
          path: '/chat/health',
          description: 'Ping server AI',
          execute: () => chatAPI.checkHealth()
        },
        {
          name: 'Gửi tin nhắn Chat',
          method: 'POST',
          path: '/chat',
          description: 'Gửi tin tới AI',
          defaultParams: { message: 'Xin chào, bạn có khỏe không?' },
          execute: (params) => chatAPI.send(params.message)
        }
      ]
    },
    {
      name: 'Admin Sản phẩm',
      endpoints: [
        {
          name: 'Danh sách (Admin)',
          method: 'GET',
          path: '/admin/products',
          description: 'Lấy bảng sản phẩm quản trị',
          defaultParams: { limit: 5 },
          execute: (params) => adminAPI.getProducts(params)
        }
      ]
    },
    {
      name: 'Admin Đơn hàng',
      endpoints: [
        {
          name: 'Danh sách (Admin)',
          method: 'GET',
          path: '/admin/orders',
          description: 'Quản lý đơn hàng',
          defaultParams: { limit: 5 },
          execute: (params) => adminAPI.getOrders(params)
        },
        {
          name: 'Chi tiết đơn',
          method: 'GET',
          path: `/admin/orders/:id`,
          description: 'Xem chi tiết đơn hàng',
          defaultParams: { id: TEST_ID },
          execute: (params) => adminAPI.getOrderById(params.id)
        }
      ]
    },
    {
      name: 'Admin Người dùng',
      endpoints: [
        {
          name: 'Danh sách Users',
          method: 'GET',
          path: '/admin/users',
          description: 'Quản lý người dùng',
          defaultParams: { limit: 5 },
          execute: (params) => adminAPI.getUsers(params)
        },
        {
          name: 'Chi tiết User',
          method: 'GET',
          path: `/admin/users/:id`,
          description: 'Xem thông tin user',
          defaultParams: { id: TEST_ID },
          execute: (params) => adminAPI.getUserById(params.id)
        }
      ]
    },
    {
      name: 'Admin Hệ thống',
      endpoints: [
        {
          name: 'Thống kê',
          method: 'GET',
          path: '/admin/dashboard',
          description: 'Số liệu dashboard',
          execute: () => adminAPI.getDashboard()
        },
        {
          name: 'Phân tích (Analytics)',
          method: 'GET',
          path: '/admin/analytics',
          description: 'Báo cáo chi tiết',
          execute: () => adminAPI.getAnalytics()
        },
        {
          name: 'Cấu hình',
          method: 'GET',
          path: '/admin/settings',
          description: 'Cài đặt hệ thống',
          execute: () => adminAPI.getSettings()
        },
        {
          name: 'Thông báo',
          method: 'GET',
          path: '/admin/notifications',
          description: 'Tất cả thông báo',
          defaultParams: { limit: 5 },
          execute: (params) => adminAPI.getNotifications(params)
        },
        {
          name: 'Quyền hạn',
          method: 'GET',
          path: '/admin/permissions',
          description: 'Danh sách phân quyền',
          execute: () => adminAPI.getPermissions()
        }
      ]
    },
    {
      name: 'Thương hiệu (Brands)',
      endpoints: [
        {
          name: 'Lấy (Public)',
          method: 'GET',
          path: '/brands',
          description: 'Lấy danh sách thương hiệu (Public)',
          execute: (params) => brandsAPI.getPublic(params)
        },
        {
          name: 'Lấy tất cả (Admin)',
          method: 'GET',
          path: '/admin/brands',
          description: 'Lấy danh sách thương hiệu (Admin)',
          execute: (params) => brandsAPI.getAll(params)
        },
        {
          name: 'Chi tiết (Admin)',
          method: 'GET',
          path: '/admin/brands/:id',
          description: 'Chi tiết thương hiệu',
          defaultParams: { id: TEST_ID },
          execute: (params) => brandsAPI.getById(params.id)
        }
      ]
    },
    {
      name: 'Mã giảm giá (Coupons)',
      endpoints: [
        {
          name: 'Áp dụng mã',
          method: 'POST',
          path: '/admin/coupons/apply',
          description: 'Kiểm tra mã giảm giá',
          defaultParams: { code: 'TESTCOUPON', subtotal: 500000 },
          execute: (params) => couponsAPI.apply(params.code, params.subtotal)
        }
      ]
    },
    {
      name: 'Đánh giá (Reviews)',
      endpoints: [
        {
          name: 'Lấy theo sản phẩm',
          method: 'GET',
          path: '/reviews/product/:id',
          description: 'Lấy đánh giá của sản phẩm',
          defaultParams: { id: TEST_ID },
          execute: (params) => reviewsAPI.getByProduct(params.id)
        },
        {
          name: 'Tạo đánh giá',
          method: 'POST',
          path: '/reviews',
          description: 'Gửi đánh giá mới',
          defaultParams: {
            product_id: TEST_ID,
            rating: 5,
            title: 'Tuyệt vời',
            content: 'Sản phẩm rất tốt'
          },
          execute: (params) => reviewsAPI.create(params)
        }
      ]
    },
    {
      name: 'Banner',
      endpoints: [
        {
          name: 'Lấy banner',
          method: 'GET',
          path: '/banners',
          description: 'Lấy danh sách banner',
          defaultParams: { position: 'home_hero' },
          execute: (params) => bannersAPI.getAll(params)
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2x font-bold text-secondary-900 dark:text-white">API Test Playground</h1>
           <p className="text-secondary-500">Công cụ kiểm thử và tài liệu API</p>
        </div>
        <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => setResults({})}>Xóa kết quả</button>
        </div>
      </div>

      <div className="grid gap-6">
        {groups.map(group => (
          <div key={group.name} className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 overflow-hidden">
            <button 
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-900 text-left font-semibold"
            >
              <span>{group.name}</span>
              {expandedGroups[group.name] ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
            </button>
            
            {expandedGroups[group.name] && (
              <div className="divide-y divide-secondary-100 dark:divide-secondary-700">
                {group.endpoints.map(endpoint => {
                   const key = `${group.name}-${endpoint.name}`;
                   const result = results[key];
                   const isLoading = loading[key];
                   const paramsValue = getParams(key, endpoint.defaultParams);
                   const hasParams = endpoint.defaultParams !== undefined;

                   return (
                     <div key={endpoint.name} className="p-4">
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-1">
                             <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono
                               ${endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                 endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                                 endpoint.method === 'PUT' ? 'bg-purple-100 text-purple-700' :
                                 endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' : 
                                 'bg-yellow-100 text-yellow-700'
                               }
                             `}>
                               {endpoint.method}
                             </span>
                             <code className="text-sm bg-secondary-100 dark:bg-secondary-900 px-2 py-0.5 rounded text-secondary-700 dark:text-secondary-300">
                               {endpoint.path}
                             </code>
                           </div>
                           <h3 className="font-medium text-secondary-900 dark:text-white">{endpoint.name}</h3>
                           <p className="text-xs text-secondary-500 mb-2">{endpoint.description}</p>
                           
                           {/* Param Editor */}
                           {hasParams && (
                             <div className="mt-2">
                               <label className="text-xs font-medium text-secondary-500 flex items-center gap-1 mb-1">
                                 <Code className="w-3 h-3" />
                                 Request Body / Params (JSON)
                               </label>
                               <textarea
                                 value={paramsValue}
                                 onChange={(e) => updateParams(key, e.target.value)}
                                 className="w-full h-32 text-xs font-mono p-3 bg-secondary-50 dark:bg-black/30 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                                 placeholder="{}"
                               />
                             </div>
                           )}
                         </div>

                         <button
                           onClick={() => executeApi(group.name, endpoint)}
                           disabled={isLoading}
                           className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shrink-0 mt-6 md:mt-0"
                         >
                           {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />}
                           Test
                         </button>
                       </div>

                       {/* Result Area */}
                       {result && (
                         <div className={`mt-3 rounded-lg border overflow-hidden ${
                           result.success ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                         }`}>
                           <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20">
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className={`text-xs font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                  Status: {result.status}
                                </span>
                              </div>
                              <button onClick={() => copyToClipboard(result.data)} className="p-1 hover:bg-gray-200 rounded">
                                <Copy className="w-3 h-3 text-gray-500" />
                              </button>
                           </div>
                           <div className="max-h-60 overflow-y-auto p-3">
                             <pre className="text-xs font-mono text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">
                               {JSON.stringify(result.data, null, 2)}
                             </pre>
                           </div>
                         </div>
                       )}
                     </div>
                   );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
