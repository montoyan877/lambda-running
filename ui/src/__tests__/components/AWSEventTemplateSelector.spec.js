/**
 * Tests for AWSEventTemplateSelector component
 * Tests the functionality of the AWS Event Template Selector component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AWSEventTemplateSelector from '../../components/AWSEventTemplateSelector.vue';
import { AWS_EVENT_TEMPLATES } from '../../utils/awsEventTemplates';

// Mock the AWS templates
vi.mock('../../utils/awsEventTemplates', () => ({
  AWS_EVENT_TEMPLATES: [
    {
      name: 'API Gateway AWS Proxy',
      category: 'AWS',
      icon: { 
        color: 'text-blue-400',
        path: 'M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633z'
      },
      data: { test: 'data1' }
    },
    {
      name: 'S3 Put',
      category: 'AWS',
      icon: { 
        color: 'text-red-400',
        paths: ['M4 3a2 2 0 100 4h12a2 2 0 100-4H4z', 'M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8z']
      },
      data: { test: 'data2' }
    },
    {
      name: 'DynamoDB Update',
      category: 'AWS',
      icon: { 
        color: 'text-yellow-500',
        path: 'M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5z'
      },
      data: { test: 'data3' }
    }
  ]
}));

describe('AWSEventTemplateSelector Component', () => {
  let wrapper;
  
  beforeEach(() => {
    wrapper = mount(AWSEventTemplateSelector, {
      props: {
        activeDropdown: null
      }
    });
  });
  
  it('renders correctly with button and initially closed dropdown', () => {
    // Check if the button exists
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('AWS Templates');
    
    // Dropdown should be initially closed
    expect(wrapper.find('.fixed').exists()).toBe(false);
  });
  
  it('opens dropdown when button is clicked', async () => {
    // Setup a new wrapper with default props
    wrapper = mount(AWSEventTemplateSelector, {
      props: {
        activeDropdown: null
      }
    });
    
    // Click the button to emit the dropdown-opened event
    await wrapper.find('button').trigger('click');
    
    // Verify the event was emitted
    expect(wrapper.emitted('dropdown-opened')).toBeTruthy();
    expect(wrapper.emitted('dropdown-opened')[0][0]).toBe('aws-templates');
    
    // Now simulate the parent setting activeDropdown
    await wrapper.setProps({ activeDropdown: 'aws-templates' });
    
    // Dropdown should now be visible
    expect(wrapper.find('.fixed').exists()).toBe(true);
    
    // Should show all templates
    const templateButtons = wrapper.findAll('.fixed button');
    expect(templateButtons.length).toBe(AWS_EVENT_TEMPLATES.length);
  });
  
  it('filters templates based on search query', async () => {
    // Set activeDropdown to simulate open state
    wrapper = mount(AWSEventTemplateSelector, {
      props: {
        activeDropdown: 'aws-templates'
      }
    });
    
    // Enter search query
    const searchInput = wrapper.find('input');
    await searchInput.setValue('S3');
    
    // Should show only matching templates
    const templateButtons = wrapper.findAll('.fixed button');
    expect(templateButtons.length).toBe(1);
    expect(templateButtons[0].text()).toContain('S3 Put');
  });
  
  it('shows confirmation modal when template is selected', async () => {
    // Set activeDropdown to simulate open state
    wrapper = mount(AWSEventTemplateSelector, {
      props: {
        activeDropdown: 'aws-templates'
      }
    });
    
    // Select a template
    const templateButtons = wrapper.findAll('.fixed button');
    await templateButtons[0].trigger('click');
    
    // Confirmation modal should be visible
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true);
    expect(wrapper.text()).toContain('Replace Event Data?');
  });
  
  it('emits select-template event when confirmed', async () => {
    // Set activeDropdown to simulate open state
    wrapper = mount(AWSEventTemplateSelector, {
      props: {
        activeDropdown: 'aws-templates'
      }
    });
    
    // Select a template
    const templateButtons = wrapper.findAll('.fixed button');
    await templateButtons[0].trigger('click');
    
    // Click confirm button (in the modal)
    const confirmButton = wrapper.find('.bg-blue-600');
    await confirmButton.trigger('click');
    
    // Check event was emitted with correct template
    expect(wrapper.emitted('select-template')).toBeTruthy();
    expect(wrapper.emitted('select-template')[0][0]).toEqual(AWS_EVENT_TEMPLATES[0]);
  });
}); 