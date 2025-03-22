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
              
              <button
                v-for="event in eventList"
                :key="event.name"
                @click="selectEvent(event)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                
                <div class="flex-1 min-w-0">
                  <div class="truncate">{{ event.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ formatDate(event.timestamp) }}
                  </div>
                </div>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal for confirmation -->
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
    }
  },
  
  emits: ['select-event', 'dropdown-opened', 'dropdown-closed'],
  
  setup(props, { emit }) {
    const DROPDOWN_NAME = 'saved-events';
    const eventsStore = useEventsStore();
    
    const searchQuery = ref('');
    const showConfirmModal = ref(false);
    const selectedEvent = ref(null);
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
    
    // Add resize listener when component is mounted
    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });
    
    // Clean up listener when component is unmounted
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
    });
    
    // Handle event selection
    const selectEvent = (event) => {
      selectedEvent.value = event;
      showConfirmModal.value = true;
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
    
    return {
      isActive,
      searchQuery,
      filteredEvents,
      groupedEvents,
      showConfirmModal,
      isLoading: computed(() => eventsStore.isLoading),
      toggleDropdown,
      selectEvent,
      confirmEventSelection,
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
</style> 