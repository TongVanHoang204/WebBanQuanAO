import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { chatAPI } from '../services/api';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! 👋 Mình là Feshen - trợ lý AI của ShopFeshen. Mình có thể giúp bạn tìm kiếm sản phẩm, tư vấn size, hoặc giải đáp thắc mắc. Bạn cần mình hỗ trợ gì nào? 🛍️',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    // Optimistic update
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare history (excluding the current new message which is passed strictly as 'content' generally, 
      // but here we are sending it as 'message' param. 
      // The backend will treat 'message' as the current prompt.
      // So history should be existing messages.
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatAPI.send(content, history);
      const { message, products, orders } = response.data.data;

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: message,
        products,
        orders,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! 👋 Mình là Feshen - trợ lý AI của ShopFeshen. Mình có thể giúp bạn tìm kiếm sản phẩm, tư vấn size, hoặc giải đáp thắc mắc. Bạn cần mình hỗ trợ gì nào? 🛍️',
      timestamp: new Date()
    }]);
  }, []);

  return {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    toggleChat,
    clearMessages
  };
}
