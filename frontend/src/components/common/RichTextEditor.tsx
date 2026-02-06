
import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, Sparkles, Loader2, X } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptText, setPromptText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm w-full focus:outline-none min-h-[150px] px-4 py-3 max-h-[400px] overflow-y-auto',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const handleAIWrite = async () => {
    if (!promptText.trim()) return;
    
    setIsGenerating(true);
    try {
        const res = await adminAPI.generate(promptText.trim(), 'product_description');
        if (res.data.success) {
            const content = res.data.data.content;
            editor.commands.insertContent(content);
            toast.success('Đã tạo nội dung thành công! ✨');
            setShowPrompt(false);
            setPromptText('');
        }
    } catch (error) {
        toast.error('Không thể tạo nội dung. Vui lòng thử lại.');
        console.error(error);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all relative">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1 justify-between items-center">
        <div className="flex gap-1">
            <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200 text-primary-600 font-bold' : 'text-gray-600'
            }`}
            title="Bold"
            >
            <Bold className="w-4 h-4" />
            </button>
            <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-200 text-primary-600 italic' : 'text-gray-600'
            }`}
            title="Italic"
            >
            <Italic className="w-4 h-4" />
            </button>
            <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('underline') ? 'bg-gray-200 text-primary-600 underline' : 'text-gray-600'
            }`}
            title="Underline"
            >
            <UnderlineIcon className="w-4 h-4" />
            </button>
        </div>

        {/* AI Button */}
        <button
            type="button"
            onClick={() => setShowPrompt(!showPrompt)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showPrompt ? 'bg-indigo-100 text-indigo-700' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90'}`}
        >
            <Sparkles className="w-3.5 h-3.5" />
            AI Writer
        </button>
      </div>
      
      {/* AI Prompt Overlay */}
      {showPrompt && (
        <div className="bg-indigo-50 p-3 border-b border-indigo-100 animate-in slide-in-from-top-2">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIWrite()}
                    placeholder="Nhập tên sản phẩm hoặc ý tưởng (VD: Áo sơ mi trắng công sở)..."
                    className="flex-1 text-sm border border-indigo-200 rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    autoFocus
                />
                <button 
                    type="button"
                    onClick={handleAIWrite}
                    disabled={isGenerating || !promptText.trim()}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Viết'}
                </button>
                <button
                    type="button"
                    onClick={() => setShowPrompt(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <p className="text-[10px] text-indigo-400 mt-1 pl-1">✨ AI sẽ tự động tạo mô tả hấp dẫn dựa trên từ khóa của bạn.</p>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="cursor-text" />
      
      {/* Placeholder simulation */}
      {editor.isEmpty && placeholder && (
        <div className="absolute top-[3.25rem] left-4 text-gray-400 pointer-events-none text-sm hidden">
          {placeholder}
        </div>
      )}
    </div>
  );
}
