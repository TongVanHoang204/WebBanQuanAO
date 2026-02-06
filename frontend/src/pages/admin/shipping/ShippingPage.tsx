import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Save,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
  base_fee: number;
  fee_per_kg: number;
  min_days: number;
  max_days: number;
  provinces: string | null;
  is_active: boolean;
  sort_order: number;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  base_fee: number;
  fee_per_kg: number;
  min_days: number;
  max_days: number;
  is_active: boolean;
  sort_order: number;
}

const initialForm: FormData = {
  name: '',
  code: '',
  description: '',
  base_fee: 0,
  fee_per_kg: 0,
  min_days: 1,
  max_days: 3,
  is_active: true,
  sort_order: 0
};

export default function ShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/shipping?include_inactive=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMethods(data.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleEdit = (method: ShippingMethod) => {
    setEditingId(method.id);
    setForm({
      name: method.name,
      code: method.code,
      description: method.description || '',
      base_fee: Number(method.base_fee),
      fee_per_kg: Number(method.fee_per_kg),
      min_days: method.min_days,
      max_days: method.max_days,
      is_active: method.is_active,
      sort_order: method.sort_order
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
    
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Vui lòng nhập tên và mã');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/admin/shipping/${editingId}` : '/api/admin/shipping';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingId ? 'Đã cập nhật' : 'Đã tạo mới');
        handleCancel();
        fetchMethods();
      } else {
        toast.error(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa phương thức "${name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/shipping/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Đã xóa');
        fetchMethods();
      } else {
        toast.error(data.error?.message || 'Không thể xóa');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Quản lý Vận chuyển
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            Cấu hình các phương thức và phí vận chuyển
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm phương thức
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
              {editingId ? 'Chỉnh sửa' : 'Thêm mới'} phương thức vận chuyển
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
                  Tên phương thức <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Giao hàng tiêu chuẩn"
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Mã (code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
                  placeholder="VD: standard"
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Mô tả
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Chi tiết về phương thức vận chuyển..."
                className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Phí cơ bản (VNĐ)
                </label>
                <input
                  type="number"
                  value={form.base_fee}
                  onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Phí/kg (VNĐ)
                </label>
                <input
                  type="number"
                  value={form.fee_per_kg}
                  onChange={(e) => setForm({ ...form, fee_per_kg: Number(e.target.value) })}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Ngày tối thiểu
                </label>
                <input
                  type="number"
                  value={form.min_days}
                  onChange={(e) => setForm({ ...form, min_days: Number(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Ngày tối đa
                </label>
                <input
                  type="number"
                  value={form.max_days}
                  onChange={(e) => setForm({ ...form, max_days: Number(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Kích hoạt
                </span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Thứ tự:
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  min="0"
                  className="w-20 px-3 py-1.5 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
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
      )}

      {/* Methods Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400">
              Chưa có phương thức vận chuyển nào
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Phương thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Phí cơ bản
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Phí/kg
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">
                    Thời gian
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
                {methods.map((method) => (
                  <tr key={method.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {method.name}
                        </p>
                        <code className="text-xs text-secondary-500 bg-secondary-100 dark:bg-secondary-700 px-1.5 py-0.5 rounded">
                          {method.code}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-secondary-900 dark:text-white">
                      {formatCurrency(Number(method.base_fee))}
                    </td>
                    <td className="px-6 py-4 text-secondary-900 dark:text-white">
                      {formatCurrency(Number(method.fee_per_kg))}
                    </td>
                    <td className="px-6 py-4 text-center text-secondary-600 dark:text-secondary-400">
                      {method.min_days}-{method.max_days} ngày
                    </td>
                    <td className="px-6 py-4 text-center">
                      {method.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <CheckCircle className="w-3 h-3" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400">
                          <XCircle className="w-3 h-3" />
                          Tắt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(method)}
                          className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id, method.name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
