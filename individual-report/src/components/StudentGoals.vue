<template>
  <div class="student-goals">
    <div class="section-header">
      <h3>🎯 Your Study Goals</h3>
      <button @click="showHelp = !showHelp" class="help-button">
        <span class="help-icon">💡</span>
        {{ showHelp ? 'Hide Help' : 'Need Help?' }}
      </button>
    </div>

    <!-- Enhanced Goal-Setting Modal -->
    <div v-if="showHelp" class="help-modal-overlay" @click="showHelp = false">
      <div class="help-modal-content" @click.stop>
        <div class="help-modal-header">
          <h2>Setting Effective Study Goals</h2>
          <button class="help-modal-close" @click="showHelp = false">&times;</button>
        </div>
        <div class="help-modal-body">
          <h3>Tips for Effective Study Goals</h3>
          <ul class="goal-tips-list">
            <li><strong>Keep them specific and achievable</strong> - Instead of "study more", try "complete 2 practice papers this week"</li>
            <li><strong>Focus on approach goals</strong> - Set targets you're working towards, not things you're trying to avoid</li>
            <li><strong>Make them measurable</strong> - Include numbers or specific outcomes so you know when you've achieved them</li>
            <li><strong>Set a timeframe</strong> - Give yourself a deadline to create urgency and track progress</li>
          </ul>
          
          <h3>Types of Effective Approach Goals</h3>
          
          <div class="goal-type">
            <h4>🎯 Performance Goals</h4>
            <p class="goal-example">"I want to achieve 75% or higher in my next test"</p>
            <p class="goal-description">Focus on achieving a specific ranking or score</p>
          </div>
          
          <div class="goal-type">
            <h4>📈 Mastery Goals</h4>
            <p class="goal-example">"I will improve my essay structure by practicing introductions daily"</p>
            <p class="goal-description">Focus on developing specific skills</p>
          </div>
          
          <div class="goal-type">
            <h4>🏆 Personal Best Goals</h4>
            <p class="goal-example">"I aim to beat my previous score of 68% by at least 5%"</p>
            <p class="goal-description">Focus on improving your own previous performance</p>
          </div>
          
          <div class="avoid-section">
            <h4>❌ Avoid These Types of Goals</h4>
            <ul>
              <li>"I just don't want to fail" (avoidance goal)</li>
              <li>"I hope I don't run out of time" (focuses on negative)</li>
              <li>"As long as I pass" (lacks ambition)</li>
            </ul>
          </div>
          
          <div class="goal-prompt">
            <p><strong>Now write your study goals focusing on what you want to achieve, not what you want to avoid!</strong></p>
          </div>
        </div>
      </div>
    </div>

    <div class="section-body">
      <div class="info-text" @click="handleInfoTextClick" :class="{ 'clickable': isMobile }">
        <p>✍️ Click here to write your study goals. Focus on what you want to achieve, not what you want to avoid!</p>
      </div>

      <div class="textarea-wrapper">
        <textarea
          v-model="goalText"
          class="goal-textarea"
          placeholder="✍️ Click here to write your study goals. Focus on what you want to achieve, not what you want to avoid!"
          rows="6"
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
        v-model="goalText"
        :is-open="showFocusModal"
        title="🎯 Your Study Goals"
        placeholder="✍️ Click here to write your study goals. Focus on what you want to achieve, not what you want to avoid!"
        @close="showFocusModal = false"
        @save="handleModalSave"
      />

      <div class="date-fields">
      <div class="date-field">
        <label for="goal-set-date">Set Date:</label>
        <input
          id="goal-set-date"
          v-model="goalSetDate"
          type="date"
          :disabled="saving"
        />
      </div>
      <div class="date-field">
        <label for="goal-due-date">Due Date:</label>
        <input
          id="goal-due-date"
          v-model="goalDueDate"
          type="date"
          :disabled="saving"
        />
      </div>
    </div>

      <div class="action-bar">
        <span v-if="lastSaved" class="last-saved">Last saved: {{ lastSaved }}</span>
        <button @click="saveGoals" :disabled="saving || !hasChanges" class="save-button">
          {{ saving ? 'Saving...' : 'Save Goals' }}
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">Goals saved successfully!</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
const cleanInitialGoal = stripHtml(props.existing?.goal_text || '')
const goalText = ref(cleanInitialGoal)
const goalSetDate = ref(props.existing?.goal_set_date ? props.existing.goal_set_date.split('T')[0] : '')
const goalDueDate = ref(props.existing?.goal_due_date ? props.existing.goal_due_date.split('T')[0] : '')

const originalGoalText = ref(cleanInitialGoal)
const originalSetDate = ref(goalSetDate.value)
const originalDueDate = ref(goalDueDate.value)

const showHelp = ref(false)
const showFocusModal = ref(false)
const saving = ref(false)
const error = ref(null)
const success = ref(false)
const lastSaved = ref(null)

// Mobile detection - reactive computed for responsiveness
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
})

// Track if user has interacted with textarea before
const hasInteractedWithTextarea = ref(false)

// Handle textarea click - on mobile, open modal instead of focusing
// Also show help modal on first interaction if not seen before
const handleTextareaClick = (e) => {
  // Check if this is first interaction and help hasn't been seen
  if (!hasInteractedWithTextarea.value) {
    hasInteractedWithTextarea.value = true
    const storageKey = `vespa_help_seen_${props.cycle}_goals`
    const hasSeenBefore = localStorage.getItem(storageKey)
    
    if (!hasSeenBefore) {
      // Show help modal on first click
      showHelp.value = true
      localStorage.setItem(storageKey, 'true')
    }
  }
  
  // On mobile, open focus modal instead of focusing textarea
  if (isMobile.value) {
    e.preventDefault()
    e.stopPropagation()
    showFocusModal.value = true
  }
}

