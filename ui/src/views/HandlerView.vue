<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header class="p-4 border-b border-dark-border bg-dark-100">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">Handler Testing</h1>
          <p v-if="currentHandler" class="text-sm text-gray-400 mt-1">
            {{ currentHandler.path.split('/').pop() }} -> {{ currentHandler.method }}
          </p>
        </div>
        
        <div class="flex space-x-3">
          <button 
            class="btn btn-primary text-sm flex items-center"
            @click="runHandler"
            :disabled="isExecuting || !eventData"
          >
            <svg v-if="isExecuting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isExecuting ? 'Running...' : 'Run Handler' }}</span>
          </button>
          
          <button 
            class="btn btn-outline text-sm"
            @click="saveEvent"
            :disabled="!eventData || isExecuting"
          >
            Save Event
          </button>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Event Editor -->
      <div class="w-1/2 h-full flex flex-col border-r border-dark-border">
        <div class="p-3 border-b border-dark-border bg-dark-100 flex justify-between items-center">
          <h2 class="font-medium">Event Data</h2>
          
          <div class="flex space-x-2">
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
      
      <!-- Results Panel -->
      <div class="w-1/2 h-full flex flex-col">
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
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Terminal Output -->
          <div class="h-1/2 overflow-hidden">
            <Terminal 
              ref="terminal"
              :logs="currentLogs"
            />
          </div>
          
          <!-- Result JSON -->
          <div class="h-1/2 border-t border-dark-border overflow-hidden">
            <div class="p-3 border-b border-dark-border bg-dark-100 flex justify-between items-center">
              <h3 class="font-medium">Result</h3>
              
              <div v-if="currentResult" class="text-xs">
                <span 
                  :class="currentResult.success ? 'text-green-400' : 'text-red-400'"
                >
                  {{ currentResult.success ? 'Success' : 'Failed' }}
                </span>
                <span class="text-gray-400 ml-2">
                  {{ currentResult.duration }}ms
                </span>
              </div>
            </div>
            
            <div class="h-[calc(100%-40px)] overflow-hidden">
              <CodeEditor
                v-if="currentResult"
                :modelValue="JSON.stringify(currentResult.result || currentResult.error, null, 2)"
                language="json"
                theme="dark"
                :readOnly="true"
              />
              <div v-else class="p-4 text-center text-gray-400 h-full flex items-center justify-center">
                <p>Run handler to see results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHandlersStore } from '../stores/handlers';
import { useEventsStore } from '../stores/events';
import { useExecutionStore } from '../stores/execution';
import CodeEditor from '../components/CodeEditor.vue';
import Terminal from '../components/Terminal.vue';

export default defineComponent({
  name: 'HandlerView',
  
  components: {
    CodeEditor,
    Terminal
  },
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const handlersStore = useHandlersStore();
    const eventsStore = useEventsStore();
    const executionStore = useExecutionStore();
    
    // UI State
    const eventEditor = ref(null);
    const terminal = ref(null);
    const eventData = ref('{}');
    const showSavedEvents = ref(false);
    const currentSessionId = ref(null);
    
    // On mount, initialize
    onMounted(() => {
      // Connect to socket
      executionStore.connectSocket();
      
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
      }
    });
    
    // Watch for route changes
    watch(() => [route.params.handlerPath, route.params.handlerMethod], ([newPath, newMethod]) => {
      if (newPath && newMethod) {
        handlersStore.setActiveHandler(
          decodeURIComponent(newPath),
          newMethod
        );
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
      return executionStore.getSessionLogs(currentSessionId.value);
    });
    
    const currentResult = computed(() => {
      if (!currentSessionId.value) return null;
      return executionStore.getSessionResult(currentSessionId.value);
    });
    
    // Methods
    const runHandler = async () => {
      if (!currentHandler.value || isExecuting.value) return;
      
      try {
        // Validate event data as JSON
        const parsedEvent = JSON.parse(eventData.value);
        
        // Execute the handler
        currentSessionId.value = executionStore.runHandler(
          currentHandler.value.path,
          currentHandler.value.method,
          parsedEvent
        );
      } catch (error) {
        alert(`Invalid JSON event data: ${error.message}`);
      }
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
    
    const saveEvent = async () => {
      if (!eventData.value) return;
      
      try {
        const parsedEvent = JSON.parse(eventData.value);
        
        // Show dialog to get name and category
        const name = prompt('Enter a name for this event:', 'my-event');
        if (!name) return;
        
        const category = prompt('Enter a category (optional):', 'default');
        
        // Save the event
        const success = await eventsStore.saveEvent(name, parsedEvent, category || 'default');
        
        if (success) {
          alert(`Event saved as "${name}" in category "${category || 'default'}"`);
        } else {
          alert('Failed to save event');
        }
      } catch (error) {
        alert(`Invalid JSON event data: ${error.message}`);
      }
    };
    
    return {
      // Refs
      eventEditor,
      terminal,
      eventData,
      showSavedEvents,
      currentSessionId,
      
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
      formatEvent,
      selectEvent,
      clearLogs,
      saveEvent
    };
  }
});
</script> 