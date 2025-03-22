<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <aside 
      class="sidebar-container h-full bg-dark-100 border-r border-dark-border flex flex-col transition-all duration-300" 
      :class="{ 'w-64': !sidebarCollapsed, 'w-0 -ml-1 opacity-0': sidebarCollapsed }"
    >
      <!-- Logo and title -->
      <div class="p-4 border-b border-dark-border flex flex-col">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-bold text-primary-500">Lambda Running</h1>
          
          <!-- Toggle sidebar button (visible when sidebar is expanded) -->
          <button 
            v-if="!sidebarCollapsed"
            class="text-gray-400 hover:text-white transition-all focus:outline-none"
            @click="toggleSidebar"
            title="Collapse sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-1">Test your AWS Lambda functions</p>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-2">
        <div class="mb-2">
          <div class="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
            <span>Handlers</span>
            <span class="text-xs text-primary-500">{{ filteredHandlerCount || totalHandlerCount }}</span>
          </div>
          
          <!-- Search input -->
          <div class="px-2 mb-3">
            <div class="relative">
              <input 
                v-model="searchTerm" 
                type="text" 
                placeholder="Search handlers..." 
                class="w-full bg-dark-200 border border-dark-border rounded p-2 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-2 top-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button 
                v-if="searchTerm" 
                @click="searchTerm = ''" 
                class="absolute right-2 top-2 text-gray-400 hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div v-if="isLoadingHandlers" class="px-3 py-2 text-sm text-gray-400">
            <div class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading handlers...
            </div>
          </div>
          
          <template v-else-if="handlerError">
            <div class="px-3 py-2 text-sm text-red-400">
              {{ handlerError }}
            </div>
          </template>
          
          <template v-else>
            <div v-for="(handlers, directory) in filteredGroupedHandlers" :key="directory" class="mb-3">
              <!-- Directory header (clickable) -->
              <div 
                @click="toggleDirectory(directory)"
                class="px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-dark-hover rounded cursor-pointer flex items-center"
              >
                <div class="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-3.5 w-3.5 mr-1.5 transition-transform duration-200" 
                    :class="{'transform rotate-90': isDirectoryExpanded(directory)}"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{{ directory }}</span>
                </div>
              </div>
              
              <!-- Handlers list (collapsible) -->
              <div v-if="isDirectoryExpanded(directory)" class="mt-1">
                <div 
                  v-for="handler in handlers" 
                  :key="`${handler.path}-${handler.method}`"
                  class="relative group"
                >
                  <router-link 
                    :to="`/handlers/${encodeURIComponent(handler.path)}/${handler.method}`"
                    class="sidebar-item text-xs pl-6 py-1.5 flex items-center"
                    :class="{ 'pointer-events-none opacity-50': isExecuting }"
                    active-class="active"
                  >
                    <span v-if="searchTerm" v-html="highlightMatch(handler.name)"></span>
                    <span v-else>{{ handler.name }}</span>
                    <span v-if="handler.method !== 'handler'" class="ml-1 text-xs text-gray-500">
                      ({{ handler.method }})
                    </span>
                  </router-link>
                  
                  <!-- Play button on hover -->
                  <button 
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 transition-opacity"
                    :class="{ 'opacity-0 group-hover:opacity-100': !isHandlerExecuting(handler), 'opacity-100': isHandlerExecuting(handler) }"
                    @click="runHandlerFromSidebar(handler)"
                    title="Run this handler"
                    :disabled="isExecuting"
                  >
                    <!-- Loading spinner while executing -->
                    <svg v-if="isHandlerExecuting(handler)" class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    
                    <!-- Play icon when not executing -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hover:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- No results message -->
            <div v-if="Object.keys(filteredGroupedHandlers).length === 0" class="px-3 py-2 text-sm text-gray-400">
              No handlers matching "{{ searchTerm }}"
            </div>
          </template>
        </div>
      </nav>
      
      <!-- Footer with version -->
      <div class="p-3 border-t border-dark-border">
        <div class="text-xs text-gray-500">
          <span>Lambda Running v{{ version }}</span>
        </div>
      </div>
    </aside>
    
    <!-- Toggle sidebar button (visible when sidebar is collapsed) -->
    <button 
      v-if="sidebarCollapsed"
      class="absolute left-0 top-5 z-30 p-2 bg-dark-100 rounded-r-md text-gray-400 hover:text-white transition-all focus:outline-none"
      @click="toggleSidebar"
      title="Expand sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    
    <!-- Main content -->
    <main 
      class="flex-1 h-full overflow-hidden relative transition-all duration-300"
    >
      <!-- Loading overlay -->
      <div v-if="isInitializing" class="absolute inset-0 bg-dark-200 bg-opacity-75 z-10 flex items-center justify-center">
        <div class="text-center">
          <svg class="animate-spin h-10 w-10 text-primary-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-lg font-medium text-white">Initializing Lambda Running...</p>
          <p class="text-sm text-gray-400 mt-2">Loading handlers and connecting to server</p>
        </div>
      </div>
      
      <router-view v-if="!isInitializing || hasCompletedInitialLoad" />
    </main>
  </div>
  
  <!-- Global Notification Component -->
  <Notification />
</template>

<script>
import { defineComponent, onMounted, computed, ref, watch, onBeforeUnmount, provide } from 'vue'
import { useHandlersStore } from './stores/handlers'
import { useExecutionStore } from './stores/execution'
import { useRouter } from 'vue-router'
import { notify } from './components/Notification.vue'
import Notification from './components/Notification.vue'

