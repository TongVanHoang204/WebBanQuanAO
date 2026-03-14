import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, ArrowDownCircle, ArrowUpCircle, Edit3, X } from 'lucide-react';
import { inventoryAPI } from '../../../services/api';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  
  // Stock State
  const [stock, setStock] = useState<any[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  // Movements State
  const [movements, setMovements] = useState<any[]>([]);
  const [movePage, setMovePage] = useState(1);
  const [moveTotalPages, setMoveTotalPages] = useState(1);
  const [loadingMove, setLoadingMove] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [moveType, setMoveType] = useState<'in' | 'out' | 'adjust'>('in');
  const [moveQty, setMoveQty] = useState<number | ''>('');
  const [moveNote, setMoveNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStock = async (page = 1) => {
    setLoadingStock(true);
    try {
      const res = await inventoryAPI.getInventory({ page, limit: 10, search, lowStock });
      if (res.data.success) {
        setStock(res.data.data.inventory);
        setStockPage(page);
        setStockTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải dữ liệu tồn kho');
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchMovements = async (page = 1) => {
    setLoadingMove(true);
    try {
      const res = await inventoryAPI.getMovements({ page, limit: 10 });
      if (res.data.success) {
        setMovements(res.data.data.movements);
        setMovePage(page);
        setMoveTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải lịch sử xuất/nhập');
    } finally {
      setLoadingMove(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchStock();
    } else {
      fetchMovements();
    }
  }, [activeTab, search, lowStock]);

  const handleOpenModal = (variant: any) => {
    setSelectedVariant(variant);
    setMoveType('in');
    setMoveQty('');
    setMoveNote('');
    setIsModalOpen(true);
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || !moveQty) return;
    
    setIsSubmitting(true);
    try {
      const res = await inventoryAPI.createMovement({
        variant_id: selectedVariant.id,
        type: moveType,
        qty: Number(moveQty),
        note: moveNote
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchStock(stockPage);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý kho hàng</h1>
          <p className="text-gray-500">Giám sát tồn kho và lịch sử nhập/xuất tĩnh</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('stock')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stock'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Tồn kho hiện tại
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Lịch sử xuất/nhập
        </button>
      </div>

      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm SKU hoặc Tên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setLowStock(!lowStock)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  lowStock
                    ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20'
                    : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Sắp hết hàng
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">Sản phẩm</th>
                    <th className="px-6 py-4 font-medium">SKU</th>
                    <th className="px-6 py-4 font-medium">Thuộc tính</th>
                    <th className="px-6 py-4 font-medium">Tồn kho</th>
                    <th className="px-6 py-4 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingStock ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                  ) : stock.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Không tìm thấy dữ liệu</td></tr>
                  ) : (
                    stock.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-3">
                            {item.product?.cover_image ? (
                              <img src={item.product.cover_image} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <span className="truncate max-w-[200px]" title={item.product?.name}>{item.product?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{item.variant_sku}</td>
                        <td className="px-6 py-4 text-gray-500">{item.attributes || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            item.stock_qty < 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {item.stock_qty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Stock */}
            {stockTotalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                <button
                  disabled={stockPage === 1}
                  onClick={() => fetchStock(stockPage - 1)}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm">Trang {stockPage} / {stockTotalPages}</span>
                <button
                  disabled={stockPage === stockTotalPages}
                  onClick={() => fetchStock(stockPage + 1)}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium">Loại</th>
                  <th className="px-6 py-4 font-medium">Số lượng</th>
                  <th className="px-6 py-4 font-medium">Thời gian</th>
                  <th className="px-6 py-4 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loadingMove ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có bản ghi nào</td></tr>
                ) : (
                  movements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate" title={item.product_name}>
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{item.variant_sku}</td>
                      <td className="px-6 py-4">
                        {item.type === 'in' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full text-xs font-medium">
                            <ArrowDownCircle className="w-3 h-3" /> Nhập kho
                          </span>
                        ) : item.type === 'out' ? (
                          <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full text-xs font-medium">
                            <ArrowUpCircle className="w-3 h-3" /> Xuất kho
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full text-xs font-medium">
                            <Edit3 className="w-3 h-3" /> Điều chỉnh
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{item.qty}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Movements */}
          {moveTotalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
              <button
                disabled={movePage === 1}
                onClick={() => fetchMovements(movePage - 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm">Trang {movePage} / {moveTotalPages}</span>
              <button
                disabled={movePage === moveTotalPages}
                onClick={() => fetchMovements(movePage + 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* Movement Modal */}
      {isModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cập nhật kho</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMovement} className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{selectedVariant.product?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">SKU: {selectedVariant.variant_sku} | Tồn hiện tại: <span className="font-bold text-primary-600">{selectedVariant.stock_qty}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại thay đổi</label>
                  <select
                    value={moveType}
                    onChange={(e: any) => setMoveType(e.target.value)}
                    className="w-full input text-sm bg-white dark:bg-gray-800"
                  >
                    <option value="in">Nhập thêm (+)</option>
                    <option value="out">Xuất kho (-)</option>
                    <option value="adjust">Điều chỉnh trực tiếp (=)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {moveType === 'adjust' ? 'Số lượng tồn kho mới' : 'Số lượng thay đổi'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={moveQty}
                    onChange={(e) => setMoveQty(e.target.value ? Number(e.target.value) : '')}
                    className="w-full input bg-white dark:bg-gray-800"
                    placeholder="Nhập số lượng..."
                  />
                  {moveQty && (
                    <p className="text-xs mt-1 text-gray-500">
                      Tồn kho sau cập nhật: <strong className="text-gray-900 dark:text-white">
                        {moveType === 'in' ? selectedVariant.stock_qty + Number(moveQty) :
                         moveType === 'out' ? selectedVariant.stock_qty - Number(moveQty) :
                         Number(moveQty)}
                      </strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
                  <textarea
                    value={moveNote}
                    onChange={(e) => setMoveNote(e.target.value)}
                    className="w-full input bg-white dark:bg-gray-800 resize-none h-20"
                    placeholder="VD: Hàng lỗi trả về, Kiểm kho thiếu 2 cái..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">
                    Hủy
                  </button>
                  <button type="submit" disabled={isSubmitting || !moveQty} className="btn btn-primary min-w-[120px]">
                    {isSubmitting ? 'Đang lưu...' : 'Xác nhận'}
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
