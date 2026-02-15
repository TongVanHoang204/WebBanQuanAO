/**
 * useChat hook — thin re-export from ChatContext.
 *
 * All chat state now lives in <ChatProvider> (root level) so it
 * persists across every route change without being destroyed.
 * localStorage backs it up for page refreshes (7-day expiration).
 * sessionStorage keeps the open/close state for the browser tab.
 */
export { useChatContext as useChat } from '../contexts/ChatContext';
export type { ChatContextType as UseChatReturn } from '../contexts/ChatContext';
