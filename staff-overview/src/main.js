import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Initialize function called by KnackAppLoader
function initializeStaffOverviewV2() {
  console.log('[Staff Overview V2] Initializing...')
  
  try {
    // Get config from global variable (set by KnackAppLoader)
    const config = window.STAFF_OVERVIEW_V2_CONFIG || {}
    
    // Find the mount element
    const mountElement = document.querySelector(config.elementSelector || '#view_2776')
    
    if (!mountElement) {
      console.error('[Staff Overview V2] Mount element not found:', config.elementSelector)
      return
    }
    
    // Create and mount Vue app
    const app = createApp(App)
    app.mount(mountElement)
    
    console.log('[Staff Overview V2] Successfully initialized!')
    
  } catch (error) {
    console.error('[Staff Overview V2] Initialization error:', error)
  }
}

// Expose to window for KnackAppLoader
if (typeof window !== 'undefined') {
  window.initializeStaffOverviewV2 = initializeStaffOverviewV2
}

// For development/standalone mode
if (import.meta.env.DEV) {
  console.log('[Staff Overview V2] Running in development mode')
  const app = createApp(App)
  app.mount('#app')
}

// Export for IIFE build
export { initializeStaffOverviewV2 }

