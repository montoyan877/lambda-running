import { defineStore } from 'pinia'
import axios from 'axios'

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [],
    isLoading: false,
    error: null,
    activeEvent: null
  }),
  
  getters: {
    getEventByName: (state) => (name, category = 'default') => {
      return state.events.find(event => 
        event.name === name && 
        event.category === category
      )
    },
    
    eventsByCategory: (state) => {
      const grouped = {}
      
      state.events.forEach(event => {
        const category = event.category || 'default'
        
        if (!grouped[category]) {
          grouped[category] = []
        }
        
        grouped[category].push(event)
      })
      
      // Sort events within each category
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name))
      })
      
      return grouped
    }
  },
  
  actions: {
    async fetchEvents(category = null) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/events', {
          params: category ? { category } : {}
        })
        this.events = response.data.events
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        console.error('Error fetching events:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    async fetchEvent(name, category = 'default') {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/events/${name}`, {
          params: { category }
        })
        
        const event = response.data.event
        
        // Update the events list if this event isn't already there
        if (!this.getEventByName(name, category)) {
          this.events.push(event)
        }
        
        return event
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        console.error(`Error fetching event ${name}:`, error)
        return null
      } finally {
        this.isLoading = false
      }
    },
    
    async saveEvent(name, data, category = 'default') {
      this.isLoading = true
      this.error = null
      
      try {
        await axios.post('/api/events', {
          name,
          data,
          category
        })
        
        // Refresh the events list
        await this.fetchEvents()
        
        return true
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        console.error('Error saving event:', error)
        return false
      } finally {
        this.isLoading = false
      }
    },
    
    async deleteEvent(name, category = 'default') {
      this.isLoading = true
      this.error = null
      
      try {
        await axios.delete(`/api/events/${name}`, {
          params: { category }
        })
        
        // Remove from local state
        this.events = this.events.filter(event => 
          !(event.name === name && event.category === category)
        )
        
        return true
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        console.error('Error deleting event:', error)
        return false
      } finally {
        this.isLoading = false
      }
    },
    
    setActiveEvent(event) {
      this.activeEvent = event
    }
  }
}) 