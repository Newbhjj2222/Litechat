export interface User {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  about?: string;
  createdAt: Date;
}

export interface Message {
  id: number;
  senderId: number;
  chatId: string;
  content: string;
  contentType: string;
  timestamp: Date;
  isRead: boolean;
  isDeleted: boolean;
}

export interface ChatGroup {
  id: number;
  name: string;
  description?: string;
  creatorId: number;
  profilePicture?: string;
  createdAt: Date;
  members?: GroupMember[];
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  isAdmin: boolean;
  canWrite: boolean;
  joinedAt: Date;
  user?: User;
}

export interface Status {
  id: number;
  userId: number;
  content: string;
  contentType: string;
  caption?: string;
  createdAt: Date;
  expiresAt?: Date;
  viewCount?: number;
  hasViewed?: boolean;
  user?: User;
}

export interface StatusView {
  id: number;
  statusId: number;
  viewerId: number;
  viewedAt: Date;
  viewer?: User;
}

export interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt: Date;
  otherUser?: User;
  lastMessage?: Message;
}

export interface ChatItem {
  id: string; // 'user_[id]' or 'group_[id]'
  type: 'user' | 'group';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline?: boolean;
  typingUsers?: string[];
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
