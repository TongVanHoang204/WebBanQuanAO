import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'admin' | 'system';
  senderId: string | null;
  senderName: string;
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string | null;
  guestName: string | null;
  guestEmail?: string | null;
  avatarUrl?: string | null;
  status: 'waiting' | 'active' | 'closed';
  assignedTo: string | null;
  lastMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isSupportMode: boolean;
  isAdminConnected: boolean;
  conversationId: string | null;
  messages: Message[];
  conversations: Conversation[];
  typingUser: { senderType: string; senderName: string } | null;
  activeBubbles: string[];
  unreadCount: number;
  onlineUsers: string[];
  startSupport: (guestName?: string, guestEmail?: string) => void;
  sendMessage: (content: string, specificConvId?: string) => void;
  setTyping: (isTyping: boolean, specificConvId?: string) => void;
  joinConversation: (conversationId: string) => void;
  closeConversation: (conversationId: string) => void;
  exitSupport: () => void;
  refreshConversations: () => void;
  joinAdminRoom: () => void;
  openBubble: (convId: string) => void;
  closeBubble: (convId: string) => void;
  messagesByConv: Record<string, Message[]>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [isAdminConnected, setIsAdminConnected] = useState(false);
  const { isAuthenticated } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [typingUser, setTypingUser] = useState<{ senderType: string; senderName: string } | null>(null);

  // Computed unique messages for backward compatibility
  const messages = conversationId ? (messagesByConv[conversationId] || []) : [];

  // Chat Bubbles State
  const [activeBubbles, setActiveBubbles] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);


  // Check active conversation on mount
  useEffect(() => {
      const savedConvId = localStorage.getItem('chat_conversation_id');
      if (savedConvId && socket) {
           socket.emit('check-active-conversation', { conversationId: savedConvId });
      }
  }, [socket]);

  // Ref to avoid stale closure in event handlers
  const conversationIdRef = useRef<string | null>(conversationId);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to server');
      
      // Attempt to restore active conversation
      const savedConvId = localStorage.getItem('chat_conversation_id');
      newSocket.emit('check-active-conversation', { conversationId: savedConvId });
    });

