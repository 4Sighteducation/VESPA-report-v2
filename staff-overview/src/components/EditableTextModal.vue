<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="handleClose">&times;</button>
      </div>
      <div class="modal-body">
        <textarea
          v-model="localText"
          class="edit-textarea"
          :placeholder="placeholder"
          rows="12"
          :disabled="saving"
        ></textarea>
      </div>
      <div class="modal-footer">
        <span v-if="error" class="error-text">{{ error }}</span>
        <div class="button-group">
          <button @click="handleClose" class="cancel-button" :disabled="saving">
            Cancel
          </button>
          <button @click="handleSave" class="save-button" :disabled="saving || !hasChanges">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Edit Text'
  },
  text: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Enter text here...'
  }
})

const emit = defineEmits(['close', 'save'])

const localText = ref('')
const originalText = ref('')
const saving = ref(false)
const error = ref(null)

// Watch for modal open/close and text changes
watch(() => [props.isOpen, props.text], ([isOpen, text]) => {
  if (isOpen) {
    localText.value = text || ''
    originalText.value = text || ''
    error.value = null
  }
}, { immediate: true })

const hasChanges = computed(() => {
  return localText.value.trim() !== originalText.value.trim()
})

const handleSave = async () => {
  if (!hasChanges.value) return
  
  saving.value = true
  error.value = null
  
  try {
    await emit('save', localText.value)
    // Close on successful save
    emit('close')
  } catch (err) {
    error.value = err.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (hasChanges.value && !confirm('You have unsaved changes. Close without saving?')) {
    return
  }
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid #e0e0e0;
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
  line-height: 1;
  padding: 0;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.edit-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  min-height: 300px;
  transition: border-color 0.3s;
}

.edit-textarea:focus {
  outline: none;
  border-color: #079baa;
  box-shadow: 0 0 0 3px rgba(7, 155, 170, 0.1);
}

.edit-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 2px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.error-text {
  color: #d32f2f;
  font-size: 14px;
  font-weight: 600;
}

.button-group {
  display: flex;
  gap: 12px;
}

.cancel-button,
.save-button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button {
  background: #e0e0e0;
  color: #333;
}

.cancel-button:hover:not(:disabled) {
  background: #d0d0d0;
}

.save-button {
  background: #079baa;
  color: white;
}

.save-button:hover:not(:disabled) {
  background: #067a87;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.cancel-button:disabled,
.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-container {
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-header h3 {
    font-size: 18px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .edit-textarea {
    font-size: 14px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .button-group {
    width: 100%;
  }
  
  .cancel-button,
  .save-button {
    flex: 1;
  }
}
</style>

