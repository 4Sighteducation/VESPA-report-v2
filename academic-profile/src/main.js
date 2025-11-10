import { createApp } from 'vue'
import App from './App.vue'

// Immediately expose the initializer function to global scope
;(function() {
  'use strict'
  
  // Global initialization function called by KnackAppLoader
  window.initializeAcademicProfileV2 = function() {
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
  
  console.log('[Academic Profile V2] Script loaded, initializer ready')
})()

// Export for development
export { }

