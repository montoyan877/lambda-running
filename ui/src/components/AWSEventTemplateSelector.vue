<template>
  <div class="dropdown-container">
    <div class="relative">
      <button 
        @click="toggleDropdown" 
        type="button"
        ref="dropdownButton"
        class="inline-flex items-center gap-x-1 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.5 16a3.5 3.5 0 01-.59-6.95 5.002 5.002 0 019.804-1.05A4.5 4.5 0 0113 16H5.5z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M13 16h2.5a3.5 3.5 0 10-.732-6.935A5.002 5.002 0 0014.5 16H13z" clip-rule="evenodd" />
        </svg>
        <span>AWS Templates</span>
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
              placeholder="Search templates..."
            />
          </div>
          
          <div class="mt-1">
            <template v-for="template in filteredTemplates" :key="template.name">
              <button
                @click="selectTemplate(template)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors flex items-center gap-2"
              >
                <!-- Template Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" :class="template.icon?.color || 'text-orange-400'" viewBox="0 0 20 20" fill="currentColor">
                  <path v-if="template.icon?.path" fill-rule="evenodd" :d="template.icon.path" clip-rule="evenodd" />
                  <template v-else-if="template.icon?.paths">
                    <path v-for="(path, index) in template.icon.paths" :key="index" :d="path" :fill-rule="index === 1 ? 'evenodd' : undefined" :clip-rule="index === 1 ? 'evenodd' : undefined" />
                  </template>
                  <!-- Default icon if no icon specified -->
                  <path v-if="!template.icon?.path && !template.icon?.paths" fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                </svg>
                
                <div class="flex-1 min-w-0">
                  <div class="truncate" :title="template.name">{{ template.name }}</div>
                </div>
              </button>
            </template>
            
            <div v-if="filteredTemplates.length === 0" class="px-3 py-2 text-sm text-gray-400">
              No templates found
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal for confirmation -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center p-4">
      <div class="bg-white dark:bg-dark-100 rounded-lg shadow-xl max-w-md w-full p-4">
        <h3 class="text-lg font-medium mb-2 truncate" :title="'Replace Event Data?'">Replace Event Data?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          This will replace your current event data with the selected template. Are you sure you want to continue?
        </p>
        <div class="flex justify-end space-x-2">
          <button 
            @click="showConfirmModal = false" 
            class="px-4 py-2 text-sm bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 transition-colors rounded"
          >
            Cancel
          </button>
          <button 
            @click="confirmTemplateSelection" 
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
import { AWS_EVENT_TEMPLATES } from '../utils/awsEventTemplates';

export default defineComponent({
  name: 'AWSEventTemplateSelector',
  
  props: {
    activeDropdown: {
      type: String,
      default: null
    }
  },
  
  emits: ['select-template', 'dropdown-opened', 'dropdown-closed'],
  
  setup(props, { emit }) {
    const DROPDOWN_NAME = 'aws-templates';
    const searchQuery = ref('');
    const showConfirmModal = ref(false);
    const selectedTemplate = ref(null);
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
    
    // Filter templates based on search query
    const filteredTemplates = computed(() => {
      if (!searchQuery.value) {
        return AWS_EVENT_TEMPLATES;
      }
      
      const query = searchQuery.value.toLowerCase();
      return AWS_EVENT_TEMPLATES.filter(template => 
        template.name.toLowerCase().includes(query) || 
        template.category.toLowerCase().includes(query)
      );
    });
    
    // Toggle dropdown
    const toggleDropdown = () => {
      if (isActive.value) {
        emit('dropdown-closed');
      } else {
        emit('dropdown-opened', DROPDOWN_NAME);
        searchQuery.value = '';
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
    
    // Handle template selection
    const selectTemplate = (template) => {
      selectedTemplate.value = template;
      showConfirmModal.value = true;
      emit('dropdown-closed');
    };
    
    // Confirm template selection and emit event
    const confirmTemplateSelection = () => {
      if (selectedTemplate.value) {
        emit('select-template', selectedTemplate.value);
        showConfirmModal.value = false;
        selectedTemplate.value = null;
      }
    };
    
    return {
      isActive,
      searchQuery,
      filteredTemplates,
      showConfirmModal,
      toggleDropdown,
      selectTemplate,
      confirmTemplateSelection,
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