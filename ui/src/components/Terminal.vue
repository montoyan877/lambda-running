<template>
  <div 
    ref="terminalRef" 
    class="terminal-container w-full h-full"
  ></div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

export default defineComponent({
  name: 'TerminalComponent',
  
  props: {
    logs: {
      type: Array,
      default: () => [],
    },
    autoScroll: {
      type: Boolean,
      default: true,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  
  setup(props, { emit }) {
    const terminalRef = ref(null);
    let terminal = null;
    let fitAddon = null;
    
    // Initialize the terminal
    onMounted(() => {
      if (!terminalRef.value) return;
      
      // Create terminal with default options
      terminal = new Terminal({
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        fontSize: 14,
        lineHeight: 1.5,
        cursorBlink: false,
        rendererType: 'canvas',
        theme: {
          background: '#0e1117',
          foreground: '#c8d3f5',
          black: '#000000',
          red: '#ff5370',
          green: '#c3e88d',
          yellow: '#ffcb6b',
          blue: '#82aaff',
          magenta: '#c792ea',
          cyan: '#89ddff',
          white: '#c8d3f5',
          brightBlack: '#676767',
          brightRed: '#ff757f',
          brightGreen: '#ddffa7',
          brightYellow: '#ffe585',
          brightBlue: '#9cc4ff',
          brightMagenta: '#e1acff',
          brightCyan: '#a3f7ff',
          brightWhite: '#ffffff',
        },
        ...props.options,
      });
      
      // Add addons
      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());
      
      // Open terminal in the container
      terminal.open(terminalRef.value);
      fitAddon.fit();
      
      // Handle resize
      const resizeHandler = () => {
        if (fitAddon) {
          setTimeout(() => fitAddon.fit(), 0);
        }
      };
      
      window.addEventListener('resize', resizeHandler);
      
      // Print logs that are already available
      props.logs.forEach(log => printLog(log));
      
      // Clean up
      onBeforeUnmount(() => {
        window.removeEventListener('resize', resizeHandler);
        if (terminal) {
          terminal.dispose();
        }
      });
    });
    
    // Print log messages with appropriate color
    const printLog = (log) => {
      if (!terminal) return;
      
      const typeColors = {
        info: '\x1b[36m', // Cyan
        log: '\x1b[37m',  // White
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m' // Red
      };
      
      const color = typeColors[log.type] || typeColors.log;
      const resetColor = '\x1b[0m';
      
      // Add timestamp
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      terminal.write(`${color}[${timestamp}] `);
      
      // Write the message
      terminal.writeln(`${log.message}${resetColor}`);
      
      // Auto scroll to bottom if enabled
      if (props.autoScroll) {
        terminal.scrollToBottom();
      }
    };
    
    // Watch for new logs
    watch(() => props.logs, (newLogs, oldLogs) => {
      if (newLogs.length > oldLogs.length) {
        // Print only new logs
        const newItems = newLogs.slice(oldLogs.length);
        newItems.forEach(log => printLog(log));
      }
    }, { deep: true });
    
    // Clear the terminal
    const clear = () => {
      if (terminal) {
        terminal.clear();
      }
    };
    
    // Expose methods
    return {
      terminalRef,
      clear,
    };
  },
});
</script>

<style>
.terminal-container {
  padding: 0.5rem;
}

.terminal-container .xterm-viewport::-webkit-scrollbar {
  width: 10px;
}

.terminal-container .xterm-viewport::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.terminal-container .xterm-viewport::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.terminal-container .xterm-viewport::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style> 