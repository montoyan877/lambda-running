/**
 * Tests for execution store
 * Tests the functionality of the execution store including socket connections, running handlers, and managing execution state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useExecutionStore } from '../../stores/execution';
import axios from 'axios';

// Mock socket.io-client module
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }))
}));

// Import io after mocking
import { io } from 'socket.io-client';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({})
  }
}));

describe('Execution Store', () => {
  let executionStore;
  
  beforeEach(() => {
    // Create a fresh pinia and make it active
    setActivePinia(createPinia());
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Create store
    executionStore = useExecutionStore();
    
    // Mock console methods to avoid pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  // Test socket connection
  it('connects to socket', () => {
    executionStore.connectSocket();
    
    expect(io).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    expect(executionStore.socket).not.toBeNull();
  });
  
  // Test socket disconnect
  it('disconnects from socket', () => {
    // First connect
    executionStore.connectSocket();
    
    // Get the mock socket
    const mockSocket = executionStore.socket;
    
    // Then disconnect
    executionStore.disconnectSocket();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(executionStore.socket).toBeNull();
    expect(executionStore.socketConnected).toBe(false);
  });
  
  // Test running a handler via socket
  it('runs handler via socket when connected', () => {
    // Connect to socket
    executionStore.connectSocket();
    
    // Set socket as connected
    executionStore.socketConnected = true;
    
    // Run handler
    const handlerPath = '/test/handler.js';
    const handlerMethod = 'testMethod';
    const eventData = { test: 'data' };
    
    const sessionId = executionStore.runHandler(handlerPath, handlerMethod, eventData);
    
    // Verify state
    expect(executionStore.isExecuting).toBe(true);
    expect(executionStore.currentSessionId).toBe(sessionId);
    expect(executionStore.sessions[sessionId]).toBeDefined();
    expect(executionStore.sessions[sessionId].logs).toEqual([]);
    expect(executionStore.sessions[sessionId].result).toBeNull();
    
    // Verify socket emit
    expect(executionStore.socket.emit).toHaveBeenCalledWith('run-handler', {
      handlerPath,
      handlerMethod,
      eventData,
      sessionId
    });
    
    // Verify that axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  // Test running a handler via REST API when socket is not connected
  it('runs handler via REST API when socket is not connected', () => {
    // Run handler without connecting socket
    const handlerPath = '/test/handler.js';
    const handlerMethod = 'testMethod';
    const eventData = { test: 'data' };
    
    const sessionId = executionStore.runHandler(handlerPath, handlerMethod, eventData);
    
    // Verify state
    expect(executionStore.isExecuting).toBe(true);
    expect(executionStore.currentSessionId).toBe(sessionId);
    expect(executionStore.sessions[sessionId]).toBeDefined();
    
    // Verify axios was called
    expect(axios.post).toHaveBeenCalledWith('/api/run', {
      path: handlerPath,
      method: handlerMethod,
      event: eventData,
      sessionId
    });
  });
  
  // Test stopping execution via socket
  it('stops execution via socket when connected', () => {
    // Connect to socket
    executionStore.connectSocket();
    
    // Set socket as connected
    executionStore.socketConnected = true;
    
    // Set executing state
    executionStore.isExecuting = true;
    executionStore.currentSessionId = '123';
    
    // Stop execution
    executionStore.stopExecution();
    
    // Verify socket emit
    expect(executionStore.socket.emit).toHaveBeenCalledWith('stop-execution', {
      sessionId: '123'
    });
    
    // isExecuting should still be true until we get execution-stopped event
    expect(executionStore.isExecuting).toBe(true);
  });
  
  // Test handling socket events
  it('handles console events from socket', () => {
    // Connect to socket and get the mock socket
    executionStore.connectSocket();
    const mockSocket = executionStore.socket;
    
    // Manually simulate what happens when socket emits 'console' event
    // First, create a test session
    const sessionId = '123';
    executionStore.sessions[sessionId] = {
      logs: [],
      result: null
    };
    
    // Now find the 'console' handler and call it directly
    const consoleEvent = {
      sessionId,
      type: 'log',
      message: 'Test log message',
      timestamp: new Date().toISOString()
    };
    
    // Find the callback that was registered
    const consoleCallback = mockSocket.on.mock.calls.find(call => call[0] === 'console')[1];
    consoleCallback(consoleEvent);
    
    // Verify log was added to the session
    expect(executionStore.sessions[sessionId].logs).toHaveLength(1);
    expect(executionStore.sessions[sessionId].logs[0].message).toBe('Test log message');
    expect(executionStore.sessions[sessionId].logs[0].type).toBe('log');
  });
  
  // Test session management
  it('manages session logs and results correctly', () => {
    // Create test session
    const sessionId = '123';
    executionStore.sessions[sessionId] = {
      logs: [
        { type: 'log', message: 'Test log', timestamp: Date.now() }
      ],
      result: { success: true, result: 'test result' }
    };
    
    // Test getSessionLogs
    const logs = executionStore.getSessionLogs(sessionId);
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test log');
    
    // Test getSessionResult
    const result = executionStore.getSessionResult(sessionId);
    expect(result.success).toBe(true);
    expect(result.result).toBe('test result');
    
    // Test clearConsole
    executionStore.clearConsole(sessionId);
    expect(executionStore.sessions[sessionId].logs).toHaveLength(0);
    
    // Test setErrorResult
    executionStore.setErrorResult(sessionId, { message: 'Test error' });
    expect(executionStore.sessions[sessionId].result.success).toBe(false);
    expect(executionStore.sessions[sessionId].result.error.message).toBe('Test error');
    expect(executionStore.isExecuting).toBe(false);
  });
}); 