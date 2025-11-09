import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Initialize function called by KnackAppLoader
window.initializeReportV2 = function() {
  console.log('[VESPA Report V2] Initializing...')
  
  try {
    // Get config from global variable (set by KnackAppLoader)
    const config = window.REPORT_V2_CONFIG || {}
    
    // Find the mount element
    const mountElement = document.querySelector(config.elementSelector || '#view_3250')
    
    if (!mountElement) {
      console.error('[VESPA Report V2] Mount element not found:', config.elementSelector)
      return
    }
    
    // Create and mount Vue app
    const app = createApp(App)
    app.mount(mountElement)
    
    console.log('[VESPA Report V2] Successfully initialized!')
    
  } catch (error) {
    console.error('[VESPA Report V2] Initialization error:', error)
  }
}

// For development/standalone mode
if (import.meta.env.DEV) {
  console.log('[VESPA Report V2] Running in development mode')
  const app = createApp(App)
  app.mount('#app')
}

