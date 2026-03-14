import React, { useState, useEffect } from 'react';
import { collectionsAPI } from '../../../services/api';
import { Edit, Trash, Plus, FolderHeart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AIInsightPanel from '../../../components/common/AIInsightPanel';

export default function CollectionListPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', is_active: true });

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await collectionsAPI.getCollections();
      if (res.data.success) {
        setCollections(res.data.data.collections);
      }
    } catch (err) {
      toast.error('Lỗi khi tải bộ sưu tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleOpenModal = (collection?: any) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({ name: collection.name, slug: collection.slug, description: collection.description || '', is_active: collection.is_active });
    } else {
      setEditingCollection(null);
      setFormData({ name: '', slug: '', description: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await collectionsAPI.updateCollection(editingCollection.id, formData);
        toast.success('Cập nhật thành công');
      } else {
        await collectionsAPI.createCollection(formData);
        toast.success('Tạo thành công');
      }
      setIsModalOpen(false);
      fetchCollections();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) return;
    try {
      await collectionsAPI.deleteCollection(id);
      toast.success('Xóa thành công');
      fetchCollections();
    } catch (err) {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bộ sưu tập</h1>
          <p className="text-gray-500 text-sm">Quản lý các chiến dịch & nhóm sản phẩm</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      <AIInsightPanel 
        title="Phân tích Bộ sưu tập"
        style="strategic"
        prompt="Dựa trên danh sách các bộ sưu tập hiện tại, hãy đánh giá sự phân bổ sản phẩm, xu hướng nhóm hàng và gợi ý cách tối ưu doanh thu hoặc tạo mới bộ sưu tập sắp tới."
        dataContext={JSON.stringify(collections.map(c => ({ name: c.name, product_count: c.product_count, is_active: c.is_active })))}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
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
              <tr><td colSpan={5} className="px-6 py-8 text-center">Đang tải...</td></tr>
            ) : collections.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center">Chưa có bộ sưu tập nào</td></tr>
            ) : (
              collections.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FolderHeart className="w-4 h-4 text-primary-500" /> {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.slug}</td>
                  <td className="px-6 py-4">{item.product_count}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.is_active ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-800 p-2">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 p-2">
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editingCollection ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên bộ sưu tập</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full input bg-white dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đường dẫn tĩnh (Slug)</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full input bg-white dark:bg-gray-800" placeholder="Bo trống sẽ tự tạo" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full input bg-white dark:bg-gray-800 h-20" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded border-gray-300" />
                <label htmlFor="is_active" className="text-sm font-medium">Hoạt động (Hiển thị ra trang chủ)</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
