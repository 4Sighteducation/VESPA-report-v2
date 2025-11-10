<template>
  <div class="staff-coaching-record">
    <div class="section-header">
      <h3>👨‍🏫 Staff Coaching Notes (Confidential)</h3>
      <div class="header-actions">
        <button @click="showGuide = true" class="coaching-guide-btn">
          💬 Conversation Guide
        </button>
        <span class="staff-badge">Staff Only</span>
      </div>
    </div>

    <div class="section-body">
      <p class="info-text">
        These notes are confidential and will not be visible to students. Use this space to record observations, 
        coaching conversations, and action plans.
      </p>

      <textarea
        v-model="coachingText"
        class="coaching-textarea"
        placeholder="Record coaching observations and notes here..."
        rows="8"
        :disabled="saving"
      ></textarea>

      <div class="date-field">
        <label for="coaching-date">Coaching Date:</label>
        <input
          id="coaching-date"
          v-model="coachingDate"
          type="date"
          :disabled="saving"
        />
      </div>

      <div class="action-bar">
        <span v-if="lastSaved" class="last-saved">Last saved: {{ lastSaved }}</span>
        <button @click="saveCoaching" :disabled="saving || !hasChanges" class="save-button">
          {{ saving ? 'Saving...' : 'Save Coaching Notes' }}
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">Coaching notes saved successfully!</div>
    </div>

    <CoachingGuideModal 
      :isOpen="showGuide" 
      @close="showGuide = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import CoachingGuideModal from './CoachingGuideModal.vue'

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

const coachingText = ref(props.existing?.coaching_text || '')
const coachingDate = ref(props.existing?.coaching_date ? props.existing.coaching_date.split('T')[0] : '')

const originalText = ref(coachingText.value)
const originalDate = ref(coachingDate.value)

const saving = ref(false)
const error = ref(null)
const success = ref(false)
const lastSaved = ref(props.existing?.coaching_date ? new Date(props.existing.coaching_date).toLocaleString() : null)
const showGuide = ref(false)

const hasChanges = computed(() => {
  return (
    coachingText.value.trim() !== originalText.value.trim() ||
    coachingDate.value !== originalDate.value
  )
})

// Watch for external updates
watch(() => props.existing, (newVal) => {
  if (newVal) {
    coachingText.value = newVal.coaching_text || ''
    coachingDate.value = newVal.coaching_date ? newVal.coaching_date.split('T')[0] : ''
    
    originalText.value = coachingText.value
    originalDate.value = coachingDate.value
    
    if (newVal.coaching_date) {
      lastSaved.value = new Date(newVal.coaching_date).toLocaleString()
    }
  }
}, { deep: true })

const saveCoaching = async () => {
  if (!hasChanges.value) return

  saving.value = true
  error.value = null
  success.value = false

  try {
    await emit('save', {
      cycle: props.cycle,
      coachingText: coachingText.value,
      coachingDate: coachingDate.value
    })

    originalText.value = coachingText.value
    originalDate.value = coachingDate.value
    lastSaved.value = new Date().toLocaleString()
    success.value = true
    
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to save coaching notes'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.staff-coaching-record {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  border-left: 4px solid #ff9800;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coaching-guide-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.coaching-guide-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.staff-badge {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.section-body {
  padding: 24px;
}

.info-text {
  margin: 0 0 16px 0;
  padding: 12px 16px;
  background: #e3f2fd;
  border-left: 4px solid #079baa;
  border-radius: 4px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.info-text p {
  margin: 0;
}

.coaching-textarea {
  width: 100%;
  padding: 20px;
  border: 3px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  background: #fafafa;
  margin-bottom: 16px;
  min-height: 200px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
}

.coaching-textarea:focus {
  outline: none;
  background: white;
  border-color: #079baa;
  box-shadow: 0 0 0 4px rgba(7, 155, 170, 0.1);
}

.coaching-textarea::placeholder {
  color: #999;
  font-style: italic;
}

.coaching-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  max-width: 250px;
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
  background: white;
}

.date-field input[type="date"]:focus {
  outline: none;
  border-color: #079baa;
  box-shadow: 0 0 0 3px rgba(7, 155, 170, 0.1);
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
  transition: all 0.3s ease;
}

.save-button:hover:not(:disabled) {
  background: #067a87;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(7, 155, 170, 0.3);
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
  .staff-coaching-record {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .coaching-guide-btn {
    width: 100%;
  }
  
  .date-field {
    max-width: 100%;
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
  .staff-coaching-record {
    display: none; /* Don't print confidential staff notes */
  }
}
</style>

