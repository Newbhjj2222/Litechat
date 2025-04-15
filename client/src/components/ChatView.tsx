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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate(messageText);
    setMessageText('');
    
    // Also notify via WebSocket for real-time updates
    if (userProfile) {
      sendMessage({
        type: 'new_message',
        chatId,
        senderId: userProfile.id,
        content: messageText,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach((message: Message) => {
    const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="flex flex-col flex-1 bg-netgray-100">
      {/* Chat Header */}
      <div className="p-3 bg-netgray-200 flex items-center justify-between">
        <div className="flex items-center">
          <button className="md:hidden mr-2" onClick={onBackClick}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-netgray-500"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
            {chatData?.type === 'group' ? (
              <div className="h-full w-full bg-primary flex items-center justify-center">
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
            <h2 className="font-medium text-netgray-600">{chatData?.name || 'Chat'}</h2>
            <p className="text-xs text-netgray-500">
              {chatData?.isOnline ? 'online' : 'offline'}
            </p>
          </div>
        </div>
        <div className="flex space-x-5">
          <button className="text-netgray-500 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </button>
          <button className="text-netgray-500 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
          </button>
          <button className="text-netgray-500 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        style={{ 
          backgroundImage: `url("data:image/svg+xml;charset=utf8,%3Csvg width='600' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='30' height='30' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 30 0 L 0 0 0 30' fill='none' stroke='%23E9EDEF' stroke-width='0.5' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%23EDEDED'/%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3Cg opacity='0.05'%3E%3Ccircle cx='150' cy='150' r='40' fill='%23128C7E'/%3E%3Ccircle cx='450' cy='450' r='40' fill='%23128C7E'/%3E%3Ccircle cx='300' cy='300' r='60' fill='%2325D366'/%3E%3Ccircle cx='150' cy='450' r='30' fill='%2334B7F1'/%3E%3Ccircle cx='450' cy='150' r='30' fill='%2334B7F1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat'
        }}
      >
        {isLoading ? (
          <div className="flex justify-center">
            <p className="bg-white px-3 py-1 rounded-lg shadow-sm text-netgray-500">
              Loading messages...
            </p>
          </div>
        ) : (
          Object.keys(groupedMessages).map((date) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex justify-center mb-4">
                <div className="bg-white px-3 py-1 rounded-lg shadow-sm">
                  <span className="text-xs text-netgray-500">
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
          <div className="flex justify-center items-center h-full">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <p className="text-netgray-500 mb-2">No messages yet</p>
              <p className="text-sm text-netgray-400">Start the conversation by sending a message</p>
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-netgray-200 flex items-center">
        <button type="button" className="text-netgray-500 mx-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </button>
        <button type="button" className="text-netgray-500 mx-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        </button>
        <div className="flex-1 mx-2">
          <Input
            type="text"
            placeholder="Type a message"
            className="w-full p-2 px-4 bg-white rounded-full text-netgray-600 focus:outline-none"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={!messageText.trim() || sendMessageMutation.isPending}
          className="text-white bg-primary rounded-full h-10 w-10 flex items-center justify-center mx-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </Button>
      </form>
    </div>
  );
};

export default ChatView;
