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
    
    // Initialize editor with minimal features
    onMounted(async () => {
      if (!editorContainer.value) return;
      
      try {
        // Load Monaco from CDN
        monaco = await loadMonacoFromCDN();
        
        // Define custom dark theme
        monaco.editor.defineTheme('lambda-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6A9955' },
            { token: 'keyword', foreground: 'C792EA' },
            { token: 'string', foreground: 'C3E88D' },
            { token: 'number', foreground: 'F78C6C' },
          ],
          colors: {
            'editor.background': '#0e1117',
            'editor.foreground': '#c8d3f5',
            'editorCursor.foreground': '#c8d3f5',
            'editor.lineHighlightBackground': '#171c28',
            'editorLineNumber.foreground': '#545454',
            'editor.selectionBackground': '#383d51',
            'editorSuggestWidget.background': '#171c28',
            'editorSuggestWidget.border': '#232534',
            'editorSuggestWidget.foreground': '#c8d3f5',
            'editorSuggestWidget.selectedBackground': '#2d3348',
          }
        });
        
        // Create editor with improved dark theme
        editor = monaco.editor.create(editorContainer.value, {
          value: props.modelValue,
          language: props.language,
          theme: 'lambda-dark', // Use our custom dark theme
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: 'monospace',
          tabSize: 2,
          readOnly: props.readOnly,
          lineNumbers: 'on',
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          },
          ...props.options,
        });
        
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
        
        loading.value = false;
      } catch (error) {
        console.error('Failed to load Monaco editor:', error);
        loading.value = false;
      }
      
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
    });
    
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
  background-color: #0e1117;
}
</style> 