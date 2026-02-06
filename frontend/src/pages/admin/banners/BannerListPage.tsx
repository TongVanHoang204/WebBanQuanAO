import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Save,
  X,
  Upload,
  Eye,
  EyeOff,
  GripVertical,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  position: string;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  banner_images?: { image_url: string; sort_order: number }[];
}

interface FormData {
  title: string;
  subtitle: string;
  image_url: string;
  images: string[];
  link_url: string;
  button_text: string;
  position: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const initialForm: FormData = {
  title: '',
  subtitle: '',
  image_url: '',
  images: [],
  link_url: '',
  button_text: '',
  position: 'home_hero',
  is_active: true,
  start_date: '',
  end_date: ''
};

const positionLabels: Record<string, string> = {
  home_hero: 'Trang chủ - Hero',
  home_promo: 'Trang chủ - Khuyến mãi',
  category_top: 'Đầu danh mục',
  sale_hero: 'Trang Sale - Hero',
  shop_hero: 'Cửa hàng - Hero'
};

export default function BannerListPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  // ... (states remain same)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [positionFilter, setPositionFilter] = useState<string>('');

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ include_inactive: 'true' });
      if (positionFilter) params.append('position', positionFilter);

      const res = await fetch(`/api/admin/banners?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [positionFilter]);

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    const existingImages = banner.banner_images?.map(bi => bi.image_url) || [];
    // If no specific banner_images, fallback to single image_url
    const images = existingImages.length > 0 ? existingImages : (banner.image_url ? [banner.image_url] : []);

    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      images: images,
      link_url: banner.link_url || '',
      button_text: banner.button_text || '',
      position: banner.position,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    const newImages: string[] = [];

    // Upload each file
    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                newImages.push(data.data.url);
            }
        } catch (error) {
            console.error('Upload error', error);
        }
    }

    if (newImages.length > 0) {
        setForm(prev => ({
            ...prev,
            images: [...prev.images, ...newImages],
            image_url: prev.images.length === 0 ? newImages[0] : prev.image_url // Set first image as primary if none
        }));
        toast.success(`Đã tải lên ${newImages.length} ảnh`);
    } else {
        toast.error('Lỗi tải lên ảnh');
    }
  };

  const removeImage = (index: number) => {
      setForm(prev => {
          const newImages = [...prev.images];
          newImages.splice(index, 1);
          return {
              ...prev,
              images: newImages,
              image_url: newImages.length > 0 ? newImages[0] : ''
          };
      });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
      setForm(prev => {
          const newImages = [...prev.images];
          if (direction === 'up' && index > 0) {
              [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
          } else if (direction === 'down' && index < newImages.length - 1) {
              [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
          }
          return {
              ...prev,
              images: newImages,
              image_url: newImages[0]
          };
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || (form.images.length === 0 && !form.image_url)) {
      toast.error('Vui lòng nhập tiêu đề và ít nhất 1 ảnh');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/admin/banners/${editingId}` : '/api/admin/banners';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          // Explicitly send images array
          images: form.images, 
          image_url: form.images.length > 0 ? form.images[0] : form.image_url,
          start_date: form.start_date || null,
          end_date: form.end_date || null
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingId ? 'Đã cập nhật' : 'Đã tạo mới');
        handleCancel();
        fetchBanners();
      } else {
        toast.error(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xóa banner "${title}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Đã xóa');
        fetchBanners();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !banner.is_active })
      });
      fetchBanners();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter ... (keep existing) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Quản lý Banner</h1>
          <p className="text-secondary-500 dark:text-secondary-400">Quảng cáo và slider cho trang chủ</p>
        </div>
        <button onClick={handleNew} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" /> Thêm banner
        </button>
      </div>

     <div className="flex gap-2">
        <button onClick={() => setPositionFilter('')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${positionFilter === '' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300'}`}>Tất cả</button>
        {Object.entries(positionLabels).map(([key, label]) => (
          <button key={key} onClick={() => setPositionFilter(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${positionFilter === key ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300'}`}>{label}</button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
              {editingId ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Danh sách ảnh ({form.images.length}) <span className="text-red-500">*</span>
              </label>
              
              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {form.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-secondary-200">
                          <img src={img} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {idx > 0 && <button type="button" onClick={() => moveImage(idx, 'up')} className="p-1 bg-white rounded-full"><ArrowRight className="w-4 h-4 rotate-180" /></button>}
                              <button type="button" onClick={() => removeImage(idx)} className="p-1 bg-red-500 text-white rounded-full"><Trash2 className="w-4 h-4" /></button>
                              {idx < form.images.length - 1 && <button type="button" onClick={() => moveImage(idx, 'down')} className="p-1 bg-white rounded-full"><ArrowRight className="w-4 h-4" /></button>}
                          </div>
                      </div>
                  ))}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-all aspect-video">
                      <ImageIcon className="w-8 h-8 text-secondary-400 mb-2" />
                      <span className="text-xs text-secondary-500">Thêm ảnh</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
              </div>
              <p className="mt-1 text-xs text-secondary-500">Ảnh đầu tiên sẽ là ảnh chính. Khuyên dùng kích thước 1920x800px.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* ... (Title, Subtitle inputs - keep same) */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Giảm giá 50% mùa hè"
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Phụ đề
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Mô tả ngắn..."
                  className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* ... (Link, CTA, Position inputs - keep same) */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Link đích</label>
                <input type="text" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Nút CTA</label>
                <input type="text" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Vị trí</label>
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white">
                  {Object.entries(positionLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ... (Dates - keep same) */}
               <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Ngày bắt đầu</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Ngày kết thúc</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500" />
              <label htmlFor="is_active" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Kích hoạt banner</label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors">Hủy</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Lưu thay đổi' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners Grid */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400">
              Chưa có banner nào
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {banners.map((banner) => (
              <div key={banner.id} className="p-4 flex items-center gap-4 hover:bg-secondary-50 dark:hover:bg-secondary-900/50 transition-colors">
                <GripVertical className="w-5 h-5 text-secondary-300 cursor-move" />
                
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-32 h-16 rounded-lg object-cover bg-secondary-100 dark:bg-secondary-700"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-secondary-900 dark:text-white truncate">
                      {banner.title}
                    </h4>
                    {!banner.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-700 text-secondary-600">
                        Tắt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-xs">
                      {positionLabels[banner.position] || banner.position}
                    </span>
                    {banner.link_url && (
                      <span className="truncate max-w-xs">→ {banner.link_url}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`p-2 rounded-lg transition-colors ${
                      banner.is_active 
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                        : 'text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                    }`}
                    title={banner.is_active ? 'Tắt' : 'Bật'}
                  >
                    {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id, banner.title)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
