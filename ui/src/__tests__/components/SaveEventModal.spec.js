/**
 * Tests for SaveEventModal component
 * Tests the functionality of the SaveEventModal component including form handling and validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SaveEventModal from '../../components/SaveEventModal.vue';
import Modal from '../../components/Modal.vue';

describe('SaveEventModal Component', () => {
  let wrapper;
  
  beforeEach(() => {
    // Mock alert
    window.alert = vi.fn();
    // Reset mocks
    vi.clearAllMocks();
    wrapper = null;
  });
  
  afterEach(() => {
    // Restore window methods
    vi.restoreAllMocks();
  });
  
  // Test rendering
  it('renders when show prop is true', () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Check if modal is rendered
    expect(wrapper.findComponent(Modal).exists()).toBe(true);
    expect(wrapper.findComponent(Modal).props('show')).toBe(true);
    expect(wrapper.findComponent(Modal).props('title')).toBe('Save Event');
    
    // Check if form elements are rendered
    expect(wrapper.find('#event-name').exists()).toBe(true);
    expect(wrapper.find('#event-category').exists()).toBe(true);
  });
  
  // Test default values
  it('initializes with default values', () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Check default values
    expect(wrapper.find('#event-name').element.value).toBe('my-event');
    expect(wrapper.find('#event-category').element.value).toBe('default');
  });
  
  // Test resetting values when shown
  it('resets form values when modal is shown', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true // Start with shown modal
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Verify inputs exist
    expect(wrapper.find('#event-name').exists()).toBe(true);
    expect(wrapper.find('#event-category').exists()).toBe(true);
    
    // Change values
    await wrapper.find('#event-name').setValue('test-event');
    await wrapper.find('#event-category').setValue('test-category');
    
    // Hide modal
    await wrapper.setProps({ show: false });
    
    // Show modal again to trigger reset
    await wrapper.setProps({ show: true });
    
    // Check if values were reset
    expect(wrapper.find('#event-name').element.value).toBe('my-event');
    expect(wrapper.find('#event-category').element.value).toBe('default');
  });
  
  // Test form validation
  it('shows alert when event name is empty', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Set empty event name
    await wrapper.find('#event-name').setValue('');
    
    // Call the saveEvent method directly to trigger validation
    wrapper.vm.saveEvent();
    
    // Check if alert was called
    expect(window.alert).toHaveBeenCalledWith('Event name is required');
    
    // Check that save event was not emitted
    expect(wrapper.emitted('save')).toBeFalsy();
  });
  
  // Test successful save
  it('emits save event with form data when valid', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Set form values
    await wrapper.find('#event-name').setValue('test-event');
    await wrapper.find('#event-category').setValue('test-category');
    
    // Call the saveEvent method directly
    wrapper.vm.saveEvent();
    
    // Check that save event was emitted with correct data
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'test-event',
      category: 'test-category'
    });
  });
  
  // Test using default category when empty
  it('uses default category when category is empty', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Set event name but clear category
    await wrapper.find('#event-name').setValue('test-event');
    await wrapper.find('#event-category').setValue('');
    
    // Call the saveEvent method directly
    wrapper.vm.saveEvent();
    
    // Check that save event was emitted with default category
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'test-event',
      category: 'default'
    });
  });
  
  // Test saving with enter key
  it('saves when pressing enter in event name field', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Set form values
    await wrapper.find('#event-name').setValue('keyboard-event');
    
    // Press enter
    await wrapper.find('#event-name').trigger('keydown.enter');
    
    // Check that save event was emitted
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'keyboard-event',
      category: 'default'
    });
  });
  
  // Test saving with enter key in category field
  it('saves when pressing enter in category field', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Set form values
    await wrapper.find('#event-name').setValue('keyboard-event');
    await wrapper.find('#event-category').setValue('keyboard-category');
    
    // Press enter
    await wrapper.find('#event-category').trigger('keydown.enter');
    
    // Check that save event was emitted
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'keyboard-event',
      category: 'keyboard-category'
    });
  });
  
  // Test close event
  it('emits close event when modal is closed', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });
    
    // Close modal
    await wrapper.findComponent(Modal).vm.$emit('close');
    
    // Check that close event was emitted
    expect(wrapper.emitted('close')).toBeTruthy();
  });
}); 