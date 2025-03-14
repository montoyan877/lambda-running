import { defineStore } from 'pinia'
import axios from 'axios'
import { useHandlerEventsStore } from './handlerEvents'
import { useExecutionStore } from './execution'
import { notify } from '../components/Notification.vue'

export const useHandlersStore = defineStore('handlers', {
  state: () => ({
    handlers: [],
    isLoading: false,
    error: null,
    activeHandler: null
  }),
  
  getters: {
    getHandlerById: (state) => (path, method) => {
      return state.handlers.find(handler => 
        handler.path === path && 
        handler.methods.includes(method)
      )
    },
    
    groupedHandlers: (state) => {
      const grouped = {}
      
      state.handlers.forEach(handler => {
        // Extraer solo el nombre del archivo y el directorio inmediato
        const parts = handler.path.split(/[\/\\]/)
        const fileName = parts[parts.length - 1]
        
        // Use the immediate parent directory as the group
        const parentDir = parts.length > 1 ? parts[parts.length - 2] : 'Other'
        
        if (!grouped[parentDir]) {
          grouped[parentDir] = []
        }
        
        handler.methods.forEach(method => {
          // Create a more user-friendly display name
          const displayName = `${fileName} -> ${method}`
          
          // Create a more user-friendly relative path for display
          const relativePath = parts.length > 2 
            ? `${parentDir}/${fileName}`
            : fileName
          
          // Create a unique ID for this handler
          const handlerId = `${handler.path}:${method}`
          
          grouped[parentDir].push({
            name: displayName,
            path: handler.path,
            relativePath: relativePath,
            method,
            directory: parentDir,
            id: handlerId
          })
        })
      })
      
      // Sort handlers within each group
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name))
      })
      
      return grouped
    }
  },
  
  actions: {
    async fetchHandlers() {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/handlers')
        this.handlers = response.data.handlers
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        console.error('Error fetching handlers:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    setActiveHandler(path, method) {
      this.activeHandler = { 
        path, 
        method,
        // Add relative path calculation
        relativePath: this.getRelativePath(path),
        // Add unique ID for this handler
        id: `${path}:${method}`
      }
    },
    
    getRelativePath(path) {
      if (!path) return '';
      
      // Split path and get relevant parts
      const parts = path.split(/[\/\\]/);
      
      // If there are more than 2 parts, show 'parent/file.js'
      if (parts.length > 2) {
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`; 
      }
      
      // If there are only 1 or 2 parts, just show the filename
      return parts[parts.length - 1];
    },
    
    // Run a handler from the sidebar
    runHandlerFromSidebar(handler) {
      // This will be called after navigation has happened
      // We need to determine what event data to use
      
      // 1. First check if there's an active event on the screen
      // 2. If not, check if there's a favorite event for this handler
      // 3. If not, use an empty event
      
      // We'll use a timeout to ensure the navigation has completed
      setTimeout(() => {
        const handlerEventsStore = useHandlerEventsStore()
        const executionStore = useExecutionStore()
        const handlerId = `${handler.path}:${handler.method}`
        
        // Set as active handler if not already active
        if (!this.activeHandler || 
            this.activeHandler.path !== handler.path || 
            this.activeHandler.method !== handler.method) {
          this.setActiveHandler(handler.path, handler.method)
        }
        
        // Check if execution is already in progress
        if (executionStore.isExecuting) {
          notify.warning('Handler execution already in progress')
          return
        }
        
        // Get the event data to use
        // This would be set by the component to the current event data on screen
        let eventData = {}
        
        // Check if there's a favorite event for this handler
        const favorite = handlerEventsStore.getFavorite(handlerId)
        if (favorite) {
          eventData = favorite.eventData
          notify.info(`Using favorite event "${favorite.name}"`)
        } else {
          // Check if there's a last event for this handler
          const lastEvent = handlerEventsStore.getLastEvent(handlerId)
          if (lastEvent) {
            eventData = lastEvent
            notify.info('Using last executed event')
          } else {
            notify.info('Using empty event')
          }
        }
        
        // Run the handler
        try {
          const sessionId = executionStore.runHandler(
            handler.path, 
            handler.method, 
            eventData
          )
          
          if (sessionId) {
            // Successfully started execution
            notify.success(`Running handler: ${handler.relativePath} -> ${handler.method}`)
          }
        } catch (error) {
          notify.error(`Failed to run handler: ${error.message}`)
        }
      }, 100) // Short delay to ensure navigation has completed
    },
    
    // Stop the execution of a running handler
    stopExecution() {
      const executionStore = useExecutionStore()
      
      if (!executionStore.isExecuting) {
        notify.warning('No handler execution in progress')
        return
      }
      
      executionStore.stopExecution()
      notify.info('Handler execution stopped')
    }
  }
}) 