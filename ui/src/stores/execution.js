import { defineStore } from 'pinia'
import axios from 'axios'
import { io } from 'socket.io-client'

export const useExecutionStore = defineStore('execution', {
  state: () => ({
    isExecuting: false,
    sessions: {},
    socket: null,
    socketConnected: false,
    currentSessionId: null
  }),
  
  actions: {
    connectSocket() {
      if (this.socket) {
        // Already connected or connecting
        return;
      }
      
      // Connect to socket.io on the same base URL as the frontend
      // but making sure we use the correct configuration for Socket.IO
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      if (!this.socket) return;
      
      // Add event listeners to socket
      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.socketConnected = true;
      });
      
      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.socketConnected = false;
      });
      
      // Listen for console events and results
      this.socket.on('console', (data) => {
        const { sessionId, type, message, timestamp } = data;
        
        if (!sessionId) return;
        
        // Create session if it doesn't exist
        if (!this.sessions[sessionId]) {
          this.sessions[sessionId] = {
            logs: [],
            result: null
          };
        }
        
        // Add log to the session and force reactivity
        this.sessions[sessionId].logs.push({
          type: type || 'log',
          message: message || '',
          timestamp: new Date(timestamp) || Date.now()
        });
        
        // Make sure currentSessionId is set for new logs coming in
        if (!this.currentSessionId && sessionId) {
          this.currentSessionId = sessionId;
        }
      });
      
      this.socket.on('execution-result', (data) => {
        const { sessionId, result, error, duration, success } = data;
        
        if (!sessionId) return;
        
        // Create session if it doesn't exist
        if (!this.sessions[sessionId]) {
          this.sessions[sessionId] = {
            logs: [],
            result: null
          };
        }
        
        // Update the result
        this.sessions[sessionId].result = {
          result,
          error,
          duration,
          success
        };
        
        // Make sure currentSessionId is set for results
        if (!this.currentSessionId && sessionId) {
          this.currentSessionId = sessionId;
        }
      });
      
      this.socket.on('execution-end', () => {
        this.isExecuting = false;
      });
      
      this.socket.on('execution-stopped', () => {
        this.isExecuting = false;
        // Add a log entry to the current session
        if (this.currentSessionId && this.sessions[this.currentSessionId]) {
          this.sessions[this.currentSessionId].logs.push({
            type: 'warn',
            message: 'Execution stopped by user',
            timestamp: Date.now()
          });
        }
      });
    },
    
    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.socketConnected = false;
      }
    },
    
    runHandler(handlerPath, handlerMethod, eventData) {
      if (this.isExecuting) return;
      
      this.isExecuting = true;
      
      // Generate a unique session ID
      const sessionId = Date.now().toString();
      this.currentSessionId = sessionId;
      
      // Initialize session
      this.sessions[sessionId] = {
        logs: [],
        result: null
      };
      
      // Send command to execute the handler through the socket
      if (this.socket && this.socketConnected) {
        this.socket.emit('run-handler', {
          handlerPath,
          handlerMethod,
          eventData,
          sessionId
        });
      } else {
        // If there's no socket connection, try with REST API
        axios.post('/api/run', {
          handlerPath,
          handlerMethod,
          eventData,
          sessionId
        }).catch(error => {
          console.error('Error running handler:', error);
          
          // Add error log
          this.sessions[sessionId].logs.push({
            type: 'error',
            message: `Failed to execute handler: ${error.message}`,
            timestamp: Date.now()
          });
          
          // Set error result
          this.sessions[sessionId].result = {
            error: { message: error.message },
            success: false,
            duration: 0
          };
          
          this.isExecuting = false;
        });
      }
      
      return sessionId;
    },
    
    stopExecution() {
      if (!this.isExecuting) return;
      
      // Send stop command through socket if connected
      if (this.socket && this.socketConnected && this.currentSessionId) {
        this.socket.emit('stop-execution', {
          sessionId: this.currentSessionId
        });
        
        // We don't set isExecuting to false here, we wait for the execution-stopped event
      } else {
        // If no socket connection, just set status directly
        this.isExecuting = false;
        
        // Add a log entry to the current session
        if (this.currentSessionId && this.sessions[this.currentSessionId]) {
          this.sessions[this.currentSessionId].logs.push({
            type: 'warn',
            message: 'Execution stopped by user (socket disconnected)',
            timestamp: Date.now()
          });
        }
      }
    },
    
    getSessionLogs(sessionId) {
      // If no session ID provided, use the current session
      const targetSessionId = sessionId || this.currentSessionId;
      
      if (!targetSessionId) {
        return [];
      }
      
      if (!this.sessions[targetSessionId]) {
        return [];
      }
      
      return this.sessions[targetSessionId].logs;
    },
    
    getSessionResult(sessionId) {
      // If no session ID provided, use the current session
      const targetSessionId = sessionId || this.currentSessionId;
      
      if (!targetSessionId) {
        return null;
      }
      
      if (!this.sessions[targetSessionId]) {
        return null;
      }
      
      return this.sessions[targetSessionId].result;
    },
    
    clearConsole(sessionId) {
      if (this.sessions[sessionId]) {
        this.sessions[sessionId].logs = [];
      }
    },
    
    setErrorResult(sessionId, error, duration = 0) {
      if (!this.sessions[sessionId]) {
        this.sessions[sessionId] = {
          logs: [],
          result: null
        };
      }
      
      this.sessions[sessionId].result = {
        error,
        result: null,
        success: false,
        duration: duration
      };
      
      // Also indicate that execution has finished
      this.isExecuting = false;
    }
  }
}) 