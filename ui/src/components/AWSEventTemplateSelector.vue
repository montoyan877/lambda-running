<template>
  <div class="dropdown-container">
    <div class="relative">
      <button 
        @click="toggleDropdown" 
        type="button" 
        class="inline-flex items-center gap-x-1 text-xs px-2 py-1 rounded bg-dark-hover hover:bg-dark-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>AWS Templates</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <div 
        v-if="isOpen" 
        class="absolute z-50 mt-1 w-72 rounded-md shadow-lg bg-dark-200 max-h-96 overflow-y-auto border border-dark-border"
      >
        <div class="rounded-md py-1">
          <div class="py-1 px-2">
            <input
              v-model="searchQuery"
              type="text"
              class="w-full px-2 py-1 text-sm bg-dark-300 border border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search templates..."
            />
          </div>
          
          <div class="mt-1">
            <template v-for="template in filteredTemplates" :key="template.name">
              <button
                @click="selectTemplate(template)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-dark-hover transition-colors flex items-center gap-2"
              >
                <!-- Template Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="template.icon?.color || 'text-orange-400'" viewBox="0 0 20 20" fill="currentColor">
                  <path v-if="template.icon?.path" fill-rule="evenodd" :d="template.icon.path" clip-rule="evenodd" />
                  <template v-else-if="template.icon?.paths">
                    <path v-for="(path, index) in template.icon.paths" :key="index" :d="path" :fill-rule="index === 1 ? 'evenodd' : undefined" :clip-rule="index === 1 ? 'evenodd' : undefined" />
                  </template>
                  <!-- Default icon if no icon specified -->
                  <path v-if="!template.icon?.path && !template.icon?.paths" fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                </svg>
                
                <span>
                  {{ template.name }}
                </span>
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
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-dark-100 rounded-lg shadow-xl max-w-md w-full p-4">
        <h3 class="text-lg font-medium mb-2">Replace Event Data?</h3>
        <p class="text-sm dark:text-gray-300 mb-4">
          This will replace your current event data with the selected template. Are you sure you want to continue?
        </p>
        <div class="flex justify-end space-x-2">
          <button 
            @click="showConfirmModal = false" 
            class="px-4 py-2 text-sm bg-dark-hover hover:bg-dark-300 transition-colors rounded"
          >
            Cancel
          </button>
          <button 
            @click="confirmTemplateSelection" 
            class="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 transition-colors rounded text-white"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { AWS_EVENT_TEMPLATES } from '../utils/awsEventTemplates';

export default defineComponent({
  name: 'AWSEventTemplateSelector',
  
  emits: ['select-template'],
  
  setup(props, { emit }) {
    const isOpen = ref(false);
    const searchQuery = ref('');
    const showConfirmModal = ref(false);
    const selectedTemplate = ref(null);
    
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
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        searchQuery.value = '';
      }
    };
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (isOpen.value && !event.target.closest('.dropdown-container')) {
        isOpen.value = false;
      }
    };
    
    // Setup click outside handler
    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside);
    });
    
    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });
    
    // Handle template selection
    const selectTemplate = (template) => {
      selectedTemplate.value = template;
      showConfirmModal.value = true;
      isOpen.value = false;
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
      isOpen,
      searchQuery,
      filteredTemplates,
      showConfirmModal,
      toggleDropdown,
      selectTemplate,
      confirmTemplateSelection
    };
  }
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style> 