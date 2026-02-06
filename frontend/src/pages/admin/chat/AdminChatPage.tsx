import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  User, 
  Loader2, 
  Search,
  X,
  Clock,
  CheckCircle,
  Circle,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { useSocket } from '../../../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ConfirmModal from '../../../components/common/ConfirmModal';

type TabStatus = 'all' | 'waiting' | 'active' | 'closed';

export default function AdminChatPage() {
  const { 
    isConnected, 
    isAdminConnected,
    conversations, 
    messages, 
    conversationId,
    typingUser,
    joinConversation,
    sendMessage,
    closeConversation,
    refreshConversations,
    joinAdminRoom,
    setTyping,
    openBubble
  } = useSocket();
  
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [showInfo, setShowInfo] = useState(true);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Join admin room and start auto-refresh on mount
  useEffect(() => {
    if (isConnected) {
      joinAdminRoom();
    }
  }, [isConnected, joinAdminRoom]);

  // Auto-refresh conversations every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        refreshConversations();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isConnected, refreshConversations]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [conversationId]);

  // Smart scroll on new messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleClose = () => {
    if (conversationId) {
      closeConversation(conversationId);
    }
  };

  const handleOpenBubble = () => {
    if (conversationId) {
      openBubble(conversationId);
    }
  };

  const filteredConversations = conversations
    .filter(c => {
      // Filter by Tab
      if (activeTab === 'waiting') return c.status === 'waiting';
      if (activeTab === 'active') return c.status === 'active';
      if (activeTab === 'closed') return c.status === 'closed';
      return c.status !== 'closed'; // 'all' shows active and waiting
    })
    .filter(c => 
      c.guestName?.toLowerCase().includes(search.toLowerCase()) ||
      c.userId?.includes(search) ||
      c.lastMessage?.toLowerCase().includes(search.toLowerCase())
    );

  // Get active conversation details
  const currentConversation = conversations.find(c => c.id === conversationId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-medium border border-yellow-200">Đang chờ</span>;
      case 'active':
        return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium border border-green-200">Đang chat</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-medium border border-secondary-200">Đã đóng</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
      
      {/* Left Sidebar - Conversation List */}
      <div className="w-80 flex flex-col border-r border-secondary-200 dark:border-secondary-700">
        {/* Header & Search */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-600" />
              Tin nhắn
            </h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Online' : 'Offline'}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mb-3 p-1 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
            {(['all', 'waiting', 'active'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-secondary-600 text-secondary-900 dark:text-white shadow-sm' 
                    : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                }`}
              >
                {tab === 'all' ? 'Tất cả' : tab === 'waiting' ? 'Chờ xử lý' : 'Đang chat'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-secondary-400">
              <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">Không tìm thấy cuộc hội thoại</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => joinConversation(conv.id)}
                className={`w-full p-4 flex gap-3 text-left border-b border-secondary-50 dark:border-secondary-700/50 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors ${
                  conversationId === conv.id ? 'bg-primary-50 dark:bg-primary-900/10 border-l-4 border-l-primary-600' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-sm overflow-hidden border border-secondary-200 dark:border-secondary-700">
                    {/* @ts-ignore - avatarUrl comes from backend but might not be in type definition yet */}
                    {conv.avatarUrl ? (
                      <img 
                        // @ts-ignore
                        src={conv.avatarUrl} 
                        alt={conv.guestName || 'User'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initial on error
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerText = (conv.guestName?.[0] || 'K').toUpperCase();
                        }}
                      />
                    ) : (
                      (conv.guestName?.[0] || 'K').toUpperCase()
                    )}
                  </div>
                  {conv.status === 'active' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white dark:bg-secondary-800 rounded-full flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-semibold text-sm text-secondary-900 dark:text-white truncate pr-2">
                       {conv.guestName || `Khách ${conv.userId?.slice(-4) || ''}`}
                    </span>
                    <span className="text-[10px] text-secondary-400 whitespace-nowrap">
                      {formatDistanceToNow(conv.createdAt, { addSuffix: false, locale: vi }).replace('khoảng ', '')}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${
                    conv.status === 'waiting' 
                      ? 'font-medium text-secondary-900 dark:text-white' 
                      : 'text-secondary-500 dark:text-secondary-400'
                  }`}>
                    {conv.lastMessage || 'Bắt đầu cuộc trò chuyện mới'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {getStatusBadge(conv.status)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-secondary-50/50 dark:bg-secondary-900/50">
        {conversationId && currentConversation ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between bg-white dark:bg-secondary-800">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary-600" />
                 </div>
                 <div>
                   <h3 className="font-bold text-secondary-900 dark:text-white">
                     {currentConversation.guestName || 'Khách hàng'}
                   </h3>
                   <div className="flex items-center gap-1.5">
                     {currentConversation.status === 'active' && (
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     )}
                     <span className="text-xs text-secondary-500">
                        {typingUser ? 'Đang nhập...' : 'Đang trực tuyến'}
                     </span>
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenBubble}
                  className="p-2 text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                  title="Mở cửa sổ chat thu nhỏ"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-secondary-200 dark:bg-secondary-700 mx-1" />
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-2 rounded-lg transition-colors ${
                    showInfo ? 'bg-secondary-100 text-secondary-900 dark:bg-secondary-700 dark:text-white' : 'text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-secondary-200 dark:bg-secondary-700 mx-1" />
                <button
                  onClick={() => setCloseModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                >
                  Kết thúc
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollContainerRef}>
              {messages.map((msg, idx) => {
                const isAdmin = msg.senderType === 'admin';
                const isSystem = msg.senderType === 'system';
                const showAvatar = !isSystem && (idx === 0 || messages[idx-1].senderType !== msg.senderType);

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-500 text-xs rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'} group`}>
                    {!isAdmin && (
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${showAvatar ? 'bg-secondary-200 dark:bg-secondary-700' : 'opacity-0'}`}>
                        {currentConversation?.avatarUrl ? (
                          <img 
                            src={currentConversation.avatarUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-secondary-600" />
                        )}
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                          isAdmin
                            ? 'bg-primary-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white rounded-tl-sm border border-secondary-100 dark:border-secondary-700'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-secondary-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${showAvatar ? 'bg-primary-100' : 'opacity-0'}`}>
                        <MessageCircle className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex items-end gap-2">
                 <div className="flex-1 bg-secondary-50 dark:bg-secondary-700/50 rounded-2xl border border-secondary-200 dark:border-secondary-600 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
                   <input
                    type="text"
                    value={input}
                    onChange={handleTyping}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập tin nhắn..."
                    className="w-full px-4 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm placeholder-secondary-400 text-secondary-900 dark:text-white"
                   />
                 </div>
                 <button
                   onClick={handleSend}
                   disabled={!input.trim()}
                   className="p-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-600/20 transition-all flex-shrink-0"
                 >
                   <Send className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary-400">
            <div className="w-24 h-24 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-secondary-300 dark:text-secondary-500" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">Xin chào Admin</h3>
            <p className="max-w-xs text-center text-secondary-500 mb-8">
              Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu hỗ trợ khách hàng.
            </p>
            <div className="flex gap-4">
               <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{conversations.filter(c => c.status === 'waiting').length}</p>
                  <p className="text-xs text-secondary-500 uppercase font-semibold mt-1">Đang chờ</p>
               </div>
               <div className="w-px h-10 bg-secondary-200 dark:bg-secondary-700" />
               <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{conversations.filter(c => c.status === 'active').length}</p>
                  <p className="text-xs text-secondary-500 uppercase font-semibold mt-1">Đang chat</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Info */}
      {showInfo && conversationId && currentConversation && (
        <div className="w-72 border-l border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 p-6 flex flex-col animate-slide-in-right">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden border border-secondary-200 dark:border-secondary-600">
              {currentConversation.avatarUrl ? (
                <img 
                  src={currentConversation.avatarUrl} 
                  alt={currentConversation.guestName || 'User Avatar'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-secondary-400" />
              )}
            </div>
            <h3 className="font-bold text-lg text-secondary-900 dark:text-white">
              {currentConversation.guestName || 'Khách vãng lai'}
            </h3>
            <p className="text-sm text-secondary-500">
              {currentConversation.userId ? `ID: ${currentConversation.userId}` : 'Chưa đăng nhập'}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-secondary-400 uppercase mb-3 tracking-wider">Thông tin liên hệ</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-secondary-600 dark:text-secondary-300">
                  <Mail className="w-4 h-4 text-secondary-400" />
                  <span className="truncate">{currentConversation.guestEmail || 'Chưa cung cấp'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-secondary-600 dark:text-secondary-300">
                  <Phone className="w-4 h-4 text-secondary-400" />
                  <span>Chưa cung cấp</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-secondary-600 dark:text-secondary-300">
                  <MapPin className="w-4 h-4 text-secondary-400" />
                  <span>Việt Nam</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-secondary-400 uppercase mb-3 tracking-wider">Thông tin phiên</h4>
              <div className="p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg space-y-2">
                 <div className="flex justify-between text-xs">
                    <span className="text-secondary-500">Bắt đầu:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                       {new Date(currentConversation.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-secondary-500">Trạng thái:</span>
                    <span className={`font-medium ${currentConversation.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                       {currentConversation.status === 'active' ? 'Đang hoạt động' : 'Chờ xử lý'}
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={handleClose}
        title="Đóng cuộc hội thoại"
        message="Bạn có chắc chắn muốn kết thúc cuộc hội thoại này không?"
        confirmText="Đồng ý đóng"
        cancelText="Tiếp tục hỗ trợ"
        isDestructive={true}
      />
    </div>
  );
}
