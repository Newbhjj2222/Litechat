import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main user table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  profilePicture: text("profile_picture"),
  about: text("about").default("Available"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  chatId: text("chat_id").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").default("text"),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
  isDeleted: boolean("is_deleted").default(false),
});

// Chat groups table
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  isAdmin: boolean("is_admin").default(false),
  canWrite: boolean("can_write").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Status updates table
export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").default("image"),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Status views table
export const statusViews = pgTable("status_views", {
  id: serial("id").primaryKey(),
  statusId: integer("status_id").notNull(),
  viewerId: integer("viewer_id").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Chat conversations table (for DMs)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
  isRead: true,
  isDeleted: true,
});

export const insertChatGroupSchema = createInsertSchema(chatGroups).omit({
  id: true,
  createdAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertStatusSchema = createInsertSchema(statuses).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertStatusViewSchema = createInsertSchema(statusViews).omit({
  id: true,
  viewedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type ChatGroup = typeof chatGroups.$inferSelect;
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type Status = typeof statuses.$inferSelect;
export type InsertStatus = z.infer<typeof insertStatusSchema>;

export type StatusView = typeof statusViews.$inferSelect;
export type InsertStatusView = z.infer<typeof insertStatusViewSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
