import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  Clock3,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  MoreHorizontal,
  PanelRightClose,
  Phone,
  Search,
  Send,
  User,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';

type TabStatus = 'all' | 'waiting' | 'mine' | 'closed';

export default function AdminChatPage() {
  const {
    isConnected,
    conversations,
    messages,
    conversationId,
    typingUser,
    typingByConversation,
    joinConversation,
    sendMessage,
    closeConversation,
    refreshConversations,
    joinAdminRoom,
    setTyping,
    openBubble,
    onlineUsers
  } = useSocket();
  const { user } = useAuth();

  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [showInfo, setShowInfo] = useState(true);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [closeTargetId, setCloseTargetId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const staffId = user?.id || null;
  const currentConversation = conversations.find((item) => item.id === conversationId) || null;
  const currentTyping = currentConversation ? typingByConversation[currentConversation.id] : null;

  useEffect(() => {
    if (isConnected) joinAdminRoom();
  }, [isConnected, joinAdminRoom]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) refreshConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, [isConnected, refreshConversations]);

  useEffect(() => {
    if (!conversationId) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [conversationId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 150;
    if (nearBottom) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages, currentTyping]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuId(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isOnline = (conversation: (typeof conversations)[number]) =>
    Boolean(conversation.userId && onlineUsers.includes(conversation.userId));

  const matchSearch = (conversation: (typeof conversations)[number]) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      conversation.guestName?.toLowerCase().includes(keyword) ||
      conversation.guestEmail?.toLowerCase().includes(keyword) ||
      conversation.userId?.includes(keyword) ||
      conversation.lastMessage?.toLowerCase().includes(keyword)
    );
  };

  const sortItems = (items: typeof conversations) =>
    [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  const openChats = conversations.filter((item) => item.status !== 'closed');
  const waiting = sortItems(openChats.filter((item) => !item.assignedTo && matchSearch(item)));
  const mine = sortItems(openChats.filter((item) => item.assignedTo === staffId && matchSearch(item)));
  const others = sortItems(openChats.filter((item) => item.assignedTo && item.assignedTo !== staffId && matchSearch(item)));
  const closed = sortItems(conversations.filter((item) => item.status === 'closed' && matchSearch(item)));

  const tabs = [
    { value: 'all' as const, label: 'Tất cả', count: waiting.length + mine.length + others.length },
    { value: 'waiting' as const, label: 'Chưa nhận', count: waiting.length },
    { value: 'mine' as const, label: 'Của tôi', count: mine.length },
    { value: 'closed' as const, label: 'Đóng', count: closed.length }
  ];

  const sections = useMemo(() => {
    if (activeTab === 'waiting') return [{ key: 'waiting', title: 'Chưa nhận', note: 'Phiên mới chưa có người nhận.', items: waiting }];
    if (activeTab === 'mine') return [{ key: 'mine', title: 'Bạn đang phụ trách', note: 'Các phiên đang do bạn xử lý.', items: mine }];
    if (activeTab === 'closed') return [{ key: 'closed', title: 'Đã đóng', note: 'Các phiên đã kết thúc.', items: closed }];
    return [
      { key: 'waiting', title: 'Chưa nhận', note: 'Ưu tiên phản hồi các phiên mới.', items: waiting },
      { key: 'mine', title: 'Bạn đang phụ trách', note: 'Các phiên staff này đang nắm.', items: mine },
      { key: 'others', title: 'Đồng đội đang xử lý', note: 'Theo dõi để tránh xử lý trùng.', items: others }
    ];
  }, [activeTab, closed, mine, others, waiting]);

  const totalVisible = sections.reduce((sum, section) => sum + section.items.length, 0);
  const onlineCount = openChats.filter((item) => isOnline(item)).length;

  const getPresence = (conversation: (typeof conversations)[number]) => {
    if (!conversation.userId) return { label: 'Khách vãng lai', dot: 'bg-secondary-300', text: 'text-secondary-500' };
    if (isOnline(conversation)) return { label: 'Đang online', dot: 'bg-emerald-500', text: 'text-emerald-600' };
    return { label: 'Đang offline', dot: 'bg-secondary-300', text: 'text-secondary-500' };
  };

  const getOwner = (conversation: (typeof conversations)[number]) => {
    if (conversation.status === 'closed') return { label: 'Đã đóng', className: 'bg-secondary-100 text-secondary-600 border-secondary-200' };
    if (!conversation.assignedTo) return { label: 'Chưa nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (conversation.assignedTo === staffId) return { label: 'Bạn phụ trách', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { label: 'Đồng đội phụ trách', className: 'bg-secondary-100 text-secondary-600 border-secondary-200' };
  };

  const getPreview = (conversation: (typeof conversations)[number]) =>
    typingByConversation[conversation.id]?.senderType === 'user'
      ? { text: 'Khách đang gõ...', className: 'text-primary-600 font-medium' }
      : { text: conversation.lastMessage || 'Bắt đầu cuộc trò chuyện mới', className: 'text-secondary-500' };

  const handleSend = () => {
    if (!conversationId || !input.trim()) return;
    sendMessage(input);
    setInput('');
    setTyping(false);
    inputRef.current?.focus();
  };

  const headerPresence = currentConversation ? getPresence(currentConversation) : null;
  const headerOwner = currentConversation ? getOwner(currentConversation) : null;
  const headerStatus = currentTyping?.senderType === 'user' ? 'Khách đang nhập...' : headerPresence?.label || 'Khách vãng lai';

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden rounded-[28px] border border-secondary-200/80 bg-secondary-50 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <aside className="flex h-full min-h-0 w-[360px] shrink-0 flex-col border-r border-secondary-200 bg-white/95">
        <div className="border-b border-secondary-200 px-5 py-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-secondary-900"><MessageCircle className="h-5 w-5 text-primary-600" />Tin nhắn</h2>
              <p className="mt-1 text-sm text-secondary-500">Tách rõ hàng chờ, phần việc của bạn và trạng thái online thật.</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isConnected ? 'Kết nối ổn định' : 'Mất kết nối'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[{ label: 'Chưa nhận', value: waiting.length }, { label: 'Phụ trách', value: mine.length }, { label: 'Online', value: onlineCount }].map((item) => (
              <div key={item.label} className="rounded-2xl bg-secondary-50 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-secondary-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-secondary-200 px-5 py-4">
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-secondary-50 p-1">
            {tabs.map((tab) => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`rounded-xl px-2 py-2 text-[11px] font-medium transition-all ${activeTab === tab.value ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}>
                <span className="block">{tab.label}</span>
                <span className="mt-0.5 block text-[10px] opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khách hàng..." className="w-full rounded-2xl border border-secondary-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-secondary-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>
          <p className="mt-3 text-xs text-secondary-500">{totalVisible} hội thoại phù hợp</p>
        </div>

        <div className="h-0 min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {totalVisible === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-secondary-200 bg-secondary-50 px-6 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-secondary-300" />
              <h3 className="text-base font-semibold text-secondary-900">Không có hội thoại phù hợp</h3>
              <p className="mt-2 text-sm text-secondary-500">Thử đổi từ khóa hoặc chọn tab khác.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sections.map((section) => section.items.length > 0 && (
                <section key={section.key}>
                  <div className="mb-3 flex items-end justify-between px-1">
                    <div><h3 className="text-sm font-semibold text-secondary-900">{section.title}</h3><p className="text-xs text-secondary-500">{section.note}</p></div>
                    <span className="text-xs font-medium text-secondary-400">{section.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {section.items.map((conversation) => {
                      const preview = getPreview(conversation);
                      const presence = getPresence(conversation);
                      const owner = getOwner(conversation);
                      const selected = conversationId === conversation.id;
                      return (
                        <div key={conversation.id} className={`group relative rounded-2xl border transition-all ${selected ? 'border-primary-200 bg-primary-50/80 shadow-[0_12px_30px_rgba(37,99,235,0.08)]' : 'border-secondary-200/80 bg-white hover:border-secondary-300 hover:bg-secondary-50/70'}`}>
                          <button onClick={() => { joinConversation(conversation.id); setMenuId(null); }} className="w-full px-4 py-4 text-left">
                            <div className="flex items-start gap-3">
                              <div className="relative shrink-0">
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-secondary-200 bg-gradient-to-br from-indigo-50 to-sky-100 font-semibold text-primary-700">
                                  {conversation.avatarUrl ? <img src={conversation.avatarUrl} alt={conversation.guestName || 'Khách hàng'} className="h-full w-full object-cover" /> : (conversation.guestName?.[0] || 'K').toUpperCase()}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white"><span className={`h-2.5 w-2.5 rounded-full ${presence.dot}`} /></span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-[15px] font-semibold text-secondary-900">{conversation.guestName || `Khách ${conversation.userId?.slice(-4) || ''}`}</p>
                                    <p className={`mt-1 truncate text-sm ${preview.className}`}>{preview.text}</p>
                                  </div>
                                  <span className="shrink-0 pt-0.5 text-[11px] text-secondary-400">{formatDistanceToNow(new Date(conversation.updatedAt || conversation.createdAt), { addSuffix: false, locale: vi }).replace('khoảng ', '')}</span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${owner.className}`}>{owner.label}</span>
                                  <span className={`inline-flex items-center gap-1 text-[11px] ${presence.text}`}><Circle className="h-2.5 w-2.5 fill-current stroke-none" />{presence.label}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                          <div className="absolute right-3 top-3" ref={menuId === conversation.id ? menuRef : undefined}>
                            <button onClick={(e) => { e.stopPropagation(); setMenuId((prev) => prev === conversation.id ? null : conversation.id); }} className={`rounded-xl p-2 transition-colors ${menuId === conversation.id ? 'bg-white text-secondary-700 shadow-sm' : 'text-secondary-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-secondary-700'}`} title="Thao tác hội thoại"><MoreHorizontal className="h-4 w-4" /></button>
                            {menuId === conversation.id && (
                              <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-secondary-200 bg-white p-2 shadow-2xl">
                                <button onClick={() => { joinConversation(conversation.id); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"><MessageCircle className="h-4 w-4 text-primary-600" />{conversation.assignedTo === staffId ? 'Mở hội thoại' : 'Nhận và mở chat'}</button>
                                <button onClick={() => { openBubble(conversation.id); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"><Maximize2 className="h-4 w-4 text-secondary-500" />Mở cửa sổ nhỏ</button>
                                {conversation.status !== 'closed' && <button onClick={() => { setCloseTargetId(conversation.id); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" />Kết thúc chat</button>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 min-h-0 flex-1 overflow-hidden bg-white/65">
        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          {conversationId && currentConversation ? (
            <>
              <div className="border-b border-secondary-200 bg-white/95 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-secondary-200 bg-secondary-100">{currentConversation.avatarUrl ? <img src={currentConversation.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-secondary-500" />}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-bold tracking-tight text-secondary-900">{currentConversation.guestName || 'Khách hàng'}</h3>
                        {headerOwner && <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${headerOwner.className}`}>{headerOwner.label}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 ${headerPresence?.text}`}><Circle className="h-2.5 w-2.5 fill-current stroke-none" />{headerStatus}</span>
                        <span className="text-secondary-400">Cập nhật {formatDistanceToNow(new Date(currentConversation.updatedAt || currentConversation.createdAt), { addSuffix: true, locale: vi }).replace('khoảng ', '')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={menuId === '__header__' ? menuRef : undefined}>
                    <button onClick={() => setMenuId((prev) => prev === '__header__' ? null : '__header__')} className="rounded-2xl border border-secondary-200 bg-white px-3 py-2 text-secondary-600 transition-colors hover:bg-secondary-50 hover:text-secondary-900" title="Tác vụ hội thoại"><MoreHorizontal className="h-5 w-5" /></button>
                    {menuId === '__header__' && (
                      <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-secondary-200 bg-white p-2 shadow-2xl">
                        <button onClick={() => { setShowInfo((prev) => !prev); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"><PanelRightClose className="h-4 w-4 text-secondary-500" />{showInfo ? 'Ẩn thông tin khách' : 'Hiện thông tin khách'}</button>
                        <button onClick={() => { openBubble(conversationId); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"><Maximize2 className="h-4 w-4 text-secondary-500" />Mở cửa sổ nhỏ</button>
                        <button onClick={() => { setCloseTargetId(conversationId); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" />Kết thúc chat</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isAdminMessage = message.senderType === 'admin';
                    const isSystemMessage = message.senderType === 'system';
                    const showAvatar = !isSystemMessage && (index === 0 || messages[index - 1].senderType !== message.senderType);
                    if (isSystemMessage) return <div key={message.id} className="flex justify-center"><span className="rounded-full bg-secondary-100 px-3 py-1 text-xs text-secondary-500">{message.content}</span></div>;
                    return (
                      <div key={message.id} className={`group flex gap-3 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                        {!isAdminMessage && <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-200 ${showAvatar ? '' : 'opacity-0'}`}>{currentConversation.avatarUrl ? <img src={currentConversation.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-secondary-600" />}</div>}
                        <div className={`flex max-w-[72%] flex-col ${isAdminMessage ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-full break-words whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isAdminMessage ? 'rounded-tr-sm bg-primary-600 text-white' : 'rounded-tl-sm border border-secondary-200 bg-white text-secondary-900'}`}>{message.content}</div>
                          <span className="mt-1 text-[10px] text-secondary-400 opacity-0 transition-opacity group-hover:opacity-100">{message.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })}
                  {currentTyping?.senderType === 'user' && <div className="flex items-end gap-3"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-secondary-200">{currentConversation.avatarUrl ? <img src={currentConversation.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-secondary-600" />}</div><div className="rounded-3xl rounded-tl-sm border border-secondary-200 bg-white px-4 py-3 shadow-sm"><div className="flex items-center gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-secondary-300 [animation-delay:-0.2s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-secondary-300 [animation-delay:-0.1s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-secondary-300" /></div></div></div>}
                </div>
              </div>

              <div className="border-t border-secondary-200 bg-white/95 p-4">
                <div className="flex items-end gap-3 rounded-[24px] border border-secondary-200 bg-secondary-50 p-2 pl-4 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100">
                  <input ref={inputRef} type="text" value={input} onChange={(e) => { setInput(e.target.value); setTyping(e.target.value.trim().length > 0); }} onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} placeholder="Nhập tin nhắn trả lời khách..." className="w-full bg-transparent py-2 text-sm text-secondary-900 outline-none placeholder:text-secondary-400" />
                  <button onClick={handleSend} disabled={!input.trim()} className="rounded-2xl bg-primary-600 p-3 text-white shadow-lg shadow-primary-600/20 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"><Send className="h-5 w-5" /></button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary-100"><MessageCircle className="h-11 w-11 text-secondary-300" /></div>
              <h3 className="text-2xl font-bold tracking-tight text-secondary-900">Chọn một hội thoại để bắt đầu</h3>
              <p className="mt-3 max-w-md text-sm text-secondary-500">Cột trái đã tách riêng hàng chờ chưa nhận và phần việc staff đang phụ trách để hạn chế xử lý trùng.</p>
            </div>
          )}
        </div>

        {showInfo && currentConversation && (
          <aside className="h-full min-h-0 w-[320px] shrink-0 overflow-y-auto border-l border-secondary-200 bg-white/95 p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-secondary-200 bg-secondary-100">{currentConversation.avatarUrl ? <img src={currentConversation.avatarUrl} alt={currentConversation.guestName || 'Khách hàng'} className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-secondary-400" />}</div>
              <h3 className="text-xl font-bold tracking-tight text-secondary-900">{currentConversation.guestName || 'Khách vãng lai'}</h3>
              <p className="mt-1 text-sm text-secondary-500">{currentConversation.userId ? `ID: ${currentConversation.userId}` : 'Khách chưa đăng nhập'}</p>
            </div>

            <div className="mt-8 space-y-7">
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-400">Liên hệ</h4>
                <div className="mt-4 space-y-3 text-sm text-secondary-600">
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-secondary-400" /><span className="truncate">{currentConversation.guestEmail || 'Chưa cung cấp email'}</span></div>
                  <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-secondary-400" /><span>Chưa cung cấp số điện thoại</span></div>
                  <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-secondary-400" /><span>Việt Nam</span></div>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-400">Ngữ cảnh phiên</h4>
                <div className="mt-4 rounded-3xl border border-secondary-200 bg-secondary-50 p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-secondary-500">Khách hàng</span><span className={headerPresence?.text}>{headerPresence?.label}</span></div>
                    <div className="flex items-center justify-between"><span className="text-secondary-500">Phụ trách</span><span className="font-medium text-secondary-900">{!currentConversation.assignedTo ? 'Chưa nhận' : currentConversation.assignedTo === staffId ? 'Bạn' : 'Staff khác'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-secondary-500">Bắt đầu</span><span className="font-medium text-secondary-900">{new Date(currentConversation.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div className="flex items-center justify-between"><span className="text-secondary-500">Trạng thái phiên</span><span className="font-medium text-secondary-900">{currentConversation.status === 'active' ? 'Đang xử lý' : currentConversation.status === 'waiting' ? 'Chờ phản hồi' : 'Đã đóng'}</span></div>
                  </div>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-400">Tín hiệu nhanh</h4>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-secondary-200 bg-white px-4 py-3"><div className="flex items-center gap-2 text-sm font-medium text-secondary-900"><Clock3 className="h-4 w-4 text-secondary-400" />Hoạt động gần nhất</div><p className="mt-1 text-sm text-secondary-500">{formatDistanceToNow(new Date(currentConversation.updatedAt || currentConversation.createdAt), { addSuffix: true, locale: vi }).replace('khoảng ', '')}</p></div>
                  <div className="rounded-2xl border border-secondary-200 bg-white px-4 py-3"><div className="flex items-center gap-2 text-sm font-medium text-secondary-900"><MessageCircle className="h-4 w-4 text-secondary-400" />Tín hiệu nhập liệu</div><p className="mt-1 text-sm text-secondary-500">{typingUser?.senderType === 'user' ? 'Khách đang gõ tin nhắn mới.' : 'Chưa có tín hiệu nhập liệu.'}</p></div>
                </div>
              </section>
            </div>
          </aside>
        )}
      </main>

      <ConfirmModal
        isOpen={Boolean(closeTargetId)}
        onClose={() => setCloseTargetId(null)}
        onConfirm={() => {
          if (closeTargetId) closeConversation(closeTargetId);
          setCloseTargetId(null);
        }}
        title="Đóng cuộc hội thoại"
        message="Bạn có chắc chắn muốn kết thúc cuộc hội thoại này không?"
        confirmText="Đồng ý đóng"
        cancelText="Tiếp tục hỗ trợ"
        isDestructive={true}
      />
    </div>
  );
}
