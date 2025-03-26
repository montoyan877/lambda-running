<template>
  <div class="terminal-container w-full h-full overflow-y-auto font-mono text-sm p-1">
    <div v-if="logs.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">
      <p>No output available. Run a handler to see logs.</p>
    </div>
    <div v-else>
      <div 
        v-for="(log, index) in logs" 
        :key="index" 
        class="py-1 px-3 border-b border-gray-200 dark:border-dark-700 whitespace-pre-wrap"
        :class="{
          'text-gray-900 dark:text-white': log.type === 'log',
          'text-blue-600 dark:text-cyan-400': log.type === 'info',
          'text-yellow-600 dark:text-yellow-400': log.type === 'warn',
          'text-red-600 dark:text-red-400': log.type === 'error'
        }">
        <span class="text-xs text-gray-500 mr-2">[{{ formatTime(log.timestamp) }}]</span>
        {{ log.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TerminalComponent',
  
  props: {
    logs: {
      type: Array,
      default: () => [],
    }
  },
  
  setup() {
    // Format timestamp to readable time
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    };
    
    // Expose method to clear terminal - for compatibility with previous implementation
    const clear = () => {
      // This is now handled by parent component clearing the logs array
      console.log('Terminal clear requested');
    };
    
    return {
      formatTime,
      clear
    };
  }
});
</script>

<style scoped>
.terminal-container {
  background-color: var(--color-terminal-background);
  color: var(--color-terminal-foreground);
}

.terminal-container::-webkit-scrollbar {
  width: 10px;
}

.terminal-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.terminal-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.dark .terminal-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.dark .terminal-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark .terminal-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style> 