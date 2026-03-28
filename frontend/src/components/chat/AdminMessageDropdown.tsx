import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSocket } from '../../contexts/SocketContext';

export default function AdminMessageDropdown() {
  const { conversations, unreadCount, openBubble, onlineUsers, typingByConversation } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validConversations = [...conversations]
    .filter((item) => item.status !== 'closed' || item.lastMessage)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative rounded-full p-2 transition-colors ${
          isOpen
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
            : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
        }`}
        title="Tin nhắn"
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-secondary-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-2xl animate-fade-in dark:border-secondary-800 dark:bg-secondary-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-secondary-100 p-4 dark:border-secondary-800">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Tin nhắn</h3>
            <Link
              to="/admin/chat"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-secondary-900">
            {validConversations.length > 0 ? (
              validConversations.map((conversation) => {
                const isUnread = conversation.status === 'waiting';
                const isOnline = Boolean(conversation.userId && onlineUsers.includes(conversation.userId));
                const isTyping = typingByConversation[conversation.id]?.senderType === 'user';

                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      openBubble(conversation.id);
                      setIsOpen(false);
                    }}
                    className="group flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-800"
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-secondary-200 text-lg font-bold text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300">
                        {conversation.avatarUrl ? (
                          <img src={conversation.avatarUrl} alt={conversation.guestName || 'User'} className="h-full w-full object-cover" />
                        ) : (
                          (conversation.guestName?.[0] || 'K').toUpperCase()
                        )}
                      </div>
                      {isOnline && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-secondary-900" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline justify-between gap-2">
                        <h4 className={`truncate pr-2 text-[15px] ${isUnread ? 'font-bold text-secondary-900 dark:text-white' : 'font-medium text-secondary-900 dark:text-white'}`}>
                          {conversation.guestName || 'Khách hàng'}
                        </h4>
                        <span className="shrink-0 whitespace-nowrap text-xs text-secondary-500 dark:text-secondary-400">
                          {conversation.updatedAt
                            ? formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true, locale: vi }).replace('khoảng ', '')
                            : 'Vừa xong'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${isUnread ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-secondary-500 dark:text-secondary-400'}`}>
                          {isTyping ? 'Khách đang gõ...' : conversation.lastMessage || 'Đã gửi một tin nhắn'}
                        </p>
                        {isUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-secondary-500 dark:text-secondary-400">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">Chưa có tin nhắn nào</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
