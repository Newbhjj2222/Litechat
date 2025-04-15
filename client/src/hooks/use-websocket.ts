import { useState, useEffect, useCallback } from 'react';
import { WebSocketMessage } from '@/types';
import { initSocket, closeSocket, sendSocketMessage, onSocketMessage, onSocketStatus } from '@/lib/socket';
import { useAuth } from '@/lib/useAuth';

export const useWebSocket = () => {
  const { userProfile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  
  useEffect(() => {
    // Initialize WebSocket when user is available
    if (userProfile?.id) {
      console.log('Initializing WebSocket with userId:', userProfile.id);
      try {
        initSocket(userProfile.id);
        
        // Register status callback
        const unsubscribeStatus = onSocketStatus(setIsConnected);
        
        // Register message callback
        const unsubscribeMessage = onSocketMessage((message) => {
          setMessages(prev => [...prev, message]);
        });
        
        // Cleanup on unmount
        return () => {
          unsubscribeStatus();
          unsubscribeMessage();
          closeSocket();
        };
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    } else {
      console.log('User not logged in, WebSocket not initialized');
    }
  }, [userProfile?.id]);
  
  // Function to send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    return sendSocketMessage(message);
  }, []);
  
  // Clear message history
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  return {
    isConnected,
    messages,
    sendMessage,
    clearMessages
  };
};

// Hook to handle specific message types
export const useWebSocketEvent = <T = any>(eventType: string, handler: (data: T) => void) => {
  useEffect(() => {
    const unsubscribe = onSocketMessage((message) => {
      if (message.type === eventType) {
        handler(message as unknown as T);
      }
    });
    
    return unsubscribe;
  }, [eventType, handler]);
};
