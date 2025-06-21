<template>
  <div class="dropdown-container">
    <div class="relative">
      <button 
        @click="toggleDropdown" 
        type="button"
        ref="dropdownButton"
        class="inline-flex items-center gap-x-1 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>Saved Events</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <div 
        v-if="isActive" 
        ref="dropdownMenu"
        class="fixed mt-1 w-72 rounded-md shadow-lg bg-white dark:bg-dark-200 max-h-96 overflow-y-auto border border-gray-200 dark:border-dark-border"
        :style="dropdownPosition"
      >
        <div class="rounded-md py-1">
          <div class="py-1 px-2">
            <input
              v-model="searchQuery"
              type="text"
              class="w-full px-2 py-1 text-sm bg-gray-100 dark:bg-dark-300 border border-gray-200 dark:border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search saved events..."
            />
          </div>
          
          <div class="mt-1">
            <div v-if="isLoading" class="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
              Loading events...
            </div>
            
            <div v-else-if="filteredEvents.length === 0 && !searchQuery" class="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
              No saved events found
            </div>
            
            <div v-else-if="filteredEvents.length === 0 && searchQuery" class="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
              No events match your search
            </div>
            
            <template v-else v-for="(eventList, category) in groupedEvents" :key="category">
              <div class="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-dark-300 truncate">
                {{ category }}
              </div>
              
              <div
                v-for="event in eventList"
                :key="event.name"
                class="event-item group w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors flex items-center"
              >
                <button
                  @click="selectEvent(event)"
                  class="w-full text-left flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  
                  <div class="flex-1 min-w-0 text-left">
                    <div class="truncate">{{ event.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ formatDate(event.timestamp) }}
                    </div>
                  </div>
                </button>
                
                <button
                  @click.stop="confirmDeleteEvent(event)"
                  class="delete-button opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 shrink-0"
                  title="Delete event"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal for replace confirmation -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center p-4">
      <div class="bg-white dark:bg-dark-100 rounded-lg shadow-xl max-w-md w-full p-4">
        <h3 class="text-lg font-medium mb-2 truncate">Replace Event Data?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          This will replace your current event data with the selected saved event. Are you sure you want to continue?
        </p>
        <div class="flex justify-end space-x-2">
          <button 
            @click="showConfirmModal = false" 
            class="px-4 py-2 text-sm bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors rounded"
          >
            Cancel
          </button>
          <button 
            @click="confirmEventSelection" 
            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 transition-colors rounded text-white"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal for delete confirmation -->
    <div v-if="showDeleteConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center p-4">
      <div class="bg-white dark:bg-dark-100 rounded-lg shadow-xl max-w-md w-full p-4">
        <h3 class="text-lg font-medium mb-2 truncate text-red-600 dark:text-red-500">Delete Event</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to delete the event "{{ eventToDelete?.name }}"? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-2">
          <button 
            @click="cancelDeleteEvent" 
            class="px-4 py-2 text-sm bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors rounded"
          >
            Cancel
          </button>
          <button 
            @click="deleteEvent" 
            class="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 transition-colors rounded text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useEventsStore } from '../stores/events';

