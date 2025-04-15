import { WebSocketMessage } from '@/types';

let socket: WebSocket | null = null;
let socketReconnectTimer: number | null = null;
const messageCallbacks: ((message: WebSocketMessage) => void)[] = [];
const statusCallbacks: ((status: boolean) => void)[] = [];

// Initialize WebSocket connection
export const initSocket = (userId: number) => {
  if (socket) {
    socket.close();
  }
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    // Authenticate with userId
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'auth', userId }));
      callStatusCallbacks(true);
    }
    
    // Clear reconnect timer if connection successful
    if (socketReconnectTimer) {
      window.clearTimeout(socketReconnectTimer);
      socketReconnectTimer = null;
    }
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      callMessageCallbacks(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = () => {
    callStatusCallbacks(false);
    
    // Reconnect after delay
    if (!socketReconnectTimer) {
      socketReconnectTimer = window.setTimeout(() => {
        initSocket(userId);
      }, 3000);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket?.close();
  };
  
  return socket;
};

// Send message through WebSocket
export const sendSocketMessage = (message: WebSocketMessage) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  }
  return false;
};

// Close WebSocket connection
export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  // Clear reconnect timer
  if (socketReconnectTimer) {
    window.clearTimeout(socketReconnectTimer);
    socketReconnectTimer = null;
  }
  
  // Clear all callbacks
  messageCallbacks.length = 0;
  statusCallbacks.length = 0;
};

// Register for message callbacks
export const onSocketMessage = (callback: (message: WebSocketMessage) => void) => {
  messageCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = messageCallbacks.indexOf(callback);
    if (index !== -1) {
      messageCallbacks.splice(index, 1);
    }
  };
};

// Register for connection status callbacks
export const onSocketStatus = (callback: (status: boolean) => void) => {
  statusCallbacks.push(callback);
  
  // Initialize with current status
  if (socket) {
    callback(socket.readyState === WebSocket.OPEN);
  } else {
    callback(false);
  }
  
  // Return unsubscribe function
  return () => {
    const index = statusCallbacks.indexOf(callback);
    if (index !== -1) {
      statusCallbacks.splice(index, 1);
    }
  };
};

// Helper to call all message callbacks
const callMessageCallbacks = (message: WebSocketMessage) => {
  messageCallbacks.forEach(callback => {
    try {
      callback(message);
    } catch (error) {
      console.error('Error in WebSocket message callback:', error);
    }
  });
};

// Helper to call all status callbacks
const callStatusCallbacks = (status: boolean) => {
  statusCallbacks.forEach(callback => {
    try {
      callback(status);
    } catch (error) {
      console.error('Error in WebSocket status callback:', error);
    }
  });
};

// Check if connected
export const isSocketConnected = () => {
  return socket && socket.readyState === WebSocket.OPEN;
};
