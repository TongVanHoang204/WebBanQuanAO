import { useState, useRef, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Send, Bot, User, Loader2, Mic, Sparkles, 
  Trash2, ChevronDown, ShoppingBag, Star, Truck,
  Tag, Heart, Package, ArrowRight, Maximize2, Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../../hooks/useChat';
import { formatPrice } from '../../hooks/useShop';
import { useAuth } from '../../contexts/AuthContext';
import { ChatProduct, ChatOrder, ChatMessage } from '../../types';
import { toMediaUrl } from '../../services/api';
import { LiquidMetalButton } from '../ui/liquid-metal-button';

// Voice Recognition Setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function ChatWidget() {
  const { messages, isLoading, isOpen, unreadCount, sendMessage, toggleChat, clearMessages, setIsOpen } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Scroll detection for "scroll down" button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Voice Recognition
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
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    if (nextState) {
      window.dispatchEvent(new CustomEvent('close-support-chat'));
    }
    toggleChat();
  };

  useEffect(() => {
    const handleClose = () => { if (isOpen) toggleChat(); };
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

  const handleQuickReply = (reply: string) => {
    if (!isLoading) {
      sendMessage(reply);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const chatWidth = isExpanded ? 'w-[480px]' : 'w-[400px]';
  const chatHeight = isExpanded ? 'h-[700px]' : 'h-[560px]';

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Unread Badge */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce z-10 shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
        <LiquidMetalButton
          onClick={handleToggle}
          isOpen={isOpen}
          viewMode="icon"
          className=""
          aria-label={isOpen ? 'Đóng chat' : 'Chat với AI'}
          title="Chat với AI"
        />
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-[100] ${chatWidth} ${chatHeight} flex flex-col overflow-hidden
          bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl
          border border-secondary-200/50 dark:border-secondary-700/50
          backdrop-blur-xl
          animate-slide-up
          transition-all duration-300`}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-5 py-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-30" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Feshen AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-white/80">Sẵn sàng hỗ trợ</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={clearMessages}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Xóa lịch sử"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggle}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gradient-to-b from-secondary-50 to-white dark:from-secondary-900 dark:to-secondary-800 scroll-smooth"
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onQuickReply={handleQuickReply}
                isLoading={isLoading}
              />
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-secondary-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-secondary-100 dark:border-secondary-700">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-secondary-400 ml-1">Feshen đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 p-2 bg-white dark:bg-secondary-700 rounded-full shadow-lg border border-secondary-200 dark:border-secondary-600 hover:scale-110 transition-transform z-10"
            >
              <ChevronDown className="w-4 h-4 text-secondary-500" />
            </button>
          )}

          {/* Context Suggestions (only show on last message if it has quickReplies) */}
          {messages.length > 0 && messages[messages.length - 1].quickReplies && messages[messages.length - 1].quickReplies!.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-white/80 dark:bg-secondary-800/80 backdrop-blur-sm border-t border-secondary-100 dark:border-secondary-700/50">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {messages[messages.length - 1].quickReplies!.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full
                      bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30
                      text-indigo-700 dark:text-indigo-300
                      border border-indigo-200/50 dark:border-indigo-700/50
                      hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50
                      transition-all hover:shadow-sm
                      disabled:opacity-50 whitespace-nowrap"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Bar */}
          <div className="px-4 py-2 bg-white dark:bg-secondary-800 border-t border-secondary-100 dark:border-secondary-700/50 flex gap-2 overflow-x-auto no-scrollbar">
            <QuickActionChip icon={<ShoppingBag className="w-3 h-3" />} label="Bán chạy" onClick={() => handleQuickReply('Cho tôi xem sản phẩm bán chạy nhất')} disabled={isLoading} />
            <QuickActionChip icon={<Star className="w-3 h-3" />} label="Hàng mới" onClick={() => handleQuickReply('Hàng mới về gần đây')} disabled={isLoading} />
            <QuickActionChip icon={<Tag className="w-3 h-3" />} label="Khuyến mãi" onClick={() => handleQuickReply('Có mã giảm giá nào không?')} disabled={isLoading} />
            <QuickActionChip icon={<Sparkles className="w-3 h-3" />} label="Outfit" onClick={() => handleQuickReply('Tư vấn outfit đi dạo phố')} disabled={isLoading} />
            {user && <QuickActionChip icon={<Package className="w-3 h-3" />} label="Đơn hàng" onClick={() => handleQuickReply('Đơn hàng của tôi')} disabled={isLoading} />}
            {user && <QuickActionChip icon={<Heart className="w-3 h-3" />} label="Yêu thích" onClick={() => handleQuickReply('Xem danh sách yêu thích')} disabled={isLoading} />}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="px-4 py-3 bg-white dark:bg-secondary-800 border-t border-secondary-100 dark:border-secondary-700/50">
            <div className="flex gap-2 items-center">
              <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all
                ${isListening 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-800' 
                  : 'bg-secondary-50 dark:bg-secondary-700/50 border-secondary-200 dark:border-secondary-600 focus-within:ring-2 focus-within:ring-indigo-300 dark:focus-within:ring-indigo-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-600'
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? '🎙️ Đang lắng nghe...' : 'Nhập tin nhắn...'}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-secondary-800 dark:text-white placeholder-secondary-400"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'text-secondary-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                  }`}
                  title="Nhập bằng giọng nói"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white
                  disabled:opacity-40 disabled:cursor-not-allowed
                  hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25
                  active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-secondary-400 mt-1.5 text-center">
              Feshen AI có thể đưa ra thông tin không chính xác. Hãy kiểm tra kỹ trước khi mua hàng.
            </p>
          </form>
        </div>
      )}
    </>
  );
}

