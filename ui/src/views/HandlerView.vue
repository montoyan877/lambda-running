<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header class="p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100">
      <div class="flex items-center justify-between">
        <div :class="{ 'pl-6': sidebarCollapsed }">
          <h1 class="text-xl font-bold">Handler Testing</h1>
          <p v-if="currentHandler" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ currentHandler.relativePath || getRelativePath(currentHandler.path) }}
          </p>
        </div>
        
        <div class="flex space-x-3">
          <div class="relative">
            <button 
              class="btn btn-outline text-sm flex items-center"
              @click="togglePanelMenu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Output Panels</span>
            </button>
            
            <div v-if="showPanelMenu" class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-dark-200 ring-1 ring-black ring-opacity-5 z-30">
              <div class="py-1" role="menu" aria-orientation="vertical">
                <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-dark-border">
                  <p class="font-medium">Show/Hide Output Panels</p>
                </div>
                
                <div @click.stop class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-hover">
                  <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg v-if="showOutputPanel" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <input type="checkbox" v-model="showOutputPanel" class="mr-2 hidden" />
                    <span>Output</span>
                  </label>
                </div>
                
                <div @click.stop class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-hover">
                  <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg v-if="showResultPanel" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <input type="checkbox" v-model="showResultPanel" class="mr-2 hidden" />
                    <span>Result</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
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
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <ResizablePanel class="flex-1" :initialSplit="50">
      <template #left>
        <!-- Event Editor -->
        <div class="h-full flex flex-col">
          <div class="p-3 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <h2 class="font-medium">Event Data</h2>
              <span v-if="selectedEventLabel" class="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-dark-300 text-gray-700 dark:text-gray-300">
                {{ selectedEventLabel }}
              </span>
            </div>
            
            <div class="flex space-x-2 items-center">
              <button
                class="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors"
                @click="showSaveEventModal = true"
                :disabled="!eventData || isExecuting"
                title="Save event"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21V13H7v8" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 3v4h4" />
                </svg>
              </button>
              
              <SavedEventSelector 
                :activeDropdown="activeDropdown"
                @dropdown-opened="handleDropdownOpen" 
                @dropdown-closed="handleDropdownClose"
                @select-event="selectEvent" 
              />
              
              <AWSEventTemplateSelector 
                :activeDropdown="activeDropdown"
                @dropdown-opened="handleDropdownOpen" 
                @dropdown-closed="handleDropdownClose"
                @select-template="applyAWSTemplate" 
              />
              
              <button 
                class="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors"
                @click="formatEvent"
              >
                Format
              </button>
            </div>
          </div>
          
          <div class="flex-1 overflow-hidden">
            <!-- Event Editor -->
            <CodeEditor
              ref="eventEditor"
              v-model="eventData"
              language="json"
              :theme="isDarkMode ? 'vs-dark' : 'vs'"
              :key="`event-editor-${isDarkMode}`"
              :options="{
                formatOnPaste: true,
                formatOnType: true
              }"
              @save="runHandler"
            />
          </div>
        </div>
      </template>
      
      <template #right>
        <!-- Results Panel -->
        <div v-if="showOutputPanel || showResultPanel" class="h-full flex flex-col">
          <div v-if="showOutputPanel" class="p-3 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100 flex justify-between items-center">
            <h2 class="font-medium">Output</h2>
            
            <div class="flex space-x-2">
              <button 
                class="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors"
                @click="clearLogs"
              >
                Clear
              </button>
            </div>
          </div>
          
          <ResizablePanelVertical 
            v-if="showOutputPanel && showResultPanel" 
            class="flex-1" 
            :initialSplit="60"
          >
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
                <div class="p-3 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100 flex justify-between items-center">
                  <h3 class="font-medium">Result</h3>
                  
                  <div class="flex items-center space-x-3">
                    <div v-if="currentResult" class="flex items-center space-x-3">
                      <div class="flex items-center text-xs">
                        <label class="flex items-center cursor-pointer">
                          <span class="mr-2 text-gray-700 dark:text-gray-300">Pretty JSON View</span>
                          <div class="relative">
                            <input type="checkbox" v-model="forceJsonFormat" class="sr-only" />
                            <div class="w-10 h-5 rounded-full shadow-inner transition-colors duration-300"
                                 :class="forceJsonFormat ? 'bg-primary-500 dark:bg-primary-600' : 'bg-gray-300 dark:bg-slate-500'"></div>
                            <div class="dot absolute left-0.5 top-0.5 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow transition-transform duration-300 ease-in-out" 
                                :class="{ 'transform translate-x-5': forceJsonFormat }"></div>
                          </div>
                        </label>
                      </div>
                      <div class="text-xs">
                        <span 
                          :class="currentResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                        >
                          {{ currentResult.success ? 'Success' : 'Failed' }}
                        </span>
                        <span class="text-gray-500 dark:text-gray-400 ml-2">
                          {{ formatDuration(currentResult.duration) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="flex-1 overflow-hidden">
                  <CodeEditor
                    v-if="currentResult"
                    :modelValue="formatResultOutput(currentResult)"
                    language="json"
                    :theme="isDarkMode ? 'vs-dark' : 'vs'"
                    :key="`result-editor-${isDarkMode}`"
                    :readOnly="true"
                  />
                  <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
                    <p>Run handler to see results</p>
                  </div>
                </div>
              </div>
            </template>
          </ResizablePanelVertical>
          
          <!-- Show only Output panel when Result panel is hidden -->
          <div v-else-if="showOutputPanel && !showResultPanel" class="flex-1 overflow-hidden">
            <Terminal 
              ref="terminal"
              :logs="currentLogs"
            />
          </div>
          
          <!-- Show only Result panel when Output panel is hidden -->
          <div v-else-if="!showOutputPanel && showResultPanel" class="flex-1 overflow-hidden flex flex-col">
            <div class="p-3 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100 flex justify-between items-center">
              <h3 class="font-medium">Result</h3>
              
              <div class="flex items-center space-x-3">
                <div v-if="currentResult" class="flex items-center space-x-3">
                  <div class="flex items-center text-xs">
                    <label class="flex items-center cursor-pointer">
                      <span class="mr-2 text-gray-700 dark:text-gray-300">Pretty JSON View</span>
                      <div class="relative">
                        <input type="checkbox" v-model="forceJsonFormat" class="sr-only" />
                        <div class="w-10 h-5 rounded-full shadow-inner transition-colors duration-300"
                             :class="forceJsonFormat ? 'bg-primary-500 dark:bg-primary-600' : 'bg-gray-300 dark:bg-slate-500'"></div>
                        <div class="dot absolute left-0.5 top-0.5 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow transition-transform duration-300 ease-in-out" 
                            :class="{ 'transform translate-x-5': forceJsonFormat }"></div>
                      </div>
                    </label>
                  </div>
                  <div class="text-xs">
                    <span 
                      :class="currentResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                    >
                      {{ currentResult.success ? 'Success' : 'Failed' }}
                    </span>
                    <span class="text-gray-500 dark:text-gray-400 ml-2">
                      {{ formatDuration(currentResult.duration) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex-1 overflow-hidden">
              <CodeEditor
                v-if="currentResult"
                :modelValue="formatResultOutput(currentResult)"
                language="json"
                :theme="isDarkMode ? 'vs-dark' : 'vs'"
                :key="`result-editor-${isDarkMode}`"
                :readOnly="true"
              />
              <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
                <p>Run handler to see results</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="h-full flex items-center justify-center bg-gray-100 dark:bg-dark-200">
          <div class="flex flex-col gap-3 items-center">
            <button 
              class="px-4 py-2 rounded bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
              @click="showOutputPanel = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Show Output
            </button>
            
            <button 
              class="px-4 py-2 rounded bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
              @click="showResultPanel = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Show Result
            </button>
          </div>
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
import AWSEventTemplateSelector from '../components/AWSEventTemplateSelector.vue';
import SavedEventSelector from '../components/SavedEventSelector.vue';
import { AWS_EVENT_TEMPLATES } from '../utils/awsEventTemplates';

export default defineComponent({
  name: 'HandlerView',
  
  components: {
    CodeEditor,
    Terminal,
    ResizablePanel,
    ResizablePanelVertical,
    SaveEventModal,
    AWSEventTemplateSelector,
    SavedEventSelector
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
    
    // Track dark mode state
    const isDarkMode = ref(document.documentElement.classList.contains('dark'));
    
    // UI State
    const eventEditor = ref(null);
    const terminal = ref(null);
    const eventData = ref('{}');
    const currentSessionId = ref(null);
    const showSaveEventModal = ref(false);
    const selectedEventLabel = ref(null);
    const forceJsonFormat = ref(false);
    const resultViewMode = computed(() => forceJsonFormat.value ? 'json' : 'string');
    const showPanelMenu = ref(false);
    const showOutputPanel = ref(true);
    const showResultPanel = ref(true);
    
    // Track which dropdown is open to ensure only one at a time
    const activeDropdown = ref(null);
    
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
          selectedEventLabel.value = lastEvent.name;
        }
      }
      
      // Add global event listener for Ctrl+Enter
      window.addEventListener('keydown', handleKeydown);
      // Add click listener to close panel menu when clicking outside
      window.addEventListener('click', closePanelMenu);

      // Watch for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            isDarkMode.value = document.documentElement.classList.contains('dark');
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      // Clean up observer
      onBeforeUnmount(() => {
        observer.disconnect();
      });
    });
    
    // Remove event listeners on unmount
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('click', closePanelMenu);
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
        // Clear the current execution results and logs
        currentSessionId.value = null;
        executionStore.clearCurrentSession();
        
        // Also clear terminal logs if the terminal component is available
        if (terminal.value && terminal.value.clear) {
          terminal.value.clear();
        }
        
        // Set the new active handler
        handlersStore.setActiveHandler(
          decodeURIComponent(newPath),
          newMethod
        );
        
        // Check if there's a last event for this handler and load it
        const handlerId = `${decodeURIComponent(newPath)}:${newMethod}`;
        const lastEvent = handlerEventsStore.getLastEvent(handlerId);
        if (lastEvent) {
          eventData.value = JSON.stringify(lastEvent, null, 2);
          selectedEventLabel.value = null;
        } else {
          // If no last event, reset to empty object
          eventData.value = '{}';
          selectedEventLabel.value = null;
        }
      }
    });
    
    // Watch for changes in the event data
    // If the user modifies the event data, clear the selected event label
    // Use a debounced watcher to not trigger immediately on template selection
    let eventChangeTimeout = null;
    watch(eventData, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        // Clear any existing timeout
        if (eventChangeTimeout) {
          clearTimeout(eventChangeTimeout);
        }
        
        // Set a new timeout to clear the label after a short delay
        // This prevents the label from being cleared when we programmatically set the event data
        eventChangeTimeout = setTimeout(() => {
          // Only clear if the data still doesn't match a template or saved event
          if (selectedEventLabel.value) {
            // Try to determine if this is a user edit or a programmatic change
            try {
              const currentEventData = JSON.parse(newValue);
              
              // Check if we're still showing a template
              if (selectedEventLabel.value.includes('API Gateway') || 
                  selectedEventLabel.value.includes('S3') ||
                  selectedEventLabel.value.includes('DynamoDB') ||
                  selectedEventLabel.value.includes('CloudFront') ||
                  selectedEventLabel.value.includes('SNS') ||
                  selectedEventLabel.value.includes('SQS') ||
                  selectedEventLabel.value.includes('EventBridge')) {
                
                // Find the template
                const template = AWS_EVENT_TEMPLATES.find(t => t.name === selectedEventLabel.value);
                if (template && JSON.stringify(template.data) !== JSON.stringify(currentEventData)) {
                  selectedEventLabel.value = null;
                }
              } else {
                // For saved events, we don't have an easy way to compare, so just clear the label
                // after user edits (this timeout provides a slight buffer)
                selectedEventLabel.value = null;
              }
            } catch (e) {
              // Invalid JSON, just clear the label
              selectedEventLabel.value = null;
            }
          }
        }, 500); // 500ms delay
      }
    }, { deep: true });
    
    // Computed
    const currentHandler = computed(() => handlersStore.activeHandler);
    const isExecuting = computed(() => executionStore.isExecuting);
    const events = computed(() => eventsStore.events);
    const eventsByCategory = computed(() => eventsStore.eventsByCategory);
    const isLoadingEvents = computed(() => eventsStore.isLoading);
    
    const currentLogs = computed(() => {
      // First check for current session ID
      if (currentSessionId.value) {
        const logs = executionStore.getSessionLogs(currentSessionId.value);
        if (logs && logs.length > 0) {
          return logs;
        }
      }
      
      // If not set or empty, check current active session in execution store
      const globalSessionId = executionStore.currentSessionId;
      if (globalSessionId && globalSessionId !== currentSessionId.value) {
        currentSessionId.value = globalSessionId;
        return executionStore.getSessionLogs(globalSessionId);
      }
      
      return [];
    });
    
    const currentResult = computed(() => {
      // First check for current session ID
      if (currentSessionId.value) {
        const result = executionStore.getSessionResult(currentSessionId.value);
        if (result) {
          return result;
        }
      }
      
      // If not set, check current active session in execution store
      const globalSessionId = executionStore.currentSessionId;
      if (globalSessionId && globalSessionId !== currentSessionId.value) {
        currentSessionId.value = globalSessionId;
        return executionStore.getSessionResult(globalSessionId);
      }
      
      return null;
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
      if (newLogs.length > 0 && !currentResult.value && currentSessionId.value) {
        const errorLogs = newLogs.filter(log => log.type === 'error');
        
        if (errorLogs.length > 0) {
          const errorMessages = errorLogs.map(log => log.message).join('\n');
          
          if (!executionStore.getSessionResult(currentSessionId.value)) {
            executionStore.setErrorResult(
              currentSessionId.value, 
              { message: 'Fatal error', details: errorMessages },
              Date.now() - errorLogs[0].timestamp
            );
          }
        }
      }
    }, { deep: true });
    
    // Watch for changes in execution store session ID
    watch(() => executionStore.currentSessionId, (newSessionId) => {
      if (newSessionId && newSessionId !== currentSessionId.value) {
        currentSessionId.value = newSessionId;
      }
    });
    
    // Watch for changes in execution store logs
    watch(() => {
      if (executionStore.currentSessionId) {
        return executionStore.getSessionLogs(executionStore.currentSessionId);
      }
      return [];
    }, (newLogs) => {
      if (newLogs && newLogs.length > 0 && executionStore.currentSessionId) {
        // Make sure our current session matches the execution store
        currentSessionId.value = executionStore.currentSessionId;
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
        
        // Make sure the execution store socket is connected
        if (!executionStore.socketConnected) {
          executionStore.connectSocket();
          
          // Give it a moment to connect
          setTimeout(() => {
            // Execute the handler
            const sessionId = executionStore.runHandler(
              currentHandler.value.path,
              currentHandler.value.method,
              parsedEvent
            );
            
            if (sessionId) {
              currentSessionId.value = sessionId;
            }
          }, 300);
        } else {
          // Execute the handler
          const sessionId = executionStore.runHandler(
            currentHandler.value.path,
            currentHandler.value.method,
            parsedEvent
          );
          
          if (sessionId) {
            currentSessionId.value = sessionId;
          }
        }
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
      selectedEventLabel.value = event.name;
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
    
    // Format the result for display
    const formatResultOutput = (result) => {
      try {
        if (!result) return '{}';

        // Handle based on view mode
        if (resultViewMode.value === 'string') {
          // String view - show the raw string without extra escaping
          if (result.error) {
            // If it's an error object, format normally
            let errorObj = result.error;
            if (typeof errorObj === 'string') {
              errorObj = { message: errorObj };
            }
            
            // If it has details, add them
            if (errorObj.details) {
              errorObj.details = errorObj.details.split('\n');
            }
            
            return JSON.stringify(errorObj, null, 2);
          } else {
            // For success, show the raw string output
            const resultData = result.result || {};
            
            // If result contains a body, use it directly without transformation
            // This ensures we show exactly what the API returns
            return JSON.stringify(resultData, null, 2);
          }
        } else {
          // JSON view - parse and format as JSON
          if (result.error) {
            // If it's an error object, format for better visualization
            let errorObj = result.error;
            if (typeof errorObj === 'string') {
              errorObj = { message: errorObj };
            }
            
            // If it has details, add them
            if (errorObj.details) {
              errorObj.details = errorObj.details.split('\n');
            }
            
            return JSON.stringify(errorObj, null, 2);
          } else {
            // If it's a successful result, try to parse the body if it's a string that contains JSON
            const resultData = result.result || {};
            
            // If body exists and is a string that might be JSON
            if (resultData.body && typeof resultData.body === 'string' && 
                (resultData.body.startsWith('{') || resultData.body.startsWith('['))) {
              try {
                // Create a copy to avoid modifying the original
                const formattedResult = { ...resultData };
                // Parse the body if it's valid JSON
                formattedResult.body = JSON.parse(resultData.body);
                return JSON.stringify(formattedResult, null, 2);
              } catch {
                // If parsing fails, return as is
                return JSON.stringify(resultData, null, 2);
              }
            } else {
              // Regular JSON formatting
              return JSON.stringify(resultData, null, 2);
            }
          }
        }
      } catch (e) {
        return JSON.stringify({ error: "Error formatting result" }, null, 2);
      }
    };
    
    // Format duration to display in seconds
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
      
      const parts = path.split(/[\/\\]/);
      
      if (parts.length > 2) {
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`; 
      }
      
      return parts[parts.length - 1];
    };
    
    const applyAWSTemplate = (template) => {
      eventData.value = JSON.stringify(template.data, null, 2);
      selectedEventLabel.value = template.name;
    };
    
    const togglePanelMenu = (event) => {
      event.stopPropagation();
      showPanelMenu.value = !showPanelMenu.value;
      // Close any open dropdowns when toggling panel menu
      if (showPanelMenu.value && activeDropdown.value) {
        activeDropdown.value = null;
      }
    };
    
    const closePanelMenu = () => {
      showPanelMenu.value = false;
    };
    
    // Handle opening a dropdown component
    const handleDropdownOpen = (name) => {
      activeDropdown.value = name;
    };
    
    // Handle closing a dropdown component
    const handleDropdownClose = () => {
      activeDropdown.value = null;
    };
    
    return {
      // Refs
      eventEditor,
      terminal,
      eventData,
      currentSessionId,
      showSaveEventModal,
      selectedEventLabel,
      forceJsonFormat,
      resultViewMode,
      
      // UI State
      sidebarCollapsed,
      isDarkMode,
      showPanelMenu,
      showOutputPanel,
      showResultPanel,
      activeDropdown,
      
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
      applyAWSTemplate,
      togglePanelMenu,
      closePanelMenu,
      handleDropdownOpen,
      handleDropdownClose
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

/* Panel menu dropdown styles */
.absolute {
  @apply transition-opacity duration-150;
}

/* Eye button styles */
.dot {
  @apply transition-transform duration-200 ease-in-out;
}

/* Add smooth transitions to panel visibility changes */
.h-full {
  @apply transition-all duration-200 ease-in-out;
}

/* Disabled button styles */
button:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style> 