<template>
  <button 
    @click="toggleTheme" 
    class="flex items-center text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-500 transition-all focus:outline-none rounded-md p-1.5"
    :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <!-- Sun icon for dark mode -->
    <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    <!-- Moon icon for light mode -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
    <span class="ml-1.5 text-xs">{{ isDarkMode ? 'Dark' : 'Light' }}</span>
  </button>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'ThemeToggler',
  
  setup() {
    const isDarkMode = ref(true)
    
    // Toggle between dark and light mode
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value
      
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    }
    
    // Initialize theme based on user preference
    onMounted(() => {
      // Check for saved theme preference or default to dark
      const savedTheme = localStorage.getItem('theme')
      
      if (savedTheme) {
        isDarkMode.value = savedTheme === 'dark'
      } else {
        // Default to dark mode
        isDarkMode.value = true
        localStorage.setItem('theme', 'dark')
      }
      
      // Apply theme
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    })
    
    return {
      isDarkMode,
      toggleTheme
    }
  }
})
</script> 