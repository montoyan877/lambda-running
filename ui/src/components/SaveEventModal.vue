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
        <label for="event-category" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Category</label>
        <div class="relative">
          <div class="flex">
            <select
              v-if="!isNewCategory"
              id="event-category"
              v-model="eventCategory"
              class="input pr-8 flex-grow"
              @change="handleCategoryChange"
            >
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
              <option value="__new__">+ Create new category</option>
            </select>
            <input 
              v-else
              type="text" 
              id="event-category-new" 
              v-model="newCategoryName" 
              class="input flex-grow"
              placeholder="Enter new category name"
              @keydown.enter="handleSave"
              ref="newCategoryInput"
            />
            <button 
              v-if="isNewCategory"
              class="ml-2 px-2 py-1 bg-gray-200 dark:bg-dark-hover hover:bg-gray-300 dark:hover:bg-dark-300 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              @click="cancelNewCategory"
              title="Cancel new category"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
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
import { defineComponent, ref, watch, computed, nextTick } from 'vue';
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
    const newCategoryName = ref('');
    const isNewCategory = ref(false);
    const showSaveAsMenu = ref(false);
    const newCategoryInput = ref(null);
    
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
        
        // Reset new category state
        isNewCategory.value = false;
        newCategoryName.value = '';
        
        // Always hide the save as menu when opening the modal
        showSaveAsMenu.value = false;
      }
    });
    
    // La función handleSave se define más abajo
    
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
      if (isNewCategory.value) {
        // Keep the new category name if we're creating one
        // (don't change anything)
      } else {
        eventCategory.value = props.currentEventCategory || 'default';
      }
      
      // Hide the menu
      showSaveAsMenu.value = false;
    };
    
    // Ya no necesitamos el manejador de clicks fuera del menú
    // porque estamos usando la directiva v-click-outside
    
    // Obtener categorías disponibles
    const availableCategories = computed(() => {
      const categories = Object.keys(eventsStore.eventsByCategory);
      if (!categories.includes('default')) {
        categories.unshift('default');
      }
      return categories.sort();
    });
    
    // Manejar cambio de categoría
    const handleCategoryChange = () => {
      if (eventCategory.value === '__new__') {
        isNewCategory.value = true;
        newCategoryName.value = '';
        // Enfocar el input de nueva categoría en el siguiente ciclo de renderizado
        nextTick(() => {
          if (newCategoryInput.value) {
            newCategoryInput.value.focus();
          }
        });
      }
    };
    
    // Cancelar la creación de nueva categoría
    const cancelNewCategory = () => {
      isNewCategory.value = false;
      eventCategory.value = 'default';
    };
    
    // Definir la función handleSave
    const handleSave = () => {
      // Verificar si el nombre del evento está vacío
      if (!eventName.value.trim()) {
        alert('Event name is required');
        return;
      }
      
      // Manejar la categoría según el estado
      let finalCategory = eventCategory.value;
      
      // Si estamos creando una nueva categoría
      if (isNewCategory.value) {
        if (!newCategoryName.value.trim()) {
          alert('Category name is required');
          return;
        }
        finalCategory = newCategoryName.value.trim();
      } else if (eventCategory.value === '__new__') {
        // Si seleccionó "Create new category" pero no activó el input
        alert('Please enter a name for the new category or select an existing one');
        return;
      }
      
      // Determinar si es una actualización o un nuevo evento
      const isUpdate = props.currentEventName && 
                      eventName.value === props.currentEventName &&
                      (!isNewCategory.value && finalCategory === props.currentEventCategory);
      
      // Emitir el evento de guardado
      emit('save', {
        name: eventName.value.trim(),
        category: finalCategory,
        isUpdate: isUpdate
      });
    };
    
    return {
      eventName,
      eventCategory,
      newCategoryName,
      isNewCategory,
      availableCategories,
      showSaveAsMenu,
      handleSave,
      handleCategoryChange,
      cancelNewCategory,
      toggleSaveAsMenu,
      saveAsNew,
      newCategoryInput
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

/* Estilo para el selector de categorías */
select.input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.25rem;
  padding-right: 2rem;
}
</style> 