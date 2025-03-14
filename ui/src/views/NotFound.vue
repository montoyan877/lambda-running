<template>
  <div class="flex flex-col items-center justify-center h-full p-6 text-center">
    <h1 class="text-6xl font-bold text-primary-500 mb-4">404</h1>
    <p class="text-2xl text-gray-400 mb-8">Page not found</p>
    <p class="text-gray-500 max-w-md mb-8">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <router-link to="/" class="btn btn-primary">
      Return to Dashboard
    </router-link>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'NotFoundView'
})
</script> 