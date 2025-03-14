<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Handler Statistics -->
      <div class="card">
        <h2 class="card-title">Handlers</h2>
        <div class="mt-4">
          <div class="text-4xl font-bold">{{ handlerCount }}</div>
          <div class="text-sm text-gray-400 mt-1">Functions available</div>
        </div>
        
        <div class="mt-6">
          <router-link to="/handlers" class="btn btn-secondary btn-sm w-full">
            Browse Handlers
          </router-link>
        </div>
      </div>
      
      <!-- Event Statistics -->
      <div class="card">
        <h2 class="card-title">Events</h2>
        <div class="mt-4">
          <div class="text-4xl font-bold">{{ eventCount }}</div>
          <div class="text-sm text-gray-400 mt-1">Saved events</div>
        </div>
        
        <div class="mt-6">
          <router-link to="/events" class="btn btn-secondary btn-sm w-full">
            Manage Events
          </router-link>
        </div>
      </div>
      
      <!-- Quick Start -->
      <div class="card">
        <h2 class="card-title">Quick Start</h2>
        <div class="mt-4 space-y-2">
          <button 
            v-if="recentHandler"
            class="btn btn-outline btn-sm w-full text-left"
            @click="goToHandler(recentHandler)"
          >
            {{ getHandlerName(recentHandler) }}
          </button>
          
          <div v-else class="text-gray-400 text-sm">
            No recent handlers
          </div>
        </div>
        
        <div class="mt-6">
          <button class="btn btn-primary btn-sm w-full" @click="selectRandomHandler">
            Test Random Handler
          </button>
        </div>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="mt-8">
      <h2 class="text-xl font-bold mb-4">Recent Activity</h2>
      
      <div class="card">
        <div v-if="!recentActivity.length" class="text-center py-8 text-gray-400">
          <p>No recent activity</p>
          <p class="text-sm mt-2">Start testing your handlers to see activity here</p>
        </div>
        
        <ul v-else class="divide-y divide-dark-300">
          <li v-for="activity in recentActivity" :key="activity.id" class="py-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.168 1.168a4 4 0 00-2.366.376l-.009-.01-3.964-3.964A1 1 0 017 4.414v3.758z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div class="ml-4 flex-1">
                <div class="flex justify-between">
                  <div>
                    <p class="font-medium">{{ activity.title }}</p>
                    <p class="text-sm text-gray-400">{{ activity.description }}</p>
                  </div>
                  
                  <div class="text-sm text-gray-400">
                    {{ formatDate(activity.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHandlersStore } from '../stores/handlers'
import { useEventsStore } from '../stores/events'

export default defineComponent({
  name: 'HomeView',
  
  setup() {
    const router = useRouter()
    const handlersStore = useHandlersStore()
    const eventsStore = useEventsStore()
    
    // Load data
    onMounted(() => {
      if (handlersStore.handlers.length === 0) {
        handlersStore.fetchHandlers()
      }
      
      if (eventsStore.events.length === 0) {
        eventsStore.fetchEvents()
      }
    })
    
    // Computed properties
    const handlerCount = computed(() => {
      return handlersStore.handlers.reduce((count, handler) => {
        return count + handler.methods.length
      }, 0)
    })
    
    const eventCount = computed(() => eventsStore.events.length)
    
    // Recent handler - would be dynamic in a real app
    const recentHandler = computed(() => {
      const grouped = handlersStore.groupedHandlers
      const dirs = Object.keys(grouped)
      
      if (dirs.length === 0) return null
      
      const handlers = grouped[dirs[0]]
      if (!handlers || handlers.length === 0) return null
      
      return handlers[0]
    })
    
    // Recent activity - would be dynamic in a real app
    const recentActivity = computed(() => {
      // Mock data for now
      return [
        {
          id: 1,
          title: 'Handler test complete',
          description: 'Successfully executed handler "example.js -> handler"',
          timestamp: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          id: 2,
          title: 'Event created',
          description: 'Created a new event "test-event" in category "default"',
          timestamp: new Date(Date.now() - 86400000) // 1 day ago
        }
      ]
    })
    
    // Methods
    const getHandlerName = (handler) => {
      if (!handler) return ''
      
      const pathParts = handler.path.split('/')
      return `${pathParts[pathParts.length - 1]} -> ${handler.method}`
    }
    
    const goToHandler = (handler) => {
      if (!handler) return
      
      router.push(`/handlers/${encodeURIComponent(handler.path)}/${handler.method}`)
    }
    
    const selectRandomHandler = () => {
      const grouped = handlersStore.groupedHandlers
      const dirs = Object.keys(grouped)
      
      if (dirs.length === 0) return
      
      // Get a random directory
      const randomDir = dirs[Math.floor(Math.random() * dirs.length)]
      const handlers = grouped[randomDir]
      
      if (!handlers || handlers.length === 0) return
      
      // Get a random handler
      const randomHandler = handlers[Math.floor(Math.random() * handlers.length)]
      goToHandler(randomHandler)
    }
    
    const formatDate = (date) => {
      if (!date) return ''
      
      // Simple relative time formatting
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) {
        return 'Just now'
      } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)} minutes ago`
      } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)} hours ago`
      } else {
        return date.toLocaleDateString()
      }
    }
    
    return {
      handlerCount,
      eventCount,
      recentHandler,
      recentActivity,
      getHandlerName,
      goToHandler,
      selectRandomHandler,
      formatDate
    }
  }
})
</script> 