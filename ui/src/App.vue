<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <aside class="w-64 h-full bg-dark-100 border-r border-dark-border flex flex-col">
      <!-- Logo and title -->
      <div class="p-4 border-b border-dark-border">
        <h1 class="text-xl font-bold text-primary-500">Lambda Running</h1>
        <p class="text-xs text-gray-400">Test your AWS Lambda functions</p>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-2">
        <router-link to="/" class="sidebar-item mb-1" active-class="active" exact>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Dashboard
        </router-link>
        
        <div class="mt-4 mb-2">
          <div class="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Handlers
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
            <div v-for="(handlers, directory) in groupedHandlers" :key="directory" class="mb-3">
              <div class="px-3 py-1 text-xs font-medium text-gray-400">
                {{ directory }}
              </div>
              
              <router-link 
                v-for="handler in handlers" 
                :key="`${handler.path}-${handler.method}`"
                :to="`/handlers/${encodeURIComponent(handler.path)}/${handler.method}`"
                class="sidebar-item text-xs pl-5"
                active-class="active"
              >
                {{ handler.name }}
              </router-link>
            </div>
          </template>
        </div>
        
        <router-link to="/events" class="sidebar-item mt-4" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Events
        </router-link>
      </nav>
      
      <!-- Footer -->
      <div class="p-3 border-t border-dark-border text-xs text-gray-500">
        Lambda Running v{{ version }}
      </div>
    </aside>
    
    <!-- Main content -->
    <main class="flex-1 h-full overflow-hidden relative">
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
</template>

<script>
import { defineComponent, onMounted, computed, ref, watch, onBeforeUnmount } from 'vue'
import { useHandlersStore } from './stores/handlers'
import { useExecutionStore } from './stores/execution'

export default defineComponent({
  name: 'App',
  
  setup() {
    const handlersStore = useHandlersStore()
    const executionStore = useExecutionStore()
    
    const isInitializing = ref(true)
    const hasCompletedInitialLoad = ref(false)
    
    // Fetch handlers when the app mounts
    onMounted(async () => {
      // Connect to socket
      executionStore.connectSocket()
      
      // Fetch handlers
      try {
        await handlersStore.fetchHandlers()
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
    
    return {
      version: '0.1.0',
      isLoadingHandlers: computed(() => handlersStore.isLoading),
      handlerError: computed(() => handlersStore.error),
      groupedHandlers: computed(() => handlersStore.groupedHandlers),
      isInitializing,
      hasCompletedInitialLoad
    }
  }
})
</script> 