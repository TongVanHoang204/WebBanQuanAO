
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Upload, X, Loader2, Save, Sparkles } from 'lucide-react';
import { categoriesAPI, productsAPI, adminAPI, brandsAPI, toMediaUrl } from '../../../services/api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import VariantManager from '../../../components/products/VariantManager';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
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
  const [existingImages, setExistingImages] = useState<any[]>([]); // URLs from DB
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // AI Auto-fill product content
  const handleAIGenerate = async () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên sản phẩm trước khi dùng AI');
      return;
    }
    setIsAIGenerating(true);
    try {
      const categoryName = categories.find((c: any) => String(c.id) === String(formData.category_id))?.name;
      const brandName = brands.find((b: any) => String(b.id) === String(formData.brand_id))?.name;
      const res = await adminAPI.aiProductContent(formData.name, categoryName, brandName, Number(formData.price) || undefined);
      const data = res.data.data;
      if (data) {
        setFormData(prev => ({
          ...prev,
          description: data.description || prev.description,
          meta_title: data.meta_title || prev.meta_title,
          meta_description: data.meta_description || prev.meta_description,
          meta_keywords: data.meta_keywords || prev.meta_keywords,
          tags: data.tags || prev.tags,
        }));
        toast.success('AI đã tạo nội dung thành công!');
      }
    } catch (error: any) {
      toast.error('AI tạo nội dung thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [catRes, prodRes, brandRes] = await Promise.all([
            categoriesAPI.getAll({ include_inactive: false }),
            productsAPI.getById(id!),
            brandsAPI.getAll({ include_inactive: false })
        ]);
        
        setBrands(brandRes.data.data?.brands || []);

        // 1. Setup Categories
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

        // 2. Setup Product Data
        const product = prodRes.data.data;
        if (!product) throw new Error("Product not found");

        setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            price: product.base_price,
            compare_at_price: product.compare_at_price || '',
            sku: product.sku,
            stock_qty: product.stock_qty || 0,
            track_stock: true, // Assuming always true or add field to DB
            is_active: product.is_active,
            category_id: product.category_id || '',
            brand_id: product.brand_id || '',
            meta_title: product.meta_title || '',
            meta_description: product.meta_description || '',
            meta_keywords: product.meta_keywords || '',
            tags: product.tags || '',
            weight: product.weight || '',
            length: product.length || '',
            width: product.width || '',
            height: product.height || '',
        });

        // 3. Setup Images
        if (product.product_images) {
            setExistingImages(product.product_images);
        }

        // 4. Setup Variants & Attributes
        if (product.product_attributes && product.product_attributes.length > 0) {
            // Group attributes by Option Name
            // Expected: product_attributes = [{ option: {name: 'Color'}, option_value: {value: 'Red'} }]
            const groupedOptions: Record<string, { id: string, name: string, values: Set<string> }> = {};
            
            product.product_attributes.forEach((attr: any) => {
                const optName = attr.option.name;
                const optVal = attr.option_value.value;
                
                if (!groupedOptions[optName]) {
                    groupedOptions[optName] = {
                        id: attr.option_id.toString(),
                        name: optName,
                        values: new Set()
                    };
                }
                groupedOptions[optName].values.add(optVal);
            });

            const parsedOptions = Object.values(groupedOptions).map(opt => ({
                id: opt.id,
                name: opt.name,
                values: Array.from(opt.values)
            }));
            setOptions(parsedOptions);
        }

        if (product.product_variants && product.product_variants.length > 0) {
            // Map variants for VariantManager
            // Need to reconstruct options map { "Color": "Red" } for each variant
            const mappedVariants = product.product_variants.map((v: any) => {
                 const variantOptions: Record<string, string> = {};
                 if (v.variant_option_values) {
                     v.variant_option_values.forEach((vov: any) => {
                         variantOptions[vov.option_value.option.name] = vov.option_value.value;
                     });
                 }
                 
                 return {
                     id: v.id.toString(),
                     name: Object.values(variantOptions).join(' / ') || 'Default',
                     sku: v.variant_sku,
                     price: v.price,
                     stock: v.stock_qty ?? 0,
                     options: variantOptions,
                     // existing fields
                     is_active: v.is_active
                 };
            });
            setVariants(mappedVariants);
        }

      } catch (error) {
        console.error('Failed to load data', error);
        toast.error('Không thể tải thông tin sản phẩm');
        navigate('/admin/products');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id, navigate]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Don't auto-update slug on Edit unless explicitly empty (rare)
    setFormData(prev => ({ ...prev, name }));
  };

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Add to images state
    setImages(prev => [...prev, ...files]);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove Image
  const removeImage = (index: number, isNew: boolean) => {
    if (isNew) {
      // Remove from new images
      setImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => {
        // Cleanup object URL
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      // Remove from existing images
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Submit Handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
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

  setError(null);

    setIsSaving(true);
    try {
        // 1. Upload New Images First
        let uploadedImageUrls: string[] = [];
        if (images.length > 0) {
            const { uploadAPI } = await import('../../../services/api');
            const uploadRes = await uploadAPI.multiple(images);

            // Access nested data: response.data = {success, data: {files, urls}}
            const uploadData = uploadRes.data.data || uploadRes.data;
            uploadedImageUrls = uploadData.urls || (uploadData.files?.map((f: any) => f.url)) || [];

        }

        // 2. Combine Images
        const combinedImages = [
            ...existingImages.map((img, idx) => ({ 
                url: img.url, 
                is_primary: idx === 0 && uploadedImageUrls.length === 0,
                sort_order: idx 
            })),
            ...uploadedImageUrls.map((url, idx) => ({
                url,
                is_primary: existingImages.length === 0 && idx === 0,
                sort_order: existingImages.length + idx
            }))
        ];

        const productData = {
            ...formData,
            variants: variants.map(v => ({
                id: (v.id && !v.id.toString().startsWith('var-')) ? Number(v.id) : undefined, // Parse to Number
                sku: v.sku, // Map back to SKU
                variant_sku: v.sku,
                price: v.price,
                stock_qty: v.stock,
                options: v.options,
                is_active: true
            })),
            attributes: options,
            images: combinedImages
        };
        

        await adminAPI.updateProduct(id!, productData);
        
        toast.success('Cập nhật sản phẩm thành công');
        navigate('/admin/products');
        
    } catch (error: any) {
        console.error('Update product error:', error);
        let message = error.response?.data?.error?.message || error.response?.data?.message;
        if (!message) {
            // Debug: Show what we actually got
            message = `Fallback Error: ${JSON.stringify(error.response?.data || error.message)}`;
        }
        setError(message);
        toast.error('Cập nhật thất bại');
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
      );
  }

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
            <span className="text-gray-900 font-medium">Chỉnh sửa</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
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
             Lưu thay đổi
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

      {/* ... Rest of the form ... */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* General Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin chung</h2>
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isAIGenerating || !formData.name}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isAIGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isAIGenerating ? 'AI đang tạo...' : 'AI Tự động điền'}
                  </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleNameChange}
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

                {/* Existing Images */}
                {existingImages.length > 0 && (
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        {existingImages.map((img, idx) => (
                            <div key={img.id || idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img src={toMediaUrl(img.url)} alt="Existing" className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx, false)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {idx === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                                        Ảnh cũ
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* New Images */}
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 border-t pt-4">
                        {imagePreviews.map((src, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx, true)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-green-600/60 text-white text-xs py-1 text-center">
                                    Mới
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Variants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h2 className="text-lg font-semibold text-gray-900 mb-4">Phiên bản sản phẩm</h2>
                 <p className="text-sm text-gray-500 mb-4">Quản lý các thuộc tính như Màu sắc, Kích thước.</p>
                 
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