// ============================================================
// Message Bubble Component
// ============================================================
const MessageBubble = memo(function MessageBubble({ 
  message, onQuickReply, isLoading 
}: { 
  message: ChatMessage; 
  onQuickReply: (text: string) => void;
  isLoading: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      )}
      
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md shadow-md shadow-indigo-500/20'
            : 'bg-white dark:bg-secondary-800 shadow-sm rounded-bl-md border border-secondary-100 dark:border-secondary-700/50'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm text-secondary-800 dark:text-secondary-200 leading-relaxed prose prose-sm dark:prose-invert max-w-none
              prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-headings:text-base prose-headings:mt-2 prose-headings:mb-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Product Cards */}
        {message.products && message.products.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <ShoppingBag className="w-3 h-3 text-indigo-500" />
              <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400">
                {message.products.length} sản phẩm
              </span>
            </div>
            <div className={`grid gap-2 ${message.products.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {message.products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} compact={message.products!.length > 2} />
              ))}
            </div>
            {message.products.length > 4 && (
              <Link to="/products" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-1">
                Xem thêm {message.products.length - 4} sản phẩm <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}

        {/* Order Cards */}
        {message.orders && message.orders.length > 0 && (
          <div className="space-y-2">
            {message.orders.map((order, idx) => (
              <OrderCard key={idx} order={order} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-secondary-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-secondary-200 to-secondary-300 dark:from-secondary-600 dark:to-secondary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-secondary-600 dark:text-secondary-300" />
        </div>
      )}
    </div>
  );
});

// ============================================================
// Product Card - Modern design
// ============================================================
function ProductCard({ product, compact = false }: { product: ChatProduct; compact?: boolean }) {
  const imageUrl = product.image ? toMediaUrl(product.image) : '/placeholder.jpg';

  if (compact) {
    return (
      <Link
        to={`/products/${product.slug}`}
        className="group flex flex-col bg-white dark:bg-secondary-800 rounded-xl border border-secondary-100 dark:border-secondary-700/50 overflow-hidden hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-700"
      >
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.is_new && (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-md">NEW</span>
          )}
          {product.stock_qty <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Hết hàng</span>
            </div>
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium text-secondary-800 dark:text-white truncate">{product.name}</p>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {typeof product.price === 'number' ? formatPrice(product.price) : product.price}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex items-center gap-3 p-3 bg-white dark:bg-secondary-800 rounded-xl border border-secondary-100 dark:border-secondary-700/50 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
    >
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        {product.is_new && (
          <span className="absolute top-0 left-0 px-1 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded-br-md">NEW</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.name}
        </p>
        {product.category && (
          <p className="text-[10px] text-secondary-400 mt-0.5">{product.category}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {typeof product.price === 'number' ? formatPrice(product.price) : product.price}
          </p>
          {product.stock_qty > 0 ? (
            <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full font-medium">Còn hàng</span>
          ) : (
            <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full font-medium">Hết hàng</span>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-secondary-300 dark:text-secondary-600 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ============================================================
// Order Card - With timeline support
// ============================================================
function OrderCard({ order }: { order: ChatOrder }) {
  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('giao thành công')) return { color: 'text-green-600 bg-green-50 dark:bg-green-900/30', icon: '✅' };
    if (s.includes('shipped') || s.includes('giao hàng')) return { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30', icon: '🚚' };
    if (s.includes('processing') || s.includes('xử lý')) return { color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30', icon: '🔄' };
    if (s.includes('cancelled') || s.includes('hủy')) return { color: 'text-red-600 bg-red-50 dark:bg-red-900/30', icon: '❌' };
    if (s.includes('paid') || s.includes('thanh toán')) return { color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30', icon: '💰' };
    return { color: 'text-secondary-600 bg-secondary-50 dark:bg-secondary-900/30', icon: '⏳' };
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <Link
      to="/profile/orders"
      className="block p-3 bg-white dark:bg-secondary-800 rounded-xl border border-secondary-100 dark:border-secondary-700/50 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-bold text-secondary-900 dark:text-white">#{order.code}</p>
          <p className="text-[10px] text-secondary-400 mt-0.5">{order.date}</p>
        </div>
        <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${statusConfig.color}`}>
          {statusConfig.icon} {order.status}
        </span>
      </div>
      
      {/* Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="flex items-center gap-1 my-2 px-1">
          {order.timeline.map((step, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                step.completed 
                  ? step.current ? 'bg-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'bg-green-500' 
                  : 'bg-secondary-200 dark:bg-secondary-600'
              }`} />
              {i < order.timeline!.length - 1 && (
                <div className={`flex-1 h-0.5 ${step.completed ? 'bg-green-400' : 'bg-secondary-200 dark:bg-secondary-600'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-1">
        {order.items}
      </div>

      <div className="flex justify-between items-center border-t border-secondary-100 dark:border-secondary-700 pt-2">
        <span className="text-[10px] text-secondary-400">Tổng tiền</span>
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{order.total}</span>
      </div>
    </Link>
  );
}

// ============================================================
// Quick Action Chip
// ============================================================
function QuickActionChip({ icon, label, onClick, disabled }: { 
  icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5
        bg-secondary-50 dark:bg-secondary-700/50
        text-secondary-600 dark:text-secondary-300
        text-xs font-medium rounded-full
        border border-secondary-200 dark:border-secondary-600
        hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200
        dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 dark:hover:border-indigo-700
        transition-all whitespace-nowrap
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
      {label}
    </button>
  );
}
