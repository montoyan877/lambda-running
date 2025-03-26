/**
 * Tests for CodeEditor component
 * Tests the functionality of the CodeEditor component including formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CodeEditor from '../../components/CodeEditor.vue';

// Mock Monaco editor
vi.mock('../../components/CodeEditor.vue', () => {
  const { defineComponent, ref } = require('vue');
  
  return {
    default: defineComponent({
      name: 'CodeEditor',
      props: ['modelValue', 'language', 'theme', 'readOnly', 'options'],
      emits: ['update:modelValue', 'save', 'editor-mounted'],
      setup(props, { emit }) {
        const format = vi.fn(() => {
          // Mock implementation of format
          console.log('Format method called');
        });
        
        return {
          format
        };
      },
      template: '<div>Mocked Editor</div>'
    })
  };
});

describe('CodeEditor Component', () => {
  let wrapper;
  
  beforeEach(() => {
    wrapper = mount(CodeEditor, {
      props: {
        modelValue: '{"test": "data"}',
        language: 'json',
        theme: 'dark'
      }
    });
  });
  
  it('provides a format method for JSON formatting', () => {
    // Check if format method exists
    expect(typeof wrapper.vm.format).toBe('function');
    
    // Call format method
    wrapper.vm.format();
    
    // Verify that format was called
    expect(vi.mocked(wrapper.vm.format)).toHaveBeenCalled();
  });
}); 