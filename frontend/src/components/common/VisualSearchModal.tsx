import React, { useState, useRef } from 'react';
import { Upload, X, Search, Image as ImageIcon, Loader2, Palette, Sparkles } from 'lucide-react';
import { uploadAPI, aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ProductCard from './ProductCard';
import { Product } from '../../types';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VisualSearchModal({ isOpen, onClose }: VisualSearchModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [aiPowered, setAiPowered] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResults([]);
      setHasSearched(false);
      handleSearch(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults([]);
      setHasSearched(false);
      handleSearch(file);
    }
  };

  const handleSearch = async (fileToSearch: File) => {
    try {
      setIsSearching(true);
      setHasSearched(true);
      
      // 1. Upload image
      const uploadRes = await uploadAPI.single(fileToSearch);
      
      if (!uploadRes.data.success) {
        throw new Error('Upload failed');
      }

      const imageUrl = uploadRes.data.data?.url || uploadRes.data.url;

      // 2. Visual search
      const searchRes = await aiAPI.visualSearch(imageUrl);
      
      if (searchRes.data.success) {
        setResults(searchRes.data.data);
        setAiPowered(searchRes.data.ai_powered !== false);
      } else {
        toast.error('Không thể tìm kiếm bằng hình ảnh lúc này');
      }
    } catch (error) {
      console.error('Visual search error:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResults([]);
    setHasSearched(false);
    setAiPowered(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-black border dark:border-secondary-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-secondary-800">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold dark:text-white">Tìm kiếm bằng hình ảnh</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-800 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* Upload Area */}
          <div className="w-full md:w-1/3 p-6 border-r dark:border-secondary-800 flex flex-col bg-secondary-50/50 dark:bg-secondary-900/50">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange}
            />
            
            {previewUrl ? (
              <div className="relative group flex-1 min-h-[200px] md:min-h-0 bg-white dark:bg-black rounded-lg border dark:border-secondary-800 overflow-hidden shadow-sm">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary text-sm shadow-lg"
                  >
                    Đổi ảnh khác
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="flex-1 min-h-[200px] border-2 border-dashed border-gray-300 dark:border-secondary-700 rounded-lg flex flex-col items-center justify-center p-6 text-center hover:bg-white dark:hover:bg-secondary-800 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Tải ảnh lên</h3>
                <p className="text-xs text-secondary-500 dark:text-gray-400">Kéo thả hoặc nhấp để chọn ảnh</p>
                <p className="text-[10px] text-secondary-400 mt-2">Định dạng hỗ trợ: JPG, PNG (Tối đa 5MB)</p>
              </div>
            )}
            
            <p className="text-xs text-secondary-500 dark:text-gray-400 mt-4 text-center">
              AI của ShopFeshen sẽ quét hình ảnh và tìm kiếm các trang phục tương tự trong cửa hàng.
            </p>
          </div>

          {/* Results Area */}
          <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-white dark:bg-black">
            {isSearching ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600 dark:text-primary-400" />
                <p className="text-secondary-600 dark:text-gray-300 font-medium">AI đang phân tích hình ảnh của bạn...</p>
                <p className="text-sm text-secondary-500 dark:text-gray-400">Có thể mất vài giây để tìm kiếm các món đồ tương tự.</p>
              </div>
            ) : hasSearched ? (
              results.length > 0 ? (
                <div>
                  {!aiPowered && (
                    <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Kết quả được phân tích  
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Hệ thống AI đang bảo trì. Kết quả được gợi ý dựa trên bố cục và màu sắc tương đương.
                        </p>
                      </div>
                    </div>
                  )}
                  <h3 className="font-bold text-lg mb-6 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary-600 dark:bg-primary-400 block"></span>
                    Tìm thấy {results.length} sản phẩm tương tự
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((product) => (
                      <div key={product.id} onClick={handleClose}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 text-secondary-500 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white">Không tìm thấy sản phẩm tương tự</h3>
                  <p className="text-sm text-secondary-500 dark:text-gray-400 max-w-sm">
                    Rất tiếc bộ sưu tập hiện tại của chúng tôi không có sản phẩm nào giống với hình ảnh này. Hãy thử với một góc ảnh khác hoặc sản phẩm khác.
                  </p>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <ImageIcon className="w-16 h-16 text-secondary-300 dark:text-secondary-700" />
                <h3 className="font-bold text-lg dark:text-white">Kết quả tìm kiếm</h3>
                <p className="text-sm text-secondary-500 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Tải ảnh lên để xem kết quả
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
