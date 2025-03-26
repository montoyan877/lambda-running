/**
 * Tests for handlers store
 * Tests the functionality of the handlers store including fetching handlers, grouping, and running handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHandlersStore } from '../../stores/handlers';
import axios from 'axios';

// Mock dependencies
vi.mock('axios');
vi.mock('../../stores/handlerEvents', () => ({
  useHandlerEventsStore: vi.fn(() => ({
    getFavorite: vi.fn(),
    getLastEvent: vi.fn(),
  }))
}));
vi.mock('../../stores/execution', () => ({
  useExecutionStore: vi.fn(() => ({
    isExecuting: false,
    runHandler: vi.fn(() => '123'),
    stopExecution: vi.fn()
  }))
}));
vi.mock('../../components/Notification.vue', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}));

describe('Handlers Store', () => {
  beforeEach(() => {
    // Create a fresh pinia and make it active
    setActivePinia(createPinia());
    
    // Reset all mocks
    vi.resetAllMocks();
  });
  
  // Test fetching handlers
  it('fetches handlers successfully', async () => {
    const handlersStore = useHandlersStore();
    
    // Mock the axios response
    axios.get.mockResolvedValueOnce({
      data: {
        handlers: [
          {
            path: '/handlers/test.js',
            methods: ['method1', 'method2']
          },
          {
            path: '/handlers/subdir/other.js',
            methods: ['method3']
          }
        ]
      }
    });
    
    // Call the action
    await handlersStore.fetchHandlers();
    
    // Verify the result
    expect(handlersStore.handlers).toHaveLength(2);
    expect(handlersStore.isLoading).toBe(false);
    expect(handlersStore.error).toBeNull();
    expect(axios.get).toHaveBeenCalledWith('/api/handlers');
  });
  
  // Test error handling
  it('handles fetch errors correctly', async () => {
    const handlersStore = useHandlersStore();
    
    // Mock the axios error
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValueOnce({
      message: errorMessage,
      response: {
        data: {
          message: 'Server Error'
        }
      }
    });
    
    // Call the action
    await handlersStore.fetchHandlers();
    
    // Verify the result
    expect(handlersStore.handlers).toHaveLength(0);
    expect(handlersStore.isLoading).toBe(false);
    expect(handlersStore.error).toBe('Server Error');
  });
  
  // Test grouping handlers
  it('groups handlers correctly', () => {
    const handlersStore = useHandlersStore();
    
    // Set up test data
    handlersStore.handlers = [
      {
        path: '/handlers/test.js',
        methods: ['method1', 'method2']
      },
      {
        path: '/handlers/subdir/other.js',
        methods: ['method3']
      }
    ];
    
    // Get the grouped handlers
    const grouped = handlersStore.groupedHandlers;
    
    // Verify the result
    expect(Object.keys(grouped)).toContain('handlers');
    expect(Object.keys(grouped)).toContain('subdir');
    
    // Verify handlers group
    expect(grouped.handlers).toHaveLength(2); // Two methods from test.js
    expect(grouped.handlers[0].name).toContain('test.js');
    expect(grouped.handlers[0].method).toBe('method1');
    
    // Verify subdir group
    expect(grouped.subdir).toHaveLength(1); // One method from other.js
    expect(grouped.subdir[0].name).toContain('other.js');
    expect(grouped.subdir[0].method).toBe('method3');
  });
  
  // Test setting active handler
  it('sets active handler correctly', () => {
    const handlersStore = useHandlersStore();
    
    const path = '/handlers/test.js';
    const method = 'method1';
    
    handlersStore.setActiveHandler(path, method);
    
    expect(handlersStore.activeHandler).not.toBeNull();
    expect(handlersStore.activeHandler.path).toBe(path);
    expect(handlersStore.activeHandler.method).toBe(method);
    expect(handlersStore.activeHandler.id).toBe(`${path}:${method}`);
  });
  
  // Test relative path calculation
  it('calculates relative paths correctly', () => {
    const handlersStore = useHandlersStore();
    
    // Test with multiple path segments
    expect(handlersStore.getRelativePath('/handlers/subdir/test.js')).toBe('subdir/test.js');
    
    // Test with just one path segment
    expect(handlersStore.getRelativePath('test.js')).toBe('test.js');
    
    // Test with empty path
    expect(handlersStore.getRelativePath('')).toBe('');
  });
}); 