
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, X, Loader2, Save } from 'lucide-react';
import { categoriesAPI, productsAPI, adminAPI, brandsAPI } from '../../../services/api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import VariantManager from '../../../components/products/VariantManager';
import toast from 'react-hot-toast';

export default function AddProductPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Variant State
  const [options, setOptions] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_at_price: '',
    sku: '',
    stock_qty: 0,
    track_stock: true,
    is_active: true,
    category_id: '',
    // New Fields
    brand_id: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    tags: '',
    // Shipping
    weight: '',
    length: '',
    width: '',
    height: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Fetch Categories & Brands
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          categoriesAPI.getAll({ include_inactive: false }),
          brandsAPI.getAll({ include_inactive: false })
        ]);
        
        // Flatten categories strictly for dropdown
        const flatten = (cats: any[], prefix = ''): any[] => {
            let res: any[] = [];
            cats.forEach(cat => {
                res.push({ ...cat, name: prefix + cat.name });
                if (cat.children?.length) {
                    res = res.concat(flatten(cat.children, prefix + '-- '));
                }
            });
            return res;
        };
        setCategories(flatten(catRes.data.data || []));
        setBrands(brandRes.data.data?.brands || []);
      } catch (error) {
        console.error('Failed to load initial data', error);
      }
    };
    fetchInitialData();
  }, []);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from name if slug is empty
    if (name === 'name' && !formData.slug) {
        const slug = value.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Space to dash
            .replace(/^-+|-+$/g, ''); // Trim dashes
        setFormData(prev => ({ ...prev, slug }));
    }
  };

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!formData.name) {
        toast.error('Vui lòng nhập tên sản phẩm');
        return;
    }

    // Price validation
    const price = Number(formData.price);
    if (!price || price <= 0) {
        toast.error('Giá sản phẩm phải lớn hơn 0');
        return;
    }

    setIsSaving(true);
    try {
        // 1. Upload Images First (if any)
        let uploadedImageUrls: string[] = [];
        if (images.length > 0) {
            const { uploadAPI } = await import('../../../services/api');
            const uploadRes = await uploadAPI.multiple(images);
            // Access nested data: response.data = {success, data: {files, urls}}
            const uploadData = uploadRes.data.data || uploadRes.data;
            uploadedImageUrls = uploadData.urls || (uploadData.files?.map((f: any) => f.url)) || [];
        }

        // 2. Create Product Data with Images
        const productData = {
            ...formData,
            variants: variants.map(v => ({
                sku: v.sku,
                variant_sku: v.sku,
                price: v.price,
                stock_qty: v.stock,
                options: v.options,
                is_active: true
            })),
            attributes: options,
            images: uploadedImageUrls.map((url, idx) => ({
                url,
                is_primary: idx === 0,
                sort_order: idx
            }))
        };

        console.log('Submitting Product:', productData);
        await adminAPI.createProduct(productData);
        
        toast.success('Sản phẩm đã được tạo thành công');
        navigate('/admin/products');
        
    } catch (error: any) {
        console.error('Create product error:', error);
        const message = error.response?.data?.error?.message || error.response?.data?.message || 'Tạo sản phẩm thất bại';
        setError(message);
        toast.error(message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin/dashboard" className="hover:text-primary-600">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/admin/products" className="hover:text-primary-600">Sản phẩm</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Thêm mới</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             type="button"
             onClick={() => navigate('/admin/products')}
             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
           >
             Hủy bỏ
           </button>
           <button 
             onClick={handleSubmit}
             disabled={isSaving}
             className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Lưu sản phẩm
           </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
            <X className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* General Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chung</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Ví dụ: Áo thun nam Cotton..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Đường dẫn)</label>
                        <input 
                            type="text" 
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
                        <RichTextEditor 
                            value={formData.description}
                            onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                            placeholder="Nhập mô tả chi tiết sản phẩm..."
                        />
                    </div>
                </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh sản phẩm</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-3">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Click để tải lên hoặc kéo thả hình ảnh vào đây</p>
                        <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG hoặc GIF (Tối đa 800x400px)</p>
                    </div>
                </div>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        {imagePreviews.map((src, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Variants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h2 className="text-lg font-semibold text-gray-900 mb-4">Phiên bản sản phẩm</h2>
                 <p className="text-sm text-gray-500 mb-4">Quản lý các thuộc tính như Màu sắc, Kích thước. Nếu sản phẩm có nhiều phiên bản, hãy thêm chúng ở đây.</p>
                 
                 <VariantManager 
                   options={options} 
                   setOptions={setOptions}
                   variants={variants}
                   setVariants={setVariants}
                 />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tối ưu hóa SEO</h2>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                        <input 
                            type="text"
                            name="meta_title"
                            value={formData.meta_title}
                            onChange={handleChange} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                            placeholder={formData.name || 'Tiêu đề sản phẩm'} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Tiêu đề hiển thị trên Google (Tối đa 60 ký tự)</p>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                        <textarea 
                            rows={3}
                            name="meta_description"
                            value={formData.meta_description}
                            onChange={handleChange} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                            placeholder="Mô tả ngắn gọn về sản phẩm..." 
                        />
                        <p className="text-xs text-gray-500 mt-1">Mô tả hiển thị trên Google (Tối đa 160 ký tự)</p>
                     </div>
                </div>
            </div>

        </div>

        {/* Right Column - Settings */}
        <div className="space-y-8">
            
            {/* Organization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổ chức</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select 
                            name="is_active"
                            value={formData.is_active ? 'true' : 'false'}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="true">Đã xuất bản (Published)</option>
                            <option value="false">Bản nháp (Draft)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select 
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Chọn danh mục...</option>
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Brand Selection - NEW */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                        <select 
                            name="brand_id"
                            value={formData.brand_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Chọn thương hiệu...</option>
                            {brands.map((brand: any) => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Giá bán</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán lẻ (VNĐ)</label>
                        <input 
                            type="number" 
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (Nếu giảm giá)</label>
                        <input 
                            type="number" 
                            name="compare_at_price"
                            value={formData.compare_at_price}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kho hàng</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã SKU</label>
                        <input 
                            type="text" 
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Mã sản phẩm..."
                        />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-700">Theo dõi tồn kho</span>
                        <div className="relative inline-block w-10 align-middle select-none">
                            <input 
                                type="checkbox" 
                                checked={formData.track_stock}
                                onChange={(e) => setFormData(prev => ({ ...prev, track_stock: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                        </div>
                    </div>

                    {formData.track_stock && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho</label>
                            <input 
                                type="number" 
                                name="stock_qty"
                                value={formData.stock_qty}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
