import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Save,
  X,
  Search,
  Filter,
  ChevronDown,
  Shield,
  UserCheck,
  UserX,
  Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { useAuth } from '../../../contexts/AuthContext';
import { adminAPI } from '../../../services/api';
import AIInsightPanel from '../../../components/common/AIInsightPanel';

interface Staff {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  status: 'active' | 'blocked';
  created_at: string;
  role_def?: { name: string; description: string | null };
}

interface Role {
  name: string;
  description: string | null;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
}

const initialForm: FormData = {
  username: '',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  role: 'staff'
};

export default function StaffListPage() {
  const { isAdmin } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    isDestructive: false,
    onConfirm: () => {},
  });


  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;

      const res = await adminAPI.getStaff(params);
      const data = res.data;
      if (data.success) {
        setStaffList(data.data.staff);
        setRoles(data.data.roles);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEdit = (staff: Staff) => {
    setEditingId(staff.id);
    setForm({
      username: staff.username,
      email: staff.email,
      password: '',
      full_name: staff.full_name || '',
      phone: staff.phone || '',
      role: staff.role
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId && (!form.username || !form.email || !form.password)) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      toast.error('Email không đúng định dạng');
      return;
    }

    // Vietnamese phone number validation (starts with 0, 10-11 digits)
    if (form.phone) {
      const phoneRegex = /^0[0-9]{9,10}$/;
      if (!phoneRegex.test(form.phone)) {
        toast.error('Số điện thoại không hợp lệ (VD: 0901234567)');
        return;
      }
    }

    setSaving(true);
    try {
      const body = editingId
        ? { full_name: form.full_name, phone: form.phone, role: form.role, password: form.password || undefined }
        : form;

      let res;
      if (editingId) {
        res = await adminAPI.updateStaff(editingId, body);
      } else {
        res = await adminAPI.createStaff(body);
      }
      const data = res.data;
      
      if (data.success) {
        toast.success(editingId ? 'Đã cập nhật' : 'Đã tạo mới');
        handleCancel();
        fetchStaff();
      } else {
        toast.error(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };



  const handleToggleStatus = (staff: Staff) => {
    const isBlocking = staff.status === 'active';
    const action = isBlocking ? 'khóa' : 'mở khóa';
    
    setConfirmModal({
      isOpen: true,
      title: isBlocking ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
      message: `Bạn có chắc chắn muốn ${action} tài khoản "${staff.full_name || staff.username}"? ${isBlocking ? 'Người dùng sẽ không thể đăng nhập.' : ''}`,
      confirmText: isBlocking ? 'Khóa tài khoản' : 'Mở khóa',
      isDestructive: isBlocking,
      onConfirm: async () => {
        try {
          const newStatus = staff.status === 'active' ? 'blocked' : 'active';
          const res = await adminAPI.toggleStaffStatus(staff.id, newStatus);
          const data = res.data;
          if (data.success) {
            toast.success(newStatus === 'active' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
            fetchStaff();
          } else {
            toast.error(data.error?.message || 'Có lỗi xảy ra');
          }
        } catch (error) {
          toast.error('Có lỗi trong quá trình xử lý');
        }
      }
    });
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      staff: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      manager: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || 'bg-secondary-100 text-secondary-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Quản lý Nhân viên
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            Quản lý tài khoản nhân viên và phân quyền
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800/80 rounded-2xl p-4 shadow-sm border border-secondary-200/80 dark:border-secondary-700/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none w-full h-11 pl-10 pr-10 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-900/70 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            >
              <option value="all">Tất cả vai trò</option>
              {roles.map(role => (
                <option key={role.name} value={role.name}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* AI Staff Performance */}
      <AIInsightPanel
        title="📊 AI Đánh giá hiệu suất nhân viên"
        cacheKey="staff_performance"
        onAnalyze={async () => {
          const res = await adminAPI.aiStaffAnalyze();
          return res.data.data;
        }}
        type="custom"
        renderContent={(data: any) => (
          <div className="space-y-3">
            {data.summary && <p className="text-sm text-secondary-700 dark:text-secondary-300">{data.summary}</p>}
            {data.staff_scores && data.staff_scores.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Bảng xếp hạng</p>
                <div className="space-y-2">
                  {data.staff_scores.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        i === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                        i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-secondary-900 dark:text-white text-sm">{s.name || s.username}</p>
                        <p className="text-xs text-secondary-500">{s.role} • {s.action_count ?? 0} thao tác</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          (typeof s.score === 'number' ? s.score : 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                          (typeof s.score === 'number' ? s.score : 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {s.score}
                        </span>
                        {typeof s.score === 'number' && <p className="text-[10px] text-secondary-400">/100</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(data.highlights || data.team_insights) && (data.highlights || data.team_insights).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-1">⭐ Điểm nổi bật</p>
                <ul className="space-y-1">
                  {(data.highlights || data.team_insights).map((h: any, i: number) => (
                    <li key={i} className="text-sm text-secondary-600 dark:text-secondary-300">• {typeof h === 'string' ? h : h.description || JSON.stringify(h)}</li>
                  ))}
                </ul>
              </div>
            )}
            {(data.suggestions || data.recommendations) && (data.suggestions || data.recommendations).length > 0 && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Gợi ý cải thiện</p>
                <ul className="space-y-1">
                  {(data.suggestions || data.recommendations).map((s: any, i: number) => (
                    <li key={i} className="text-sm text-secondary-700 dark:text-secondary-300">• {typeof s === 'string' ? s : s.description || JSON.stringify(s)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl border border-secondary-200 dark:border-secondary-700 p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                {editingId ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    disabled={!!editingId}
                    placeholder="username"
                    className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white disabled:bg-secondary-100 dark:disabled:bg-secondary-800 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={!!editingId}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white disabled:bg-secondary-100 dark:disabled:bg-secondary-800 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    <Key className="w-4 h-4 inline mr-1" />
                    Mật khẩu {!editingId && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingId ? 'Để trống nếu không đổi' : 'Mật khẩu'}
                    className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Vai trò
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {roles.map(role => (
                      <option key={role.name} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        {role.description ? ` - ${role.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Điện thoại
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400">
              {search ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {staff.full_name || staff.username}
                        </p>
                        <p className="text-xs text-secondary-500">@{staff.username}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-secondary-600 dark:text-secondary-400">
                      {staff.email}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getRoleBadge(staff.role)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {staff.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <UserCheck className="w-3 h-3" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          <UserX className="w-3 h-3" />
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            className={`p-2 rounded-lg transition-colors ${
                              staff.status === 'active'
                                ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={staff.status === 'active' ? 'Khóa' : 'Mở khóa'}
                          >
                            {staff.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(staff)}
                          className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}
