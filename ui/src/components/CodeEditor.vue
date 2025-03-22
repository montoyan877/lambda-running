<template>
  <div ref="editorContainer" class="monaco-editor-container w-full h-full">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <p>Loading editor...</p>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

export default defineComponent({
  name: 'CodeEditor',
  
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'json',
    },
    theme: {
      type: String,
      default: 'vs-dark',
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  
  emits: ['update:modelValue', 'save', 'editor-mounted'],
  
  setup(props, { emit }) {
    const editorContainer = ref(null);
    const loading = ref(true);
    let editor = null;
    let monaco = null;
    let subscription = null;
    
    // Format the code in the editor
    const format = () => {
      if (editor && monaco) {
        editor.getAction('editor.action.formatDocument').run();
      }
    };
    
    // Load Monaco from CDN
    const loadMonacoFromCDN = () => {
      return new Promise((resolve, reject) => {
        // Check if Monaco is already loaded
        if (window.monaco) {
          resolve(window.monaco);
          return;
        }

        // Add CSS for Monaco
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/editor/editor.main.min.css';
        document.head.appendChild(link);

        // Load Monaco script
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
        script.async = true;
        script.onload = () => {
          // Configure require paths
          window.require.config({
            paths: {
              vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
            }
          });
          
          // Load Monaco editor
          window.require(['vs/editor/editor.main'], () => {
            resolve(window.monaco);
          });
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };
    
    // Initialize Monaco editor
    const initMonaco = async () => {
      if (!editorContainer.value) return;
      
      // Load Monaco dynamically
      monaco = await import('monaco-editor');
      loading.value = false;
      
      // Determine current theme
      const isDarkMode = document.documentElement.classList.contains('dark');
      const currentTheme = isDarkMode ? 'vs-dark' : 'vs';
      
      // Define custom themes for light and dark modes
      monaco.editor.defineTheme('lambda-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0e1117',
          'editor.foreground': '#c8d3f5',
          'editorCursor.foreground': '#c8d3f5',
          'editor.lineHighlightBackground': '#171c28',
          'editorLineNumber.foreground': '#4b5563',
          'editor.selectionBackground': '#283457',
          'editorGutter.background': '#0e1117',
        }
      });
      
      monaco.editor.defineTheme('lambda-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#1e293b',
          'editorCursor.foreground': '#1e293b',
          'editor.lineHighlightBackground': '#ffffff',
          'editorLineNumber.foreground': '#64748b',
          'editor.selectionBackground': '#e2e8f0',
          'editorGutter.background': '#f8fafc',
        }
      });
      
      // Define editor options
      const defaultOptions = {
        ...props.options,
        value: props.modelValue,
        language: props.language,
        theme: isDarkMode ? 'lambda-dark' : 'lambda-light',
        readOnly: props.readOnly,
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      };
      
      // Create editor instance
      editor = monaco.editor.create(editorContainer.value, defaultOptions);
      
      // Add keyboard shortcut for format (SHIFT+ALT+F)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        function() {
          format();
        }
      );
      
      // Set up content change listener
      subscription = editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        emit('update:modelValue', value);
      });
      
      // Let parent know the editor is ready
      emit('editor-mounted', editor);
      
      // Handle window resize
      const handleResize = () => {
        if (editor) {
          editor.layout();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup on component destruction
      onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
        if (subscription) {
          subscription.dispose();
        }
        if (editor) {
          editor.dispose();
        }
      });
    };
    
    // Watch for prop changes
    watch(() => props.modelValue, (newValue) => {
      if (editor && newValue !== editor.getValue()) {
        editor.setValue(newValue);
      }
    });
    
    watch(() => props.language, (newValue) => {
      if (editor && monaco) {
        const model = editor.getModel();
        monaco.editor.setModelLanguage(model, newValue);
      }
    });
    
    // Watch for theme changes
    watch(() => document.documentElement.classList.contains('dark'), (isDark) => {
      if (editor && monaco) {
        const theme = isDark ? 'lambda-dark' : 'lambda-light';
        monaco.editor.setTheme(theme);
        
        // Store current value and cursor position
        const value = editor.getValue();
        const position = editor.getPosition();
        
        // Force refresh by recreating the editor
        if (subscription) {
          subscription.dispose();
        }
        editor.dispose();
        
        // Recreate with new theme
        editor = monaco.editor.create(editorContainer.value, {
          ...props.options,
          value: value,
          language: props.language,
          theme: theme,
          readOnly: props.readOnly,
          automaticLayout: true,
          minimap: {
            enabled: false,
          },
          scrollBeyondLastLine: false,
        });
        
        // Restore cursor position
        if (position) {
          editor.setPosition(position);
          editor.revealPositionInCenter(position);
        }
        
        // Set up content change listener again
        subscription = editor.onDidChangeModelContent(() => {
          emit('update:modelValue', editor.getValue());
        });
        
        // Add keyboard shortcut for format (SHIFT+ALT+F) again
        editor.addCommand(
          monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
          function() {
            format();
          }
        );
      }
    });
    
    // Watch for prop changes
    watch(() => props.theme, (newTheme) => {
      if (editor && monaco) {
        // Map the vs/vs-dark theme prop to our custom themes
        const actualTheme = newTheme === 'vs-dark' ? 'lambda-dark' : 'lambda-light';
        
        // When the theme prop changes directly, apply it
        monaco.editor.setTheme(actualTheme);
        
        // Force internal Monaco components to refresh
        setTimeout(() => {
          editor.layout();
        }, 100);
      }
    });
    
    onMounted(() => {
      initMonaco();
    });
    
    return {
      editorContainer,
      loading,
      format
    };
  },
});
</script>

<style>
.monaco-editor-container {
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: var(--color-terminal-background);
}

.monaco-editor {
  background-color: var(--color-terminal-background) !important;
}

.dark .monaco-editor-container {
  background-color: var(--color-terminal-background);
}

.monaco-editor .margin {
  background-color: var(--color-terminal-background) !important;
}
</style> 