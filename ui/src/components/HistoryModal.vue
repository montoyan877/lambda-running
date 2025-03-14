<template>
  <Modal 
    :show="show" 
    title="Event History" 
    confirmText="Close"
    :closeOnClickOutside="true"
    @close="$emit('close')"
    @confirm="$emit('close')"
  >
    <div class="history-container space-y-4">
      <div v-if="!currentHandler" class="text-center text-gray-400 py-4">
        No handler selected
      </div>
      
      <template v-else>
        <div class="mb-4">
          <h3 class="text-sm font-medium text-white mb-2">Last Event</h3>
          
          <div v-if="lastEvent" class="bg-dark-200 rounded-md p-3">
            <div class="flex justify-between items-center mb-2">
              <div class="text-xs text-primary-500 font-medium">Last Used</div>
              <button 
                class="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-dark-hover transition-colors"
                @click="selectEvent(lastEvent)"
              >
                Use This Event
              </button>
            </div>
            <pre class="text-xs text-gray-300 overflow-auto max-h-32">{{ formatJson(lastEvent) }}</pre>
          </div>
          
          <div v-else class="text-sm text-gray-400 py-2">
            No last event found for this handler
          </div>
        </div>
        
        <div class="mb-4">
          <h3 class="text-sm font-medium text-white mb-2">Execution History</h3>
          
          <div v-if="executionHistory.length > 0" class="bg-dark-200 rounded-md">
            <div v-for="(execution, index) in executionHistory" :key="index" class="p-3 border-b border-dark-border last:border-0">
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center">
                  <span 
                    :class="execution.success ? 'text-green-400' : 'text-red-400'" 
                    class="text-xs font-medium mr-2"
                  >
                    {{ execution.success ? 'Success' : 'Failed' }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ formatDate(execution.timestamp) }} - {{ execution.duration }}ms
                  </span>
                </div>
                <button 
                  class="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-dark-hover transition-colors"
                  @click="selectEvent(execution.event)"
                >
                  Use This Event
                </button>
              </div>
              
              <div class="mt-2">
                <div class="text-xs font-semibold text-gray-300 mb-1">Event:</div>
                <pre class="text-xs text-gray-300 overflow-auto max-h-24">{{ formatJson(execution.event) }}</pre>
              </div>
              
              <div class="mt-2" v-if="execution.result">
                <div class="text-xs font-semibold text-gray-300 mb-1">Result:</div>
                <pre class="text-xs text-gray-300 overflow-auto max-h-24">{{ formatJson(execution.result) }}</pre>
              </div>
            </div>
          </div>
          
          <div v-else class="text-sm text-gray-400 py-2">
            No execution history found for this handler
          </div>
        </div>
      </template>
    </div>
  </Modal>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useHandlersStore } from '../stores/handlers';
import { useHandlerEventsStore } from '../stores/handlerEvents';
import Modal from './Modal.vue';
import { notify } from '../components/Notification.vue';

export default defineComponent({
  name: 'HistoryModal',
  
  components: {
    Modal
  },
  
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['close', 'select'],
  
  setup(props, { emit }) {
    const handlersStore = useHandlersStore();
    const handlerEventsStore = useHandlerEventsStore();
    
    // Get current handler
    const currentHandler = computed(() => handlersStore.activeHandler);
    
    // Get last event for current handler
    const lastEvent = computed(() => {
      if (!currentHandler.value) return null;
      return handlerEventsStore.getLastEvent(currentHandler.value.id);
    });
    
    // Get execution history for current handler
    const executionHistory = computed(() => {
      if (!currentHandler.value) return [];
      return handlerEventsStore.getExecutionHistory(currentHandler.value.id);
    });
    
    // Format JSON for display
    const formatJson = (data) => {
      try {
        return JSON.stringify(data, null, 2);
      } catch (error) {
        return String(data);
      }
    };
    
    // Format date for display
    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
    
    // Select an event to use
    const selectEvent = (eventData) => {
      emit('select', { data: eventData });
      emit('close');
    };
    
    return {
      currentHandler,
      lastEvent,
      executionHistory,
      formatJson,
      formatDate,
      selectEvent
    };
  }
});
</script>

<style scoped>
.history-container {
  max-height: 60vh;
  overflow-y: auto;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 