import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, Loader2, Mic } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { formatPrice } from '../../hooks/useShop';
import { useAuth } from '../../contexts/AuthContext';
import { ChatProduct, ChatOrder } from '../../types';

// Voice Recognition Setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function ChatWidget() {
  const { messages, isLoading, isOpen, sendMessage, toggleChat, clearMessages } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Voice Search Logic
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'vi-VN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ tìm kiếm bằng giọng nói.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    if (nextState) {
      // Close Support chat if opening AI chat
      window.dispatchEvent(new CustomEvent('close-support-chat'));
    }
    toggleChat();
  };

  useEffect(() => {
    const handleClose = () => {
      if (isOpen) toggleChat();
    };
    window.addEventListener('close-ai-chat', handleClose);
    return () => window.removeEventListener('close-ai-chat', handleClose);
  }, [isOpen, toggleChat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-secondary-800 rotate-0' 
            : 'bg-primary-600 hover:bg-primary-700 animate-pulse-slow'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        title="Chat với AI"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[100] w-[380px] h-[500px] bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-secondary-200 dark:border-secondary-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Trợ lý AI</h3>
                <p className="text-xs text-primary-100">Fashion Store</p>
              </div>
            </div>
            <button
              onClick={clearMessages}
              className="text-xs text-primary-200 hover:text-white transition-colors"
            >
              Làm mới
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50 dark:bg-secondary-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                )}
                <div className={`max-w-[75%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-secondary-800 shadow-sm rounded-bl-md dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Product Cards */}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.products.slice(0, 3).map((product) => (
                        <MiniProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}

                  {/* Order Cards */}
                  {message.orders && message.orders.length > 0 && (
                     <div className="mt-2 space-y-2">
                      {message.orders.map((order, idx) => (
                        <MiniOrderCard key={idx} order={order} />
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-secondary-400 mt-1">
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-600 dark:text-secondary-300" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-white dark:bg-secondary-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    <span className="text-sm text-secondary-500">Đang trả lời...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-2 bg-white dark:bg-secondary-800 border-t border-secondary-100 dark:border-secondary-700 flex gap-2 overflow-x-auto no-scrollbar">
            <SuggestionChip 
              label="🔥 Bán chạy" 
              onClick={() => sendMessage('Cho tôi xem sản phẩm bán chạy nhất')} 
              disabled={isLoading}
            />
            <SuggestionChip 
              label="👗 Outfit" 
              onClick={() => sendMessage('Tôi đi dự tiệc cưới nên mặc gì?')} 
              disabled={isLoading}
            />
            <SuggestionChip 
              label="💰 Dưới 500k" 
              onClick={() => sendMessage('Tìm váy đẹp dưới 500k')} 
              disabled={isLoading}
            />
            <SuggestionChip 
              label="📏 Chọn size" 
              onClick={() => sendMessage('Tôi 55kg mặc size gì?')} 
              disabled={isLoading}
            />
            <SuggestionChip 
              label="🎁 Quà tặng" 
              onClick={() => sendMessage('Tặng bạn gái gì đẹp?')} 
              disabled={isLoading}
            />
            {user && (
              <SuggestionChip 
                label="📦 Đơn hàng" 
                onClick={() => sendMessage('Đơn hàng của tôi')} 
                disabled={isLoading}
              />
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-secondary-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Đang lắng nghe..." : "Nhập tin nhắn..."}
                className={`flex-1 px-4 py-2.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors dark:text-white ${
                  isListening ? 'bg-red-50 text-red-600 placeholder-red-400 ring-2 ring-red-500' : 'bg-secondary-100 dark:bg-secondary-700'
                }`}
                disabled={isLoading}
              />
              
              <button
                type="button"
                onClick={toggleListening}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-300 dark:hover:bg-secondary-600'
                }`}
                title="Nhập bằng giọng nói"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// Mini Product Card for chat
function MiniProductCard({ product }: { product: ChatProduct }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="flex items-center gap-3 p-2 bg-white dark:bg-secondary-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <img
        src={product.image || '/placeholder.jpg'}
        alt={product.name}
        className="w-12 h-12 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-800 dark:text-white truncate">{product.name}</p>
        <p className="text-sm text-primary-600 font-semibold">
          {isNaN(Number(product.price)) ? product.price : formatPrice(product.price)}
        </p>
      </div>
      {product.stock_qty > 0 ? (
        <span className="text-xs text-accent-green">Còn hàng</span>
      ) : (
        <span className="text-xs text-accent-red">Hết</span>
      )}
    </Link>
  );
}

// Mini Order Card for chat
function MiniOrderCard({ order }: { order: ChatOrder }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed': return 'text-accent-green bg-accent-green/10';
      case 'cancelled':
      case 'refunded': return 'text-accent-red bg-accent-red/10';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-secondary-600 bg-secondary-100';
    }
  };

  return (
    <Link
      to={`/profile/orders`}
      className="block p-3 bg-white dark:bg-secondary-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-secondary-100 dark:border-secondary-700"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-bold text-secondary-900 dark:text-white">#{order.code}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{order.date}</p>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(order.status)} uppercase`}>
          {order.status}
        </span>
      </div>
      
      <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-1">
        {order.items}
      </div>

      <div className="flex justify-between items-center border-t border-secondary-100 dark:border-secondary-700 pt-2 mt-1">
        <span className="text-xs text-secondary-500 dark:text-secondary-400">Tổng tiền</span>
        <span className="text-sm font-bold text-primary-600">{order.total}</span>
      </div>
    </Link>
  );
}

// Suggestion Chip Component
function SuggestionChip({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-shrink-0 px-3 py-1.5 bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 text-xs rounded-full hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}