export default defineComponent({
  name: 'App',
  
  components: {
    Notification
  },
  
  setup() {
    const handlersStore = useHandlersStore()
    const executionStore = useExecutionStore()
    const router = useRouter()
    
    const isInitializing = ref(true)
    const hasCompletedInitialLoad = ref(false)
    const sidebarCollapsed = ref(false)
    const searchTerm = ref('')
    const expandedDirectories = ref({})
    
    // Provide sidebarCollapsed to all child components
    provide('sidebarCollapsed', sidebarCollapsed)
    
    // Toggle sidebar visibility
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
      // Save preference to localStorage
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
    }
    
    // Toggle directory expansion
    const toggleDirectory = (directory) => {
      if (expandedDirectories.value[directory]) {
        expandedDirectories.value[directory] = !expandedDirectories.value[directory]
      } else {
        expandedDirectories.value[directory] = true
      }
      // Save to localStorage
      localStorage.setItem('expandedDirectories', JSON.stringify(expandedDirectories.value))
    }
    
    // Check if directory is expanded
    const isDirectoryExpanded = (directory) => {
      return expandedDirectories.value[directory] !== false
    }
    
    // Filter handlers based on search term
    const filteredGroupedHandlers = computed(() => {
      const grouped = {}
      const groupedHandlers = handlersStore.groupedHandlers
      
      if (!searchTerm.value) {
        return groupedHandlers
      }
      
      const searchLower = searchTerm.value.toLowerCase()
      
      // Filter each directory group
      Object.keys(groupedHandlers).forEach(dir => {
        const matchingHandlers = groupedHandlers[dir].filter(handler => 
          handler.name.toLowerCase().includes(searchLower) ||
          handler.method.toLowerCase().includes(searchLower) ||
          dir.toLowerCase().includes(searchLower)
        )
        
        if (matchingHandlers.length > 0) {
          grouped[dir] = matchingHandlers
          // Auto-expand directories with matching handlers
          expandedDirectories.value[dir] = true
        }
      })
      
      return grouped
    })
    
    // Count total filtered handlers
    const filteredHandlerCount = computed(() => {
      let count = 0
      Object.values(filteredGroupedHandlers.value).forEach(handlers => {
        count += handlers.length
      })
      return count
    })
    
    // Highlight matching text in search results
    const highlightMatch = (text) => {
      if (!searchTerm.value) return text
      
      const searchRegex = new RegExp(`(${searchTerm.value})`, 'gi')
      return text.replace(searchRegex, '<span class="text-primary-500 font-medium">$1</span>')
    }
    
    // Run handler from sidebar
    const runHandlerFromSidebar = (handler) => {
      // Navigate to the handler
      router.push(`/handlers/${encodeURIComponent(handler.path)}/${handler.method}`)
      
      // Wait for navigation and then run the handler
      handlersStore.runHandlerFromSidebar(handler)
    }
    
    // Fetch handlers when the app mounts
    onMounted(async () => {
      // Connect to socket
      executionStore.connectSocket()
      
      // Restore sidebar state from localStorage
      const savedSidebarState = localStorage.getItem('sidebarCollapsed')
      if (savedSidebarState !== null) {
        sidebarCollapsed.value = savedSidebarState === 'true'
      }
      
      // Restore expanded directories from localStorage
      const savedExpandedDirectories = localStorage.getItem('expandedDirectories')
      if (savedExpandedDirectories) {
        try {
          expandedDirectories.value = JSON.parse(savedExpandedDirectories)
        } catch (e) {
          console.error('Failed to parse saved directory state:', e)
        }
      }
      
      // Fetch handlers
      try {
        await handlersStore.fetchHandlers()
        
        // Default expansion state for directories (if not already set)
        const groupedHandlers = handlersStore.groupedHandlers
        Object.keys(groupedHandlers).forEach(dir => {
          if (expandedDirectories.value[dir] === undefined) {
            expandedDirectories.value[dir] = true // Default to expanded
          }
        })
      } catch (error) {
        console.error('Failed to load handlers:', error)
      } finally {
        // Stop showing loading after 1 second
        setTimeout(() => {
          isInitializing.value = false
          // After a short delay, mark initialization as complete
          setTimeout(() => {
            hasCompletedInitialLoad.value = true
          }, 100)
        }, 1000)
      }
    })
    
    // Clean up on unmount
    onBeforeUnmount(() => {
      executionStore.disconnectSocket()
    })
    
    // Compute total number of handlers
    const totalHandlerCount = computed(() => {
      return handlersStore.handlers.reduce((count, handler) => {
        return count + handler.methods.length
      }, 0)
    })
    
    return {
      version: '0.2.3',
      isLoadingHandlers: computed(() => handlersStore.isLoading),
      handlerError: computed(() => handlersStore.error),
      groupedHandlers: computed(() => handlersStore.groupedHandlers),
      filteredGroupedHandlers,
      filteredHandlerCount,
      searchTerm,
      totalHandlerCount,
      isInitializing,
      hasCompletedInitialLoad,
      sidebarCollapsed,
      toggleSidebar,
      toggleDirectory,
      isDirectoryExpanded,
      highlightMatch,
      runHandlerFromSidebar,
      isExecuting: computed(() => executionStore.isExecuting),
      // Function to check if a specific handler is currently executing
      isHandlerExecuting: (handler) => {
        const activeHandler = handlersStore.activeHandler
        if (!activeHandler || !executionStore.isExecuting) return false
        return activeHandler.path === handler.path && activeHandler.method === handler.method
      }
    }
  }
})
</script>

<style scoped>
.sidebar-container {
  overflow: hidden;
}

.sidebar-toggle {
  transition: all 0.3s ease;
}

.sidebar-item {
  @apply block px-3 py-1 rounded text-gray-300 hover:bg-dark-hover;
}

.sidebar-item.active {
  @apply bg-dark-hover text-white;
}
</style> 