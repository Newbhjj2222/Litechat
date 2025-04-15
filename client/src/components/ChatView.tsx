import React, { useState, useRef, useEffect } from 'react';
import { AvatarWithStatus } from '@/components/ui/avatar-with-status';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ui/chat-message';
import { Message, ChatItem } from '@/types';
import { useAuth } from '@/lib/useAuth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface ChatViewProps {
  chatId: string;
  onBackClick: () => void;
  chatData?: ChatItem;
}

const ChatView: React.FC<ChatViewProps> = ({ chatId, onBackClick, chatData }) => {
  const { userProfile } = useAuth();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useWebSocket();
  const queryClient = useQueryClient();
  
  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: [chatId ? `/api/messages/${chatId}` : null],
    enabled: !!chatId,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!userProfile) throw new Error('User not logged in');
      
      const message = {
        senderId: userProfile.id,
        chatId,
        content,
        contentType: 'text'
      };
      
      return apiRequest('POST', '/api/messages', message);
    },
    onSuccess: () => {
      // Invalidate messages cache to refresh the chat
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${chatId}`] });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    
    // Send the message
    sendMessageMutation.mutate(messageText);
    
    // Also send through WebSocket for real-time updates
    if (userProfile) {
      sendMessage({
        type: 'message',
        data: {
          senderId: userProfile.id,
          chatId,
          content: messageText,
          contentType: 'text',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Clear the input
    setMessageText('');
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Group messages by date for display
  const groupedMessages: Record<string, Message[]> = {};
  
  messages.forEach((message: Message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="flex flex-col h-full">
      {/* WhatsApp-style Chat Header */}
      <div className="whatsapp-header">
        <div className="flex items-center flex-1">
          <button 
            onClick={onBackClick}
            className="md:hidden mr-3 text-white"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-200">
            {chatData?.type === 'group' ? (
              <div className="h-full w-full bg-[#128c7e] flex items-center justify-center">
                <span className="text-white font-medium">
                  {chatData.name.split(' ').map(word => word[0]).join('').substring(0, 2)}
                </span>
              </div>
            ) : (
              <AvatarWithStatus
                src={chatData?.avatar}
                alt={chatData?.name || 'Chat'}
                fallback={(chatData?.name || 'Chat').substring(0, 2).toUpperCase()}
                status={chatData?.isOnline ? 'online' : 'offline'}
              />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-white">{chatData?.name || 'Chat'}</h2>
            <p className="text-xs text-white/80">
              {chatData?.isOnline ? 'online' : 'last seen today at 12:45 PM'}
            </p>
          </div>
        </div>
        <div className="flex space-x-5">
          <button className="text-white/90 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </button>
          <button className="text-white/90 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          <button className="text-white/90 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </button>
        </div>
      </div>
      
      {/* Chat Messages with white background */}
      <div 
        className="flex-1 overflow-y-auto p-3"
        style={{ 
          backgroundColor: '#ffffff',
        }}
      >
        {isLoading ? (
          <div className="flex justify-center">
            <p className="bg-white px-3 py-1 rounded-lg shadow-sm text-gray-500">
              Loading messages...
            </p>
          </div>
        ) : (
          Object.keys(groupedMessages).map((date) => (
            <div key={date} className="space-y-1">
              {/* Date Separator */}
              <div className="flex justify-center mb-4 mt-4">
                <div className="bg-[#e1f2fb] px-3 py-1 rounded-lg shadow-sm">
                  <span className="text-xs text-[#5c6a73] font-medium">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              {/* Messages for this date */}
              {groupedMessages[date].map((message: Message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  contentType={message.contentType as 'text' | 'image' | 'file'}
                  timestamp={new Date(message.timestamp)}
                  isOwn={userProfile?.id === message.senderId}
                  isRead={message.isRead}
                />
              ))}
            </div>
          ))
        )}
        
        {/* Empty state */}
        {!isLoading && Object.keys(groupedMessages).length === 0 && (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="w-16 h-16 rounded-full bg-[#25d366] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm5.982 13.982a1 1 0 0 1-1.414 0L12 11.414l-4.568 4.568a1 1 0 0 1-1.414-1.414L10.586 10 6.018 5.432a1 1 0 0 1 1.414-1.414L12 8.586l4.568-4.568a1 1 0 0 1 1.414 1.414L13.414 10l4.568 4.568a1 1 0 0 1 0 1.414z"/>
              </svg>
            </div>
            <p className="text-[#075e54] font-medium mb-2">No messages here yet</p>
            <p className="text-sm text-gray-500 max-w-xs text-center">Start the conversation by sending a message or browse chats in your inbox</p>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* WhatsApp-style Chat Input */}
      <div className="bg-[#f0f0f0] px-4 py-2">
        <form onSubmit={handleSendMessage} className="whatsapp-message-input">
          <button type="button" className="text-[#919191] p-2">
            <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
              <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011c-5.869 0-10.631 4.774-10.631 10.658 0 5.883 4.762 10.657 10.631 10.657 5.87 0 10.631-4.774 10.631-10.657 0-5.884-4.761-10.658-10.631-10.658zm0 19.318c-4.758 0-8.626-3.862-8.626-8.66 0-4.799 3.868-8.661 8.626-8.661 4.759 0 8.627 3.862 8.627 8.661 0 4.798-3.868 8.66-8.627 8.66z"/>
            </svg>
          </button>
          <button type="button" className="text-[#919191] p-2">
            <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
              <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"/>
            </svg>
          </button>
          <div className="flex-1 mx-2">
            <Input
              type="text"
              placeholder="Type a message"
              className="w-full p-2 border-none focus:ring-0 focus:outline-none bg-transparent"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>
          {!messageText.trim() ? (
            <button type="button" className="p-2 text-[#919191]">
              <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
                <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"/>
              </svg>
            </button>
          ) : (
            <Button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="p-2 text-white bg-[#25d366] rounded-full h-10 w-10 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
              </svg>
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatView;