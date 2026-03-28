import React, { useEffect, useMemo, useState } from 'react';
import { Check, Edit, FolderHeart, Package, Plus, Search, Trash, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AIInsightPanel from '../../../components/common/AIInsightPanel';
import { adminAPI, collectionsAPI, toMediaUrl } from '../../../services/api';
import type { Collection, Product } from '../../../types';

type CollectionForm = {
  name: string;
  slug: string;
  description: string;
  image: string;
  is_active: boolean;
  is_featured: boolean;
  featured_sort_order: number;
};

const emptyForm: CollectionForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  is_active: true,
  is_featured: false,
  featured_sort_order: 0
};

const normalizeProduct = (product: any): Product => ({
  ...product,
  id: String(product.id),
  slug: product.slug || '',
  category: product.category || undefined,
  product_images:
    product.product_images ||
    (product.cover_image
      ? [
          {
            id: 'cover',
            product_id: String(product.id),
            url: product.cover_image,
            alt_text: null,
            is_primary: true,
            sort_order: 0
          }
        ]
      : []),
  product_variants: product.product_variants || []
});

export default function CollectionListPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<CollectionForm>(emptyForm);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map((product) => product.id)),
    [selectedProducts]
  );

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await collectionsAPI.getCollections({ limit: 50 });
      if (response.data.success) {
        setCollections(response.data.data.collections || []);
      }
    } catch {
      toast.error('Lỗi khi tải bộ sưu tập');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductOptions = async (keyword = '') => {
    setProductLoading(true);
    try {
      const response = await adminAPI.getProducts({
        search: keyword || undefined,
        limit: 24
      });

      const rawProducts = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data?.products || [];

      setProductOptions(rawProducts.map(normalizeProduct));
    } catch {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const timeout = setTimeout(() => {
      fetchProductOptions(productSearch.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [isModalOpen, productSearch]);

  const handleOpenModal = async (collection?: Collection) => {
    setProductSearch('');
    setProductOptions([]);

    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        image: collection.image || '',
        is_active: collection.is_active ?? true,
        is_featured: collection.is_featured ?? false,
        featured_sort_order: collection.featured_sort_order ?? 0
      });

      try {
        const detailRes = await collectionsAPI.getCollectionById(collection.id);
        setSelectedProducts((detailRes.data.data.products || []).map(normalizeProduct));
      } catch {
        toast.error('Không thể tải chi tiết bộ sưu tập');
        setSelectedProducts([]);
      }
    } else {
      setEditingCollection(null);
      setFormData(emptyForm);
      setSelectedProducts([]);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
    setFormData(emptyForm);
    setSelectedProducts([]);
    setProductSearch('');
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev.filter((item) => item.id !== product.id);
      }

      return [...prev, product];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        image: formData.image.trim() || undefined,
        product_ids: selectedProducts.map((product) => product.id)
      };

      if (editingCollection) {
        await collectionsAPI.updateCollection(editingCollection.id, payload);
        toast.success('Cập nhật thành công');
      } else {
        await collectionsAPI.createCollection(payload);
        toast.success('Tạo thành công');
      }

      closeModal();
      fetchCollections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) return;

    try {
      await collectionsAPI.deleteCollection(id);
      toast.success('Xóa thành công');
      fetchCollections();
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bộ sưu tập</h1>
          <p className="text-sm text-gray-500">
            Quản lý nhóm sản phẩm, collection nổi bật và trang công khai theo chủ đề.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      <AIInsightPanel
        title="Phân tích bộ sưu tập"
        style="strategic"
        prompt="Dựa trên danh sách bộ sưu tập hiện tại, hãy đánh giá độ phủ sản phẩm, collection nào nên đưa lên trang chủ và gợi ý thứ tự hiển thị hợp lý."
        dataContext={JSON.stringify(
          collections.map((collection) => ({
            name: collection.name,
            product_count: collection.product_count,
            is_active: collection.is_active,
            is_featured: collection.is_featured,
            featured_sort_order: collection.featured_sort_order
          }))
        )}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Tên bộ sưu tập</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium">Số sản phẩm</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  Đang tải...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  Chưa có bộ sưu tập nào
                </td>
              </tr>
            ) : (
              collections.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:ring-primary-900/40">
                        {item.image ? (
                          <img src={toMediaUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <FolderHeart className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p>{item.name}</p>
                        {item.description && (
                          <p className="max-w-md truncate text-xs font-normal text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.slug}</td>
                  <td className="px-6 py-4">{item.product_count || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.is_active ? 'Hoạt động' : 'Ẩn'}
                      </span>
                      {item.is_featured && (
                        <span className="inline-flex rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700">
                          Nổi bật #{item.featured_sort_order || 0}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleOpenModal(item)} className="p-2 text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:text-red-800">
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="mx-auto flex min-h-[calc(100vh-2rem)] items-start justify-center py-2 lg:items-center lg:py-6">
            <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingCollection ? 'Cập nhật bộ sưu tập' : 'Tạo bộ sưu tập mới'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gắn sản phẩm vào collection để dùng cho landing page, block chủ đề và trang công khai.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1.08fr_1fr]">
                  <div className="min-h-0 space-y-4 overflow-y-auto border-b border-gray-200 p-6 dark:border-gray-800 lg:border-b-0 lg:border-r">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Tên bộ sưu tập</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full input bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full input bg-white dark:bg-gray-800"
                        placeholder="Bỏ trống sẽ tự tạo"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Ảnh đại diện / URL</label>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full input bg-white dark:bg-gray-800"
                        placeholder="https://..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Nếu để trống, storefront sẽ ưu tiên ảnh sản phẩm đầu tiên trong collection.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Mô tả</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="h-28 w-full input resize-none bg-white dark:bg-gray-800"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600"
                      />
                      Hoạt động ngoài storefront
                    </label>

                    <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60 sm:grid-cols-[1fr_180px]">
                      <label className="flex items-start gap-3 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
                        />
                        <span>
                          <span className="block text-gray-900 dark:text-white">Đánh dấu nổi bật trên trang chủ</span>
                          <span className="mt-1 block text-xs font-normal text-gray-500">
                            Chỉ collection bật cờ này mới xuất hiện trong block “Bộ sưu tập nổi bật”.
                          </span>
                        </span>
                      </label>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Thứ tự nổi bật</label>
                        <input
                          type="number"
                          min={0}
                          value={formData.featured_sort_order}
                          onChange={(e) =>
                            setFormData({ ...formData, featured_sort_order: Number(e.target.value) || 0 })
                          }
                          className="w-full input bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Đã chọn {selectedProducts.length} sản phẩm
                        </h4>
                      </div>
                      {selectedProducts.length === 0 ? (
                        <p className="text-sm text-gray-500">Chưa có sản phẩm nào trong collection này.</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {selectedProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800"
                            >
                              <div className="h-12 w-12 overflow-hidden rounded-xl bg-gray-100">
                                {product.product_images?.[0]?.url ? (
                                  <img
                                    src={toMediaUrl(product.product_images[0].url)}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <Package className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.category?.name || 'Không có danh mục'}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleProductSelection(product)}
                                className="rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col overflow-hidden p-6">
                    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/60">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Tìm sản phẩm theo tên..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                      />
                    </div>

                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                      {productLoading ? (
                        <div className="py-10 text-center text-sm text-gray-500">Đang tải sản phẩm...</div>
                      ) : productOptions.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp.</div>
                      ) : (
                        productOptions.map((product) => {
                          const selected = selectedProductIds.has(product.id);

                          return (
                            <button
                              type="button"
                              key={product.id}
                              onClick={() => toggleProductSelection(product)}
                              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                                selected
                                  ? 'border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-100'
                                  : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800'
                              }`}
                            >
                              <div className="h-14 w-14 overflow-hidden rounded-xl bg-gray-100">
                                {product.product_images?.[0]?.url ? (
                                  <img
                                    src={toMediaUrl(product.product_images[0].url)}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <Package className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{product.name}</p>
                                <p className="truncate text-xs text-gray-500">
                                  {product.category?.name || 'Không có danh mục'}
                                </p>
                              </div>
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                  selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 text-transparent'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    Hủy
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary min-w-32">
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
