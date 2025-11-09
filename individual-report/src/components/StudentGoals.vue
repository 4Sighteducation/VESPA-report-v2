<template>
  <div class="student-goals">
    <div class="section-header">
      <h3>🎯 Your Study Goals</h3>
      <button @click="showHelp = !showHelp" class="help-button">
        {{ showHelp ? 'Hide Help' : 'Need help?' }}
      </button>
    </div>

    <div v-if="showHelp" class="help-text">
      <p>Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound):</p>
      <ul>
        <li>Be specific about what you want to achieve</li>
        <li>Set realistic goals you can measure</li>
        <li>Focus on areas where your VESPA scores are lower</li>
        <li>Set a clear deadline for completion</li>
      </ul>
    </div>

    <textarea
      v-model="goalText"
      class="goal-textarea"
      placeholder="Describe your study goals for this cycle..."
      rows="6"
      :disabled="saving"
    ></textarea>

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

const goalText = ref(props.existing?.goal_text || '')
const goalSetDate = ref(props.existing?.goal_set_date ? props.existing.goal_set_date.split('T')[0] : '')
const goalDueDate = ref(props.existing?.goal_due_date ? props.existing.goal_due_date.split('T')[0] : '')

const originalGoalText = ref(props.existing?.goal_text || '')
const originalSetDate = ref(goalSetDate.value)
const originalDueDate = ref(goalDueDate.value)

const showHelp = ref(false)
const saving = ref(false)
const error = ref(null)
const success = ref(false)
const lastSaved = ref(null)

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
    goalText.value = newVal.goal_text || ''
    goalSetDate.value = newVal.goal_set_date ? newVal.goal_set_date.split('T')[0] : ''
    goalDueDate.value = newVal.goal_due_date ? newVal.goal_due_date.split('T')[0] : ''
    
    originalGoalText.value = goalText.value
    originalSetDate.value = goalSetDate.value
    originalDueDate.value = goalDueDate.value
  }
}, { deep: true })

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

.goal-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
  margin-bottom: 16px;
}

.goal-textarea:focus {
  outline: none;
  border-color: #079baa;
}

.goal-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
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
  .help-button,
  .action-bar,
  .error-message,
  .success-message {
    display: none;
  }
  
  .goal-textarea,
  .date-field input[type="date"] {
    border: 1px solid #ddd;
  }
}
</style>

