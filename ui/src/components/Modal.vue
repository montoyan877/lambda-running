<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="closeOnClickOutside ? $emit('close') : null">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button 
            class="modal-close"
            @click="$emit('close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer">
            <button 
              class="btn btn-outline mr-2"
              @click="$emit('close')"
            >
              {{ cancelText }}
            </button>
            <button 
              class="btn btn-primary"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Modal',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Modal'
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    closeOnClickOutside: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['close', 'confirm'],
  
  setup() {
    return {};
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 30rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:root.dark .modal-container {
  background-color: var(--color-dark-100);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

:root.dark .modal-header {
  border-bottom: 1px solid var(--color-dark-border);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

:root.dark .modal-title {
  color: white;
}

.modal-close {
  color: #6b7280;
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: #111827;
}

:root.dark .modal-close {
  color: #9ca3af;
}

:root.dark .modal-close:hover {
  background-color: var(--color-dark-hover);
  color: white;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

:root.dark .modal-footer {
  border-top: 1px solid var(--color-dark-border);
}
</style> 