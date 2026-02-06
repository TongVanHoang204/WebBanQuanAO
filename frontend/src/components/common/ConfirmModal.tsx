
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-3xl w-full max-w-sm shadow-2xl shadow-secondary-900/10 dark:shadow-none transform transition-all scale-100 opacity-100 overflow-hidden font-inter">
        <div className="p-8 text-center">
          <div className={`mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center animate-bounce-short ${
            isDestructive 
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20' 
              : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
          }`}>
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-secondary-900 dark:text-white mb-3 italic tracking-tighter uppercase">
            {title}
          </h3>
          <p className="text-secondary-500 dark:text-secondary-400 mb-8 leading-relaxed font-medium">
            {message}
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 text-sm font-bold text-secondary-600 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-700/50 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-2xl transition-all duration-300"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3.5 text-sm font-bold text-white rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${
                isDestructive 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none' 
                  : 'bg-primary-600 hover:bg-primary-700 shadow-primary-200 dark:shadow-none'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
