<template>
  <div ref="editorContainer" class="monaco-editor-container w-full h-full"></div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';
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
    let editor = null;
    let subscription = null;
    let contentChangeTimeout = null;
    
    // Configure default monaco settings
    const configureMonaco = () => {
      // Register custom themes
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
        },
      });
    };
    
    // Initialize editor
    onMounted(() => {
      if (!editorContainer.value) return;
      
      configureMonaco();
      
      // Create editor instance
      editor = monaco.editor.create(editorContainer.value, {
        value: props.modelValue,
        language: props.language,
        theme: props.theme === 'dark' ? 'lambda-dark' : props.theme,
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        lineHeight: 22,
        letterSpacing: 0.5,
        fontLigatures: true,
        tabSize: 2,
        renderLineHighlight: 'all',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        readOnly: props.readOnly,
        ...props.options,
      });
      
      // Set up content change listener
      subscription = editor.onDidChangeModelContent(() => {
        clearTimeout(contentChangeTimeout);
        contentChangeTimeout = setTimeout(() => {
          const value = editor.getValue();
          emit('update:modelValue', value);
        }, 100);
      });
      
      // Set up keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        emit('save', editor.getValue());
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
      
      // Warn if there are unsaved changes before navigation
      onBeforeRouteLeave((to, from, next) => {
        if (editor && editor.getValue() !== props.modelValue) {
          if (confirm('You have unsaved changes. Do you want to leave anyway?')) {
            next();
          } else {
            next(false);
          }
        } else {
          next();
        }
      });
    });
    
    // Methods exposed to parent components
    const format = () => {
      if (editor) {
        editor.getAction('editor.action.formatDocument').run();
      }
    };
    
    const setPosition = (lineNumber, column) => {
      if (editor) {
        editor.revealLineInCenter(lineNumber);
        editor.setPosition({ lineNumber, column });
        editor.focus();
      }
    };
    
    // Watch for prop changes
    watch(() => props.modelValue, (newValue) => {
      if (editor && newValue !== editor.getValue()) {
        editor.setValue(newValue);
      }
    });
    
    watch(() => props.language, (newValue) => {
      if (editor) {
        const model = editor.getModel();
        monaco.editor.setModelLanguage(model, newValue);
      }
    });
    
    watch(() => props.theme, (newValue) => {
      if (editor) {
        const theme = newValue === 'dark' ? 'lambda-dark' : newValue;
        monaco.editor.setTheme(theme);
      }
    });
    
    watch(() => props.readOnly, (newValue) => {
      if (editor) {
        editor.updateOptions({ readOnly: newValue });
      }
    });
    
    return {
      editorContainer,
      format,
      setPosition,
    };
  },
});
</script>

<style>
.monaco-editor-container {
  border-radius: 0.375rem;
  overflow: hidden;
}
</style> 