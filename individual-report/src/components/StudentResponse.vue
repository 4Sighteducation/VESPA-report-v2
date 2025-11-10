<template>
  <div class="student-response">
    <div class="section-header">
      <h3>💡 Your Reflection</h3>
      <button @click="showHelp = !showHelp" class="help-button">
        <span class="help-icon">💡</span>
        {{ showHelp ? 'Hide Help' : 'Need Help?' }}
      </button>
    </div>

    <!-- Enhanced Help Modal -->
    <div v-if="showHelp" class="help-modal-overlay" @click="showHelp = false">
      <div class="help-modal-content" @click.stop>
        <div class="help-modal-header">
          <h2>Writing Your VESPA Response</h2>
          <button class="help-modal-close" @click="showHelp = false">&times;</button>
        </div>
        <div class="help-modal-body">
          <div class="guide-intro">
            <p>Your response helps your tutor/mentor understand your unique situation and provide personalized support. Be honest and specific - there are no wrong answers!</p>
          </div>
          
          <h3>📊 Reflecting on Your VESPA Scores</h3>
          <div class="guide-section">
            <p>Consider how accurately the report reflects your current study habits:</p>
            <ul>
              <li><strong>Do the scores feel right?</strong> Which ones resonate most with your experience?</li>
              <li><strong>Any surprises?</strong> Were any scores higher or lower than expected?</li>
              <li><strong>Your strengths:</strong> What's your highest score telling you?</li>
              <li><strong>Growth areas:</strong> What might your lowest score suggest?</li>
            </ul>
            
            <div class="sentence-starters">
              <h4>Try starting with:</h4>
              <p class="starter">"Looking at my scores, I was surprised to see..."</p>
              <p class="starter">"My [highest/lowest] score in [area] makes sense because..."</p>
              <p class="starter">"I think the report is [very/somewhat/not very] accurate because..."</p>
            </div>
          </div>
          
          <h3>📚 Your Current Study Experience</h3>
          <div class="guide-section">
            <p>Help your tutor/mentor understand what studying is really like for you right now:</p>
            <ul>
              <li><strong>Daily reality:</strong> What does a typical study session look like?</li>
              <li><strong>Challenges:</strong> What's been particularly difficult lately?</li>
              <li><strong>Successes:</strong> What study strategies are working well?</li>
            </ul>
            
            <div class="sentence-starters">
              <h4>Express yourself with:</h4>
              <p class="starter">"Right now, I'm finding it hard to..."</p>
              <p class="starter">"My biggest challenge with studying is..."</p>
              <p class="starter">"Something that's been working well for me is..."</p>
            </div>
          </div>
          
          <div class="guide-tips">
            <h4>💡 Tips for a Great Response</h4>
            <ul>
              <li><strong>Be specific:</strong> Instead of "I procrastinate," try "I often leave essays until 2 days before they're due"</li>
              <li><strong>Include context:</strong> Mention relevant factors (work commitments, health, family responsibilities)</li>
              <li><strong>Be honest:</strong> Your tutor/mentor is here to help, not judge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="section-body">
      <div class="info-text">
        <p>✍️ Click here to write your reflection. Think about: What surprised you? What makes sense? What do you want to improve?</p>
      </div>

      <div class="textarea-wrapper">
        <textarea
          v-model="responseText"
          class="response-textarea"
          placeholder="✍️ Click here to write your reflection. Think about: What surprised you? What makes sense? What do you want to improve?"
          rows="8"
          :disabled="saving"
          @click="handleTextareaClick"
          @focus="handleTextareaFocus"
        ></textarea>
        <button 
          class="expand-button" 
          @click="showFocusModal = true"
          title="Expand to full screen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>

      <TextareaFocusModal
        v-model="responseText"
        :is-open="showFocusModal"
        title="💡 Your Reflection"
        placeholder="✍️ Click here to write your reflection. Think about: What surprised you? What makes sense? What do you want to improve?"
        @close="showFocusModal = false"
        @save="handleModalSave"
      />

      <div class="action-bar">
        <span v-if="lastSaved" class="last-saved">Last saved: {{ lastSaved }}</span>
        <button @click="saveResponse" :disabled="saving || !hasChanges" class="save-button">
          {{ saving ? 'Saving...' : 'Save Response' }}
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">Response saved successfully!</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { stripHtml } from '../utils/textUtils.js'
import TextareaFocusModal from './TextareaFocusModal.vue'

const props = defineProps({
  cycle: {
    type: Number,
    required: true
  },
  existing: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save'])

// Strip HTML from initial value
const cleanInitialText = stripHtml(props.existing?.response_text || '')
const responseText = ref(cleanInitialText)
const originalText = ref(cleanInitialText)
const showHelp = ref(false)
const showFocusModal = ref(false)
const saving = ref(false)
const error = ref(null)
const success = ref(false)
const lastSaved = ref(props.existing?.submitted_at ? new Date(props.existing.submitted_at).toLocaleString() : null)

// Mobile detection - reactive computed for responsiveness
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
})

// Auto-open help on first visit
onMounted(() => {
  const storageKey = `vespa_help_seen_${props.cycle}_reflection`
  const hasSeenBefore = localStorage.getItem(storageKey)
  
  if (!hasSeenBefore) {
    // Small delay so user sees the page first
    setTimeout(() => {
      showHelp.value = true
      localStorage.setItem(storageKey, 'true')
    }, 1000)
  }
})

