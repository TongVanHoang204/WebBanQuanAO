import { useState, useEffect } from 'react';
import { 
  Building2, Truck, Shield, Save, Upload, Loader2, Info, Plus, X, CreditCard, Globe
} from 'lucide-react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  
  // Settings state
  const [settings, setSettings] = useState({
    store_name: '',
    legal_entity_name: '',
    store_logo: '',
    support_email: '',
    support_phone: '',
    physical_address: '',
    maintenance_mode: 'false',
    seo_indexing: 'true',
    shipping_standard_fee: '30000',
    shipping_free_threshold: '500000',
    shipping_min_days: '3',
    shipping_max_days: '5',
    google_client_id: '',
    payment_vnpay_enabled: 'false',
    payment_vnpay_tmn_code: '',
    payment_vnpay_hash_secret: '',
    payment_vnpay_url: '',
    payment_cod_enabled: 'true',
    payment_bank_enabled: 'false',
    payment_bank_info: '',
    payment_bank_id: '',
    payment_bank_account: '',
    payment_bank_account_name: '',
    payment_momo_enabled: 'false',
    payment_momo_qrcode: '',
  });

  // Permissions state
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);
  const [newPermission, setNewPermission] = useState({ name: '', description: '' });
  const [processingPerm, setProcessingPerm] = useState(false);

  // Fetch settings on load
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch permissions when tab becomes permissions
  useEffect(() => {
    if (activeTab === 'permissions') {
      fetchPermissions();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSettings();
      if (res.data.success) {
        setSettings({
          ...settings,
          ...res.data.data
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const res = await adminAPI.getPermissions();
      if (res.data.success) {
        setPermissions(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách quyền');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await adminAPI.updateSettings(settings);
      if (res.data.success) {
        toast.success('Lưu cài đặt thành công');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File quá lớn (max 2MB)');
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const toastId = toast.loading('Đang tải ảnh...');
      const res = await adminAPI.uploadLogo(formData);
      toast.dismiss(toastId);
      
      if (res.data.success) {
        setSettings({ ...settings, store_logo: res.data.data.url });
        toast.success('Upload logo thành công');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi upload logo');
    }
  };

  const handleSavePermission = async () => {
    if (!newPermission.name) {
      toast.error('Vui lòng nhập tên quyền');
      return;
    }

    try {
      setProcessingPerm(true);
      if (editingPermission) {
        await adminAPI.updatePermission(editingPermission.id, newPermission);
        toast.success('Cập nhật quyền thành công');
      } else {
        await adminAPI.createPermission(newPermission);
        toast.success('Tạo quyền mới thành công');
      }
      setShowPermissionModal(false);
      fetchPermissions();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Lỗi khi lưu quyền');
    } finally {
      setProcessingPerm(false);
    }
  };

  const handleDeletePermission = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa quyền này?')) return;
    try {
      await adminAPI.deletePermission(id);
      toast.success('Xóa quyền thành công');
      fetchPermissions();
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi xóa quyền');
    }
  };

  const formatCurrency = (val: string) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val));

  const tabs = [
    { id: 'shop', label: 'Thông tin cửa hàng', icon: Building2 },
    // { id: 'email', label: 'Cấu hình Email', icon: Mail }, // Removed
    { id: 'shipping', label: 'Vận chuyển', icon: Truck },
    { id: 'payment', label: 'Thanh toán', icon: CreditCard },
    { id: 'social', label: 'Social Login', icon: Globe },
    { id: 'permissions', label: 'Phân quyền', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-secondary-400 mt-1">Quản lý thông tin cửa hàng và cấu hình hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchSettings()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-secondary-300 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 overflow-hidden transition-colors">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                    activeTab === tab.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-secondary-400 hover:bg-gray-50 dark:hover:bg-secondary-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'shop' && (
            <div className="space-y-6">
              {/* Shop Identity */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Nhận diện thương hiệu</h2>
                <p className="text-sm text-gray-500 dark:text-secondary-400 mb-6">Logo và tên cửa hàng hiển thị với khách hàng</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Tên cửa hàng</label>
                    <input
                      type="text"
                      value={settings.store_name}
                      onChange={e => setSettings({...settings, store_name: e.target.value})}
                      className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Tên pháp lý công ty</label>
                    <input
                      type="text"
                      value={settings.legal_entity_name}
                      onChange={e => setSettings({...settings, legal_entity_name: e.target.value})}
                      className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">Logo cửa hàng</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-secondary-600 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-secondary-900 hover:bg-gray-100 dark:hover:bg-secondary-800 transition-colors cursor-pointer relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {settings.store_logo ? (
                        <div className="relative">
                          <img 
                            src={`http://localhost:4000${settings.store_logo}`} 
                            alt="Store Logo" 
                            className="h-24 object-contain"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                            <span className="text-white text-sm font-medium">Thay đổi</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-secondary-500 flex items-center justify-center rounded-full bg-gray-100 dark:bg-secondary-800 mb-3">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Upload logo mới</p>
                          <p className="text-xs text-gray-500 dark:text-secondary-400 mt-1">SVG, PNG, JPG (max 2MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Support */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Liên hệ & Hỗ trợ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Email hỗ trợ</label>
                    <input
                      type="email"
                      value={settings.support_email}
                      onChange={e => setSettings({...settings, support_email: e.target.value})}
                      className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Hotline</label>
                    <input
                      type="tel"
                      value={settings.support_phone}
                      onChange={e => setSettings({...settings, support_phone: e.target.value})}
                      className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Địa chỉ văn phòng</label>
                    <textarea
                      rows={3}
                      value={settings.physical_address}
                      onChange={e => setSettings({...settings, physical_address: e.target.value})}
                      className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Store Availability */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Trạng thái cửa hàng</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Chế độ bảo trì</h3>
                      <p className="text-sm text-gray-500 dark:text-secondary-400">Tạm ẩn website với khách hàng và hiện thông báo bảo trì</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.maintenance_mode === 'true'}
                        onChange={e => setSettings({...settings, maintenance_mode: String(e.target.checked)})}
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="border-t border-gray-200 dark:border-secondary-700 pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Cho phép Google Index</h3>
                      <p className="text-sm text-gray-500 dark:text-secondary-400">Cho phép các công cụ tìm kiếm thu thập dữ liệu website</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.seo_indexing === 'true'}
                        onChange={e => setSettings({...settings, seo_indexing: String(e.target.checked)})}
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Cấu hình vận chuyển</h2>
              <p className="text-sm text-gray-500 dark:text-secondary-400 mb-6">Thiết lập phí vận chuyển mặc định</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                    Phí vận chuyển tiêu chuẩn
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.shipping_standard_fee}
                      onChange={e => setSettings({...settings, shipping_standard_fee: e.target.value})}
                      className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg pl-3 pr-12 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-secondary-400 sm:text-sm">VND</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-secondary-400 mt-1">
                    {formatCurrency(settings.shipping_standard_fee)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                    Miễn phí vận chuyển cho đơn từ
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.shipping_free_threshold}
                      onChange={e => setSettings({...settings, shipping_free_threshold: e.target.value})}
                      className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg pl-3 pr-12 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-secondary-400 sm:text-sm">VND</span>
                    </div>
                  </div>
                   <p className="text-sm text-gray-500 dark:text-secondary-400 mt-1">
                    {formatCurrency(settings.shipping_free_threshold)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                    Thời gian giao hàng tối thiểu (ngày)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping_min_days}
                    onChange={e => setSettings({...settings, shipping_min_days: e.target.value})}
                    className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                    Thời gian giao hàng tối đa (ngày)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping_max_days}
                    onChange={e => setSettings({...settings, shipping_max_days: e.target.value})}
                    className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  {/* COD */}
                  <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6">
                     <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Thanh toán khi nhận hàng (COD)</h2>
                          <p className="text-sm text-gray-500 dark:text-secondary-400">Cho phép khách hàng thanh toán bằng tiền mặt khi nhận hàng</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.payment_cod_enabled === 'true'}
                            onChange={e => setSettings({...settings, payment_cod_enabled: String(e.target.checked)})}
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                     </div>
                  </div>

                   {/* Bank Transfer (VietQR) */}
                   <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Chuyển khoản ngân hàng (VietQR)</h2>
                           <p className="text-sm text-gray-500 dark:text-secondary-400">Cho phép khách hàng chuyển khoản qua mã QR ngân hàng</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.payment_bank_enabled === 'true'}
                            onChange={e => setSettings({...settings, payment_bank_enabled: String(e.target.checked)})}
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      
                      {settings.payment_bank_enabled === 'true' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                    Ngân hàng (Bin/ID)
                                    <a href="https://api.vietqr.io/v2/banks" target="_blank" rel="noreferrer" className="ml-2 text-xs text-primary-600 hover:underline transition-colors">Tra cứu mã ngân hàng</a>
                                </label>
                                <input
                                    type="text"
                                    value={settings.payment_bank_id || ''}
                                    onChange={e => setSettings({...settings, payment_bank_id: e.target.value})}
                                    placeholder="VD: MB, VCB, 970422"
                                    className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Số tài khoản</label>
                                <input
                                    type="text"
                                    value={settings.payment_bank_account || ''}
                                    onChange={e => setSettings({...settings, payment_bank_account: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Tên chủ tài khoản</label>
                                <input
                                    type="text"
                                    value={settings.payment_bank_account_name || ''}
                                    onChange={e => setSettings({...settings, payment_bank_account_name: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                            </div>
                          </div>
                          
                          <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Ghi chú thêm (Hiển thị dưới QR)</label>
                          <textarea
                            rows={3}
                            value={settings.payment_bank_info}
                            onChange={e => setSettings({...settings, payment_bank_info: e.target.value})}
                            className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                          />
                        </>
                      )}
                   </div>

                    {/* MoMo */}
                    <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6">
                       <div className="flex items-center justify-between mb-4">
                         <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ví điện tử MoMo</h2>
                            <p className="text-sm text-gray-500 dark:text-secondary-400">Hiển thị mã QR nhận tiền MoMo cá nhân</p>
                         </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={settings.payment_momo_enabled === 'true'}
                             onChange={e => setSettings({...settings, payment_momo_enabled: String(e.target.checked)})}
                           />
                           <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                         </label>
                       </div>

                       {settings.payment_momo_enabled === 'true' && (
                           <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Link ảnh QR Code MoMo</label>
                             <input
                                 type="text"
                                 value={settings.payment_momo_qrcode || ''}
                                 onChange={e => setSettings({...settings, payment_momo_qrcode: e.target.value})}
                                 placeholder="https://example.com/my-momo-qr.jpg"
                                 className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                             />
                             <p className="text-xs text-gray-500 mt-2">Bạn có thể upload ảnh QR lên host khác và dán link vào đây, hoặc tính năng upload sẽ được cập nhật sau.</p>
                           </div>
                       )}
                    </div>

                    {/* VNPay */}
                    <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
                       <div className="flex items-center justify-between mb-4">
                         <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Cổng thanh toán VNPay</h2>
                            <p className="text-sm text-gray-500 dark:text-secondary-400">Tích hợp thanh toán qua VNPay (ATM, QR, Credit)</p>
                         </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={settings.payment_vnpay_enabled === 'true'}
                             onChange={e => setSettings({...settings, payment_vnpay_enabled: String(e.target.checked)})}
                           />
                           <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                         </label>
                       </div>

                       {settings.payment_vnpay_enabled === 'true' && (
                           <div className="grid grid-cols-1 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">TMN Code</label>
                                <input
                                  type="text"
                                  value={settings.payment_vnpay_tmn_code}
                                  onChange={e => setSettings({...settings, payment_vnpay_tmn_code: e.target.value})}
                                  className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Hash Secret</label>
                                <input
                                  type="password"
                                  value={settings.payment_vnpay_hash_secret}
                                  onChange={e => setSettings({...settings, payment_vnpay_hash_secret: e.target.value})}
                                  className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Payment URL</label>
                                <input
                                  type="text"
                                  value={settings.payment_vnpay_url}
                                  onChange={e => setSettings({...settings, payment_vnpay_url: e.target.value})}
                                  className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                              </div>
                           </div>
                       )}
                    </div>
                </div>
              )}

          {activeTab === 'social' && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Đăng nhập Social</h2>
              <p className="text-sm text-gray-500 dark:text-secondary-400 mb-6">Cấu hình đăng nhập qua Google, Facebook</p>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Google Client ID</label>
                  <input
                    type="text"
                    value={settings.google_client_id}
                    onChange={e => setSettings({...settings, google_client_id: e.target.value})}
                    placeholder="xxx-xxx.apps.googleusercontent.com"
                    className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-secondary-400 mt-2">
                    Lấy Client ID tại <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Google Cloud Console</a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách quyền hạn</h2>
                  <p className="text-sm text-gray-500 dark:text-secondary-400">Định nghĩa các quyền hạn trong hệ thống</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPermission(null);
                    setNewPermission({ name: '', description: '' });
                    setShowPermissionModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm quyền mới
                </button>
              </div>

              {/* Permission List */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 overflow-hidden transition-colors">
                {loadingPermissions ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  </div>
                ) : (
                  <table className="w-full text-left text-sm text-gray-500 dark:text-secondary-400">
                    <thead className="bg-gray-50 dark:bg-secondary-700/50 text-xs text-gray-700 dark:text-secondary-300 uppercase">
                      <tr>
                        <th className="px-6 py-3">Tên quyền</th>
                        <th className="px-6 py-3">Mô tả</th>
                        <th className="px-6 py-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-secondary-700 bg-white dark:bg-secondary-800">
                      {permissions.length > 0 ? (
                        permissions.map((perm: any) => (
                          <tr key={perm.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {perm.name}
                            </td>
                            <td className="px-6 py-4">{perm.description || '---'}</td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingPermission(perm);
                                  setNewPermission({ name: perm.name, description: perm.description || '' });
                                  setShowPermissionModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeletePermission(perm.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-secondary-400">
                            Chưa có quyền nào được định nghĩa
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPermission ? 'Chỉnh sửa quyền' : 'Thêm quyền mới'}
              </h3>
              <button 
                onClick={() => setShowPermissionModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Tên quyền</label>
                <input
                  type="text"
                  value={newPermission.name}
                  onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
                  placeholder="Ví dụ: Quản lý kho"
                  className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Mô tả</label>
                <textarea
                  value={newPermission.description}
                  onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                  placeholder="Mô tả chi tiết về quyền này..."
                  rows={3}
                  className="w-full border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-secondary-300 bg-gray-100 dark:bg-secondary-700 rounded-lg hover:bg-gray-200 dark:hover:bg-secondary-600 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSavePermission}
                  disabled={processingPerm}
                  className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {processingPerm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingPermission ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
