<template>
  <Modal 
    :show="show" 
    title="Save Event" 
    confirmText="Save"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <div class="space-y-4">
      <div class="form-group">
        <label for="event-name" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Event Name</label>
        <input 
          type="text" 
          id="event-name" 
          v-model="eventName" 
          class="input"
          placeholder="my-event"
          @keydown.enter="handleSave"
        />
      </div>
      
      <div class="form-group">
        <label for="event-category" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Category (optional)</label>
        <input 
          type="text" 
          id="event-category" 
          v-model="eventCategory" 
          class="input"
          placeholder="default"
          @keydown.enter="handleSave"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end items-center space-x-2">
        <button 
          class="btn btn-outline"
          @click="$emit('close')"
        >
          Cancel
        </button>
        
        <div class="relative">
          <button 
            class="btn btn-primary"
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import Modal from './Modal.vue';
import { useEventsStore } from '../stores/events';

export default defineComponent({
  name: 'SaveEventModal',
  
  components: {
    Modal
  },
  
  directives: {
    clickOutside: {
      mounted(el, binding) {
        el._clickOutside = (event) => {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value(event);
          }
        };
        document.addEventListener('click', el._clickOutside);
      },
      unmounted(el) {
        document.removeEventListener('click', el._clickOutside);
      }
    }
  },
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    currentEventName: {
      type: String,
      default: ''
    },
    currentEventCategory: {
      type: String,
      default: 'default'
    }
  },
  
  emits: ['close', 'save'],
  
  setup(props, { emit }) {
    const eventsStore = useEventsStore();
    const eventName = ref('my-event');
    const eventCategory = ref('default');
    const showSaveAsMenu = ref(false);
    
    // Reset form when modal is shown
    watch(() => props.show, (newValue) => {
      if (newValue) {
        if (props.currentEventName) {
          // If we have a current event, use its name for the form
          eventName.value = props.currentEventName;
          eventCategory.value = props.currentEventCategory || 'default';
        } else {
          // New event with default values
          eventName.value = 'my-event';
          eventCategory.value = 'default';
        }
        
        // Always hide the save as menu when opening the modal
        showSaveAsMenu.value = false;
      }
    });
    
    // Handle save button click
    const handleSave = () => {
      if (!eventName.value.trim()) {
        alert('Event name is required');
        return;
      }
      
      // If we have a current event and the name hasn't changed, update it
      const isUpdate = props.currentEventName && 
                      eventName.value === props.currentEventName &&
                      eventCategory.value === props.currentEventCategory;
      
      emit('save', {
        name: eventName.value.trim(),
        category: eventCategory.value.trim() || 'default',
        isUpdate: isUpdate
      });
    };
    
    // Toggle save as menu
    const toggleSaveAsMenu = () => {
      showSaveAsMenu.value = !showSaveAsMenu.value;
    };
    
    // Save as new event
    const saveAsNew = () => {
      // Generate a unique name based on the current one
      const baseName = props.currentEventName || 'event';
      const timestamp = new Date().getTime().toString().slice(-4);
      eventName.value = `${baseName}-${timestamp}`;
      
      // Keep the same category
      eventCategory.value = props.currentEventCategory || 'default';
      
      // Hide the menu
      showSaveAsMenu.value = false;
    };
    
    // Ya no necesitamos el manejador de clicks fuera del menú
    // porque estamos usando la directiva v-click-outside
    
    return {
      eventName,
      eventCategory,
      showSaveAsMenu,
      handleSave,
      toggleSaveAsMenu,
      saveAsNew,
    };
  }
});
</script>

<style scoped>
/* Botón de menú desplegable */
.btn-primary-light {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Estilo para el menú desplegable */
.absolute {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style> 