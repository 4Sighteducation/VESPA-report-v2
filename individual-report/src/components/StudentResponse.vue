<template>
  <div class="student-response">
    <div class="section-header">
      <h3>💡 Your Reflection</h3>
      <button @click="showHelp = !showHelp" class="help-button">
        {{ showHelp ? 'Hide Help' : 'Need help?' }}
      </button>
    </div>

    <div v-if="showHelp" class="help-text">
      <p>Think about your VESPA scores and consider:</p>
      <ul>
        <li>What surprised you about your results?</li>
        <li>Which areas are you most proud of?</li>
        <li>What challenges are you facing in your studies?</li>
        <li>How do these results reflect your current situation?</li>
      </ul>
    </div>

    <textarea
      v-model="responseText"
      class="response-textarea"
      placeholder="Write your reflection on your VESPA scores here..."
      rows="8"
      :disabled="saving"
    ></textarea>

    <div class="action-bar">
      <span v-if="lastSaved" class="last-saved">Last saved: {{ lastSaved }}</span>
      <button @click="saveResponse" :disabled="saving || !hasChanges" class="save-button">
        {{ saving ? 'Saving...' : 'Save Response' }}
      </button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">Response saved successfully!</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

const responseText = ref(props.existing?.response_text || '')
const originalText = ref(props.existing?.response_text || '')
const showHelp = ref(false)
const saving = ref(false)
const error = ref(null)
const success = ref(false)
const lastSaved = ref(props.existing?.submitted_at ? new Date(props.existing.submitted_at).toLocaleString() : null)

const hasChanges = computed(() => {
  return responseText.value.trim() !== originalText.value.trim()
})

// Watch for external updates
watch(() => props.existing, (newVal) => {
  if (newVal?.response_text !== undefined) {
    responseText.value = newVal.response_text
    originalText.value = newVal.response_text
    if (newVal.submitted_at) {
      lastSaved.value = new Date(newVal.submitted_at).toLocaleString()
    }
  }
}, { deep: true })

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
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.help-button {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.help-button:hover {
  background: #e0e0e0;
}

.help-text {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #079baa;
}

.help-text p {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #555;
}

.help-text ul {
  margin: 0;
  padding-left: 20px;
}

.help-text li {
  margin-bottom: 6px;
  color: #666;
}

.response-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.response-textarea:focus {
  outline: none;
  border-color: #079baa;
}

.response-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
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
  .help-button,
  .action-bar,
  .error-message,
  .success-message {
    display: none;
  }
  
  .response-textarea {
    border: 1px solid #ddd;
  }
}
</style>

