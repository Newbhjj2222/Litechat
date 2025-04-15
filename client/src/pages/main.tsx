import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/useAuth';
import { useWebSocket } from '@/hooks/use-websocket';
import ChatSidebar from '@/components/ChatSidebar';
import ChatView from '@/components/ChatView';
import ProfileView from '@/components/ProfileView';
import StatusViewer from '@/components/StatusViewer';
import CreateGroupModal from '@/components/CreateGroupModal';
import CreateStatusModal from '@/components/CreateStatusModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatItem, Status } from '@/types';

// Welcome screen component shown when no chat is selected
const WelcomeScreen: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-netgray-100">
      <div className="text-center p-8">
        <div className="h-32 w-32 rounded-full bg-[#25d366] flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white">
            <path d="M32 16C23.2 16 16 23.2 16 32C16 36.1 17.4 39.9 19.7 42.9L17.5 48L23.3 46.1C26.2 48 29 49 32 49C40.8 49 48 41.8 48 33C48 24.2 40.8 16 32 16ZM39.7 39.7C39.2 40.7 37.4 41.6 36.5 41.7C35.6 41.8 34.8 42.1 30.5 40.4C25.2 38.3 22 33 21.8 32.7C21.6 32.4 19.8 30 19.8 27.5C19.8 25 21.1 23.8 21.5 23.3C21.9 22.8 22.5 22.7 22.8 22.7C23.1 22.7 23.5 22.7 23.8 22.7C24.1 22.7 24.5 22.6 24.9 23.5C25.3 24.4 26.2 26.9 26.3 27.1C26.4 27.3 26.5 27.5 26.3 27.8C26.1 28.1 26 28.3 25.8 28.5C25.6 28.7 25.3 29 25.1 29.2C24.9 29.4 24.7 29.6 24.9 30C25.1 30.4 26 31.9 27.4 33.1C29.2 34.6 30.7 35.1 31.1 35.3C31.5 35.5 31.7 35.4 32 35.1C32.3 34.8 33.1 33.9 33.4 33.5C33.7 33.1 34 33.2 34.4 33.3C34.8 33.4 37.3 34.6 37.7 34.8C38.1 35 38.4 35.1 38.5 35.3C38.6 35.7 38.6 36.6 38.1 37.6L39.7 39.7Z" fill="currentColor"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-black mb-4">Welcome to NetChat</h1>
        <p className="text-black mb-6">Connect with friends, create groups, and share your status updates.</p>
        <p className="text-black">Select a chat to start messaging</p>
      </div>
    </div>
  );
};