export default defineComponent({
  name: 'SavedEventSelector',
  
  props: {
    activeDropdown: {
      type: String,
      default: null
    },
    currentEventData: {
      type: Object,
      default: null
    }
  },
  
  emits: ['select-event', 'dropdown-opened', 'dropdown-closed'],
  
  setup(props, { emit }) {
    const DROPDOWN_NAME = 'saved-events';
    const eventsStore = useEventsStore();
    
    const searchQuery = ref('');
    const showConfirmModal = ref(false);
    const showDeleteConfirmModal = ref(false);
    const selectedEvent = ref(null);
    const eventToDelete = ref(null);
    const dropdownButton = ref(null);
    const dropdownMenu = ref(null);
    const dropdownPosition = ref({});
    
    // Computed to check if this dropdown is active
    const isActive = computed(() => props.activeDropdown === DROPDOWN_NAME);
    
    // Filter events based on search query
    const filteredEvents = computed(() => {
      if (!searchQuery.value) {
        return eventsStore.events;
      }
      
      const query = searchQuery.value.toLowerCase();
      return eventsStore.events.filter(event => 
        event.name.toLowerCase().includes(query) || 
        event.category.toLowerCase().includes(query)
      );
    });
    
    // Group events by category for display
    const groupedEvents = computed(() => {
      const result = {};
      
      filteredEvents.value.forEach(event => {
        if (!result[event.category]) {
          result[event.category] = [];
        }
        result[event.category].push(event);
      });
      
      return result;
    });
    
    // Handle clicks outside the dropdown
    const handleClickOutside = (event) => {
      if (isActive.value &&
          dropdownButton.value && 
          dropdownMenu.value && 
          !dropdownButton.value.contains(event.target) && 
          !dropdownMenu.value.contains(event.target)) {
        emit('dropdown-closed');
      }
    };
    
    // Calculate and set dropdown position
    const updateDropdownPosition = () => {
      nextTick(() => {
        if (dropdownButton.value && dropdownMenu.value) {
          const buttonRect = dropdownButton.value.getBoundingClientRect();
          const menuWidth = dropdownMenu.value.offsetWidth;
          
          // Center the dropdown under the button
          const left = buttonRect.left + (buttonRect.width / 2) - (menuWidth / 2);
          
          // Ensure the dropdown doesn't go off-screen
          const adjustedLeft = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));
          
          dropdownPosition.value = {
            top: `${buttonRect.bottom + 5}px`,
            left: `${adjustedLeft}px`
          };
        }
      });
    };
    
    // Watch for window resize events to reposition dropdown
    const handleResize = () => {
      if (isActive.value) {
        updateDropdownPosition();
      }
    };
    
    // Toggle dropdown
    const toggleDropdown = () => {
      if (isActive.value) {
        emit('dropdown-closed');
      } else {
        emit('dropdown-opened', DROPDOWN_NAME);
        searchQuery.value = '';
        // Fetch events when opening dropdown
        eventsStore.fetchEvents();
        // Position the dropdown
        updateDropdownPosition();
      }
    };
    
    // Watch for active dropdown changes
    watch(() => props.activeDropdown, (newVal) => {
      if (newVal !== DROPDOWN_NAME) {
        // Reset search when dropdown is closed
        searchQuery.value = '';
      } else {
        // Update position when dropdown becomes active
        updateDropdownPosition();
      }
    });
    
    // Add resize and click listeners when component is mounted
    onMounted(() => {
      window.addEventListener('resize', handleResize);
      document.addEventListener('mousedown', handleClickOutside);
    });
    
    // Clean up listeners when component is unmounted
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    });
    
    // Handle event selection
    const selectEvent = (event) => {
      selectedEvent.value = event;
      
      // Get current event data from parent component
      const currentEventData = JSON.stringify(props.currentEventData || {});
      const isEmptyEvent = currentEventData === '{}' || currentEventData === '';
      
      if (isEmptyEvent) {
        // If the current event is empty, directly emit the selection without confirmation
        emit('select-event', selectedEvent.value);
        selectedEvent.value = null;
      } else {
        // Otherwise, show confirmation modal
        showConfirmModal.value = true;
      }
      
      emit('dropdown-closed');
    };
    
    // Confirm event selection and emit event
    const confirmEventSelection = () => {
      if (selectedEvent.value) {
        emit('select-event', selectedEvent.value);
        showConfirmModal.value = false;
        selectedEvent.value = null;
      }
    };
    
    // Format date for display
    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString();
    };
    
    // Confirm delete event
    const confirmDeleteEvent = (event) => {
      eventToDelete.value = event;
      showDeleteConfirmModal.value = true;
    };
    
    // Cancel delete event
    const cancelDeleteEvent = () => {
      eventToDelete.value = null;
      showDeleteConfirmModal.value = false;
    };
    
    // Delete event
    const deleteEvent = async () => {
      if (eventToDelete.value) {
        try {
          const success = await eventsStore.deleteEvent(
            eventToDelete.value.name,
            eventToDelete.value.category
          );
          
          if (success) {
            // Refresh events list
            await eventsStore.fetchEvents();
            showDeleteConfirmModal.value = false;
            eventToDelete.value = null;
          } else {
            alert('Failed to delete event');
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          alert(`Error deleting event: ${error.message}`);
        }
      }
    };
    
    return {
      isActive,
      searchQuery,
      filteredEvents,
      groupedEvents,
      showConfirmModal,
      showDeleteConfirmModal,
      eventToDelete,
      isLoading: computed(() => eventsStore.isLoading),
      toggleDropdown,
      selectEvent,
      confirmEventSelection,
      confirmDeleteEvent,
      cancelDeleteEvent,
      deleteEvent,
      formatDate,
      dropdownButton,
      dropdownMenu,
      dropdownPosition,
      updateDropdownPosition
    };
  }
});
</script>

<style scoped>
/* Ensure dropdown appears above other content */
.dropdown-container {
  position: relative;
}

/* Ensure the dropdown list itself has a very high z-index */
.fixed {
  z-index: 9999 !important;
}

/* Styles for the event item and delete button */
.event-item {
  position: relative;
}

.event-item button:first-child {
  text-align: left;
  justify-content: flex-start;
}

.delete-button {
  opacity: 0;
  transition: opacity 0.2s ease-in-out, background-color 0.2s ease-in-out;
  flex-shrink: 0;
}

.event-item:hover .delete-button {
  opacity: 1;
}
</style> 