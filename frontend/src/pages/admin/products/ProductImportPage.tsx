import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

export default function ProductImportPage() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const [importResult, setImportResult] = useState<{
    total: number;
    created: number;
    updated: number;
    unchanged: number;
    errors: { row: number; sku: string; error: string }[];
    validRows: { 
      row: number; 
      sku: string; 
      name: string; 
      type: 'create' | 'update' | 'unchanged';
      changes?: { field: string; old: any; new: any }[];
    }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    window.open(`${apiUrl}/admin/import/products/template?token=${token}`, '_blank');
  };

  const handlePreviewImport = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    setImportResult(null);
    setUploadProgress(0);
    setIsPreviewMode(true);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await adminAPI.importProducts(formData, true, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setImportResult(response.data.data);
      
      if (response.data.data.errors.length === 0) {
        toast.success(`Phân tích thành công: Sẵn sàng nhập ${response.data.data.validRows?.length || 0} sản phẩm`);
      } else {
        toast.error(`Phát hiện ${response.data.data.errors.length} lỗi trong file Excel`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Phân tích Excel thất bại');
      setIsPreviewMode(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await adminAPI.importProducts(formData, false);
      
      setImportResult(null);
      setIsPreviewMode(false);
      setImportFile(null);
      
      toast.success(`Nhập thành công: ${response.data.data.created} mới, ${response.data.data.updated} cập nhật`);
      
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Nhập Excel thất bại');
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    setUploadProgress(0);
    setIsPreviewMode(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file);
      } else {
        toast.error('Chỉ chấp nhận file định dạng .xlsx hoặc .xls');
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400">
          <Link to="/admin/products" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Sản phẩm
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-secondary-900 dark:text-white font-medium">Nhập Excel</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/admin/products"
              className="p-2 -ml-2 text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white tracking-tight">Nhập sản phẩm</h1>
              <p className="text-secondary-500 dark:text-secondary-400 text-sm mt-1">Cập nhật hoặc thêm mới cấu hình sản phẩm hàng loạt</p>
            </div>
          </div>
          
          <button 
            onClick={resetImport}
            className="flex items-center gap-2 px-4 py-2 text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors font-medium text-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start pt-2">
        {/* Left Column: Upload Area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
             <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">1. Tải lên tệp Excel</h3>
             
             {/* Download Template */}
             <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30 mb-6">
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3 font-medium">
                  Chưa có file mẫu? Dùng mẫu chuẩn để tránh lỗi:
                </p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Tải mẫu nhập sản phẩm (.xlsx)
                </button>
              </div>

              {/* File Upload Area */}
              {!importResult && (
                <div>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                      isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 ring-4 ring-indigo-500/20 scale-[1.02]' 
                      : importFile 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20' 
                        : 'border-secondary-300 dark:border-secondary-600 hover:border-indigo-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 cursor-pointer'
                    }`}
                    onClick={() => !isImporting && fileInputRef.current?.click()}
                    onDragOver={!isImporting ? onDragOver : undefined}
                    onDragLeave={!isImporting ? onDragLeave : undefined}
                    onDrop={!isImporting ? onDrop : undefined}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      disabled={isImporting}
                    />
                    {importFile ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-3 bg-white dark:bg-secondary-700 rounded-lg shadow-sm">
                            <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-secondary-900 dark:text-white line-clamp-1">{importFile.name}</p>
                          <p className="text-xs text-secondary-500 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ) : (
                        <div className="flex flex-col items-center">
                        <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-secondary-100 text-secondary-500 dark:bg-secondary-700 dark:text-secondary-400'}`}>
                            <Upload className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
                        </div>
                        <p className="text-sm font-bold text-secondary-900 dark:text-white">
                          {isDragging ? 'Thả file vào đây...' : 'Click để chọn file hoặc kéo thả'}
                        </p>
                        <p className="text-xs text-secondary-400 mt-2">
                          Hỗ trợ: .xlsx, .xls (tối đa 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {isImporting && (
                    <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-secondary-700 dark:text-secondary-300">
                          {uploadProgress < 100 ? 'Đang tải file lên...' : 'Đang xử lý dữ liệu...'}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400">{uploadProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-secondary-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] -skew-x-12 translate-x-[-100%]"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!importResult && (
                    <button
                      onClick={handlePreviewImport}
                      disabled={!importFile || isImporting}
                      className="w-full mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-5 h-5" />
                          Phân tích file
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {importResult && (
                 <div className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-900/50 rounded-xl border border-secondary-200 dark:border-secondary-700">
                    <div className="flex items-start gap-3">
                       <FileSpreadsheet className="w-8 h-8 text-green-600 mt-1 shrink-0" />
                       <div>
                          <p className="font-semibold text-secondary-900 dark:text-white line-clamp-1">{importFile?.name}</p>
                          <p className="text-xs text-secondary-500 mt-1">Đã phân tích xong</p>
                       </div>
                    </div>
                 </div>
              )}
          </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-700 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-secondary-900 dark:text-white">2. Xem trước & Xác nhận</h3>
               {isPreviewMode && importResult && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Chế độ xem trước
                </span>
               )}
            </div>

            {!importResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-secondary-100 dark:border-secondary-700/50 rounded-xl bg-secondary-50/50 dark:bg-secondary-900/20">
                 <div className="w-16 h-16 bg-white dark:bg-secondary-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <Info className="w-8 h-8 text-secondary-400" />
                 </div>
                 <h4 className="text-secondary-900 dark:text-white font-semibold mb-2">Chưa có dữ liệu phân tích</h4>
                 <p className="text-secondary-500 dark:text-secondary-400 text-sm max-w-sm">
                   Vui lòng tải lên một file Excel ở cột bên trái và bấm &quot;Phân tích file&quot; để hệ thống kiểm tra dữ liệu trước khi nhập.
                 </p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-center border border-emerald-100 dark:border-emerald-800/30">
                      <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{importResult.created}</p>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Tạo mới</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-800/30">
                      <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">{importResult.updated}</p>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Cập nhật (Sửa)</p>
                    </div>
                    <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-xl text-center border border-secondary-100 dark:border-secondary-800/30">
                      <p className="text-3xl font-black text-secondary-600 dark:text-secondary-400 mb-1">{importResult.unchanged || 0}</p>
                      <p className="text-xs font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider">Giữ nguyên</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl text-center border border-rose-100 dark:border-rose-800/30 relative">
                      {importResult.errors.length > 0 && (
                        <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 animate-pulse"></span>
                      )}
                      <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">{importResult.errors.length}</p>
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Bỏ qua (Lỗi)</p>
                    </div>
                  </div>

                  {/* Errors List */}
                  {importResult.errors.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl overflow-hidden shrink-0">
                      <div className="px-4 py-3 bg-rose-100/50 dark:bg-rose-900/30 border-b border-rose-200 dark:border-rose-800/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4 text-rose-600" />
                           <span className="text-sm font-bold text-rose-700 dark:text-rose-300">Cảnh báo: {importResult.errors.length} dòng dữ liệu lỗi sẽ bị bỏ qua</span>
                         </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-0">
                         <table className="w-full text-sm text-left">
                            <thead className="text-xs text-rose-700 dark:text-rose-300 bg-rose-100/30 dark:bg-rose-900/20 uppercase sticky top-0">
                               <tr>
                                  <th className="px-4 py-2 font-semibold">Dòng Excel</th>
                                  <th className="px-4 py-2 font-semibold">Mã SKU</th>
                                  <th className="px-4 py-2 font-semibold">Chi tiết lỗi</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100/50 dark:divide-rose-800/20 text-rose-800 dark:text-rose-200">
                               {importResult.errors.map((err, idx) => (
                                 <tr key={idx} className="hover:bg-rose-100/20 dark:hover:bg-rose-800/10">
                                    <td className="px-4 py-2 font-mono text-xs font-bold text-rose-600">#{err.row}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{err.sku}</td>
                                    <td className="px-4 py-2 font-medium">{err.error}</td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                    </div>
                  )}

                  {/* Valid Data Preview */}
                  {importResult.validRows && importResult.validRows.length > 0 && (
                     <div className="border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex flex-col min-h-[300px] flex-1 max-h-[500px]">
                        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/50 flex items-center gap-2 shrink-0 rounded-t-xl">
                           <Check className="w-4 h-4 text-emerald-600" />
                           <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                             Chi tiết thay đổi: {importResult.validRows.filter(r => r.type !== 'unchanged').length} sản phẩm
                           </span>
                        </div>
                        <div className="overflow-y-auto flex-1 p-0 bg-white dark:bg-secondary-800 relative rounded-b-xl border-t border-transparent">
                           <table className="w-full text-sm text-left">
                              <thead className="text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-800 sticky top-0 z-10 shadow-sm border-b border-secondary-200 dark:border-secondary-700">
                                 <tr>
                                    <th className="px-4 py-3 font-semibold">Hành động</th>
                                    <th className="px-4 py-3 font-semibold">Dòng</th>
                                    <th className="px-4 py-3 font-semibold w-1/4">Sản Phẩm</th>
                                    <th className="px-4 py-3 font-semibold">Chi tiết cập nhật</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700/50 text-secondary-700 dark:text-secondary-300">
                                 {importResult.validRows.filter(row => row.type !== 'unchanged').length === 0 ? (
                                    <tr>
                                       <td colSpan={4} className="px-4 py-8 text-center text-secondary-500">
                                          Không có sản phẩm nào cần thêm mới hoặc thay đổi thông tin.
                                       </td>
                                    </tr>
                                 ) : (
                                    importResult.validRows.filter(row => row.type !== 'unchanged').map((row, idx) => (
                                     <tr key={idx} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/30 align-top">
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${
                                          row.type === 'create' 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50' 
                                            : row.type === 'update'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50'
                                            : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800/40 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-700/50'
                                        }`}>
                                          {row.type === 'create' ? '+ TẠO MỚI' : row.type === 'update' ? '✎ CẬP NHẬT' : '✓ GIỮ NGUYÊN'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-mono text-xs text-secondary-500">#{row.row}</td>
                                      <td className="px-4 py-3">
                                         <div className="font-semibold text-secondary-900 dark:text-white truncate" title={row.name}>{row.name}</div>
                                         <div className="text-xs text-secondary-500 font-mono mt-0.5">SKU: {row.sku}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                         {row.type === 'create' ? (
                                           <span className="text-xs text-secondary-400 italic">Thêm mới toàn bộ dữ liệu</span>
                                         ) : (
                                           row.changes && row.changes.length > 0 ? (
                                             <div className="space-y-1.5">
                                               {row.changes.map((change, cIdx) => (
                                                 <div key={cIdx} className="text-xs bg-secondary-50 dark:bg-secondary-800/50 p-1.5 rounded border border-secondary-100 dark:border-secondary-700 flex flex-wrap items-center gap-1.5">
                                                   <span className="font-semibold text-secondary-700 dark:text-secondary-300">{change.field}:</span>
                                                   <span className="line-through text-rose-500 dark:text-rose-400 opacity-70">
                                                      {change.old !== null && change.old !== undefined ? (typeof change.old === 'number' && change.field.includes('Giá') ? change.old.toLocaleString() : String(change.old)) : 'Trống'}
                                                   </span>
                                                   <span className="text-secondary-400">→</span>
                                                   <span className="text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded">
                                                      {change.new !== null && change.new !== undefined ? (typeof change.new === 'number' && change.field.includes('Giá') ? change.new.toLocaleString() : String(change.new)) : 'Trống'}
                                                   </span>
                                                 </div>
                                               ))}
                                             </div>
                                           ) : (
                                             <span className="text-xs text-secondary-400 italic">Không có thay đổi dữ liệu</span>
                                           )
                                         )}
                                      </td>
                                     </tr>
                                   ))
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}

                  {/* Primary Action Button */}
                  {isPreviewMode && (
                    <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700 flex justify-end sticky bottom-0 bg-white dark:bg-secondary-800 pb-4 z-20">
                      <button
                        onClick={handleConfirmImport}
                        disabled={isImporting || (importResult.created === 0 && importResult.updated === 0)}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center gap-2 text-base"
                      >
                        {isImporting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Hệ thống đang lưu...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Xác nhận Nhập ({importResult.validRows?.length || 0} Sản phẩm)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {!isPreviewMode && !isImporting && importResult !== null && (
                     <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700 flex justify-end">
                        <Link
                          to="/admin/products"
                          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                           Quay lại danh sách Sản phẩm
                        </Link>
                     </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
