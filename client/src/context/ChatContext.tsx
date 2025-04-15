import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useWebSocket, useWebSocketEvent } from '@/hooks/use-websocket';
import { ChatItem, Message } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface ChatContextType {
  selectedChatId: string | null;
  selectChat: (chatId: string) => void;
  chats: ChatItem[];
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, content: string, contentType?: string) => boolean;
  unreadCounts: Record<string, number>;
  markChatAsRead: (chatId: string) => void;
  isInitialized: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const { isConnected, messages: wsMessages, sendMessage: sendWsMessage } = useWebSocket();
  const queryClient = useQueryClient();
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Load chat data when user logs in
  useEffect(() => {
    if (userProfile?.id && isConnected) {
      // Initialize chat data
      // This would typically fetch chats and messages from API
      setIsInitialized(true);
    }
  }, [userProfile?.id, isConnected]);
  
  // Handle new message from WebSocket
  useWebSocketEvent('new_message', (data) => {
    const { chatId, message } = data;
    
    // Add message to the appropriate chat
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: [...chatMessages, message]
      };
    });
    
    // If not the currently selected chat, increment unread count
    if (selectedChatId !== chatId) {
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || 0) + 1
      }));
    }
    
    // Invalidate cache to refresh chat list
    queryClient.invalidateQueries({ queryKey: [`/api/messages/${chatId}`] });
  });
  
  // Handle status changes
  useWebSocketEvent('new_status', () => {
    // Invalidate status queries
    queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
    if (userProfile?.id) {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userProfile.id}/statuses`] });
    }
  });
  
  // Send a message
  const sendMessage = (chatId: string, content: string, contentType = 'text') => {
    if (!userProfile) return false;
    
    // Send via WebSocket for real-time updates
    const success = sendWsMessage({
      type: 'new_message',
      chatId,
      senderId: userProfile.id,
      content,
      contentType,
      timestamp: new Date().toISOString()
    });
    
    return success;
  };
  
  // Mark a chat as read
  const markChatAsRead = (chatId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: 0
    }));
    
    // If we had an API for this, we would call it here
  };
  
  const selectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    markChatAsRead(chatId);
  };
  
  return (
    <ChatContext.Provider
      value={{
        selectedChatId,
        selectChat,
        chats,
        messages,
        sendMessage,
        unreadCounts,
        markChatAsRead,
        isInitialized
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
