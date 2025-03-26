import { defineStore } from 'pinia';
import axios from 'axios';
import { notify } from '../components/Notification.vue';

export const useHandlerEventsStore = defineStore('handlerEvents', {
  state: () => ({
    lastEvents: {}, // { handlerId: eventData }
    favorites: {}, // { handlerId: { eventData, name } }
    executionHistory: {}, // { handlerId: [{ event, result, success, duration, timestamp }] }
    isLoading: false,
    error: null
  }),
  
  getters: {
    // Get the last event for a specific handler
    getLastEvent: (state) => (handlerId) => {
      return state.lastEvents[handlerId] || null;
    },
    
    // Get the favorite event for a specific handler
    getFavorite: (state) => (handlerId) => {
      return state.favorites[handlerId] || null;
    },
    
    // Check if a handler has a favorite event
    hasFavorite: (state) => (handlerId) => {
      return !!state.favorites[handlerId];
    },
    
    // Get execution history for a specific handler
    getExecutionHistory: (state) => (handlerId) => {
      return state.executionHistory[handlerId] || [];
    }
  },
  
  actions: {
    // Save the last event executed for a handler
    saveLastEvent(handlerId, eventData) {
      this.lastEvents[handlerId] = eventData;
      this.saveToLocalStorage();
    },
    
    // Add execution to history
    addExecutionToHistory(handlerId, event, result, success, duration) {
      if (!this.executionHistory[handlerId]) {
        this.executionHistory[handlerId] = [];
      }
      
      // Limit history to 10 items per handler
      if (this.executionHistory[handlerId].length >= 10) {
        this.executionHistory[handlerId].pop(); // Remove oldest
      }
      
      // Add execution at the beginning (newest first)
      this.executionHistory[handlerId].unshift({
        event,
        result,
        success,
        duration,
        timestamp: Date.now()
      });
      
      this.saveToLocalStorage();
    },
    
    // Set an event as favorite for a handler
    setFavorite(handlerId, eventData, name = 'Favorite') {
      this.favorites[handlerId] = { eventData, name };
      this.saveToLocalStorage();
      notify.success(`Set "${name}" as favorite event for this handler`);
    },
    
    // Remove a favorite event for a handler
    removeFavorite(handlerId) {
      if (this.favorites[handlerId]) {
        delete this.favorites[handlerId];
        this.saveToLocalStorage();
        notify.info('Removed favorite event for this handler');
      }
    },
    
    // Clear all last events (historical)
    clearHistory() {
      this.lastEvents = {};
      this.executionHistory = {};
      this.saveToLocalStorage();
      notify.info('Event history cleared');
    },
    
    // Save state to localStorage
    saveToLocalStorage() {
      try {
        localStorage.setItem('handlerLastEvents', JSON.stringify(this.lastEvents));
        localStorage.setItem('handlerFavorites', JSON.stringify(this.favorites));
        localStorage.setItem('handlerExecutionHistory', JSON.stringify(this.executionHistory));
      } catch (error) {
        console.error('Failed to save handler events to localStorage:', error);
      }
    },
    
    // Load state from localStorage
    loadFromLocalStorage() {
      try {
        const lastEvents = localStorage.getItem('handlerLastEvents');
        const favorites = localStorage.getItem('handlerFavorites');
        const executionHistory = localStorage.getItem('handlerExecutionHistory');
        
        if (lastEvents) {
          this.lastEvents = JSON.parse(lastEvents);
        }
        
        if (favorites) {
          this.favorites = JSON.parse(favorites);
        }
        
        if (executionHistory) {
          this.executionHistory = JSON.parse(executionHistory);
        }
      } catch (error) {
        console.error('Failed to load handler events from localStorage:', error);
      }
    },
    
    // Initialize store
    initialize() {
      this.loadFromLocalStorage();
    }
  }
}); 