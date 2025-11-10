import { createApp } from 'vue'
import App from './App.vue'

// Initialization function - will be exposed to global scope at end
function initAcademicProfile() {
  console.log('[Academic Profile V2] Initializing...')
  
  // Get config from global
  const config = window.ACADEMIC_PROFILE_V2_CONFIG
  
  if (!config) {
    console.error('[Academic Profile V2] Config not found')
    return
  }
  
  console.log('[Academic Profile V2] Config loaded:', config)
  
  // Find the mount point
  const mountPoint = document.querySelector(config.elementSelector)
  
  if (!mountPoint) {
    console.error('[Academic Profile V2] Mount point not found:', config.elementSelector)
    return
  }
  
  // Create a container div for the Vue app
  const appContainer = document.createElement('div')
  appContainer.id = 'academic-profile-app'
  mountPoint.appendChild(appContainer)
  
  // Create and mount the Vue app
  const app = createApp(App, {
    config: config
  })
  
  app.mount('#academic-profile-app')
  
  console.log('[Academic Profile V2] Mounted successfully')
}

// Expose to window (matches pattern from report1w.js)
typeof window !== 'undefined' && (window.initializeAcademicProfileV2 = initAcademicProfile)

