import { defineStore } from 'pinia'
import axios from 'axios'

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
        const relativePath = handler.path
        const pathParts = relativePath.split('/').filter(Boolean)
        
        // Group by top-level directory
        const topDir = pathParts[0] || 'Other'
        
        if (!grouped[topDir]) {
          grouped[topDir] = []
        }
        
        handler.methods.forEach(method => {
          grouped[topDir].push({
            name: `${relativePath} -> ${method}`,
            path: handler.path,
            method,
            directory: topDir
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
      this.activeHandler = { path, method }
    }
  }
}) 