const MainPage: React.FC = () => {
  const { userProfile, loading, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  
  // UI state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showChatView, setShowChatView] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateStatus, setShowCreateStatus] = useState(false);
  
  // Get all chats for the user
  const { data: conversations = [], isLoading: isLoadingChats } = useQuery({
    queryKey: [userProfile?.id ? `/api/users/${userProfile.id}/conversations` : null],
    enabled: !!userProfile?.id,
  });
  
  // Get user groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: [userProfile?.id ? `/api/users/${userProfile.id}/groups` : null],
    enabled: !!userProfile?.id,
  });
  
  // Get active statuses
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['/api/statuses'],
    enabled: !!userProfile?.id,
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !userProfile) {
      setLocation('/login');
    }
  }, [userProfile, loading, setLocation]);
  
  // Format conversations into chat items
  const chatItems: ChatItem[] = [
    // Individual chats
    ...conversations.map((conv: any) => ({
      id: `user_${conv.user1Id}_${conv.user2Id}`,
      type: 'user',
      name: conv.otherUser?.username || 'Unknown User',
      avatar: conv.otherUser?.profilePicture,
      lastMessage: conv.lastMessage?.content,
      lastMessageTime: conv.lastMessageAt,
      unreadCount: 0,
      isOnline: true, // TODO: implement online status tracking
    })),
    // Group chats
    ...groups.map((group: any) => ({
      id: `group_${group.id}`,
      type: 'group',
      name: group.name,
      avatar: group.profilePicture,
      lastMessage: '', // TODO: implement last message for groups
      unreadCount: 0,
    })),
  ];
  
  // Find the selected chat data
  const selectedChat = chatItems.find(chat => chat.id === selectedChatId);
  
  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowChatView(true);
    setShowProfile(false);
    setShowStatusViewer(false);
    
    // On mobile, hide the chat list
    if (window.innerWidth < 768) {
      setShowChatList(false);
    }
  };
  
  // Handle back button on mobile
  const handleBackToList = () => {
    setShowChatList(true);
    setShowChatView(false);
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    setLocation('/login');
  };
  
  // Handle status view
  const handleStatusView = (statusId: number) => {
    setSelectedStatusId(statusId);
    setShowStatusViewer(true);
    setShowChatView(false);
    setShowProfile(false);
    
    // On mobile, hide the chat list
    if (window.innerWidth < 768) {
      setShowChatList(false);
    }
  };
  
  // Handle status navigation
  const handleNextStatus = () => {
    if (!selectedStatusId) return;
    
    const statusIndex = statuses.findIndex((s: Status) => s.id === selectedStatusId);
    if (statusIndex < statuses.length - 1) {
      setSelectedStatusId(statuses[statusIndex + 1].id);
    } else {
      // Loop back to first status
      setSelectedStatusId(statuses[0].id);
    }
  };
  
  const handlePreviousStatus = () => {
    if (!selectedStatusId) return;
    
    const statusIndex = statuses.findIndex((s: Status) => s.id === selectedStatusId);
    if (statusIndex > 0) {
      setSelectedStatusId(statuses[statusIndex - 1].id);
    } else {
      // Loop to last status
      setSelectedStatusId(statuses[statuses.length - 1].id);
    }
  };
  
  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-netgray-100">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#25d366] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Render main app layout
  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chat List */}
        <div className={`${showChatList ? 'block' : 'hidden'} md:block w-full md:w-96 bg-white border-r border-netgray-200 flex flex-col h-full`}>
          <ChatSidebar
            onChatSelect={handleChatSelect}
            onProfileClick={() => {
              setShowProfile(true);
              setShowChatView(false);
              setShowStatusViewer(false);
              if (window.innerWidth < 768) {
                setShowChatList(false);
              }
            }}
            onStatusClick={() => {
              // Show status creation modal or own status
              if (statuses && statuses.length > 0) {
                const ownStatus = statuses.find((s: Status) => s.userId === userProfile?.id);
                if (ownStatus) {
                  handleStatusView(ownStatus.id);
                } else {
                  setShowCreateStatus(true);
                }
              } else {
                setShowCreateStatus(true);
              }
            }}
            onNewChatClick={() => {
              // Show create chat dialog
              // (For now, we'll just show welcome screen)
              setSelectedChatId(null);
              setShowChatView(false);
              setShowProfile(false);
              setShowStatusViewer(false);
            }}
            onNewGroupClick={() => setShowCreateGroup(true)}
            onSettingsClick={() => {
              // Show settings (for now, use profile)
              setShowProfile(true);
              setShowChatView(false);
              setShowStatusViewer(false);
              if (window.innerWidth < 768) {
                setShowChatList(false);
              }
            }}
            onLogout={handleLogout}
            selectedChatId={selectedChatId || undefined}
          />
        </div>
        
        {/* Right Content - Chat */}
        {showChatView && selectedChatId && (
          <div className={`${showChatView ? 'block' : 'hidden'} md:flex flex-col flex-1 bg-netgray-100`}>
            <ChatView
              chatId={selectedChatId}
              onBackClick={handleBackToList}
              chatData={selectedChat}
            />
          </div>
        )}
        
        {/* Welcome Screen (shown when no chat is selected) */}
        {!showChatView && !showProfile && !showStatusViewer && (
          <div className="flex flex-col flex-1">
            <WelcomeScreen />
          </div>
        )}
        
        {/* Profile Page */}
        {showProfile && (
          <div className={`${showProfile ? 'block' : 'hidden'} md:flex flex-col flex-1 bg-white`}>
            <ProfileView onBack={handleBackToList} />
          </div>
        )}
        
        {/* Status Viewer */}
        {showStatusViewer && selectedStatusId !== null && (
          <div className={`${showStatusViewer ? 'block' : 'hidden'} md:flex flex-col flex-1 bg-black`}>
            <StatusViewer
              statusId={selectedStatusId}
              onClose={() => {
                setShowStatusViewer(false);
                // On mobile, show chat list
                if (window.innerWidth < 768) {
                  setShowChatList(true);
                }
              }}
              onNext={statuses.length > 1 ? handleNextStatus : undefined}
              onPrevious={statuses.length > 1 ? handlePreviousStatus : undefined}
            />
          </div>
        )}
      </div>
      
      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
      
      <CreateStatusModal
        isOpen={showCreateStatus}
        onClose={() => setShowCreateStatus(false)}
      />
      
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-md shadow-md text-sm">
          Connecting...
        </div>
      )}
    </div>
  );
};

export default MainPage;