// Handle textarea focus - show help on first focus if not seen before
const handleTextareaFocus = (e) => {
  // Check if this is first interaction and help hasn't been seen
  if (!hasInteractedWithTextarea.value) {
    hasInteractedWithTextarea.value = true
    const storageKey = `vespa_help_seen_${props.cycle}_goals`
    const hasSeenBefore = localStorage.getItem(storageKey)
    
    if (!hasSeenBefore) {
      // Show help modal on first focus
      showHelp.value = true
      localStorage.setItem(storageKey, 'true')
    }
  }
  
  // On mobile, open modal instead
  if (isMobile.value) {
    e.preventDefault()
    e.target.blur()
    showFocusModal.value = true
  }
}

// Handle info text click on mobile - open modal
const handleInfoTextClick = () => {
  if (isMobile.value) {
    showFocusModal.value = true
  }
}

const hasChanges = computed(() => {
  return (
    goalText.value.trim() !== originalGoalText.value.trim() ||
    goalSetDate.value !== originalSetDate.value ||
    goalDueDate.value !== originalDueDate.value
  )
})

// Watch for external updates
watch(() => props.existing, (newVal) => {
  if (newVal) {
    const cleanGoal = stripHtml(newVal.goal_text || '')
    goalText.value = cleanGoal
    goalSetDate.value = newVal.goal_set_date ? newVal.goal_set_date.split('T')[0] : ''
    goalDueDate.value = newVal.goal_due_date ? newVal.goal_due_date.split('T')[0] : ''
    
    originalGoalText.value = goalText.value
    originalSetDate.value = goalSetDate.value
    originalDueDate.value = goalDueDate.value
  }
}, { deep: true })

const handleModalSave = () => {
  // Auto-save when closing the modal
  if (hasChanges.value) {
    saveGoals()
  }
}

const saveGoals = async () => {
  if (!hasChanges.value) return

  saving.value = true
  error.value = null
  success.value = false

  try {
    await emit('save', {
      cycle: props.cycle,
      goalText: goalText.value,
      goalSetDate: goalSetDate.value,
      goalDueDate: goalDueDate.value
    })

    originalGoalText.value = goalText.value
    originalSetDate.value = goalSetDate.value
    originalDueDate.value = goalDueDate.value
    lastSaved.value = new Date().toLocaleString()
    success.value = true
    
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to save goals'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.student-goals {
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

.info-text.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.info-text.clickable:hover {
  background: #bbdefb;
  transform: translateX(2px);
}

.info-text p {
  margin: 0;
}

/* Enhanced Goal-Setting Modal Styles */
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

.help-modal-body h3 {
  color: #079baa;
  margin: 24px 0 12px 0;
  font-size: 20px;
  font-weight: 700;
}

.help-modal-body h3:first-child {
  margin-top: 0;
}

.goal-tips-list {
  margin: 0 0 20px 0;
  padding-left: 20px;
}

.goal-tips-list li {
  margin-bottom: 12px;
  line-height: 1.7;
  color: #555;
}

.goal-type {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #079baa;
}

.goal-type h4 {
  margin: 0 0 8px 0;
  font-size: 17px;
  font-weight: 700;
  color: #333;
}

.goal-example {
  margin: 0 0 8px 0;
  padding: 12px;
  background: white;
  border-radius: 6px;
  font-style: italic;
  color: #666;
  font-size: 15px;
}

.goal-description {
  margin: 0;
  font-size: 13px;
  color: #777;
}

.avoid-section {
  background: #ffebee;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
  border-left: 4px solid #f44336;
}

.avoid-section h4 {
  margin: 0 0 12px 0;
  font-size: 17px;
  font-weight: 700;
  color: #d32f2f;
}

.avoid-section ul {
  margin: 0;
  padding-left: 20px;
}

.avoid-section li {
  margin-bottom: 8px;
  color: #666;
}

.goal-prompt {
  background: #e8f5e9;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
  border-left: 4px solid #4caf50;
}

.goal-prompt p {
  margin: 0;
  font-size: 16px;
  color: #2e7d32;
}

.textarea-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.goal-textarea {
  width: 100%;
  padding: 20px;
  padding-right: 50px;
  border: 3px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  cursor: text;
  white-space: pre-wrap; /* Preserve line breaks */
  background: #fafafa;
  min-height: 150px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
}

.goal-textarea:focus {
  outline: none;
  background: white;
  border-color: #079baa;
  box-shadow: 0 0 0 4px rgba(7, 155, 170, 0.1);
}

.goal-textarea::placeholder {
  color: #999;
  font-style: italic;
}

.goal-textarea:disabled {
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

.date-fields {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.date-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-field label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.date-field input[type="date"] {
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.date-field input[type="date"]:focus {
  outline: none;
  border-color: #079baa;
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
  .student-goals {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .date-fields {
    flex-direction: column;
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
  .student-goals {
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
  .expand-button,
  .date-fields {
    display: none !important;
    visibility: hidden !important;
  }
  
  .textarea-wrapper {
    position: static !important;
    margin-bottom: 0 !important;
  }
  
  .goal-textarea {
    border: 0.3pt solid #ccc !important;
    padding: 1mm !important;
    min-height: 15mm !important;
    max-height: 20mm !important;
    font-size: 7pt !important;
    line-height: 1.3 !important;
    overflow: hidden !important;
    white-space: pre-wrap !important;
  }
  
  .date-field input[type="date"] {
    display: none !important;
  }
}
</style>

