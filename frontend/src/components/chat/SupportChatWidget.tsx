import { useState, useRef, useEffect } from 'react';
import { Headphones, X, Send, User, ArrowLeft, Minus } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SupportChatWidget() {
  const { user } = useAuth();
  const {
    isConnected,
    isSupportMode,
    messages,
    typingUser,
    startSupport,
    sendMessage,
    exitSupport,
    setTyping
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      // Scroll to bottom when opening
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [isOpen, isSupportMode]);

  const toggleChat = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      // Close AI chat if opening Support chat
      window.dispatchEvent(new CustomEvent('close-ai-chat'));
      
      // Auto-start logic
      if (!isSupportMode) {
        if (user) {
          startSupport();
        } else {
          setShowGuestForm(true);
        }
      }
    }
    if (!nextState && !isSupportMode) {
      // Reset state when closing
      setShowGuestForm(false);
    }
  };

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    window.addEventListener('close-support-chat', handleClose);
    return () => window.removeEventListener('close-support-chat', handleClose);
  }, []);

  const handleStartSupport = () => {
    if (!user && !guestName.trim()) {
      setShowGuestForm(true);
      return;
    }
    startSupport(guestName || undefined);
    setShowGuestForm(false);
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleBack = () => {
    exitSupport();
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-secondary-800 rotate-0'
            : 'bg-green-600 hover:bg-green-700'
        }`}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        title="Hỗ trợ trực tuyến"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Headphones className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Support Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[100] w-[380px] h-[520px] bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-secondary-200 dark:border-secondary-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Hỗ trợ trực tuyến</h3>
                <p className="text-xs opacity-75">
                  {isSupportMode
                    ? (isConnected ? (typingUser ? `${typingUser.senderName} đang nhập...` : 'Trực tuyến') : 'Đang chờ kết nối...')
                    : 'Liên hệ nhân viên hỗ trợ'}
                </p>
              </div>
            </div>
            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Thu nhỏ"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {!isSupportMode ? (
            // Welcome Screen
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-secondary-50 dark:bg-secondary-900">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Headphones className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              {!showGuestForm && (
                <>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    Chào mừng bạn!
                  </h3>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center mb-6">
                    Bạn cần hỗ trợ? Nhân viên của chúng tôi sẵn sàng giúp đỡ bạn.
                  </p>
                </>
              )}

              {/* Guest Name Form */}
              {showGuestForm && !user && (
                <div className="w-full mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    Vui lòng cho biết tên của bạn:
                  </p>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    className="w-full px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-700 text-sm focus:ring-2 focus:ring-yellow-500 dark:bg-secondary-700 dark:text-white mb-2"
                    autoFocus
                  />
                </div>
              )}

              <button
                onClick={handleStartSupport}
                disabled={showGuestForm && !guestName.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Headphones className="w-5 h-5" />
                Bắt đầu trò chuyện
              </button>

              <p className="text-xs text-secondary-400 mt-4">
                {isConnected ? '🟢 Sẵn sàng kết nối' : '🟡 Đang kết nối...'}
              </p>
            </div>
          ) : (
            // Chat Messages
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50 dark:bg-secondary-900">
                {messages.length === 0 && (
                  <div className="text-center text-secondary-400 py-8">
                    <p className="text-sm">Đang chờ nhân viên hỗ trợ...</p>
                    <p className="text-xs mt-1">Bạn có thể gửi tin nhắn trước</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.senderType === 'admin' && (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Headphones className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    <div className={`max-w-[75%] ${msg.senderType === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          msg.senderType === 'user'
                            ? 'bg-green-600 text-white rounded-br-md'
                            : msg.senderType === 'system'
                            ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 italic text-center'
                            : 'bg-white dark:bg-secondary-800 shadow-sm rounded-bl-md dark:text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className="text-xs text-secondary-400 mt-1">
                        {msg.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.senderType === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-secondary-600 dark:text-secondary-300" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2.5 bg-secondary-100 dark:bg-secondary-700 border-0 rounded-full text-sm focus:ring-2 focus:ring-green-500 dark:text-white"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
