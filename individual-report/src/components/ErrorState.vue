<template>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <button v-if="showRetry" @click="$emit('retry')" class="retry-button">
      Try Again
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Something went wrong'
  },
  message: {
    type: String,
    required: true
  },
  showRetry: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['retry'])
</script>

<style scoped>
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-container h3 {
  color: #d32f2f;
  margin: 0 0 12px 0;
  font-size: 24px;
}

.error-container p {
  color: #666;
  margin: 0 0 24px 0;
  font-size: 16px;
  max-width: 500px;
}

.retry-button {
  padding: 12px 24px;
  background: #079baa;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.retry-button:hover {
  background: #067a87;
}
</style>

