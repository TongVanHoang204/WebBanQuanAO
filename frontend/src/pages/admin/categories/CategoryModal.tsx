
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { categoriesAPI } from '../../../services/api';
import toast from 'react-hot-toast';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any | null; // If provided, edit mode
  categories: any[]; // For parent selection
}

export default function CategoryModal({ isOpen, onClose, onSuccess, category, categories }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    sort_order: 0,
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        parent_id: category.parent_id || '',
        sort_order: category.sort_order || 0,
        is_active: category.is_active
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        parent_id: '',
        sort_order: 0,
        is_active: true
      });
    }
  }, [category, isOpen]);

  // Auto-generate slug from name if not manually edited (simple version)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!category && !formData.slug) {
       const slug = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Trim hyphens
       setFormData(prev => ({ ...prev, name, slug }));
    } else {
       setFormData(prev => ({ ...prev, name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id ? formData.parent_id : null
      };

      if (category) {
        await categoriesAPI.update(category.id, payload);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await categoriesAPI.create(payload);
        toast.success('Tạo danh mục thành công');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Save category error:', error);
      toast.error(error.response?.data?.message || 'Lưu danh mục thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Flatten categories for dropdown (simplified)
  const flattenCategories = (cats: any[], depth = 0): any[] => {
     let flat: any[] = [];
     cats.forEach(cat => {
        flat.push({ ...cat, depth });
        if (cat.children) {
           flat = flat.concat(flattenCategories(cat.children, depth + 1));
        }
     });
     return flat;
  };
  
  const flatCategories = flattenCategories(categories);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ví dụ: Thời trang nam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Đường dẫn)</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="thoi-trang-nam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Không (Danh mục gốc)</option>
              {flatCategories.map(cat => (
                <option key={cat.id} value={cat.id} disabled={category && category.id === cat.id}>
                  {'- '.repeat(cat.depth)}{cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự sắp xếp</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
             </div>
             <div className="flex items-center pt-6">
                <label className="flex items-center cursor-pointer gap-2">
                   <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                      <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-4' : ''}`}></div>
                   </div>
                   <span className="text-sm text-gray-700">Kích hoạt</span>
                </label>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {category ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
