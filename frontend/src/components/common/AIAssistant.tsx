import React, { useState, useRef, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Send, Bot, X, Maximize2, Minimize2, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Xin chào! Tôi là trợ lý ảo Admin của ShopFeshen. Tôi có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        // Prepare context (basic history) - limit to last 10 messages to save tokens if needed
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        
        const res = await adminAPI.chat([...history, userMessage]);
        
        if (res.data.success) {
            const aiMessage: Message = { role: 'assistant', content: res.data.data.message };
            setMessages(prev => [...prev, aiMessage]);
        } else {
             // Handle error cleanly
             setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, tôi gặp sự cố khi kết nối với máy chủ AI. Vui lòng thử lại sau.' }]);
        }

    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, đã xảy ra lỗi kết nối. Hãy đảm bảo service AI đang chạy.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 animate-bounce-subtle"
          title="Chat với trợ lý ảo"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
            className={`fixed bottom-6 right-6 bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 z-50 transition-all duration-300 flex flex-col overflow-hidden
                ${isMinimized ? 'w-72 h-14' : 'w-[400px] h-[600px]'}
            `}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">Trợ lý ảo ShopFeshen</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area - Only visible if not minimized */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50 dark:bg-secondary-900/50">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`
                        max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed
                        ${msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-secondary-700 text-secondary-800 dark:text-gray-100 rounded-bl-none shadow-sm'
                        }
                      `}
                    >
                      {msg.role === 'assistant' ? (
                          <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({node, inline, className, children, ...props}: any) {
                                        return !inline ? (
                                            <div className="bg-gray-900 text-gray-100 p-2 rounded-md my-2 overflow-x-auto text-xs">
                                                <code {...props}>{children}</code>
                                            </div>
                                        ) : (
                                            <code className="bg-gray-100 dark:bg-gray-800 text-red-500 px-1 rounded" {...props}>{children}</code>
                                        )
                                    }
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                          </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-secondary-700 p-3 rounded-2xl rounded-bl-none shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi gì đó (ví dụ: Phân tích doanh thu)..."
                    disabled={isLoading}
                    className="w-full bg-secondary-100 dark:bg-secondary-900 text-secondary-900 dark:text-white rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-secondary-400 dark:text-secondary-500">
                        AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
                    </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
