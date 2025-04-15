import { 
  User, InsertUser, 
  Message, InsertMessage, 
  ChatGroup, InsertChatGroup,
  GroupMember, InsertGroupMember,
  Status, InsertStatus,
  StatusView, InsertStatusView,
  Conversation, InsertConversation
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByChatId(chatId: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, isRead: boolean): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Chat group methods
  getChatGroup(id: number): Promise<ChatGroup | undefined>;
  getChatGroups(): Promise<ChatGroup[]>;
  getChatGroupsByUserId(userId: number): Promise<ChatGroup[]>;
  createChatGroup(group: InsertChatGroup): Promise<ChatGroup>;
  updateChatGroup(id: number, groupData: Partial<ChatGroup>): Promise<ChatGroup | undefined>;
  deleteChatGroup(id: number): Promise<boolean>;
  
  // Group member methods
  getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  updateGroupMember(id: number, memberData: Partial<GroupMember>): Promise<GroupMember | undefined>;
  removeGroupMember(id: number): Promise<boolean>;
  
  // Status methods
  getStatus(id: number): Promise<Status | undefined>;
  getStatusesByUserId(userId: number): Promise<Status[]>;
  getActiveStatuses(): Promise<Status[]>;
  createStatus(status: InsertStatus): Promise<Status>;
  deleteStatus(id: number): Promise<boolean>;
  
  // Status view methods
  getStatusViews(statusId: number): Promise<StatusView[]>;
  addStatusView(view: InsertStatusView): Promise<StatusView>;
  
  // Conversation methods
  getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationLastMessage(id: number): Promise<Conversation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private chatGroups: Map<number, ChatGroup>;
  private groupMembers: Map<number, GroupMember>;
  private statuses: Map<number, Status>;
  private statusViews: Map<number, StatusView>;
  private conversations: Map<number, Conversation>;
  
  private userId: number;
  private messageId: number;
  private groupId: number;
  private memberId: number;
  private statusId: number;
  private viewId: number;
  private conversationId: number;
  
  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.chatGroups = new Map();
    this.groupMembers = new Map();
    this.statuses = new Map();
    this.statusViews = new Map();
    this.conversations = new Map();
    
    this.userId = 1;
    this.messageId = 1;
    this.groupId = 1;
    this.memberId = 1;
    this.statusId = 1;
    this.viewId = 1;
    this.conversationId = 1;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByChatId(chatId: string, limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId && !message.isDeleted)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const timestamp = new Date();
    const message: Message = { 
      ...messageData, 
      id, 
      timestamp, 
      isRead: false, 
      isDeleted: false 
    };
    this.messages.set(id, message);
    return message;
  }
  
  async updateMessage(id: number, isRead: boolean): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;
    
    const updatedMessage = { ...message, isDeleted: true };
    this.messages.set(id, updatedMessage);
    return true;
  }
  
  // Chat group methods
  async getChatGroup(id: number): Promise<ChatGroup | undefined> {
    return this.chatGroups.get(id);
  }
  
  async getChatGroups(): Promise<ChatGroup[]> {
    return Array.from(this.chatGroups.values());
  }
  
  async getChatGroupsByUserId(userId: number): Promise<ChatGroup[]> {
    const memberGroups = Array.from(this.groupMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.groupId);
    
    return Array.from(this.chatGroups.values())
      .filter(group => memberGroups.includes(group.id));
  }
  
  async createChatGroup(groupData: InsertChatGroup): Promise<ChatGroup> {
    const id = this.groupId++;
    const createdAt = new Date();
    const group: ChatGroup = { ...groupData, id, createdAt };
    this.chatGroups.set(id, group);
    return group;
  }
  
  async updateChatGroup(id: number, groupData: Partial<ChatGroup>): Promise<ChatGroup | undefined> {
    const group = this.chatGroups.get(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...groupData };
    this.chatGroups.set(id, updatedGroup);
    return updatedGroup;
  }
  
  async deleteChatGroup(id: number): Promise<boolean> {
    return this.chatGroups.delete(id);
  }
  
  // Group member methods
  async getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined> {
    return Array.from(this.groupMembers.values())
      .find(member => member.groupId === groupId && member.userId === userId);
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId);
  }
  
  async addGroupMember(memberData: InsertGroupMember): Promise<GroupMember> {
    const id = this.memberId++;
    const joinedAt = new Date();
    const member: GroupMember = { ...memberData, id, joinedAt };
    this.groupMembers.set(id, member);
    return member;
  }
  
  async updateGroupMember(id: number, memberData: Partial<GroupMember>): Promise<GroupMember | undefined> {
    const member = this.groupMembers.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...memberData };
    this.groupMembers.set(id, updatedMember);
    return updatedMember;
  }
  
  async removeGroupMember(id: number): Promise<boolean> {
    return this.groupMembers.delete(id);
  }
  
  // Status methods
  async getStatus(id: number): Promise<Status | undefined> {
    return this.statuses.get(id);
  }
  
  async getStatusesByUserId(userId: number): Promise<Status[]> {
    const now = new Date();
    return Array.from(this.statuses.values())
      .filter(status => status.userId === userId && (status.expiresAt === null || status.expiresAt > now))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getActiveStatuses(): Promise<Status[]> {
    const now = new Date();
    return Array.from(this.statuses.values())
      .filter(status => status.expiresAt === null || status.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createStatus(statusData: InsertStatus): Promise<Status> {
    const id = this.statusId++;
    const createdAt = new Date();
    // Status expires in 3 days
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + 3);
    
    const status: Status = { ...statusData, id, createdAt, expiresAt };
    this.statuses.set(id, status);
    return status;
  }
  
  async deleteStatus(id: number): Promise<boolean> {
    return this.statuses.delete(id);
  }
  
  // Status view methods
  async getStatusViews(statusId: number): Promise<StatusView[]> {
    return Array.from(this.statusViews.values())
      .filter(view => view.statusId === statusId);
  }
  
  async addStatusView(viewData: InsertStatusView): Promise<StatusView> {
    const id = this.viewId++;
    const viewedAt = new Date();
    const view: StatusView = { ...viewData, id, viewedAt };
    this.statusViews.set(id, view);
    return view;
  }
  
  // Conversation methods
  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values())
      .find(conv => 
        (conv.user1Id === user1Id && conv.user2Id === user2Id) || 
        (conv.user1Id === user2Id && conv.user2Id === user1Id)
      );
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.user1Id === userId || conv.user2Id === userId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }
  
  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const id = this.conversationId++;
    const lastMessageAt = new Date();
    const conversation: Conversation = { ...conversationData, id, lastMessageAt };
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async updateConversationLastMessage(id: number): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updatedConversation = { ...conversation, lastMessageAt: new Date() };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }
}

// Initialize storage
export const storage = new MemStorage();
