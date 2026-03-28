import { useEffect, useRef, useState } from 'react';
import { X, Send, User, Minus, Sparkles, Loader2 } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

function normalizeChatInput(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const candidate =
      (value as { text?: unknown }).text ??
      (value as { message?: unknown }).message ??
      (value as { content?: unknown }).content ??
      (value as { reply?: unknown }).reply ??
      '';
    return typeof candidate === 'string' ? candidate : '';
  }
  return '';
}

export default function AdminChatManager() {
  const {
    activeBubbles,
    conversations,
    closeBubble,
    messagesByConv,
    sendMessage,
    setTyping,
    onlineUsers,
    typingByConversation,
    bubbleOpenSignals
  } = useSocket();

  return (
    <div className="pointer-events-none fixed bottom-0 right-24 z-50 flex items-end gap-3 xl:right-28">
      {activeBubbles.map((convId) => {
        const conversation = conversations.find((item) => item.id === convId);
        if (!conversation) return null;

        return (
          <AdminChatBubble
            key={convId}
            conversation={conversation}
            messages={messagesByConv[convId] || []}
            isCustomerOnline={Boolean(conversation.userId && onlineUsers.includes(conversation.userId))}
            isCustomerTyping={typingByConversation[convId]?.senderType === 'user'}
            bubbleOpenSignal={bubbleOpenSignals[convId] || 0}
            onClose={() => closeBubble(convId)}
            onSend={(text) => sendMessage(text, convId)}
            onTyping={(typing) => setTyping(typing, convId)}
          />
        );
      })}
    </div>
  );
}

function AdminChatBubble({
  conversation,
  messages,
  isCustomerOnline,
  isCustomerTyping,
  bubbleOpenSignal,
  onClose,
  onSend,
  onTyping
}: {
  conversation: any;
  messages: any[];
  isCustomerOnline: boolean;
  isCustomerTyping: boolean;
  bubbleOpenSignal: number;
  onClose: () => void;
  onSend: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const safeInput = normalizeChatInput(input);

  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    }
  }, [messages, isMinimized]);

  useEffect(() => {
    setIsMinimized(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [bubbleOpenSignal]);

  const handleSend = () => {
    if (!safeInput.trim()) return;
    onSend(safeInput);
    setInput('');
  };

  const handleSmartReply = async () => {
    if (messages.length === 0) return;
    setIsGenerating(true);
    try {
      const recentMessages = messages
        .slice(-10)
        .map((msg) => `${msg.senderType === 'admin' ? 'Support' : 'Khách'}: ${msg.content}`)
        .join('\n');
      const prompt = `Dựa trên lịch sử chat này, hãy gợi ý câu trả lời tiếp theo:\n\n${recentMessages}`;
      const res = await adminAPI.generate(prompt, 'chat_reply');
      if (res.data.success) {
        setInput(normalizeChatInput(res.data.data));
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      toast.error('Không thể tạo gợi ý lúc này');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const presenceLabel = isCustomerTyping ? 'Khách đang gõ...' : isCustomerOnline ? 'Khách đang online' : 'Khách đang offline';
  const presenceClass = isCustomerTyping ? 'text-primary-600' : isCustomerOnline ? 'text-green-600' : 'text-secondary-500';

  if (isMinimized) {
    return (
      <div className="pointer-events-auto w-64 rounded-t-lg border border-secondary-200 bg-white shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
        <div
          className="flex cursor-pointer items-center justify-between rounded-t-lg p-3 transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-700"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-200 dark:bg-secondary-700">
                <User className="h-4 w-4 text-secondary-600" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-secondary-800 ${isCustomerOnline ? 'bg-green-500' : 'bg-secondary-300'}`} />
            </div>
            <span className="truncate text-sm font-semibold text-secondary-900 dark:text-white">
              {conversation.guestName || 'Khách hàng'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full p-1 text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto flex h-[450px] w-80 flex-col rounded-t-xl border border-secondary-200 bg-white shadow-xl animate-slide-up dark:border-secondary-700 dark:bg-secondary-800">
      <div
        className="flex cursor-pointer items-center justify-between rounded-t-xl border-b border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800"
        onClick={() => setIsMinimized(true)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xs font-bold text-primary-600 ring-2 ring-white dark:bg-indigo-900/30 dark:text-primary-400 dark:ring-secondary-800">
              {conversation.avatarUrl ? (
                <img src={conversation.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (conversation.guestName?.[0] || 'K').toUpperCase()
              )}
            </div>
            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-secondary-800 ${isCustomerOnline ? 'bg-green-500' : 'bg-secondary-300'}`} />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-secondary-900 dark:text-white">
              {conversation.guestName || 'Khách hàng'}
            </h4>
            <p className={`flex items-center gap-1 text-[10px] font-medium ${presenceClass}`}>{presenceLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="rounded-full p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full p-1.5 text-secondary-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-secondary-50 p-3 dark:bg-secondary-900/50">
        {messages.map((msg: any) => {
          const isAdmin = msg.senderType === 'admin';
          const isSystem = msg.senderType === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="my-2 flex justify-center">
                <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] text-secondary-400 dark:bg-secondary-800">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              {!isAdmin && (
                <div className="mt-auto flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
                  {conversation.avatarUrl ? (
                    <img src={conversation.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-3 w-3 text-secondary-600" />
                  )}
                </div>
              )}
              <div className={`max-w-[75%] break-words whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${isAdmin ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm border border-secondary-100 bg-white text-secondary-800 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 dark:text-gray-200'}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={safeInput}
            onChange={(e) => {
              setInput(e.target.value);
              onTyping(e.target.value.length > 0);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-full border-none bg-secondary-100 px-4 py-2 text-sm text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
            autoFocus
          />
          <button
            onClick={handleSmartReply}
            disabled={isGenerating || messages.length === 0}
            className="shrink-0 rounded-full p-2 text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50 dark:hover:bg-simple-gray-800"
            title="AI gợi ý trả lời"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </button>
          <button
            onClick={handleSend}
            disabled={!safeInput.trim()}
            className="shrink-0 rounded-full bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
