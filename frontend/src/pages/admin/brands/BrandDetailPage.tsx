
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Upload,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { brandsAPI, uploadAPI } from '../../../services/api';

interface BrandForm {
  name: string;
  slug: string;
  logo: string;
  description: string;
  is_active: boolean;
}

export default function BrandDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BrandForm>({
    name: '',
    slug: '',
    logo: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (!isNew && id) {
      fetchBrand();
    }
  }, [id]);

  const fetchBrand = async () => {
    try {
      const res = await brandsAPI.getById(id!);
      const data = res.data;
      
      if (data.success) {
        setForm({
          name: data.data.name,
          slug: data.data.slug,
          logo: data.data.logo || '',
          description: data.data.description || '',
          is_active: data.data.is_active
        });
      } else {
        toast.error('Không tìm thấy thương hiệu');
        navigate('/admin/brands');
      }
    } catch (error) {
        console.error('Fetch brand error:', error);
      toast.error('Lỗi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({
      ...prev,
      name,
      slug: isNew ? generateSlug(name) : prev.slug
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadAPI.single(file);
      const data = res.data;
      
      if (data.success) {
        setForm(prev => ({ ...prev, logo: data.data.url }));
        toast.success('Đã tải lên logo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Lỗi tải lên ảnh');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên thương hiệu');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (isNew) {
        res = await brandsAPI.create(form);
      } else {
        res = await brandsAPI.update(id!, form);
      }
      
      const data = res.data;
      
      if (data.success) {
        toast.success(isNew ? 'Đã tạo thương hiệu' : 'Đã cập nhật thương hiệu');
        navigate('/admin/brands');
      } else {
        toast.error(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('Save brand error:', error);
      toast.error(error.response?.data?.error?.message || 'Lỗi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/brands"
          className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {isNew ? 'Thêm thương hiệu mới' : 'Chỉnh sửa thương hiệu'}
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            {isNew ? 'Tạo thương hiệu mới cho sản phẩm' : `Cập nhật thông tin thương hiệu`}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Logo thương hiệu
          </label>
          <div className="flex items-center gap-4">
            {form.logo ? (
              <img
                src={form.logo}
                alt="Logo"
                className="w-20 h-20 rounded-xl object-contain bg-secondary-100 dark:bg-secondary-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
                <Tag className="w-8 h-8 text-secondary-400" />
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors">
                <Upload className="w-4 h-4" />
                Tải lên logo
              </span>
            </label>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Tên thương hiệu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={handleNameChange}
            placeholder="VD: Nike, Adidas, Gucci..."
            className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Slug (URL)
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="nike, adidas, gucci..."
            className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          />
          <p className="mt-1 text-xs text-secondary-500">
            Đường dẫn URL thân thiện (tự động tạo từ tên)
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Mô tả
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Thông tin về thương hiệu..."
            className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
            className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Hiển thị thương hiệu trên website
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <Link
            to="/admin/brands"
            className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isNew ? 'Tạo thương hiệu' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
