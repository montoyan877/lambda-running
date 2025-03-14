<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header class="p-4 border-b border-dark-border bg-dark-100">
      <div class="flex items-center justify-between">
        <div :class="{ 'pl-6': sidebarCollapsed }">
          <h1 class="text-xl font-bold">Handler Testing</h1>
          <p v-if="currentHandler" class="text-sm text-gray-400 mt-1">
            {{ currentHandler.relativePath || getRelativePath(currentHandler.path) }} -> {{ currentHandler.method }}
          </p>
        </div>
        
        <div class="flex space-x-3">
          <button 
            v-if="!isExecuting"
            class="btn btn-primary text-sm flex items-center"
            @click="runHandler"
            :disabled="!eventData"
          >
            <span>Run Handler</span>
          </button>
          
          <button 
            v-else
            class="btn btn-danger text-sm flex items-center"
            @click="stopExecution"
          >
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Stop Execution</span>
          </button>
          
          <button 
            class="btn btn-outline text-sm"
            @click="showSaveEventModal = true"
            :disabled="!eventData || isExecuting"
          >
            Save Event
          </button>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <ResizablePanel class="flex-1" :initialSplit="50">
      <template #left>
        <!-- Event Editor -->
        <div class="h-full flex flex-col">
          <div class="p-3 border-b border-dark-border bg-dark-100 flex justify-between items-center">
            <h2 class="font-medium">Event Data</h2>
            
            <div class="flex space-x-2 items-center">
              <button 
                v-if="showSavedEvents"
                class="text-xs px-2 py-1 rounded bg-dark-hover hover:bg-dark-300 transition-colors"
                @click="showSavedEvents = false"
              >
                Hide Saved Events
              </button>
              <button 
                v-else
                class="text-xs px-2 py-1 rounded bg-dark-hover hover:bg-dark-300 transition-colors"
                @click="showSavedEvents = true"
              >
                Show Saved Events
              </button>
              
              <button 
                class="text-xs px-2 py-1 rounded bg-dark-hover hover:bg-dark-300 transition-colors"
                @click="formatEvent"
              >
                Format
              </button>
            </div>
          </div>
          
          <div class="flex-1 flex overflow-hidden">
            <!-- Event Editor -->
            <div :class="['h-full', showSavedEvents ? 'w-1/2' : 'w-full']">
              <CodeEditor
                ref="eventEditor"
                v-model="eventData"
                language="json"
                theme="dark"
                :options="{
                  formatOnPaste: true,
                  formatOnType: true
                }"
                @save="runHandler"
              />
            </div>
            
            <!-- Saved Events Panel -->
            <div v-if="showSavedEvents" class="w-1/2 h-full overflow-auto bg-dark-200 border-l border-dark-border">
              <div v-if="isLoadingEvents" class="p-4 text-center text-gray-400">
                Loading events...
              </div>
              
              <div v-else-if="events.length === 0" class="p-4 text-center text-gray-400">
                No saved events found
              </div>
              
              <div v-else class="p-2">
                <div v-for="(eventList, category) in eventsByCategory" :key="category" class="mb-4">
                  <h3 class="text-xs font-semibold text-gray-400 uppercase px-2 py-1">{{ category }}</h3>
                  
                  <div 
                    v-for="event in eventList" 
                    :key="event.name"
                    class="px-3 py-2 text-sm hover:bg-dark-hover cursor-pointer rounded transition-colors"
                    @click="selectEvent(event)"
                  >
                    {{ event.name }}
                    <div class="text-xs text-gray-500 mt-1">
                      {{ new Date(event.timestamp).toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <template #right>
        <!-- Results Panel -->
        <div class="h-full flex flex-col">
          <div class="p-3 border-b border-dark-border bg-dark-100 flex justify-between items-center">
            <h2 class="font-medium">Output</h2>
            
            <div class="flex space-x-2">
              <button 
                class="text-xs px-2 py-1 rounded bg-dark-hover hover:bg-dark-300 transition-colors"
                @click="clearLogs"
              >
                Clear
              </button>
            </div>
          </div>
          
          <ResizablePanelVertical class="flex-1" :initialSplit="50">
            <template #top>
              <!-- Terminal Output -->
              <div class="h-full overflow-hidden">
                <Terminal 
                  ref="terminal"
                  :logs="currentLogs"
                />
              </div>
            </template>
            
            <template #bottom>
              <!-- Result JSON -->
              <div class="h-full overflow-hidden flex flex-col">
                <div class="p-3 border-b border-dark-border bg-dark-100 flex justify-between items-center">
                  <h3 class="font-medium">Result</h3>
                  
                  <div v-if="currentResult" class="text-xs">
                    <span 
                      :class="currentResult.success ? 'text-green-400' : 'text-red-400'"
                    >
                      {{ currentResult.success ? 'Success' : 'Failed' }}
                    </span>
                    <span class="text-gray-400 ml-2">
                      {{ formatDuration(currentResult.duration) }}
                    </span>
                  </div>
                </div>
                
                <div class="flex-1 overflow-hidden">
                  <CodeEditor
                    v-if="currentResult"
                    :modelValue="formatResultOutput(currentResult)"
                    language="json"
                    theme="dark"
                    :readOnly="true"
                  />
                  <div v-else class="p-4 text-center text-gray-400 h-full flex items-center justify-center">
                    <p>Run handler to see results</p>
                  </div>
                </div>
              </div>
            </template>
          </ResizablePanelVertical>
        </div>
      </template>
    </ResizablePanel>
    
    <!-- Save Event Modal -->
    <SaveEventModal
      :show="showSaveEventModal"
      @close="showSaveEventModal = false"
      @save="handleSaveEvent"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHandlersStore } from '../stores/handlers';
import { useEventsStore } from '../stores/events';
import { useExecutionStore } from '../stores/execution';
import { useHandlerEventsStore } from '../stores/handlerEvents';
import CodeEditor from '../components/CodeEditor.vue';
import Terminal from '../components/Terminal.vue';
import ResizablePanel from '../components/ResizablePanel.vue';
import ResizablePanelVertical from '../components/ResizablePanelVertical.vue';
import SaveEventModal from '../components/SaveEventModal.vue';
import { notify } from '../components/Notification.vue';

export default defineComponent({
  name: 'HandlerView',
  
  components: {
    CodeEditor,
    Terminal,
    ResizablePanel,
    ResizablePanelVertical,
    SaveEventModal
  },
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const handlersStore = useHandlersStore();
    const eventsStore = useEventsStore();
    const executionStore = useExecutionStore();
    const handlerEventsStore = useHandlerEventsStore();
    
    // Get sidebarCollapsed state from App component
    const sidebarCollapsed = inject('sidebarCollapsed', ref(false));
    
    // UI State
    const eventEditor = ref(null);
    const terminal = ref(null);
    const eventData = ref('{}');
    const showSavedEvents = ref(false);
    const currentSessionId = ref(null);
    const showSaveEventModal = ref(false);
    
    // Toggle dropdown menus
    const toggleEventOptions = () => {
      console.log('Esta funcionalidad ha sido temporalmente desactivada');
    };
    
    // On mount, initialize
    onMounted(() => {
      // Connect to socket
      executionStore.connectSocket();
      
      // Initialize handler events store
      handlerEventsStore.initialize();
      
      // Fetch handlers if not loaded
      if (handlersStore.handlers.length === 0) {
        handlersStore.fetchHandlers();
      }
      
      // Fetch events
      eventsStore.fetchEvents();
      
      // If we have handler path and method from the route, set it as active
      if (route.params.handlerPath && route.params.handlerMethod) {
        handlersStore.setActiveHandler(
          decodeURIComponent(route.params.handlerPath),
          route.params.handlerMethod
        );
        
        // Check if there's a last event for this handler and load it
        const handlerId = `${decodeURIComponent(route.params.handlerPath)}:${route.params.handlerMethod}`;
        const lastEvent = handlerEventsStore.getLastEvent(handlerId);
        if (lastEvent) {
          eventData.value = JSON.stringify(lastEvent, null, 2);
        }
      }
      
      // Add global event listener for Ctrl+Enter
      window.addEventListener('keydown', handleKeydown);
    });
    
    // Remove event listener on unmount
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown);
    });
    
    // Handle keydown events
    const handleKeydown = (event) => {
      // Check if it's Ctrl+Enter
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        // Prevent default behavior (like form submission)
        event.preventDefault();
        
        // Run handler if possible
        if (currentHandler.value && !isExecuting.value && eventData.value) {
          runHandler();
        }
      }
    };
    
    // Watch for route changes
    watch(() => [route.params.handlerPath, route.params.handlerMethod], ([newPath, newMethod]) => {
      if (newPath && newMethod) {
        handlersStore.setActiveHandler(
          decodeURIComponent(newPath),
          newMethod
        );
        
        // Check if there's a last event for this handler and load it
        const handlerId = `${decodeURIComponent(newPath)}:${newMethod}`;
        const lastEvent = handlerEventsStore.getLastEvent(handlerId);
        if (lastEvent) {
          eventData.value = JSON.stringify(lastEvent, null, 2);
        } else {
          // If no last event, reset to empty object
          eventData.value = '{}';
        }
      }
    });
    
    // Computed
    const currentHandler = computed(() => handlersStore.activeHandler);
    const isExecuting = computed(() => executionStore.isExecuting);
    const events = computed(() => eventsStore.events);
    const eventsByCategory = computed(() => eventsStore.eventsByCategory);
    const isLoadingEvents = computed(() => eventsStore.isLoading);
    
    const currentLogs = computed(() => {
      if (!currentSessionId.value) return [];
      const logs = executionStore.getSessionLogs(currentSessionId.value);
      console.log(`Debug - Current logs for session ${currentSessionId.value}:`, logs);
      return logs;
    });
    
    const currentResult = computed(() => {
      if (!currentSessionId.value) return null;
      return executionStore.getSessionResult(currentSessionId.value);
    });
    
    // Watch for changes in current result to update execution history
    watch(currentResult, (newResult) => {
      if (newResult && currentHandler.value) {
        try {
          const parsedEvent = JSON.parse(eventData.value);
          handlerEventsStore.addExecutionToHistory(
            currentHandler.value.id,
            parsedEvent,
            newResult.result || newResult.error,
            newResult.success,
            newResult.duration
          );
        } catch (error) {
          console.error('Failed to add execution to history:', error);
        }
      }
    });
    
    // Watch for fatal errors in logs and add them to result if not already set
    watch(() => currentLogs.value, (newLogs) => {
      // Si hay logs de error pero no hay resultado (error fatal antes de resultado)
      if (newLogs.length > 0 && !currentResult.value && currentSessionId.value) {
        const errorLogs = newLogs.filter(log => log.type === 'error');
        
        if (errorLogs.length > 0) {
          // Creamos un resultado con el error
          const errorMessages = errorLogs.map(log => log.message).join('\n');
          
          // Solo agregamos el resultado si no existe
          if (!executionStore.getSessionResult(currentSessionId.value)) {
            executionStore.setErrorResult(
              currentSessionId.value, 
              { message: 'Fatal error', details: errorMessages },
              Date.now() - errorLogs[0].timestamp // Calcular duración aproximada
            );
          }
        }
      }
    }, { deep: true });
    
    // Methods
    const runHandler = async () => {
      if (!currentHandler.value || isExecuting.value) return;
      
      try {
        // Validate event data as JSON
        const parsedEvent = JSON.parse(eventData.value);
        
        // Save to handler event history
        if (currentHandler.value) {
          handlerEventsStore.saveLastEvent(currentHandler.value.id, parsedEvent);
        }
        
        // Execute the handler
        currentSessionId.value = executionStore.runHandler(
          currentHandler.value.path,
          currentHandler.value.method,
          parsedEvent
        );
      } catch (error) {
        notify.error(`Invalid JSON event data: ${error.message}`);
      }
    };
    
    const stopExecution = () => {
      handlersStore.stopExecution();
    };
    
    const formatEvent = () => {
      if (eventEditor.value) {
        eventEditor.value.format();
      }
    };
    
    const selectEvent = (event) => {
      eventData.value = JSON.stringify(event.data, null, 2);
      showSavedEvents.value = false;
    };
    
    const clearLogs = () => {
      if (currentSessionId.value) {
        executionStore.clearConsole(currentSessionId.value);
      }
      
      if (terminal.value) {
        terminal.value.clear();
      }
    };
    
    const handleSaveEvent = async (eventInfo) => {
      try {
        const parsedEvent = JSON.parse(eventData.value);
        
        // Save the event
        const success = await eventsStore.saveEvent(
          eventInfo.name, 
          parsedEvent, 
          eventInfo.category
        );
        
        if (success) {
          notify.success(`Event saved as "${eventInfo.name}" in category "${eventInfo.category}"`);
          showSaveEventModal.value = false;
        } else {
          notify.error('Failed to save event');
        }
      } catch (error) {
        notify.error(`Invalid JSON event data: ${error.message}`);
      }
    };
    
    // Formatear el resultado para mostrarlo
    const formatResultOutput = (result) => {
      try {
        if (!result) return '{}';

        if (result.error) {
          // Si es un objeto de error, formatear para mejor visualización
          let errorObj = result.error;
          if (typeof errorObj === 'string') {
            errorObj = { message: errorObj };
          }
          
          // Si tiene detalles, agregarlos
          if (errorObj.details) {
            errorObj.details = errorObj.details.split('\n');
          }
          
          return JSON.stringify(errorObj, null, 2);
        } else {
          // Si es un resultado exitoso
          return JSON.stringify(result.result || {}, null, 2);
        }
      } catch (e) {
        return JSON.stringify({ error: "Error formatting result" }, null, 2);
      }
    };
    
    // Formatear duración para mostrarla en segundos
    const formatDuration = (duration) => {
      if (duration < 1000) {
        return `${duration}ms`;
      } else {
        const seconds = (duration / 1000).toFixed(2);
        return `${seconds}s`;
      }
    };
    
    const getRelativePath = (path) => {
      if (!path) return '';
      
      // Dividir la ruta y obtener las últimas partes
      const parts = path.split(/[\/\\]/);
      
      // Si hay más de 2 partes, mostrar 'parent/file.js'
      if (parts.length > 2) {
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`; 
      }
      
      // Si hay solo 1 o 2 partes, mostrar solo el nombre del archivo
      return parts[parts.length - 1];
    };
    
    return {
      // Refs
      eventEditor,
      terminal,
      eventData,
      showSavedEvents,
      currentSessionId,
      showSaveEventModal,
      
      // UI State
      sidebarCollapsed,
      
      // Computed
      currentHandler,
      isExecuting,
      events,
      eventsByCategory,
      isLoadingEvents,
      currentLogs,
      currentResult,
      
      // Methods
      runHandler,
      stopExecution,
      formatEvent,
      selectEvent,
      clearLogs,
      handleSaveEvent,
      formatDuration,
      formatResultOutput,
      getRelativePath,
      toggleEventOptions
    };
  }
});
</script>

<style scoped>
.btn-danger {
  @apply bg-red-500 hover:bg-red-600 text-white;
}

/* Fix dropdown z-index */
.relative {
  position: relative;
  z-index: 20;
}
</style> 