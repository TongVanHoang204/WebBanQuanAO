import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ChatMessage } from '../types';
import { chatAPI } from '../services/api';

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY = 'shopfeshen_chat_history';
const OPEN_STATE_KEY = 'shopfeshen_chat_open';
const MAX_STORED_MESSAGES = 100;
const HISTORY_EXPIRATION_DAYS = 7;
const HISTORY_EXPIRATION_MS = HISTORY_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! 👋 Mình là **Feshen** - trợ lý AI thời trang của ShopFeshen.\n\nMình có thể giúp bạn:\n- 🔍 Tìm kiếm sản phẩm\n- 👗 Tư vấn outfit & phối đồ\n- 📏 Hướng dẫn chọn size\n- 🎫 Tìm mã giảm giá\n- 📦 Theo dõi đơn hàng\n\nBạn cần mình hỗ trợ gì nào? 😊',
  quickReplies: ['🔥 Sản phẩm hot', '🆕 Hàng mới về', '🎫 Mã giảm giá', '👗 Tư vấn outfit'],
  timestamp: new Date(),
};

// ─── Stored format ───────────────────────────────────────────
interface StoredHistory {
  messages: ChatMessage[];
  lastUpdated: number;
}

// ─── Load / Save helpers ─────────────────────────────────────
function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];

    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return [WELCOME_MESSAGE]; }

    // Legacy format (plain array)
    if (Array.isArray(parsed)) {
      return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }

    // New format with expiration
    if (parsed?.messages && parsed?.lastUpdated) {
      if (Date.now() - parsed.lastUpdated > HISTORY_EXPIRATION_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return [WELCOME_MESSAGE];
      }
      return parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return [WELCOME_MESSAGE];
}

function saveHistory(messages: ChatMessage[]) {
  try {
    const payload: StoredHistory = {
      messages: messages.slice(-MAX_STORED_MESSAGES),
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
}

function loadOpenState(): boolean {
  try {
    return sessionStorage.getItem(OPEN_STATE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveOpenState(open: boolean) {
  try {
    sessionStorage.setItem(OPEN_STATE_KEY, String(open));
  } catch {}
}

// ─── Context type ────────────────────────────────────────────
export interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  unreadCount: number;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  clearMessages: () => void;
  setIsOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────
export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpenState] = useState(loadOpenState);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(isOpen);

  // Keep ref in sync & clear unread when opened
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Persist messages → localStorage on every change
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Persist open/close state → sessionStorage
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    saveOpenState(open);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpenState((prev) => {
      const next = !prev;
      saveOpenState(next);
      return next;
    });
  }, []);

  // ── Send message ──────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const history = messages.slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await chatAPI.send(content, history);
        const data = response.data?.data || response.data || {};
        const { message, products, orders, quickReplies } = data;

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: message || 'Xin chào, tôi có thể giúp gì cho bạn?',
          products: products || [],
          orders: orders || [],
          quickReplies: quickReplies || [],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (!isOpenRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'Xin lỗi, mình đang gặp sự cố kỹ thuật 😔 Vui lòng thử lại sau hoặc liên hệ hỗ trợ qua hotline nhé!',
          quickReplies: ['Thử lại', 'Liên hệ hỗ trợ'],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  // ── Clear ─────────────────────────────────────────────────
  const clearMessages = useCallback(() => {
    const fresh = { ...WELCOME_MESSAGE, id: `welcome-${Date.now()}`, timestamp: new Date() };
    setMessages([fresh]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isOpen,
        unreadCount,
        sendMessage,
        toggleChat,
        clearMessages,
        setIsOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────
export function useChatContext(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within <ChatProvider>');
  return ctx;
}
