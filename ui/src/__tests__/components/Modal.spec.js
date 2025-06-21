/**
 * Tests for Modal component
 * Tests the functionality of the Modal component including showing/hiding and event emissions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Modal from '../../components/Modal.vue';

describe('Modal Component', () => {
  let wrapper;
  
  beforeEach(() => {
    // Reset wrapper before each test
    wrapper = null;
  });
  
  // Test rendering when show is true
  it('renders when show prop is true', () => {
    wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'Test Modal'
      }
    });
    
    // With our Teleport stub, we can find the modal content directly
    expect(wrapper.find('.modal-container').exists()).toBe(true);
    expect(wrapper.find('.modal-title').text()).toBe('Test Modal');
  });
  
  // Test not rendering when show is false
  it('does not render when show prop is false', () => {
    wrapper = mount(Modal, {
      props: {
        show: false,
        title: 'Test Modal'
      }
    });
    
    // Should be v-if false, so it won't render
    expect(wrapper.find('.modal-container').exists()).toBe(false);
  });
  
  // Test close button emits close event
  it('emits close event when close button is clicked', async () => {
    wrapper = mount(Modal, {
      props: {
        show: true
      }
    });
    
    await wrapper.find('.modal-close').trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('close');
    expect(wrapper.emitted().close.length).toBe(1);
  });
  
  // Test confirm button emits confirm event
  it('emits confirm event when confirm button is clicked', async () => {
    wrapper = mount(Modal, {
      props: {
        show: true
      }
    });
    
    await wrapper.find('.btn-primary').trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('confirm');
    expect(wrapper.emitted().confirm.length).toBe(1);
  });
  
  // Test cancel button emits close event
  it('emits close event when cancel button is clicked', async () => {
    wrapper = mount(Modal, {
      props: {
        show: true
      }
    });
    
    await wrapper.find('.btn-outline').trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('close');
    expect(wrapper.emitted().close.length).toBe(1);
  });
  
  // Test custom button text
  it('uses custom button text from props', () => {
    wrapper = mount(Modal, {
      props: {
        show: true,
        confirmText: 'Save',
        cancelText: 'Discard'
      }
    });
    
    expect(wrapper.find('.btn-primary').text()).toBe('Save');
    expect(wrapper.find('.btn-outline').text()).toBe('Discard');
  });
  
  // Test clicking outside the modal
  it('emits close event when clicking outside if closeOnClickOutside is true', async () => {
    wrapper = mount(Modal, {
      props: {
        show: true,
        closeOnClickOutside: true
      }
    });
    
    // Click on the overlay (the parent of the modal container)
    await wrapper.find('.modal-overlay').trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('close');
    expect(wrapper.emitted().close.length).toBe(1);
  });
  
  // Test NOT closing when clicking outside if closeOnClickOutside is false
  it('does not emit close event when clicking outside if closeOnClickOutside is false', async () => {
    wrapper = mount(Modal, {
      props: {
        show: true,
        closeOnClickOutside: false
      }
    });
    
    await wrapper.find('.modal-overlay').trigger('click');
    
    // Should not have any close events
    expect(wrapper.emitted().close).toBeFalsy();
  });
  
  // Test default value of closeOnClickOutside is false
  it('has closeOnClickOutside default to false', async () => {
    wrapper = mount(Modal, {
      props: {
        show: true
      }
    });
    
    await wrapper.find('.modal-overlay').trigger('click');
    
    // Should not have any close events since default is now false
    expect(wrapper.emitted().close).toBeFalsy();
  });
}); 