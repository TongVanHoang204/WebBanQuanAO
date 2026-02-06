import { useState, useRef, useEffect } from 'react';
import { X, Send, User, MessageCircle, Minus, Maximize2, Sparkles, Loader2 } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminChatManager() {
  const { 
    activeBubbles, 
    conversations, 
    closeBubble, 
    messagesByConv, 
    sendMessage, 
    setTyping 
  } = useSocket();

  return (
    <div className="fixed bottom-0 right-4 z-50 flex items-end gap-3 pointer-events-none">
      {activeBubbles.map((convId) => {
        const conversation = conversations.find(c => c.id === convId);
        if (!conversation) return null;

        return (
          <AdminChatBubble
            key={convId}
            conversation={conversation}
            messages={messagesByConv[convId] || []}
            onClose={() => closeBubble(convId)}
            onSend={(text) => sendMessage(text, convId)}
            onTyping={(isTyping) => setTyping(isTyping, convId)}
          />
        );
      })}
    </div>
  );
}

function AdminChatBubble({ 
  conversation, 
  messages, 
  onClose, 
  onSend, 
  onTyping 
}: { 
  conversation: any, 
  messages: any[], 
  onClose: () => void, 
  onSend: (text: string) => void,
  onTyping: (isTyping: boolean) => void 
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [messages, isMinimized]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleSmartReply = async () => {
    if (messages.length === 0) return;
    
    setIsGenerating(true);
    try {
        // Construct context from last 10 messages
        const recentMessages = messages.slice(-10).map(msg => 
            `${msg.senderType === 'admin' ? 'Support' : 'Khách'}: ${msg.content}`
        ).join('\n');
        
        const prompt = `Dựa trên lịch sử chat này, hãy gợi ý câu trả lời tiếp theo:\n\n${recentMessages}`;
        
        const res = await adminAPI.generate(prompt, 'chat_reply');
        if (res.data.success) {
            setInput(res.data.data);
            // Focus back to input
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    } catch (error) {
        toast.error('Không thể tạo gợi ý lúc này');
        console.error(error);
    } finally {
        setIsGenerating(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="pointer-events-auto bg-white dark:bg-secondary-800 shadow-lg rounded-t-lg border border-secondary-200 dark:border-secondary-700 w-64">
        <div 
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors rounded-t-lg"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-secondary-600" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-secondary-800 rounded-full"></span>
            </div>
            <span className="font-semibold text-sm text-secondary-900 dark:text-white truncate">
              {conversation.guestName || 'Khách hàng'}
            </span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto bg-white dark:bg-secondary-800 shadow-xl rounded-t-xl border border-secondary-200 dark:border-secondary-700 w-80 h-[450px] flex flex-col animate-slide-up">
      {/* Header */}
      <div 
        className="p-3 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between bg-white dark:bg-secondary-800 rounded-t-xl cursor-pointer"
        onClick={() => setIsMinimized(true)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="relative">
             <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs ring-2 ring-white dark:ring-secondary-800 overflow-hidden">
                {conversation.avatarUrl ? (
                  <img src={conversation.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (conversation.guestName?.[0] || 'K').toUpperCase()
                )}
             </div>
             {conversation.status === 'active' && (
               <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-secondary-800 rounded-full"></span>
             )}
          </div>
          <div className="min-w-0">
             <h4 className="font-bold text-sm text-secondary-900 dark:text-white truncate">
                {conversation.guestName || 'Khách hàng'}
             </h4>
             <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
               Đang hoạt động
             </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
            className="p-1.5 text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-full transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 text-secondary-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-secondary-50 dark:bg-secondary-900/50">
        {messages.map((msg: any) => {
          const isAdmin = msg.senderType === 'admin';
          const isSystem = msg.senderType === 'system';
          
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="text-[10px] text-secondary-400 bg-secondary-100 dark:bg-secondary-800 px-2 py-0.5 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              {!isAdmin && (
                <div className="w-6 h-6 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0 mt-auto overflow-hidden">
                   {conversation.avatarUrl ? (
                     <img src={conversation.avatarUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-3 h-3 text-secondary-600" />
                   )}
                </div>
              )}
              <div 
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                  isAdmin 
                    ? 'bg-primary-600 text-white rounded-br-sm' 
                    : 'bg-white dark:bg-secondary-800 text-secondary-800 dark:text-gray-200 border border-secondary-100 dark:border-secondary-700 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="p-3 bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-secondary-100 dark:bg-secondary-700 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:outline-none text-secondary-900 dark:text-white placeholder-secondary-400"
            autoFocus
          />
          <button
            onClick={handleSmartReply}
            disabled={isGenerating || messages.length === 0}
            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-simple-gray-800 rounded-full disabled:opacity-50 transition-colors flex-shrink-0"
            title="AI Gợi ý trả lời"
          >
            {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Sparkles className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