// Handle textarea click - on mobile, open modal instead of focusing
const handleTextareaClick = (e) => {
  if (isMobile.value) {
    e.preventDefault()
    showFocusModal.value = true
  }
}

// Handle textarea focus - on desktop, open modal for better UX
const handleTextareaFocus = (e) => {
  if (!isMobile.value) {
    // On desktop, still allow normal focus but also offer modal
    // User can click expand button if they want full-screen
  }
}

const hasChanges = computed(() => {
  return responseText.value.trim() !== originalText.value.trim()
})

// Watch for external updates
watch(() => props.existing, (newVal) => {
  if (newVal?.response_text !== undefined) {
    const cleanText = stripHtml(newVal.response_text)
    responseText.value = cleanText
    originalText.value = cleanText
    if (newVal.submitted_at) {
      lastSaved.value = new Date(newVal.submitted_at).toLocaleString()
    }
  }
}, { deep: true })

const handleModalSave = () => {
  // Auto-save when closing the modal
  if (hasChanges.value) {
    saveResponse()
  }
}

const saveResponse = async () => {
  if (!hasChanges.value) return

  saving.value = true
  error.value = null
  success.value = false

  try {
    await emit('save', {
      cycle: props.cycle,
      responseText: responseText.value
    })

    originalText.value = responseText.value
    lastSaved.value = new Date().toLocaleString()
    success.value = true
    
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to save response'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.student-response {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.section-header {
  background: linear-gradient(135deg, #079baa, #7bd8d0);
  padding: 20px 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.section-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.help-button {
  background: linear-gradient(135deg, #079baa, #62d1d2);
  color: white;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(7, 155, 170, 0.4);
  animation: pulse 2s infinite;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.help-button .help-icon {
  font-size: 20px;
}

.help-button:hover {
  background: linear-gradient(135deg, #067a87, #079baa);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(7, 155, 170, 0.6);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(7, 155, 170, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(7, 155, 170, 0.6);
  }
}

.section-body {
  padding: 24px;
}

.info-text {
  background: #e3f2fd;
  padding: 12px 16px;
  border-left: 4px solid #079baa;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.info-text p {
  margin: 0;
}

/* Enhanced Help Modal Styles */
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.help-modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.help-modal-header {
  padding: 24px 30px;
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  color: white;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.help-modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 32px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  line-height: 1;
}

.help-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.help-modal-body {
  padding: 30px;
  color: #333;
}

.guide-intro {
  background: #e3f2fd;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border-left: 4px solid #079baa;
}

.guide-intro p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #555;
}

.help-modal-body h3 {
  color: #079baa;
  margin: 24px 0 12px 0;
  font-size: 20px;
  font-weight: 700;
}

.guide-section {
  margin-bottom: 24px;
}

.guide-section p {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #555;
}

.guide-section ul {
  margin: 0;
  padding-left: 20px;
}

.guide-section li {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #666;
}

.sentence-starters {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.sentence-starters h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 700;
  color: #555;
}

.starter {
  margin: 8px 0;
  padding: 10px 14px;
  background: white;
  border-left: 3px solid #079baa;
  border-radius: 4px;
  font-style: italic;
  color: #666;
  font-size: 14px;
}

.guide-tips {
  background: #fff3e0;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
}

.guide-tips h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 700;
  color: #ff9800;
}

.guide-tips ul {
  margin: 0;
  padding-left: 20px;
}

.guide-tips li {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #666;
}

.textarea-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.response-textarea {
  width: 100%;
  padding: 20px;
  padding-right: 50px; /* Space for expand button */
  border: 3px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  cursor: text;
  white-space: pre-wrap; /* Preserve line breaks */
  background: #fafafa;
  min-height: 200px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
}

.response-textarea:focus {
  outline: none;
  background: white;
  border-color: #079baa;
  box-shadow: 0 0 0 4px rgba(7, 155, 170, 0.1);
}

.response-textarea::placeholder {
  color: #999;
  font-style: italic;
}

.response-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.expand-button {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #079baa;
  color: white;
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.expand-button:hover {
  background: #067a87;
  transform: scale(1.1);
}

.expand-button:active {
  transform: scale(0.95);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.last-saved {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

.save-button {
  padding: 12px 24px;
  background: #079baa;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.save-button:hover:not(:disabled) {
  background: #067a87;
}

.save-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message,
.success-message {
  margin-top: 12px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.error-message {
  background: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.success-message {
  background: #efe;
  color: #060;
  border: 1px solid #cfc;
}

@media (max-width: 768px) {
  .student-response {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .save-button {
    width: 100%;
  }
}

@media print {
  .student-response {
    padding: 2mm !important;
    margin-bottom: 2mm !important;
    box-shadow: none !important;
    page-break-inside: avoid !important;
  }
  
  .section-header h3 {
    font-size: 9pt !important;
    margin: 0 0 1mm 0 !important;
  }
  
  .help-button,
  .action-button,
  .action-bar,
  .error-message,
  .success-message,
  .expand-button {
    display: none !important;
    visibility: hidden !important;
  }
  
  .textarea-wrapper {
    position: static !important;
  }
  
  .response-textarea {
    border: 0.3pt solid #ccc !important;
    padding: 1mm !important;
    min-height: 15mm !important;
    max-height: 20mm !important;
    font-size: 7pt !important;
    line-height: 1.3 !important;
    overflow: hidden !important;
    white-space: pre-wrap !important;
  }
}
</style>

