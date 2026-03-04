import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

export default function AIPromptModal({ isOpen, onClose, onSubmit, isLoading = false }: AIPromptModalProps) {
  const [prompt, setPrompt] = useState('');

  // Reset prompt when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrompt('');
    }
  }, [isOpen]);

  // Tính toán gợi ý động theo ngày/lễ
  const dynamicSuggestions = React.useMemo(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    
    const suggestions: string[] = [];

    suggestions.push(`Tạo 5 mã freeship cho tháng ${month}`);
    suggestions.push("Tạo mã giảm 50% cho khách VIP");

    if (month === 1 || (month === 2 && date <= 10)) {
       suggestions.unshift("Tạo ưu đãi cho dịp Tết Nguyên Đán");
    }
    if (month === 2 && date <= 14) {
       suggestions.unshift("Tạo 3 mã Lễ Tình Nhân 14/2");
    }
    if (month === 3 && date <= 8) {
       suggestions.unshift("Tạo flash sale Quốc tế Phụ nữ 8/3");
    }
    if (month === 4 || (month === 5 && date <= 1)) {
       suggestions.unshift("Tạo 2 mã ưu đãi lễ 30/4 - 1/5");
    }
    if (month === 5 && date > 1 && date <= 15) {
       suggestions.unshift("Tạo mã ưu đãi Ngày của Mẹ");
    }
    if (month === 6 && date <= 1) {
       suggestions.unshift("Tạo giảm giá Quốc tế Thiếu nhi 1/6");
    }
    if (month === 8 || (month === 9 && date <= 2)) {
       suggestions.unshift("Tạo mã ưu đãi lễ Quốc khánh 2/9");
    }
    if (month === 10 && date <= 20) {
       suggestions.unshift("Tạo 3 mã tri ân Phụ nữ VN 20/10");
    }
    if (month === 10 && date > 20 && date <= 31) {
       suggestions.unshift("Tạo mã Halloween ma quái 31/10");
    }
    if (month === 11) {
       suggestions.unshift("Tạo 2 mã ưu đãi Black Friday");
       if (date <= 20) suggestions.unshift("Tạo mã tri ân Nhà giáo VN 20/11");
    }
    if (month === 12) {
       suggestions.unshift("Tạo siêu giảm giá Giáng Sinh 24/12");
       if (date >= 25) suggestions.unshift("Tạo 3 mã mừng năm mới");
    }
    
    const extraDefaults = [
        "Tạo 2 mã ưu đãi xả kho cuối mùa",
        "Tạo mã giảm 100K cho đơn từ 500K",
        "Tạo khuyến mãi mua 1 tặng 1"
    ];

    while (suggestions.length < 5 && extraDefaults.length > 0) {
       suggestions.push(extraDefaults.pop()!);
    }

    return suggestions.slice(0, 5);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl w-full max-w-lg shadow-2xl shadow-secondary-900/10 dark:shadow-none transform transition-all scale-100 opacity-100 overflow-hidden font-inter">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-100 dark:border-secondary-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
              Tạo mã khuyến mãi bằng AI
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-secondary-600 dark:text-secondary-400 mb-4 text-sm leading-relaxed">
            Nhập chủ đề hoặc nội dung yêu cầu để AI tự động tạo mã khuyến mãi. Bạn có thể yêu cầu tạo nhiều mã cùng lúc.
          </p>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {dynamicSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(suggestion)}
                className="px-3 py-1.5 text-xs font-medium text-secondary-600 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700/50 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-200 dark:border-secondary-600 text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
          
          <div className="mb-6">
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="VD: Tạo 3 mã giảm giá cho Lễ Tình Nhân 14/2, giảm 20% mỗi mã..."
              className="w-full h-32 px-4 py-3 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 resize-none transition-all"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-semibold text-secondary-600 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-700/50 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl transition-all duration-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Bắt đầu tạo
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
