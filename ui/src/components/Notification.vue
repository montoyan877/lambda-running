<template>
  <Teleport to="body">
    <div class="notifications-container">
      <TransitionGroup name="notification">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification"
          :class="notification.type"
        >
          <div class="notification-content">
            <div 
              v-if="notification.type === 'success'" 
              class="notification-icon notification-icon-success"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div 
              v-else-if="notification.type === 'error'" 
              class="notification-icon notification-icon-error"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div 
              v-else
              class="notification-icon notification-icon-info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="notification-message">
              {{ notification.message }}
            </div>
            <button 
              class="notification-close" 
              @click="removeNotification(notification.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script>
import { defineComponent, ref, onUnmounted } from 'vue';

// Singleton pattern for notification management
let notificationInstance = null;
let notificationId = 0;

export default defineComponent({
  name: 'Notification',
  
  setup() {
    const notifications = ref([]);
    const timeouts = {};
    
    // Set this as the singleton instance
    notificationInstance = {
      add(notification) {
        const id = notificationId++;
        const notificationWithId = { ...notification, id };
        
        notifications.value.push(notificationWithId);
        
        // Auto-remove after timeout
        if (notification.timeout !== 0) {
          timeouts[id] = setTimeout(() => {
            removeNotification(id);
          }, notification.timeout || 5000);
        }
        
        return id;
      },
      remove(id) {
        removeNotification(id);
      },
      clear() {
        notifications.value = [];
        
        // Clear all timeouts
        Object.values(timeouts).forEach(timeout => {
          clearTimeout(timeout);
        });
      }
    };
    
    // Function to remove a notification
    const removeNotification = (id) => {
      notifications.value = notifications.value.filter(n => n.id !== id);
      
      // Clear the timeout if it exists
      if (timeouts[id]) {
        clearTimeout(timeouts[id]);
        delete timeouts[id];
      }
    };
    
    // Clean up on unmount
    onUnmounted(() => {
      // Clear all timeouts
      Object.values(timeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    });
    
    return {
      notifications,
      removeNotification
    };
  }
});

// Export methods to show notifications
export const notify = {
  success(message, timeout = 5000) {
    if (!notificationInstance) return;
    return notificationInstance.add({ type: 'success', message, timeout });
  },
  
  error(message, timeout = 5000) {
    if (!notificationInstance) return;
    return notificationInstance.add({ type: 'error', message, timeout });
  },
  
  info(message, timeout = 5000) {
    if (!notificationInstance) return;
    return notificationInstance.add({ type: 'info', message, timeout });
  }
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  max-width: 90vw;
}

.notification {
  background-color: var(--color-dark-100);
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  min-width: 20rem;
  max-width: 30rem;
  border-left: 4px solid;
}

.notification.success {
  border-left-color: #10b981;
}

.notification.error {
  border-left-color: #ef4444;
}

.notification.info {
  border-left-color: #3b82f6;
}

.notification-content {
  display: flex;
  align-items: flex-start;
}

.notification-icon {
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.notification-icon-success {
  color: #10b981;
}

.notification-icon-error {
  color: #ef4444;
}

.notification-icon-info {
  color: #3b82f6;
}

.notification-message {
  flex-grow: 1;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: white;
}

.notification-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s;
}

.notification-close:hover {
  color: white;
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 