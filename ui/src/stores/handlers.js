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
          
          grouped[parentDir].push({
            name: displayName,
            path: handler.path,
            relativePath: relativePath,
            method,
            directory: parentDir
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
        relativePath: this.getRelativePath(path)
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
    }
  }
}) 