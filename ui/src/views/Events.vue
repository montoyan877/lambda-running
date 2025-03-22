<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <header class="p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold">Saved Events</h1>
        
        <div class="flex space-x-2">
          <button class="btn btn-primary text-sm" @click="createNewEvent">
            New Event
          </button>
        </div>
      </div>
    </header>
    
    <!-- Main content -->
    <div class="flex-1 grid grid-cols-4 overflow-hidden">
      <!-- Events sidebar -->
      <div class="h-full border-r border-gray-200 dark:border-dark-border flex flex-col overflow-hidden">
        <!-- Search and filter -->
        <div class="p-4 border-b border-gray-200 dark:border-dark-border">
          <div class="relative rounded-md shadow-sm">
            <input 
              type="text" 
              v-model="searchQuery"
              class="input w-full pl-9" 
              placeholder="Search events" 
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div v-if="isLoading" class="p-8 text-center text-gray-400">
          Loading events...
        </div>
        
        <div v-else-if="filteredEvents.length === 0" class="p-4 text-center">
          <p class="text-gray-500 dark:text-gray-400">No events found</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or create a new event</p>
        </div>
        
        <div v-else>
          <div v-for="(eventList, category) in groupedEvents" :key="category" class="mb-4">
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-2">{{ category }}</h3>
            
            <div 
              v-for="event in eventList" 
              :key="`${event.category}-${event.name}`"
              :class="[
                'px-4 py-3 border-l-2 cursor-pointer transition-colors',
                activeEvent && activeEvent.name === event.name && activeEvent.category === event.category
                  ? 'bg-gray-100 dark:bg-dark-hover border-primary-500'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-dark-hover'
              ]"
              @click="selectEvent(event)"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium">{{ event.name }}</h4>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ formatDate(event.timestamp) }}
                  </div>
                </div>
                
                <button 
                  class="text-gray-500 hover:text-red-500"
                  @click.stop="confirmDelete(event)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Event Details -->
      <div class="w-2/3 flex flex-col">
        <div v-if="!activeEvent" class="flex-1 flex items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 class="text-xl font-medium mb-2">No Event Selected</h2>
            <p>Select an event from the list, or create a new one</p>
          </div>
        </div>
        
        <template v-else>
          <div class="p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100 flex justify-between items-center">
            <div>
              <h2 class="font-medium">
                {{ activeEvent.name }}
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({{ activeEvent.category }})
                </span>
              </h2>
              <div class="text-xs text-gray-500 mt-1">
                Created: {{ formatDate(activeEvent.timestamp) }}
              </div>
            </div>
            
            <div class="flex space-x-2">
              <button 
                class="btn btn-outline text-xs"
                @click="saveChanges"
                :disabled="!hasChanges"
              >
                Save Changes
              </button>
              
              <button 
                class="btn btn-outline text-xs"
                @click="formatJson"
              >
                Format JSON
              </button>
            </div>
          </div>
          
          <div class="flex-1 overflow-hidden">
            <CodeEditor
              ref="editor"
              v-model="editedData"
              language="json"
              :theme="isDarkMode ? 'vs-dark' : 'vs'"
              :key="`event-editor-${isDarkMode}`"
              :options="{
                formatOnPaste: true,
                formatOnType: true
              }"
              @save="saveChanges"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useEventsStore } from '../stores/events';
import CodeEditor from '../components/CodeEditor.vue';

export default defineComponent({
  name: 'EventsView',
  
  components: {
    CodeEditor
  },
  
  setup() {
    const eventsStore = useEventsStore();
    const editor = ref(null);
    const isDarkMode = ref(document.documentElement.classList.contains('dark'));
    
    // State
    const searchQuery = ref('');
    const editedData = ref('');
    const originalData = ref('');
    
    // Load events when component mounts
    onMounted(() => {
      eventsStore.fetchEvents();
      
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
    
    // Computed properties
    const isLoading = computed(() => eventsStore.isLoading);
    const events = computed(() => eventsStore.events);
    const activeEvent = computed(() => eventsStore.activeEvent);
    
    // Filter events based on search query
    const filteredEvents = computed(() => {
      if (!searchQuery.value) return events.value;
      
      const query = searchQuery.value.toLowerCase();
      return events.value.filter(event => 
        event.name.toLowerCase().includes(query) || 
        event.category.toLowerCase().includes(query)
      );
    });
    
    // Group events by category
    const groupedEvents = computed(() => {
      const grouped = {};
      
      filteredEvents.value.forEach(event => {
        const category = event.category || 'default';
        
        if (!grouped[category]) {
          grouped[category] = [];
        }
        
        grouped[category].push(event);
      });
      
      // Sort events within each category
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name));
      });
      
      return grouped;
    });
    
    // Track if changes have been made
    const hasChanges = computed(() => {
      return editedData.value !== originalData.value;
    });
    
    // Watch for active event changes
    watch(() => activeEvent.value, (newEvent) => {
      if (newEvent) {
        const jsonData = JSON.stringify(newEvent.data, null, 2);
        editedData.value = jsonData;
        originalData.value = jsonData;
      } else {
        editedData.value = '';
        originalData.value = '';
      }
    });
    
    // Methods
    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString();
    };
    
    const selectEvent = (event) => {
      eventsStore.setActiveEvent(event);
    };
    
    const formatJson = () => {
      if (editor.value) {
        editor.value.format();
      }
    };
    
    const saveChanges = async () => {
      if (!activeEvent.value || !hasChanges.value) return;
      
      try {
        const parsedData = JSON.parse(editedData.value);
        
        const success = await eventsStore.saveEvent(
          activeEvent.value.name,
          parsedData,
          activeEvent.value.category
        );
        
        if (success) {
          originalData.value = editedData.value;
          alert('Event saved successfully');
        } else {
          alert('Failed to save event');
        }
      } catch (error) {
        alert(`Invalid JSON: ${error.message}`);
      }
    };
    
    const createNewEvent = () => {
      const name = prompt('Enter a name for the new event:');
      if (!name) return;
      
      const category = prompt('Enter a category (optional):', 'default');
      
      try {
        eventsStore.saveEvent(name, {}, category || 'default');
        
        // Set the new event as active after a brief delay to allow the store to update
        setTimeout(() => {
          const newEvent = eventsStore.getEventByName(name, category || 'default');
          if (newEvent) {
            eventsStore.setActiveEvent(newEvent);
          }
        }, 100);
      } catch (error) {
        alert(`Failed to create event: ${error.message}`);
      }
    };
    
    const confirmDelete = async (event) => {
      if (confirm(`Are you sure you want to delete the event "${event.name}"?`)) {
        const success = await eventsStore.deleteEvent(event.name, event.category);
        
        if (success) {
          // If the deleted event was active, clear the active event
          if (activeEvent.value && activeEvent.value.name === event.name && activeEvent.value.category === event.category) {
            eventsStore.setActiveEvent(null);
          }
        } else {
          alert('Failed to delete event');
        }
      }
    };
    
    return {
      isLoading,
      events,
      activeEvent,
      filteredEvents,
      groupedEvents,
      searchQuery,
      editedData,
      hasChanges,
      editor,
      isDarkMode,
      
      // Methods
      formatDate,
      selectEvent,
      formatJson,
      saveChanges,
      createNewEvent,
      confirmDelete
    };
  }
});
</script> 