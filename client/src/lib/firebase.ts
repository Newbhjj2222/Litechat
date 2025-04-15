import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getDatabase, ref, set, onValue, update, remove, push, serverTimestamp } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log configuration for debugging (without exposing API key)
console.log('Firebase initialized with project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// Authentication helpers
export const registerUser = async (email: string, password: string, username: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });
    return userCredential.user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

// User profile helpers
export const updateUserProfile = async (userId: string, data: any) => {
  try {
    await update(ref(db, `users/${userId}`), data);
    if (data.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
    }
    if (data.photoURL && auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: data.photoURL });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

export const uploadProfileImage = async (userId: string, file: File) => {
  try {
    const imageRef = storageRef(storage, `users/${userId}/profile`);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    await updateUserProfile(userId, { photoURL: downloadURL });
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};

// Message helpers
export const sendMessage = async (chatId: string, senderId: string, content: string, contentType = "text") => {
  try {
    const messageRef = push(ref(db, `messages/${chatId}`));
    const timestamp = serverTimestamp();
    await set(messageRef, {
      senderId,
      content,
      contentType,
      timestamp,
      isRead: false,
      isDeleted: false
    });
    
    // Update last message in chat
    await update(ref(db, `chats/${chatId}`), {
      lastMessage: { content, senderId, timestamp }
    });
    
    return messageRef.key;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const markMessageAsRead = async (chatId: string, messageId: string) => {
  try {
    await update(ref(db, `messages/${chatId}/${messageId}`), { isRead: true });
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    await update(ref(db, `messages/${chatId}/${messageId}`), { isDeleted: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

// Group helpers
export const createGroup = async (name: string, creatorId: string, members: string[] = []) => {
  try {
    // Create group
    const groupRef = push(ref(db, 'groups'));
    const timestamp = serverTimestamp();
    
    await set(groupRef, {
      name,
      creatorId,
      createdAt: timestamp,
      memberCount: members.length + 1 // Including creator
    });
    
    const groupId = groupRef.key;
    if (!groupId) throw new Error('Failed to create group');
    
    // Add creator as admin
    await set(ref(db, `groupMembers/${groupId}/${creatorId}`), {
      isAdmin: true,
      canWrite: true,
      joinedAt: timestamp
    });
    
    // Add members
    for (const memberId of members) {
      await set(ref(db, `groupMembers/${groupId}/${memberId}`), {
        isAdmin: false,
        canWrite: true,
        joinedAt: timestamp
      });
    }
    
    // Create chat for the group
    await set(ref(db, `chats/group_${groupId}`), {
      type: 'group',
      groupId,
      createdAt: timestamp
    });
    
    return groupId;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

export const addGroupMember = async (groupId: string, userId: string, isAdmin = false, canWrite = true) => {
  try {
    const timestamp = serverTimestamp();
    await set(ref(db, `groupMembers/${groupId}/${userId}`), {
      isAdmin,
      canWrite,
      joinedAt: timestamp
    });
    
    // Increment member count
    const groupRef = ref(db, `groups/${groupId}`);
    onValue(groupRef, (snapshot) => {
      const group = snapshot.val();
      if (group) {
        update(groupRef, {
          memberCount: (group.memberCount || 0) + 1
        });
      }
    }, { onlyOnce: true });
  } catch (error) {
    console.error("Error adding group member:", error);
    throw error;
  }
};

export const removeGroupMember = async (groupId: string, userId: string) => {
  try {
    await remove(ref(db, `groupMembers/${groupId}/${userId}`));
    
    // Decrement member count
    const groupRef = ref(db, `groups/${groupId}`);
    onValue(groupRef, (snapshot) => {
      const group = snapshot.val();
      if (group && group.memberCount > 0) {
        update(groupRef, {
          memberCount: group.memberCount - 1
        });
      }
    }, { onlyOnce: true });
  } catch (error) {
    console.error("Error removing group member:", error);
    throw error;
  }
};

export const updateGroupMember = async (groupId: string, userId: string, isAdmin: boolean, canWrite: boolean) => {
  try {
    await update(ref(db, `groupMembers/${groupId}/${userId}`), {
      isAdmin,
      canWrite
    });
  } catch (error) {
    console.error("Error updating group member:", error);
    throw error;
  }
};

// Status helpers
export const createStatus = async (userId: string, content: string, contentType = "image", caption?: string) => {
  try {
    const statusRef = push(ref(db, `statuses/${userId}`));
    const timestamp = serverTimestamp();
    
    // Calculate expiry (3 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);
    
    await set(statusRef, {
      content,
      contentType,
      caption,
      createdAt: timestamp,
      expiresAt: expiresAt.toISOString()
    });
    
    return statusRef.key;
  } catch (error) {
    console.error("Error creating status:", error);
    throw error;
  }
};

export const uploadStatusMedia = async (userId: string, file: File) => {
  try {
    const timestamp = Date.now();
    const statusRef = storageRef(storage, `statuses/${userId}/${timestamp}`);
    await uploadBytes(statusRef, file);
    const downloadURL = await getDownloadURL(statusRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading status media:", error);
    throw error;
  }
};

export const viewStatus = async (statusId: string, viewerId: string) => {
  try {
    const viewRef = ref(db, `statusViews/${statusId}/${viewerId}`);
    await set(viewRef, {
      viewedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error recording status view:", error);
    throw error;
  }
};

// Conversation helpers
export const getOrCreateConversation = async (user1Id: string, user2Id: string) => {
  try {
    // Sort IDs to ensure consistent chat ID
    const sortedIds = [user1Id, user2Id].sort();
    const chatId = `user_${sortedIds[0]}_${sortedIds[1]}`;
    
    // Check if conversation exists
    const chatRef = ref(db, `chats/${chatId}`);
    return new Promise((resolve, reject) => {
      onValue(chatRef, async (snapshot) => {
        if (snapshot.exists()) {
          resolve(chatId);
        } else {
          // Create new conversation
          try {
            await set(chatRef, {
              type: 'private',
              participants: {
                [user1Id]: true,
                [user2Id]: true
              },
              createdAt: serverTimestamp()
            });
            resolve(chatId);
          } catch (error) {
            reject(error);
          }
        }
      }, { onlyOnce: true });
    });
  } catch (error) {
    console.error("Error with conversation:", error);
    throw error;
  }
};

// Cleanup function to delete expired content
export const setupAutoCleanup = () => {
  // Auto-delete statuses after 3 days
  const statusCleanupRef = ref(db, 'statuses');
  onValue(statusCleanupRef, (snapshot) => {
    const now = new Date();
    const statuses = snapshot.val();
    
    if (statuses) {
      Object.entries(statuses).forEach(([userId, userStatuses]: [string, any]) => {
        Object.entries(userStatuses).forEach(([statusId, status]: [string, any]) => {
          if (status.expiresAt) {
            const expiryDate = new Date(status.expiresAt);
            if (now > expiryDate) {
              remove(ref(db, `statuses/${userId}/${statusId}`));
            }
          }
        });
      });
    }
  });
  
  // Auto-delete messages after 10 days
  const messagesCleanupRef = ref(db, 'messages');
  onValue(messagesCleanupRef, (snapshot) => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const messages = snapshot.val();
    
    if (messages) {
      Object.entries(messages).forEach(([chatId, chatMessages]: [string, any]) => {
        Object.entries(chatMessages).forEach(([messageId, message]: [string, any]) => {
          if (message.timestamp) {
            const messageDate = new Date(message.timestamp);
            if (tenDaysAgo > messageDate) {
              update(ref(db, `messages/${chatId}/${messageId}`), { isDeleted: true });
            }
          }
        });
      });
    }
  }, { onlyOnce: true });
};

export { app, auth, db, storage };
