/**
 * Tests for Notification component
 * Tests the functionality of the Notification component and its utility functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Notification, { notify } from '../../components/Notification.vue';

describe('Notification Component', () => {
  let wrapper;
  
  beforeEach(() => {
    // Create wrapper
    wrapper = mount(Notification, {
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
  });
  
  afterEach(() => {
    // Clean up
    if (wrapper) {
      wrapper.unmount();
    }
    vi.restoreAllMocks();
  });
  
  // Test empty state
  it('renders without notifications initially', () => {
    expect(wrapper.vm.notifications.length).toBe(0);
  });
  
  // Test notification utility functions
  it('provides utility functions via notify object', () => {
    // Make sure utilities exist
    expect(typeof notify.success).toBe('function');
    expect(typeof notify.error).toBe('function');
    expect(typeof notify.info).toBe('function');
  });
  
  // Test direct manipulation of notifications array
  it('can add and remove notifications directly', async () => {
    // Add directly to notifications array
    const notificationId = Date.now();
    wrapper.vm.notifications.push({
      id: notificationId,
      type: 'success',
      message: 'Test notification'
    });
    
    await wrapper.vm.$nextTick();
    
    // Check notification was added
    expect(wrapper.vm.notifications.length).toBe(1);
    
    // Remove notification
    wrapper.vm.removeNotification(notificationId);
    await wrapper.vm.$nextTick();
    
    // Check notification was removed
    expect(wrapper.vm.notifications.length).toBe(0);
  });
  
  // Test notification cleanup
  it('exposes a removeNotification method', () => {
    expect(typeof wrapper.vm.removeNotification).toBe('function');
  });
}); 