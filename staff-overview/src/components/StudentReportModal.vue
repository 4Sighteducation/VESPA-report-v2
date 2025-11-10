<template>
  <div v-if="isOpen" class="report-modal-overlay" @click.self="close">
    <div class="report-modal-container">
      <div class="report-modal-header">
        <h2>{{ studentName }} - VESPA Report</h2>
        <button class="close-button" @click="close">
          <span class="close-icon">&times;</span>
        </button>
      </div>
      <div class="report-modal-body">
        <iframe
          v-if="reportUrl"
          ref="reportIframe"
          :src="reportUrl"
          class="report-iframe"
          @load="handleIframeLoad"
          frameborder="0"
          allowfullscreen
        ></iframe>
        <div v-show="loading" class="iframe-loading">
          <div class="spinner"></div>
          <p>Loading report...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  studentEmail: {
    type: String,
    default: null
  },
  studentName: {
    type: String,
    default: 'Student'
  }
})

const emit = defineEmits(['close'])

const reportUrl = ref(null)
const loading = ref(true)
const reportIframe = ref(null)

// Build the report URL
watch(() => [props.isOpen, props.studentEmail], ([open, email]) => {
  if (open && email) {
    reportUrl.value = `https://vespaacademy.knack.com/vespa-academy#vespa-coaching-report?email=${encodeURIComponent(email)}`
    loading.value = true
    console.log('[Report Modal] Opening report for:', email)
  } else {
    reportUrl.value = null
  }
}, { immediate: true })

const handleIframeLoad = () => {
  // Hide Knack headers and navigation in the iframe
  try {
    const iframe = reportIframe.value
    if (iframe && iframe.contentDocument) {
      // Inject CSS to hide Knack elements
      const style = iframe.contentDocument.createElement('style')
      style.textContent = `
        /* Hide Knack default headers and navigation */
        .knHeader,
        .kn-menu,
        .kn-info,
        .kn-current_user,
        #kn-app-menu,
        .kn-back,
        .breadcrumb-back,
        .header-breadcrumb {
          display: none !important;
        }
        
        /* Adjust body padding to account for hidden header */
        body {
          padding-top: 0 !important;
        }
        
        /* Ensure content starts at top */
        .kn-scene,
        #kn-app-container {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
      `
      iframe.contentDocument.head.appendChild(style)
      console.log('[Report Modal] Hid Knack headers in iframe')
    }
  } catch (e) {
    console.log('[Report Modal] Could not hide headers (cross-origin):', e.message)
  }
  
  // Add a delay to ensure content is fully rendered
  setTimeout(() => {
    loading.value = false
    console.log('[Report Modal] Report loaded')
  }, 500)
}

const close = () => {
  loading.value = true
  emit('close')
}

// Close on Escape key
const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Add/remove escape listener
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.report-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.report-modal-container {
  background: white;
  border-radius: 12px;
  width: 95vw;
  height: 92vh;
  max-width: 1600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.report-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.report-modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  padding: 0;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.close-icon {
  font-size: 36px;
  line-height: 1;
  font-weight: 300;
  color: white;
}

.report-modal-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}

.report-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  display: block;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  z-index: 2;
  pointer-events: none;
}

.iframe-loading.hidden {
  display: none;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top-color: #079baa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.iframe-loading p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

@media (max-width: 768px) {
  .report-modal-overlay {
    padding: 0;
  }
  
  .report-modal-container {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    border-radius: 0;
  }
  
  .report-modal-header {
    padding: 16px 20px;
    border-radius: 0;
  }
  
  .report-modal-header h2 {
    font-size: 18px;
  }
}
</style>

