import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { 
  insertUserSchema, 
  insertMessageSchema, 
  insertChatGroupSchema,
  insertGroupMemberSchema,
  insertStatusSchema,
  insertStatusViewSchema,
  insertConversationSchema
} from "@shared/schema";

// WebSocket clients tracked by userId
interface WebSocketClient extends WebSocket {
  userId?: number;
}

// Create a map of active WebSocket connections
const clients = new Map<number, WebSocketClient[]>();

// Helper to send messages to users
function sendToUser(userId: number, data: any) {
  const userSockets = clients.get(userId) || [];
  
  userSockets.forEach(socket => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  });
}

// Helper to broadcast to all clients
function broadcast(data: any) {
  clients.forEach((sockets) => {
    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    });
  });
}

// Helper to send to group members
async function sendToGroup(groupId: number, data: any) {
  const members = await storage.getGroupMembers(groupId);
  
  members.forEach(member => {
    sendToUser(member.userId, data);
  });
}

// Chat API with auto-cleanup functions
export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Registration endpoint
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      // Validate user data
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with this email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Check if username is available
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create new user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating user' });
    }
  });
  
  // Login endpoint
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  });
  
  // Get current user
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Error fetching user' });
    }
  });
  
  // Update user
  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  });
  
  // Delete user
  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  });
  
  // Get messages
  app.get('/api/messages/:chatId', async (req: Request, res: Response) => {
    try {
      const chatId = req.params.chatId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const messages = await storage.getMessagesByChatId(chatId, limit);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });
  
  // Send message
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // Create message
      const message = await storage.createMessage(messageData);
      
      // Emit to websocket clients
      if (messageData.chatId.startsWith('group_')) {
        // Group message
        const groupId = parseInt(messageData.chatId.replace('group_', ''));
        const group = await storage.getChatGroup(groupId);
        
        if (group) {
          await sendToGroup(groupId, {
            type: 'new_message',
            chatId: messageData.chatId,
            message
          });
        }
      } else {
        // Direct message
        const parts = messageData.chatId.split('_');
        if (parts.length === 2) {
          const user1Id = parseInt(parts[0]);
          const user2Id = parseInt(parts[1]);
          
          sendToUser(user1Id, {
            type: 'new_message',
            chatId: messageData.chatId,
            message
          });
          
          sendToUser(user2Id, {
            type: 'new_message',
            chatId: messageData.chatId,
            message
          });
          
          // Get or create conversation
          let conversation = await storage.getConversation(user1Id, user2Id);
          
          if (!conversation) {
            conversation = await storage.createConversation({
              user1Id,
              user2Id
            });
          } else {
            await storage.updateConversationLastMessage(conversation.id);
          }
        }
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Send message error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error sending message' });
    }
  });
  
  // Create chat group
  app.post('/api/groups', async (req: Request, res: Response) => {
    try {
      const groupData = insertChatGroupSchema.parse(req.body);
      
      // Create group
      const group = await storage.createChatGroup(groupData);
      
      // Add creator as admin
      await storage.addGroupMember({
        groupId: group.id,
        userId: groupData.creatorId,
        isAdmin: true,
        canWrite: true
      });
      
      res.status(201).json(group);
    } catch (error) {
      console.error('Create group error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating group' });
    }
  });
  
  // Get group details
  app.get('/api/groups/:id', async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getChatGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      // Get group members
      const members = await storage.getGroupMembers(groupId);
      
      res.json({ ...group, members });
    } catch (error) {
      console.error('Get group error:', error);
      res.status(500).json({ message: 'Error fetching group' });
    }
  });
  
  // Get user's groups
  app.get('/api/users/:id/groups', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const groups = await storage.getChatGroupsByUserId(userId);
      res.json(groups);
    } catch (error) {
      console.error('Get user groups error:', error);
      res.status(500).json({ message: 'Error fetching groups' });
    }
  });
  
  // Add member to group
  app.post('/api/groups/:id/members', async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const { userId, isAdmin = false, canWrite = true } = req.body;
      
      // Check if group exists
      const group = await storage.getChatGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user is already a member
      const existingMember = await storage.getGroupMember(groupId, userId);
      if (existingMember) {
        return res.status(400).json({ message: 'User is already a member of this group' });
      }
      
      // Add user to group
      const member = await storage.addGroupMember({
        groupId,
        userId,
        isAdmin,
        canWrite
      });
      
      // Notify group members
      await sendToGroup(groupId, {
        type: 'member_added',
        groupId,
        userId,
        member
      });
      
      res.status(201).json(member);
    } catch (error) {
      console.error('Add member error:', error);
      res.status(500).json({ message: 'Error adding member' });
    }
  });
  
  // Update group member
  app.patch('/api/groups/members/:id', async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      const { isAdmin, canWrite } = req.body;
      
      const updatedMember = await storage.updateGroupMember(memberId, { isAdmin, canWrite });
      
      if (!updatedMember) {
        return res.status(404).json({ message: 'Member not found' });
      }
      
      // Notify group members
      await sendToGroup(updatedMember.groupId, {
        type: 'member_updated',
        groupId: updatedMember.groupId,
        member: updatedMember
      });
      
      res.json(updatedMember);
    } catch (error) {
      console.error('Update member error:', error);
      res.status(500).json({ message: 'Error updating member' });
    }
  });
  
  // Create status
  app.post('/api/statuses', async (req: Request, res: Response) => {
    try {
      const statusData = insertStatusSchema.parse(req.body);
      
      // Create status
      const status = await storage.createStatus(statusData);
      
      // Broadcast new status to all clients
      broadcast({
        type: 'new_status',
        userId: statusData.userId,
        status
      });
      
      res.status(201).json(status);
    } catch (error) {
      console.error('Create status error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating status' });
    }
  });
  
  // Get user statuses
  app.get('/api/users/:id/statuses', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const statuses = await storage.getStatusesByUserId(userId);
      res.json(statuses);
    } catch (error) {
      console.error('Get statuses error:', error);
      res.status(500).json({ message: 'Error fetching statuses' });
    }
  });
  
  // Get all active statuses
  app.get('/api/statuses', async (req: Request, res: Response) => {
    try {
      const statuses = await storage.getActiveStatuses();
      res.json(statuses);
    } catch (error) {
      console.error('Get all statuses error:', error);
      res.status(500).json({ message: 'Error fetching statuses' });
    }
  });
  
  // View status
  app.post('/api/statuses/:id/views', async (req: Request, res: Response) => {
    try {
      const statusId = parseInt(req.params.id);
      const { viewerId } = req.body;
      
      // Check if status exists
      const status = await storage.getStatus(statusId);
      if (!status) {
        return res.status(404).json({ message: 'Status not found' });
      }
      
      // Record the view
      const view = await storage.addStatusView({
        statusId,
        viewerId
      });
      
      // Notify status owner
      sendToUser(status.userId, {
        type: 'status_viewed',
        statusId,
        viewerId,
        view
      });
      
      res.status(201).json(view);
    } catch (error) {
      console.error('View status error:', error);
      res.status(500).json({ message: 'Error recording status view' });
    }
  });
  
  // Get status views
  app.get('/api/statuses/:id/views', async (req: Request, res: Response) => {
    try {
      const statusId = parseInt(req.params.id);
      const views = await storage.getStatusViews(statusId);
      res.json(views);
    } catch (error) {
      console.error('Get status views error:', error);
      res.status(500).json({ message: 'Error fetching status views' });
    }
  });
  
  // Get user conversations
  app.get('/api/users/:id/conversations', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const conversations = await storage.getConversationsByUserId(userId);
      
      // Get other users' details
      const conversationsWithUsers = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
          const otherUser = await storage.getUser(otherUserId);
          
          if (!otherUser) return null;
          
          // Remove sensitive info
          const { password, ...otherUserInfo } = otherUser;
          
          return {
            ...conv,
            otherUser: otherUserInfo
          };
        })
      );
      
      // Filter out null values (for deleted users)
      const validConversations = conversationsWithUsers.filter(Boolean);
      
      res.json(validConversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Error fetching conversations' });
    }
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('WebSocket client connected');
    
    // Handle authentication message
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle different message types
        if (data.type === 'auth') {
          const userId = data.userId;
          ws.userId = userId;
          
          // Add to clients map
          if (!clients.has(userId)) {
            clients.set(userId, []);
          }
          clients.get(userId)?.push(ws);
          
          console.log(`User ${userId} authenticated via WebSocket`);
          
          // Send confirmation
          ws.send(JSON.stringify({ type: 'auth_success' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (ws.userId) {
        // Remove socket from clients map
        const userSockets = clients.get(ws.userId) || [];
        const newUserSockets = userSockets.filter(socket => socket !== ws);
        
        if (newUserSockets.length > 0) {
          clients.set(ws.userId, newUserSockets);
        } else {
          clients.delete(ws.userId);
        }
        
        console.log(`User ${ws.userId} disconnected`);
      }
    });
  });
  
  // Schedule cleanup jobs
  
  // 1. Auto-delete messages after 10 days
  setInterval(async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    // In a real database, we would use a query to find and delete
    // For now, we'll mark messages as deleted
    for (const [id, message] of storage.messages.entries()) {
      if (message.timestamp < tenDaysAgo && !message.isDeleted) {
        await storage.deleteMessage(id);
      }
    }
  }, 86400000); // Run daily
  
  // 2. Auto-delete statuses after 3 days
  setInterval(async () => {
    const now = new Date();
    
    // In a real database, we would use a query to find and delete
    for (const [id, status] of storage.statuses.entries()) {
      if (status.expiresAt && status.expiresAt < now) {
        await storage.deleteStatus(id);
      }
    }
  }, 3600000); // Run hourly
  
  return httpServer;
}
