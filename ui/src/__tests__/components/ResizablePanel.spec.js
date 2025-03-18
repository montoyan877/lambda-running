/**
 * Tests for ResizablePanel component
 * Tests the functionality of the ResizablePanel component including resizing with mouse events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResizablePanel from '../../components/ResizablePanel.vue';

describe('ResizablePanel Component', () => {
  let wrapper;
  
  beforeEach(() => {
    // Reset the wrapper
    wrapper = null;
    
    // Reset event listeners
    vi.restoreAllMocks();
    document.removeEventListener = vi.fn();
    document.addEventListener = vi.fn();
  });
  
  // Test initial rendering
  it('renders with default split ratio', () => {
    wrapper = mount(ResizablePanel, {
      slots: {
        left: '<div class="left-content">Left Panel</div>',
        right: '<div class="right-content">Right Panel</div>'
      }
    });
    
    // Check if panels are rendered with default widths
    const leftPanel = wrapper.find('.panel-left');
    const rightPanel = wrapper.find('.panel-right');
    
    expect(leftPanel.attributes('style')).toContain('width: 50%');
    expect(rightPanel.attributes('style')).toContain('width: 50%');
    
    // Check if resize handle exists
    expect(wrapper.find('.resize-handle').exists()).toBe(true);
    
    // Check if slots content is rendered
    expect(wrapper.find('.left-content').text()).toBe('Left Panel');
    expect(wrapper.find('.right-content').text()).toBe('Right Panel');
  });
  
  // Test custom initial split
  it('renders with custom initial split ratio', () => {
    wrapper = mount(ResizablePanel, {
      props: {
        initialSplit: 30
      },
      slots: {
        left: '<div>Left Panel</div>',
        right: '<div>Right Panel</div>'
      }
    });
    
    // Check if panels are rendered with custom widths
    const leftPanel = wrapper.find('.panel-left');
    const rightPanel = wrapper.find('.panel-right');
    
    expect(leftPanel.attributes('style')).toContain('width: 30%');
    expect(rightPanel.attributes('style')).toContain('width: 70%');
  });
  
  // Test resize start
  it('starts resize process on mousedown', async () => {
    wrapper = mount(ResizablePanel);
    
    // Trigger mousedown on the resize handle
    await wrapper.find('.resize-handle').trigger('mousedown');
    
    // Check if the resize-active class is added
    expect(wrapper.vm.isResizing).toBe(true);
    
    // Check if event listeners are added
    expect(document.addEventListener).toHaveBeenCalledTimes(2);
    expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });
  
  // Test resize stop
  it('stops resize process on mouseup', async () => {
    wrapper = mount(ResizablePanel);
    
    // Start resizing
    await wrapper.find('.resize-handle').trigger('mousedown');
    
    // Get the stopResize handler
    const mouseupHandler = document.addEventListener.mock.calls.find(
      call => call[0] === 'mouseup'
    )[1];
    
    // Trigger mouseup
    mouseupHandler();
    
    // Check if the resize-active class is removed
    expect(wrapper.vm.isResizing).toBe(false);
    
    // Check if event listeners are removed
    expect(document.removeEventListener).toHaveBeenCalledTimes(2);
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });
  
  // Test resizing within bounds
  it('resizes within min and max constraints', async () => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1000,
      left: 0,
      right: 1000
    }));
    
    wrapper = mount(ResizablePanel, {
      props: {
        minWidth: 20,
        maxWidth: 80
      }
    });
    
    // Start resizing
    await wrapper.find('.resize-handle').trigger('mousedown');
    
    // Get the onResize handler
    const mousemoveHandler = document.addEventListener.mock.calls.find(
      call => call[0] === 'mousemove'
    )[1];
    
    // Test resizing to 40%
    mousemoveHandler({ clientX: 400 });
    expect(wrapper.vm.leftPanelWidth).toBe(40);
    
    // Test resizing below minWidth
    mousemoveHandler({ clientX: 100 });
    expect(wrapper.vm.leftPanelWidth).toBe(20); // Should clamp to minWidth
    
    // Test resizing above maxWidth
    mousemoveHandler({ clientX: 900 });
    expect(wrapper.vm.leftPanelWidth).toBe(80); // Should clamp to maxWidth
  });
  
  // Test cleanup of event listeners on component unmount
  it('cleans up event listeners when unmounted', async () => {
    wrapper = mount(ResizablePanel);
    
    // Start resizing
    await wrapper.find('.resize-handle').trigger('mousedown');
    
    // Unmount the component
    wrapper.unmount();
    
    // Check if event listeners are removed
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });
}); 