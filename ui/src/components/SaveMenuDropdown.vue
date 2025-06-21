<template>
  <div class="dropdown-container">
    <div class="relative">
      <div class="inline-flex items-center">
        <button
          @click="handleSaveClick"
          type="button"
          class="inline-flex items-center text-xs px-2 py-1 rounded-l bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors"
          :disabled="!hasEventData || isExecuting"
          title="Save event"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21V13H7v8" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 3v4h4" />
          </svg>
        </button>
        <button
          @click="toggleDropdown"
          type="button"
          ref="dropdownButton"
          class="inline-flex items-center text-xs px-1 py-1 rounded-r border-l border-gray-300 dark:border-dark-border bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors"
          :disabled="!hasEventData || isExecuting"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div 
        v-if="isActive" 
        ref="dropdownMenu"
        class="fixed mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-dark-200 border border-gray-200 dark:border-dark-border"
        :style="dropdownPosition"
      >
        <div class="rounded-md py-1">
          <button 
            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-hover"
            @click="handleSaveAsClick"
          >
            Save As...
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

export default defineComponent({
  name: 'SaveMenuDropdown',
  
  props: {
    activeDropdown: {
      type: String,
      default: null
    },
    hasEventData: {
      type: Boolean,
      default: false
    },
    isExecuting: {
      type: Boolean,
      default: false
    },
    hasSelectedEvent: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['dropdown-opened', 'dropdown-closed', 'save-click', 'save-as-click'],
  
  setup(props, { emit }) {
    const DROPDOWN_NAME = 'save-menu';
    const dropdownButton = ref(null);
    const dropdownMenu = ref(null);
    const dropdownPosition = ref({});
    
    // Computed to check if this dropdown is active
    const isActive = computed(() => props.activeDropdown === DROPDOWN_NAME);
    
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
          
          // Position the dropdown at the right edge of the button
          const left = buttonRect.right - menuWidth;
          
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
        // Position the dropdown
        updateDropdownPosition();
      }
    };
    
    // Watch for active dropdown changes
    watch(() => props.activeDropdown, (newVal) => {
      if (newVal === DROPDOWN_NAME) {
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
    
    // Handle save click
    const handleSaveClick = () => {
      emit('save-click');
    };
    
    // Handle save as click
    const handleSaveAsClick = () => {
      emit('save-as-click');
      emit('dropdown-closed');
    };
    
    return {
      isActive,
      dropdownButton,
      dropdownMenu,
      dropdownPosition,
      toggleDropdown,
      updateDropdownPosition,
      handleSaveClick,
      handleSaveAsClick
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