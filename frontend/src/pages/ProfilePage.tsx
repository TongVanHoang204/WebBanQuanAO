import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, uploadAPI } from '../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Loader2, 
  Key, 
  MapPin, 
  Plus, 
  Camera,
  Package,
  Calendar,
  ChevronRight,
  Clock,
  ShieldCheck,
  Building,
  Home,
  X,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AddressSelector from '../components/common/AddressSelector';

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

interface Address {
  id: string;
  type: string;
  full_name: string;
  phone: string;
  address_line1: string;
  city: string;
  province: string;
  is_default: boolean;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address> | null>(null);
  
  // Profile Form
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    province: ''
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Address Form
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    type: 'Nhà riêng',
    full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    province: '',
    is_default: false
  });

  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address_line1: user.address_line1 || '',
        city: user.city || '',
        province: user.province || ''
      });
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [activityRes, addressRes] = await Promise.all([
        authAPI.getActivity(),
        authAPI.getAddresses()
      ]);
      setActivities(activityRes.data.data);
      setAddresses(addressRes.data.data);
    } catch (error) {
      console.error('Failed to fetch profile data', error);
      toast.error('Không thể tải dữ liệu cá nhân');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
       await authAPI.setDefaultAddress(id);
       toast.success('Đã đặt làm địa chỉ mặc định');
       // Refresh to sync user profile and list order
       const currentUserRes = await authAPI.getMe();
       updateUser(currentUserRes.data.data);
       fetchData();
    } catch (error) {
       toast.error('Lỗi khi đặt địa chỉ mặc định');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload to server
      const uploadRes = await uploadAPI.single(file);
      const avatarUrl = uploadRes.data.data.url;

      // 2. Update user profile
      const updateRes = await authAPI.updateProfile({ ...profileForm, avatar_url: avatarUrl });
      
      // 3. Update local user state
      updateUser(updateRes.data.data);
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Lỗi khi tải lên ảnh đại diện');
    } finally {
      setLoading(false);
      // Reset input value to allow re-uploading same file if needed
      e.target.value = '';
    }
  };

  const handleDeleteAddress = async (id: string) => {
     if(!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
     try {
        await authAPI.deleteAddress(id);
        setAddresses(prev => prev.filter(a => a.id !== id));
        toast.success('Đã xóa địa chỉ');
     } catch (error) {
        toast.error('Lỗi khi xóa địa chỉ');
     }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
      updateUser(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Lỗi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (checked: boolean) => {
    try {
      setLoading(true);
      const res = await authAPI.toggle2FA(checked);
      toast.success(res.data.message);
      
      // Update local user
      if (user) {
        updateUser({ ...user, two_factor_enabled: checked });
      }
    } catch (error: any) {
      toast.error('Lỗi khi cập nhật trạng thái 2FA');
      // Revert is automatic if we rely on user state, but simpler to just catch
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('Đổi mật khẩu thành công');
      setIsPasswordModalOpen(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Lỗi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentAddress && currentAddress.id) {
         // Update
         await authAPI.updateAddress(currentAddress.id, addressForm);
      } else {
         // Create
         await authAPI.addAddress(addressForm);
      }
      
      toast.success(currentAddress ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ mới thành công');
      setIsAddressModalOpen(false);
      
      // Refresh to ensure sync
      const currentUserRes = await authAPI.getMe();
      updateUser(currentUserRes.data.data);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi khi lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const openAddressModal = (address?: Partial<Address>) => {
    if (address) {
      setCurrentAddress(address);
      setAddressForm(address);
    } else {
      setCurrentAddress(null);
      setAddressForm({
        type: 'Nhà riêng',
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        address_line1: '',
        city: '',
        province: '',
        is_default: false
      });
    }
    setIsAddressModalOpen(true);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login': return <Key className="w-4 h-4 text-amber-500" />;
      case 'order_placed': return <Package className="w-4 h-4 text-blue-500" />;
      case 'profile_updated': return <User className="w-4 h-4 text-emerald-500" />;
      default: return <Clock className="w-4 h-4 text-secondary-400" />;
    }
  };

  const getActivityText = (log: ActivityLog) => {
    switch (log.action) {
      case 'login': return 'Đăng nhập vào hệ thống';
      case 'order_placed': return `Đã đặt đơn hàng mới #${log.details?.order_code || ''}`;
      case 'profile_updated': return 'Đã cập nhật thông tin cá nhân';
      case 'password_changed': return 'Đã thay đổi mật khẩu';
      default: return log.action;
    }
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Hồ sơ cá nhân - Fashion Store</title>
      </Helmet>

      <div className="bg-secondary-50 dark:bg-secondary-900 min-h-screen py-8 md:py-12 transition-colors duration-300 font-inter">
        <div className="container-custom max-w-5xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-black text-secondary-900 dark:text-white uppercase italic tracking-tighter mb-1">
                 Hồ sơ tài khoản
              </h1>
              <p className="text-secondary-500 dark:text-secondary-400 font-medium">
                 Quản lý thông tin cá nhân, địa chỉ liên lạc và bảo mật tài khoản.
              </p>
            </div>
            
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-2xl text-sm font-bold text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              Bảo mật & Mật khẩu
            </button>
          </div>

          <div className="space-y-8">
            {/* Personal Information Card */}
            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-3">
                   Thông tin cá nhân
                </h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 uppercase tracking-widest"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-12 gap-10">
                {/* Avatar Section */}
                <div className="md:col-span-3 flex flex-col items-center">
                   <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl bg-primary-100 dark:bg-secondary-700 overflow-hidden border-4 border-white dark:border-secondary-600 shadow-xl flex items-center justify-center">
                         {loading && !isEditing ? (
                           <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                         ) : user.avatar_url ? (
                           <img 
                             src={user.avatar_url} 
                             alt={user.full_name || user.username} 
                             className="w-full h-full object-cover"
                           />
                         ) : user.full_name ? (
                           <span className="text-4xl font-black text-primary-600 dark:text-white italic">
                             {user.full_name.charAt(0).toUpperCase()}
                           </span>
                         ) : (
                           <User className="w-16 h-16 text-primary-500" />
                         )}
                      </div>
                      <label 
                        className={`absolute -bottom-2 -right-2 p-2.5 bg-white dark:bg-secondary-900 rounded-2xl shadow-lg text-secondary-600 dark:text-secondary-400 hover:text-primary-600 transition-all border border-secondary-100 dark:border-secondary-700 cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                         <Camera className="w-4 h-4" />
                         <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleAvatarUpload}
                           disabled={loading}
                         />
                      </label>
                   </div>
                </div>

                {/* Details Section */}
                <div className="md:col-span-9">
                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-secondary-400">Họ và tên</label>
                          <input 
                            type="text" 
                            required
                            value={profileForm.full_name} 
                            onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                            className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Alex Johnson"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-secondary-400">Số điện thoại</label>
                          <input 
                            type="tel" 
                            value={profileForm.phone} 
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="+1 (555) 123-4567"
                          />
                       </div>
                       <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                          <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-3 rounded-2xl text-sm font-bold text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-all"
                          >
                             Hủy bỏ
                          </button>
                          <button 
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary-200 dark:shadow-none"
                          >
                             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                             Lưu thông tin
                          </button>
                       </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Họ và tên</span>
                          <p className="text-lg font-bold text-secondary-900 dark:text-white">{user.full_name || 'Chưa cập nhật'}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Địa chỉ Email</span>
                          <p className="text-lg font-bold text-secondary-900 dark:text-white">{user.email}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Số điện thoại</span>
                          <p className="text-lg font-bold text-secondary-900 dark:text-white">{user.phone || 'Chưa cập nhật'}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Thành viên từ</span>
                          <p className="text-lg font-bold text-secondary-900 dark:text-white">
                             {new Date(user.created_at).toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Addresses Section */}
            <div>
               <div className="flex items-center justify-between mb-6 px-4">
                  <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-3">
                     Địa chỉ nhận hàng
                  </h2>
                  <button 
                    onClick={() => openAddressModal()}
                    className="btn btn-primary rounded-2xl px-5 py-2.5 text-xs flex items-center gap-2"
                  >
                     <Plus className="w-4 h-4" />
                     THÊM MỚI
                  </button>
               </div>
               
               <div className="grid md:grid-cols-2 gap-6">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`group bg-white dark:bg-secondary-800 border-2 ${addr.is_default ? 'border-primary-500 dark:border-primary-600' : 'border-secondary-100 dark:border-secondary-700'} rounded-[2rem] p-8 shadow-md relative overflow-hidden hover:shadow-xl transition-all duration-500`}>
                       {addr.is_default && (
                         <div className="absolute top-6 right-6 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                            Mặc định
                         </div>
                       )}
                       <div className={`w-12 h-12 ${addr.is_default ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'bg-secondary-50 dark:bg-secondary-900 text-secondary-400 group-hover:bg-primary-50 group-hover:text-primary-600'} rounded-2xl flex items-center justify-center transition-colors mb-6`}>
                          {addr.type === 'Nhà riêng' ? <Home className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                       </div>
                       <h3 className="text-lg font-black text-secondary-900 dark:text-white mb-3">{addr.type}</h3>
                       <p className="text-secondary-500 dark:text-secondary-400 text-sm leading-relaxed mb-6">
                          <span className="font-bold text-secondary-700 dark:text-secondary-300">{addr.full_name}</span> - {addr.phone}<br />
                          {addr.address_line1}, {addr.city}, {addr.province}, Việt Nam
                       </p>
                       <div className="flex items-center gap-4 pt-4 border-t border-secondary-50 dark:border-secondary-700">
                          <button 
                            onClick={() => openAddressModal(addr)}
                            className="text-xs font-bold text-secondary-900 dark:text-white hover:text-primary-600 transition-colors"
                          >
                            Sửa
                          </button>
                          {!addr.is_default && (
                            <>
                              <button 
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-xs font-bold text-secondary-400 hover:text-accent-red transition-colors"
                              >
                                Xóa
                              </button>
                              <button 
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-xs font-bold text-primary-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Đặt mặc định
                              </button>
                            </>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-[2.5rem] p-8 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-3">
                     Hoạt động gần đây
                  </h2>
               </div>

               <div className="space-y-6">
                  {activities.length > 0 ? activities.map((log) => (
                    <div key={log.id} className="flex items-start gap-5 group">
                       <div className="w-10 h-10 rounded-2xl bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                          {getActivityIcon(log.action)}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                             <h4 className="text-sm font-bold text-secondary-900 dark:text-white truncate">
                                {getActivityText(log)}
                             </h4>
                             <span className="text-[11px] text-secondary-400 whitespace-nowrap">
                                {new Date(log.created_at).toLocaleDateString('vi-VN')}
                             </span>
                          </div>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                             {log.action === 'login' ? 'Truy cập từ trình duyệt Chrome (Windows)' : 'Thông tin tài khoản đã được thay đổi.'}
                          </p>
                       </div>
                    </div>
                  )) : (
                    <div className="text-center py-10">
                       <p className="text-secondary-400 text-sm italic">Chưa có hoạt động nào được ghi lại.</p>
                    </div>
                  )}
               </div>

               <button className="w-full mt-8 py-4 bg-secondary-50 dark:bg-secondary-900 rounded-2xl text-[11px] font-black uppercase tracking-widest text-secondary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex items-center justify-center gap-2">
                  Xem tất cả hoạt động
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-secondary-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-secondary-100 dark:border-secondary-700 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-secondary-900 dark:text-white flex items-center gap-3">
                <MapPin className="w-6 h-6 text-primary-600" />
                {currentAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Loại địa chỉ</label>
                  <select 
                    value={addressForm.type}
                    onChange={(e) => setAddressForm({...addressForm, type: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 outline-none"
                  >
                    <option value="Nhà riêng">Nhà riêng</option>
                    <option value="Văn phòng">Văn phòng</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Họ và tên</label>
                  <input 
                    type="text" required
                    value={addressForm.full_name}
                    onChange={(e) => setAddressForm({...addressForm, full_name: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Số điện thoại</label>
                <input 
                  type="tel" required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Địa chỉ cụ thể</label>
                <input 
                  type="text" required
                  value={addressForm.address_line1}
                  onChange={(e) => setAddressForm({...addressForm, address_line1: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 outline-none"
                  placeholder="Số nhà, tên đường..."
                />
              </div>

              <div className="mt-4">
                  <AddressSelector 
                      province={addressForm.province} 
                      district={addressForm.city}
                      onChange={(addr) => setAddressForm({
                          ...addressForm, 
                          province: addr.province, 
                          city: addr.district
                          // Not saving ward in this form model yet, or append to address_line1 if desired
                      })} 
                  />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Lưu địa chỉ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-secondary-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-secondary-100 dark:border-secondary-700 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-secondary-900 dark:text-white flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary-600" />

                Bảo mật tài khoản
              </h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
                {/* 2FA Toggle */}
                <div className="p-5 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-secondary-900 dark:text-white">Xác thực 2 bước (2FA)</h4>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400">Nhận mã OTP qua email khi đăng nhập</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={user?.two_factor_enabled || false}
                                onChange={(e) => handleToggle2FA(e.target.checked)}
                                disabled={loading}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-secondary-200 dark:border-secondary-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white dark:bg-secondary-800 text-secondary-500 uppercase tracking-widest font-bold">Đổi mật khẩu</span>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Mật khẩu hiện tại</label>
                <input 
                  type="password" required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Mật khẩu mới</label>
                <input 
                  type="password" required minLength={6}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" required minLength={6}
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-700 outline-none"
                />
              </div>


              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-secondary-900 dark:bg-white hover:bg-black dark:hover:bg-secondary-200 text-white dark:text-secondary-900 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-secondary-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Cập nhật mật khẩu
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
