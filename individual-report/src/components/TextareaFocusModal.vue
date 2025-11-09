<template>
  <div v-if="isOpen" class="textarea-modal-overlay" @click="handleClose">
    <div class="textarea-modal-content" @click.stop>
      <div class="textarea-modal-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="handleClose" aria-label="Close">&times;</button>
      </div>
      
      <div class="textarea-modal-body">
        <textarea
          ref="textareaRef"
          v-model="localValue"
          class="focus-textarea"
          :placeholder="placeholder"
          :rows="rows"
          @keydown.esc="handleClose"
        ></textarea>
      </div>
      
      <div class="textarea-modal-footer">
        <button class="cancel-button" @click="handleCancel">Cancel</button>
        <button class="save-button" @click="handleSave">Save & Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Edit Text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'save'])

const localValue = ref(props.modelValue)
const textareaRef = ref(null)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// Auto-focus textarea when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    localValue.value = props.modelValue
    await nextTick()
    if (textareaRef.value) {
      textareaRef.value.focus()
    }
  }
})

const handleSave = () => {
  emit('update:modelValue', localValue.value)
  emit('save', localValue.value)
  emit('close')
}

const handleCancel = () => {
  localValue.value = props.modelValue // Revert changes
  emit('close')
}

const handleClose = () => {
  // Ask user if they want to save if there are changes
  if (localValue.value !== props.modelValue) {
    if (confirm('You have unsaved changes. Save before closing?')) {
      handleSave()
    } else {
      handleCancel()
    }
  } else {
    emit('close')
  }
}
</script>

<style scoped>
.textarea-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.textarea-modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.textarea-modal-header {
  padding: 24px 30px;
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  color: white;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.textarea-modal-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 36px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  line-height: 1;
  padding: 0;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.textarea-modal-body {
  padding: 30px;
  flex: 1;
  overflow: auto;
}

.focus-textarea {
  width: 100%;
  min-height: 400px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 17px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.3s;
}

.focus-textarea:focus {
  outline: none;
  border-color: #079baa;
  box-shadow: 0 0 0 3px rgba(7, 155, 170, 0.1);
}

.textarea-modal-footer {
  padding: 20px 30px;
  background: #f8f9fa;
  border-radius: 0 0 16px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e0e0e0;
}

.cancel-button,
.save-button {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button {
  background: #e0e0e0;
  color: #333;
}

.cancel-button:hover {
  background: #d0d0d0;
}

.save-button {
  background: #079baa;
  color: white;
}

.save-button:hover {
  background: #067a87;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(7, 155, 170, 0.3);
}

@media (max-width: 768px) {
  .textarea-modal-overlay {
    padding: 0;
  }
  
  .textarea-modal-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .textarea-modal-header {
    border-radius: 0;
    padding: 20px;
  }
  
  .textarea-modal-header h3 {
    font-size: 18px;
  }
  
  .textarea-modal-body {
    padding: 20px;
  }
  
  .focus-textarea {
    font-size: 16px;
    min-height: 300px;
  }
  
  .textarea-modal-footer {
    border-radius: 0;
    padding: 16px 20px;
  }
  
  .cancel-button,
  .save-button {
    flex: 1;
    padding: 14px 20px;
  }
}

@media print {
  .textarea-modal-overlay {
    display: none;
  }
}
</style>

