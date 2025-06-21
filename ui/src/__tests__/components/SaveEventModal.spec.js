/**
 * Tests for SaveEventModal component
 * Tests the functionality of the SaveEventModal component including form handling and validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SaveEventModal from '../../components/SaveEventModal.vue';
import Modal from '../../components/Modal.vue';
import { createPinia, setActivePinia } from 'pinia';

describe('SaveEventModal Component', () => {
  let wrapper;
  
  beforeEach(() => {
    // Setup Pinia
    setActivePinia(createPinia());
    
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
        },
        directives: {
          clickOutside: true
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
        },
        directives: {
          clickOutside: true
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
        },
        directives: {
          clickOutside: true
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
        },
        directives: {
          clickOutside: true
        }
      }
    });
    
    // Set empty event name
    await wrapper.find('#event-name').setValue('');
    
    // Call the handleSave method directly to trigger validation
    wrapper.vm.handleSave();
    
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
        },
        directives: {
          clickOutside: true
        }
      }
    });
    
    // Set form values
    await wrapper.find('#event-name').setValue('test-event');
    await wrapper.find('#event-category').setValue('test-category');
    
    // Call the handleSave method directly
    wrapper.vm.handleSave();
    
    // Check that save event was emitted with correct data
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'test-event',
      category: 'test-category',
      isUpdate: false
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
        },
        directives: {
          clickOutside: true
        }
      }
    });
    
    // Set event name but clear category
    await wrapper.find('#event-name').setValue('test-event');
    await wrapper.find('#event-category').setValue('');
    
    // Call the handleSave method directly
    wrapper.vm.handleSave();
    
    // Check that save event was emitted with default category
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'test-event',
      category: 'default',
      isUpdate: false
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
        },
        directives: {
          clickOutside: true
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
      category: 'default',
      isUpdate: false
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
        },
        directives: {
          clickOutside: true
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
      category: 'keyboard-category',
      isUpdate: false
    });
  });
  
  // Test existing event mode
  it('shows save as menu button when currentEventName is provided', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true,
        currentEventName: 'existing-event',
        currentEventCategory: 'existing-category'
      },
      global: {
        stubs: {
          Teleport: true
        },
        directives: {
          clickOutside: true
        },
        mocks: {
          useEventsStore: () => ({})
        }
      }
    });
    
    // Check that form fields have the right values
    const nameInput = wrapper.find('#event-name');
    const categoryInput = wrapper.find('#event-category');
    
    expect(nameInput.element.value).toBe('existing-event');
    expect(categoryInput.element.value).toBe('existing-category');
    
    // Check that the save as menu button is visible
    const saveAsButton = wrapper.find('.btn-primary-light');
    expect(saveAsButton.exists()).toBe(true);
  });
  
  // Test save as menu toggle
  it('toggles save as menu when button is clicked', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true,
        currentEventName: 'existing-event',
        currentEventCategory: 'existing-category'
      },
      global: {
        stubs: {
          Teleport: true
        },
        directives: {
          clickOutside: true
        },
        mocks: {
          useEventsStore: () => ({})
        }
      }
    });
    
    // Initially menu is hidden
    expect(wrapper.find('.absolute').exists()).toBe(false);
    
    // Click the save as button
    await wrapper.find('.btn-primary-light').trigger('click');
    
    // Now menu should be visible
    expect(wrapper.vm.showSaveAsMenu).toBe(true);
  });
  
  // Test save as new functionality
  it('updates form when save as new is clicked', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true,
        currentEventName: 'existing-event',
        currentEventCategory: 'existing-category'
      },
      global: {
        stubs: {
          Teleport: true
        },
        directives: {
          clickOutside: true
        },
        mocks: {
          useEventsStore: () => ({})
        }
      }
    });
    
    // Call saveAsNew method directly
    wrapper.vm.saveAsNew();
    
    // Check that form values are updated
    expect(wrapper.find('#event-name').element.value).toContain('existing-event-');
    expect(wrapper.find('#event-category').element.value).toBe('existing-category');
  });
  
  // Test emitting save with isUpdate flag
  it('emits save event with isUpdate flag when saving existing event', async () => {
    wrapper = mount(SaveEventModal, {
      props: {
        show: true,
        currentEventName: 'existing-event',
        currentEventCategory: 'existing-category'
      },
      global: {
        stubs: {
          Teleport: true
        },
        directives: {
          clickOutside: true
        },
        mocks: {
          useEventsStore: () => ({})
        }
      }
    });
    
    // Call save method
    wrapper.vm.handleSave();
    
    // Check that save event was emitted with isUpdate flag
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'existing-event',
      category: 'existing-category',
      isUpdate: true
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
        },
        directives: {
          clickOutside: true
        }
      }
    });
    
    // Close modal
    await wrapper.findComponent(Modal).vm.$emit('close');
    
    // Check that close event was emitted
    expect(wrapper.emitted('close')).toBeTruthy();
  });
}); 