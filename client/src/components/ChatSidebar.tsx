import React, { useState, useEffect } from 'react';
import { AvatarWithStatus } from '@/components/ui/avatar-with-status';
import { Input } from '@/components/ui/input';
import { ChatItem, Status } from '@/types';
import { useAuth } from '@/lib/useAuth';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  onProfileClick: () => void;
  onStatusClick: () => void;
  onNewChatClick: () => void;
  onNewGroupClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  selectedChatId?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onChatSelect,
  onProfileClick,
  onStatusClick,
  onNewChatClick,
  onNewGroupClick,
  onSettingsClick,
  onLogout,
  selectedChatId,
}) => {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  // Fetch chats
  const { data: chats = [], isLoading: isLoadingChats } = useQuery({
    queryKey: [userProfile?.id ? `/api/users/${userProfile.id}/conversations` : null],
    enabled: !!userProfile?.id,
  });
  
  // Fetch active statuses
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['/api/statuses'],
    enabled: !!userProfile?.id,
  });
  
  // Filter chats based on search query
  const filteredChats = chats.filter((chat: ChatItem) => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get user's own status
  const userStatus = userProfile?.id 
    ? statuses.find((s: Status) => s.userId === userProfile.id)
    : null;
  
  // Get other users' statuses
  const otherStatuses = userProfile?.id
    ? statuses.filter((s: Status) => s.userId !== userProfile.id)
    : [];
  
  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menuButton = document.getElementById('menuButton');
      const dropdownMenu = document.getElementById('dropdownMenu');
      
      if (
        menuButton && 
        dropdownMenu && 
        !menuButton.contains(event.target as Node) && 
        !dropdownMenu.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="w-full md:w-96 bg-white border-r border-netgray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 bg-netgray-100 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onProfileClick} className="mr-4">
            <AvatarWithStatus
              src={userProfile?.profilePicture}
              alt={userProfile?.username || 'User'}
              fallback={userProfile?.username?.substring(0, 2).toUpperCase()}
              status="online"
            />
          </button>
          <h1 className="text-xl font-bold text-primary-dark">NetChat</h1>
        </div>
        <div className="flex space-x-5">
          <button 
            className="text-netgray-500 hover:text-primary transition-colors" 
            onClick={onStatusClick}
            aria-label="Status"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
          </button>
          <button 
            className="text-netgray-500 hover:text-primary transition-colors" 
            onClick={onNewChatClick}
            aria-label="New chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <div className="relative">
            <button 
              id="menuButton"
              className="text-netgray-500 hover:text-primary transition-colors" 
              onClick={handleMenuToggle}
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </button>
            <div 
              id="dropdownMenu" 
              className={`absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10 ${showMenu ? '' : 'hidden'}`}
            >
              <ul className="py-1">
                <li>
                  <button 
                    onClick={() => {
                      onNewGroupClick();
                      setShowMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-netgray-600 hover:bg-netgray-100 w-full text-left"
                  >
                    New Group
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      onSettingsClick();
                      setShowMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-netgray-600 hover:bg-netgray-100 w-full text-left"
                  >
                    Settings
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      onLogout();
                      setShowMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-netgray-600 hover:bg-netgray-100 w-full text-left"
                  >
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-2 bg-white">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search or start new chat"
            className="w-full p-2 pl-10 bg-netgray-100 rounded-lg text-netgray-600 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="absolute left-3 top-3 text-netgray-400" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>
      
      {/* Status Row */}
      <div className="p-3 overflow-x-auto">
        <div className="flex space-x-4">
          {/* Your status */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-white p-0.5">
                <div className={`status-ring ${userStatus ? 'active' : ''} h-full w-full rounded-full p-0.5`}>
                  <AvatarWithStatus
                    src={userProfile?.profilePicture}
                    alt={userProfile?.username || 'Your status'}
                    fallback={userProfile?.username?.substring(0, 2).toUpperCase()}
                    size="lg"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-primary-light text-white rounded-full p-1 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
            </div>
            <span className="text-xs mt-1 text-netgray-500">Your status</span>
          </div>
          
          {/* Other users' statuses */}
          {otherStatuses.slice(0, 6).map((status: Status) => (
            <div key={status.id} className="flex flex-col items-center">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-2 border-white p-0.5">
                  <div className="status-ring active h-full w-full rounded-full p-0.5">
                    <AvatarWithStatus
                      src={status.user?.profilePicture}
                      alt={status.user?.username || 'User'}
                      fallback={status.user?.username?.substring(0, 2).toUpperCase()}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
              <span className="text-xs mt-1 text-netgray-500">
                {status.user?.username?.split(' ')[0] || 'User'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingChats ? (
          <div className="p-4 text-center text-netgray-500">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-netgray-500">
            {searchQuery ? 'No chats match your search' : 'No chats yet'}
          </div>
        ) : (
          filteredChats.map((chat: ChatItem) => (
            <div 
              key={chat.id}
              className={`chat-item p-3 hover:bg-netgray-100 cursor-pointer border-t border-netgray-200 flex items-center ${
                selectedChatId === chat.id ? 'bg-netgray-100' : ''
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="h-12 w-12 rounded-full overflow-hidden mr-3">
                {chat.type === 'group' ? (
                  <div className="h-full w-full bg-primary flex items-center justify-center">
                    <span className="text-white font-medium">
                      {chat.name.split(' ').map(word => word[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                ) : (
                  <AvatarWithStatus
                    src={chat.avatar}
                    alt={chat.name}
                    fallback={chat.name.substring(0, 2).toUpperCase()}
                    status={chat.isOnline ? 'online' : 'offline'}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <h3 className="font-medium text-netgray-600 truncate">{chat.name}</h3>
                  <span className="text-xs text-netgray-400">
                    {chat.lastMessageTime ? format(new Date(chat.lastMessageTime), 'h:mm a') : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-netgray-500 truncate">
                    {chat.type === 'group' && chat.lastMessage && (
                      <span className="font-medium">{chat.typingUsers?.[0]}: </span>
                    )}
                    {chat.lastMessage || 'Start a conversation'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <div className="bg-primary rounded-full h-5 w-5 flex items-center justify-center">
                      <span className="text-xs text-white">{chat.unreadCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
