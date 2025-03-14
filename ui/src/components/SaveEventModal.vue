<template>
  <Modal 
    :show="show" 
    title="Save Event" 
    confirmText="Save"
    @close="$emit('close')"
    @confirm="saveEvent"
  >
    <div class="space-y-4">
      <div class="form-group">
        <label for="event-name" class="block text-sm font-medium text-gray-300 mb-1">Event Name</label>
        <input 
          type="text" 
          id="event-name" 
          v-model="eventName" 
          class="input"
          placeholder="my-event"
          @keydown.enter="saveEvent"
        />
      </div>
      
      <div class="form-group">
        <label for="event-category" class="block text-sm font-medium text-gray-300 mb-1">Category (optional)</label>
        <input 
          type="text" 
          id="event-category" 
          v-model="eventCategory" 
          class="input"
          placeholder="default"
          @keydown.enter="saveEvent"
        />
      </div>
    </div>
  </Modal>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import Modal from './Modal.vue';

export default defineComponent({
  name: 'SaveEventModal',
  
  components: {
    Modal
  },
  
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['close', 'save'],
  
  setup(props, { emit }) {
    const eventName = ref('my-event');
    const eventCategory = ref('default');
    
    // Reset form when modal is shown
    watch(() => props.show, (newValue) => {
      if (newValue) {
        eventName.value = 'my-event';
        eventCategory.value = 'default';
      }
    });
    
    const saveEvent = () => {
      if (!eventName.value.trim()) {
        alert('Event name is required');
        return;
      }
      
      emit('save', {
        name: eventName.value.trim(),
        category: eventCategory.value.trim() || 'default'
      });
    };
    
    return {
      eventName,
      eventCategory,
      saveEvent
    };
  }
});
</script> 