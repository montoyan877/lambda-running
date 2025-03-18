/**
 * Tests for ResizablePanelVertical component
 * Tests the functionality of the ResizablePanelVertical component including resizing with mouse events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResizablePanelVertical from '../../components/ResizablePanelVertical.vue';

describe('ResizablePanelVertical Component', () => {
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
    wrapper = mount(ResizablePanelVertical, {
      slots: {
        top: '<div class="top-content">Top Panel</div>',
        bottom: '<div class="bottom-content">Bottom Panel</div>'
      }
    });
    
    // Check if panels are rendered with default widths
    const topPanel = wrapper.find('.panel-top');
    const bottomPanel = wrapper.find('.panel-bottom');
    
    expect(topPanel.attributes('style')).toContain('height: 50%');
    expect(bottomPanel.attributes('style')).toContain('height: 50%');
    
    // Check if resize handle exists
    expect(wrapper.find('.resize-handle').exists()).toBe(true);
    
    // Check if slots content is rendered
    expect(wrapper.find('.top-content').text()).toBe('Top Panel');
    expect(wrapper.find('.bottom-content').text()).toBe('Bottom Panel');
  });
  
  // Test custom initial split
  it('renders with custom initial split ratio', () => {
    wrapper = mount(ResizablePanelVertical, {
      props: {
        initialSplit: 30
      },
      slots: {
        top: '<div>Top Panel</div>',
        bottom: '<div>Bottom Panel</div>'
      }
    });
    
    // Check if panels are rendered with custom heights
    const topPanel = wrapper.find('.panel-top');
    const bottomPanel = wrapper.find('.panel-bottom');
    
    expect(topPanel.attributes('style')).toContain('height: 30%');
    expect(bottomPanel.attributes('style')).toContain('height: 70%');
  });
  
  // Test resize start
  it('starts resize process on mousedown', async () => {
    wrapper = mount(ResizablePanelVertical);
    
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
    wrapper = mount(ResizablePanelVertical);
    
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
      height: 1000,
      top: 0,
      bottom: 1000
    }));
    
    wrapper = mount(ResizablePanelVertical, {
      props: {
        minHeight: 20,
        maxHeight: 80
      }
    });
    
    // Start resizing
    await wrapper.find('.resize-handle').trigger('mousedown');
    
    // Get the onResize handler
    const mousemoveHandler = document.addEventListener.mock.calls.find(
      call => call[0] === 'mousemove'
    )[1];
    
    // Test resizing to 40%
    mousemoveHandler({ clientY: 400 });
    expect(wrapper.vm.topPanelHeight).toBe(40);
    
    // Test resizing below minHeight
    mousemoveHandler({ clientY: 100 });
    expect(wrapper.vm.topPanelHeight).toBe(20); // Should clamp to minHeight
    
    // Test resizing above maxHeight
    mousemoveHandler({ clientY: 900 });
    expect(wrapper.vm.topPanelHeight).toBe(80); // Should clamp to maxHeight
  });
  
  // Test cleanup of event listeners on component unmount
  it('cleans up event listeners when unmounted', async () => {
    wrapper = mount(ResizablePanelVertical);
    
    // Start resizing
    await wrapper.find('.resize-handle').trigger('mousedown');
    
    // Unmount the component
    wrapper.unmount();
    
    // Check if event listeners are removed
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });
}); 