// ... inside useEffect ...
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsAdminConnected(false);
      console.log('[Socket] Disconnected from server');
    });

    // Handle forced logout
    newSocket.on('force_logout', (data: { message: string }) => {
      toast.error(data.message || 'Phiên đăng nhập đã hết hạn');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Adding a small delay to ensure toast is seen if possible, though redirect might cut it short.
      // But alert or confirm blocks execution. 
      // window.location.href forces reload.
      setTimeout(() => {
         window.location.href = '/login';
      }, 1500);
    });

    // Support started successfully
    newSocket.on('support-started', (data: { conversationId: string; status: string }) => {
      setConversationId(data.conversationId);
      setIsSupportMode(true);
      setMessagesByConv(prev => ({ ...prev, [data.conversationId]: [] }));
      localStorage.setItem('chat_conversation_id', data.conversationId);
    });


    newSocket.on('new-message', (message: Message) => {
      console.log('[Socket] New message received:', message);
      setMessagesByConv(prev => {
        const convId = message.conversationId;
        const current = prev[convId] || [];
        if (current.some(m => m.id === message.id)) {
            console.log('[Socket] Duplicate message ignored:', message.id);
            return prev;
        }
        return {
          ...prev,
          [convId]: [...current, { ...message, createdAt: new Date(message.createdAt) }]
        };
      });
      
      // Update conversations list and status
      setConversations(prev => prev.map(c => 
        c.id === message.conversationId 
          ? { 
              ...c, 
              lastMessage: message.content, 
              updatedAt: new Date(message.createdAt),
              // If message from user, mark as waiting (frontend optimistically, backend should confirm)
              status: message.senderType === 'user' ? 'waiting' : c.status
            } 
          : c
      ));

      // Notification Logic: Sound + Toast - REMOVED per user request
      /* 
      if (message.senderType === 'user') {
         // Logic removed
      }
      */
    });

    // Messages history received
    newSocket.on('conversation-messages', (data: { conversationId?: string; messages: Message[] }) => {
      if (data.messages.length > 0) {
        const convId = data.conversationId || data.messages[0].conversationId;
        if (convId) {
           setMessagesByConv(prev => ({
             ...prev,
             [convId]: data.messages.map(m => ({ ...m, createdAt: new Date(m.createdAt) }))
           }));
        }
      } else if (data.conversationId) {
         setMessagesByConv(prev => ({ ...prev, [data.conversationId!]: [] }));
      }
    });

    // Admin joined notification - disabled per user request
    // newSocket.on('admin-joined', (data: { adminName: string; conversationId?: string }) => {
    //   const targetConvId = data.conversationId || conversationIdRef.current;
    //   if (targetConvId) {
    //     setMessagesByConv(prev => {
    //       const existingMessages = prev[targetConvId] || [];
    //       const recentJoinMsg = existingMessages.find(
    //         m => m.senderType === 'system' && 
    //              m.content.includes(data.adminName) && 
    //              m.content.includes('tham gia') &&
    //              Date.now() - new Date(m.createdAt).getTime() < 5000
    //       );
    //       if (recentJoinMsg) return prev;
    //       
    //       const systemMessage: Message = {
    //         id: `system-${Date.now()}-${Math.random()}`,
    //         conversationId: targetConvId,
    //         senderType: 'system',
    //         senderId: null,
    //         senderName: 'Hệ thống',
    //         content: `${data.adminName} đã tham gia cuộc trò chuyện.`,
    //         createdAt: new Date()
    //       };
    //       return {
    //         ...prev,
    //         [targetConvId]: [...existingMessages, systemMessage]
    //       };
    //     });
    //   }
    // });

    // Conversation closed
    newSocket.on('conversation-closed', (data: { conversationId: string }) => {
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        conversationId: data.conversationId,
        senderType: 'system',
        senderId: null,
        senderName: 'Hệ thống',
        content: 'Cuộc hội thoại đã được đóng.',
        createdAt: new Date()
      };
      setMessagesByConv(prev => ({
        ...prev,
        [data.conversationId]: [...(prev[data.conversationId] || []), systemMessage]
      }));

      localStorage.removeItem('chat_conversation_id');

      if (conversationId === data.conversationId) {
        setTimeout(() => {
          setIsSupportMode(false);
          setConversationId(null);
        }, 3000);
      }
      setConversations(prev => prev.map(c => 
        c.id === data.conversationId ? { ...c, status: 'closed', updatedAt: new Date() } : c
      ));
    });

    // Typing indicator
    newSocket.on('user-typing', (data: { senderType: string; senderName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUser({ senderType: data.senderType, senderName: data.senderName });
      } else {
        setTypingUser(null);
      }
    });

    // Conversation list update
    newSocket.on('conversations-list', (data: { conversations: Conversation[] }) => {
      setConversations(data.conversations.map(c => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: c.updatedAt ? new Date(c.updatedAt) : null })));
    });

    // New conversation notification
    newSocket.on('new-conversation', (conv: Conversation) => {
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) return prev;
        return [{ ...conv, createdAt: new Date(conv.createdAt), updatedAt: null }, ...prev];
      });
    });

    // Admin room joined confirmation
    newSocket.on('admin-room-joined', () => {
      console.log('[Socket] Admin successfully joined admin-room');
      setIsAdminConnected(true);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('[Socket] Error:', data.message);
    });

    // Online users update
    newSocket.on('online-users-update', (users: string[]) => {
      console.log('[Socket] Online users updated:', users);
      setOnlineUsers(users);
    });

    // New generic notification received
    newSocket.on('new-notification', (notification: any) => {
      console.log('[Socket] New notification received:', notification);
      
      // Dispatch a custom event so other components (like NotificationDropdown) can listen
      // This is cleaner than passing too much state through context if only one component needs the list
      window.dispatchEvent(new CustomEvent('new_notification_received', { detail: notification }));
      
      // Optional: Global toast for important notifications
      if (notification.type === 'order_new') {
        // Don't show toast for success confirmation to avoid duplicate with checkout page or redundant info
        if (notification.title === 'Đặt hàng thành công') return;

        toast.success(notification.title, {
           duration: 5000,
           position: 'top-right',
           icon: '🎁'
        });
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('[Socket] Cleaning up socket connection...');
      newSocket.disconnect();
    };
  }, [isAuthenticated]); // Re-connect when auth state changes

  const startSupport = useCallback((guestName?: string, guestEmail?: string) => {
    if (socket) {
      socket.emit('start-support', { guestName, guestEmail });
    }
  }, [socket]);

  const sendMessage = useCallback((content: string, specificConvId?: string) => {
    const targetId = specificConvId || conversationId;
    if (socket && targetId && content.trim()) {
      socket.emit('send-message', { conversationId: targetId, content: content.trim() });
    }
  }, [socket, conversationId]);

  const setTyping = useCallback((isTyping: boolean, specificConvId?: string) => {
    const targetId = specificConvId || conversationId;
    if (socket && targetId) {
      socket.emit('typing', { conversationId: targetId, isTyping });
    }
  }, [socket, conversationId]);

  const joinConversation = useCallback((convId: string) => {
    if (socket) {
      socket.emit('join-conversation', { conversationId: convId });
      setConversationId(convId);
      setIsSupportMode(true);
      
      // Optimistically mark as active/read
      setConversations(prev => prev.map(c => 
        c.id === convId ? { ...c, status: 'active' } : c
      ));
    }
  }, [socket]);

  const closeConversation = useCallback((convId: string) => {
    if (socket) {
      socket.emit('close-conversation', { conversationId: convId });
    }
  }, [socket]);

  const exitSupport = useCallback(() => {
    setIsSupportMode(false);
    setConversationId(null);
    setMessagesByConv({});
  }, []);

  const refreshConversations = useCallback(() => {
    if (socket) {
      socket.emit('get-conversations');
    }
  }, [socket]);

  const joinAdminRoom = useCallback(() => {
    if (socket) {
      socket.emit('join-admin-room');
      socket.emit('get-conversations');
    }
  }, [socket]);

  const openBubble = useCallback((convId: string) => {
    setActiveBubbles(prev => {
      if (prev.includes(convId)) return prev;
      const newBubbles = [...prev, convId];
      // Max 3 bubbles
      if (newBubbles.length > 3) return newBubbles.slice(1);
      return newBubbles;
    });
    // Ensure we are joined to receive messages
    if (socket) {
      socket.emit('join-conversation', { conversationId: convId });
      // Optimistically mark as active/read
      setConversations(prev => prev.map(c => 
        c.id === convId ? { ...c, status: 'active' } : c
      ));
    }
  }, [socket]);

  const closeBubble = useCallback((convId: string) => {
    setActiveBubbles(prev => prev.filter(id => id !== convId));
  }, []);

  useEffect(() => {
    const waiting = conversations.filter(c => c.status === 'waiting').length;
    setUnreadCount(waiting);
  }, [conversations]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      isSupportMode,
      isAdminConnected,
      conversationId,
      messages,
      conversations,
      typingUser,
      activeBubbles,
      unreadCount,
      onlineUsers,
      messagesByConv,
      startSupport,
      sendMessage,
      setTyping,
      joinConversation,
      closeConversation,
      exitSupport,
      refreshConversations,
      joinAdminRoom,
      openBubble,
      closeBubble
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
