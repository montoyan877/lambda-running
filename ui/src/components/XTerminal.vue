<template>
  <div ref="terminalContainer" class="xterm-container w-full h-full">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <p>Loading terminal...</p>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';

export default defineComponent({
  name: 'XTerminal',
  
  props: {
    logs: {
      type: Array,
      default: () => [],
    },
    options: {
      type: Object,
      default: () => ({
        cursorBlink: true,
        fontFamily: 'monospace',
        fontSize: 14,
        lineHeight: 1.2,
        theme: {
          background: '#0e1117',
          foreground: '#f8f8f2',
          cursor: '#f8f8f2',
          selection: '#44475a',
        }
      }),
    }
  },
  
  setup(props) {
    const terminalContainer = ref(null);
    const loading = ref(true);
    let terminal = null;
    let fitAddon = null;
    
    // Initialize terminal
    onMounted(async () => {
      if (!terminalContainer.value) return;
      
      try {
        // Dynamically import xterm and addons
        const [
          { Terminal }, 
          { FitAddon }, 
          { WebLinksAddon }
        ] = await Promise.all([
          import('xterm'),
          import('xterm-addon-fit'),
          import('xterm-addon-web-links')
        ]);
        
        // Create terminal instance
        terminal = new Terminal(props.options);
        
        // Load addons
        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(new WebLinksAddon());
        
        // Open terminal in container
        terminal.open(terminalContainer.value);
        
        // Initial fit
        setTimeout(() => {
          if (fitAddon) {
            fitAddon.fit();
          }
        }, 100);
        
        // Write initial logs if any
        if (props.logs && props.logs.length > 0) {
          writeLogsToTerminal(props.logs);
        }
        
        loading.value = false;
      } catch (error) {
        console.error('Failed to load xterm:', error);
        loading.value = false;
      }
      
      // Handle window resize
      const handleResize = () => {
        if (fitAddon) {
          fitAddon.fit();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup on component destruction
      onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
        if (terminal) {
          terminal.dispose();
        }
      });
    });
    
    // Helper to format and write logs to terminal
    const writeLogsToTerminal = (logs) => {
      if (!terminal) return;
      
      logs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        let color = '\x1b[37m'; // default white
        
        switch (log.type) {
          case 'info':
            color = '\x1b[36m'; // cyan
            break;
          case 'warn':
            color = '\x1b[33m'; // yellow
            break;
          case 'error':
            color = '\x1b[31m'; // red
            break;
        }
        
        terminal.writeln(`\x1b[90m[${timestamp}]\x1b[0m ${color}${log.message}\x1b[0m`);
      });
    };
    
    // Expose method to clear terminal
    const clear = () => {
      if (terminal) {
        terminal.clear();
      }
    };
    
    // Watch for log changes
    watch(() => props.logs, (newLogs, oldLogs) => {
      if (!terminal) return;
      
      if (oldLogs && newLogs && oldLogs.length < newLogs.length) {
        // Only write new logs
        const newItems = newLogs.slice(oldLogs.length);
        writeLogsToTerminal(newItems);
      } else if (!oldLogs || oldLogs.length === 0) {
        // Write all logs if old logs were empty
        writeLogsToTerminal(newLogs);
      }
    }, { deep: true });
    
    return {
      terminalContainer,
      loading,
      clear
    };
  }
});
</script>

<style>
.xterm-container {
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: #0e1117;
}
</style> 