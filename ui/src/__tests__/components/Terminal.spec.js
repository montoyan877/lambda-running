/**
 * Tests for Terminal component
 * Tests the functionality of the Terminal component including rendering logs and formatting timestamps
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Terminal from '../../components/Terminal.vue';

describe('Terminal Component', () => {
  // Test empty state
  it('displays empty state message when no logs are present', () => {
    const wrapper = mount(Terminal, {
      props: {
        logs: []
      }
    });
    
    expect(wrapper.text()).toContain('No output available');
  });
  
  // Test displaying logs
  it('displays logs with proper formatting', () => {
    const logs = [
      {
        type: 'log',
        message: 'This is a regular log',
        timestamp: '2023-03-01T12:00:00.000Z'
      },
      {
        type: 'error',
        message: 'This is an error log',
        timestamp: '2023-03-01T12:01:00.000Z'
      },
      {
        type: 'info',
        message: 'This is an info log',
        timestamp: '2023-03-01T12:02:00.000Z'
      },
      {
        type: 'warn',
        message: 'This is a warning log',
        timestamp: '2023-03-01T12:03:00.000Z'
      }
    ];
    
    const wrapper = mount(Terminal, {
      props: {
        logs
      }
    });
    
    // No empty state message
    expect(wrapper.text()).not.toContain('No output available');
    
    // All log messages should be present
    for (const log of logs) {
      expect(wrapper.text()).toContain(log.message);
    }
    
    // Check for proper CSS classes for different log types
    const logElements = wrapper.findAll('.py-1');
    expect(logElements.length).toBe(logs.length);
    
    expect(logElements[0].classes()).toContain('text-gray-900'); // log type
    expect(logElements[1].classes()).toContain('text-red-600'); // error type
    expect(logElements[2].classes()).toContain('text-blue-600'); // info type
    expect(logElements[3].classes()).toContain('text-yellow-600'); // warn type
  });
  
  // Test timestamp formatting
  it('formats timestamps correctly', () => {
    // Override the Date.toLocaleTimeString method to return a fixed value for testing
    const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
    Date.prototype.toLocaleTimeString = vi.fn().mockReturnValue('12:34:56');
    
    const logs = [
      {
        type: 'log',
        message: 'Test log',
        timestamp: '2023-03-01T12:00:00.000Z'
      }
    ];
    
    const wrapper = mount(Terminal, {
      props: {
        logs
      }
    });
    
    // Check if timestamp is displayed correctly
    expect(wrapper.text()).toContain('[12:34:56]');
    
    // Restore original method
    Date.prototype.toLocaleTimeString = originalToLocaleTimeString;
  });
  
  // Test that the clear method exists but doesn't actually do anything
  it('has a clear method for backwards compatibility', () => {
    const wrapper = mount(Terminal, {
      props: {
        logs: []
      }
    });
    
    // Spy on console.log
    const consoleSpy = vi.spyOn(console, 'log');
    
    // Call the clear method
    wrapper.vm.clear();
    
    // Verify the console log was called
    expect(consoleSpy).toHaveBeenCalledWith('Terminal clear requested');
  });
}); 