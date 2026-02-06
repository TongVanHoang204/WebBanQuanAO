import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUserById(id!);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy khách hàng</p>
        <Link to="/admin/customers" className="text-primary-600 hover:underline mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/customers" className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.full_name || 'Chưa có tên'}</h1>
          <p className="text-sm text-gray-500 dark:text-secondary-400">@{customer.username}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          customer.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {customer.status === 'active' ? 'Hoạt động' : 'Đã chặn'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-secondary-400 mb-1">Họ và tên</label>
                <p className="text-gray-900 dark:text-white font-medium">{customer.full_name || '---'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-secondary-400 mb-1">Email</label>
                <p className="text-gray-900 dark:text-white">{customer.email}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-secondary-400 mb-1">Số điện thoại</label>
                <p className="text-gray-900 dark:text-white">{customer.phone || '---'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-secondary-400 mb-1">Vai trò</label>
                <p className="text-gray-900 dark:text-white capitalize">{customer.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</p>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
              Sổ địa chỉ ({customer.shipping_addresses?.length || 0})
            </h2>
            
            {customer.shipping_addresses && customer.shipping_addresses.length > 0 ? (
               <div className="space-y-4">
                  {customer.shipping_addresses.map((addr: any) => (
                    <div key={addr.id} className={`p-4 rounded-lg border ${addr.is_default ? 'border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/20' : 'border-gray-200 dark:border-secondary-700'}`}>
                       <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${addr.type === 'Nhà riêng' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                             {addr.type}
                          </span>
                          {addr.is_default && (
                             <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Mặc định
                             </span>
                          )}
                       </div>
                       <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          {addr.full_name} <span className="text-gray-500 dark:text-secondary-400 font-normal">- {addr.phone}</span>
                       </p>
                       <p className="text-sm text-gray-600 dark:text-secondary-400">
                          {addr.address_line1}, {addr.city}, {addr.province}
                       </p>
                    </div>
                  ))}
               </div>
            ) : (
              // Fallback to legacy fields if no shipping_addresses found (migration support)
              customer.address_line1 || customer.city ? (
                <div className="space-y-2 text-gray-700 dark:text-secondary-300">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Địa chỉ chính (Lacy)</p>
                  {customer.address_line1 && <p>{customer.address_line1}</p>}
                  {customer.address_line2 && <p>{customer.address_line2}</p>}
                  <p>
                    {[customer.city, customer.province, customer.country].filter(Boolean).join(', ') || '---'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                   <p className="text-gray-500 dark:text-secondary-400 italic mb-2">Chưa có thông tin địa chỉ</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-secondary-400 mb-4">Thông tin tài khoản</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 dark:text-secondary-500" />
                <span className="text-gray-700 dark:text-secondary-300">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 dark:text-secondary-500" />
                <span className="text-gray-700 dark:text-secondary-300">{customer.phone || '---'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-secondary-500" />
                <span className="text-gray-700 dark:text-secondary-300">
                  Đăng ký: {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-secondary-400 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Đơn hàng gần đây
            </h3>
            {customer.orders?.length > 0 ? (
              <div className="space-y-3">
                {customer.orders.map((order: any) => (
                  <Link 
                    key={order.id} 
                    to={`/admin/orders/${order.id}`}
                    className="block p-3 bg-gray-50 dark:bg-secondary-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{order.order_code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-secondary-400">
                      <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.grand_total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-secondary-400 text-center py-4">Chưa có đơn hàng</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
