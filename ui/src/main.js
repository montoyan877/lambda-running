import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/css/main.css'
import axios from 'axios'
import Notification from './components/Notification.vue'

// Comprobar si el servidor API está disponible
async function checkApiServer() {
  try {
    await axios.get('http://localhost:3000/api/handlers')
    console.log('API Server available at http://localhost:3000')
    return true
  } catch (error) {
    console.warn('API Server not available. Some functions may not work correctly.')
    console.warn('Run "node bin/lambda-run.js ui --port 3000" in another terminal to start the API server.')
    return false
  }
}

// Create Vue application
const app = createApp(App)

// Use Pinia for state management
app.use(createPinia())

// Use Vue Router
app.use(router)

// Mount the application
app.mount('#app')

// Register global components
app.component('Notification', Notification)

// Check API server availability
checkApiServer() 