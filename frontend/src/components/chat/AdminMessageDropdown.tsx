import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminMessageDropdown() {
  const { conversations, unreadCount, openBubble, onlineUsers } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpenBubble = (convId: string) => {
    openBubble(convId);
    setIsOpen(false);
  };

  // Filter valid conversations and sort by most recent activity
  const validConversations = conversations
    .filter(c => c.status !== 'closed' || c.lastMessage)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5); // Show top 5

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
             isOpen 
               ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
               : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
        }`}
        title="Tin nhắn"
      >
        <MessageCircle className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-secondary-900 flex items-center justify-center text-[8px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-secondary-900 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-800 overflow-hidden z-50 animate-fade-in origin-top-right">
          {/* Header */}
          <div className="p-4 border-b border-secondary-100 dark:border-secondary-800 flex items-center justify-between">
            <h3 className="font-bold text-lg text-secondary-900 dark:text-white">Tin nhắn</h3>
            <Link 
              to="/admin/chat" 
              onClick={() => setIsOpen(false)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Xem tất cả
            </Link>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white dark:bg-secondary-900">
            {validConversations.length > 0 ? (
              validConversations.map((conv) => {
                const isUnread = conv.status === 'waiting'; 
                const isOnline = conv.userId && onlineUsers.includes(conv.userId);
                return (
                  <div 
                    key={conv.id}
                    onClick={() => handleOpenBubble(conv.id)}
                    className="flex p-3 hover:bg-secondary-50 dark:hover:bg-secondary-800 cursor-pointer transition-colors relative group"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mr-3 self-center">
                      <div className="w-12 h-12 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center text-lg font-bold text-secondary-600 dark:text-secondary-300 overflow-hidden">
                        {/* @ts-ignore */}
                        {conv.avatarUrl ? (
                          <img 
                            // @ts-ignore
                            src={conv.avatarUrl} 
                            alt={conv.guestName || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (conv.guestName?.[0] || 'K').toUpperCase()
                        )}
                      </div>
                      {/* Active/Online indicator */}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-secondary-900 rounded-full" title="Online"></span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-[15px] truncate pr-2 ${
                            isUnread 
                              ? 'font-bold text-secondary-900 dark:text-white' 
                              : 'font-medium text-secondary-900 dark:text-white'
                          }`}
                        >
                          {conv.guestName || 'Khách hàng'}
                        </h4>
                        <span className="text-xs text-secondary-500 dark:text-secondary-400 whitespace-nowrap flex-shrink-0">
                           {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: vi }).replace('khoảng ', '') : 'Vừa xong'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <p className={`text-sm truncate w-full ${
                             isUnread
                               ? 'font-semibold text-blue-600 dark:text-blue-400'
                               : 'text-secondary-500 dark:text-secondary-400'
                           }`}
                         >
                           {conv.lastMessage || 'Đã gửi một tin nhắn'}
                         </p>
                         {/* Unread blue dot */}
                         {isUnread && (
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 ml-2"></span>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-secondary-500 dark:text-secondary-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-secondary-500">Chưa có tin nhắn nào</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
