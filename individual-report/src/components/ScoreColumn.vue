<template>
  <div class="score-column">
    <div
      v-for="(category, index) in categories"
      :key="category.name"
      class="score-box"
      :style="{ backgroundColor: category.color }"
    >
      <div class="score-label">{{ category.name }}</div>
      <div class="score-value">
        {{ scores[category.key] !== null && scores[category.key] !== undefined ? scores[category.key] : '-' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { vespaColors } from '../data/vespaColors.js'

const props = defineProps({
  scores: {
    type: Object,
    required: true
  }
})

const categories = [
  { name: 'VISION', key: 'vision', color: vespaColors.vision },
  { name: 'EFFORT', key: 'effort', color: vespaColors.effort },
  { name: 'SYSTEMS', key: 'systems', color: vespaColors.systems },
  { name: 'PRACTICE', key: 'practice', color: vespaColors.practice },
  { name: 'ATTITUDE', key: 'attitude', color: vespaColors.attitude }
]
</script>

<style scoped>
.score-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 180px;
}

.score-box {
  padding: 20px;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s, box-shadow 0.3s;
}

.score-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.score-label {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.score-value {
  font-size: 36px;
  font-weight: 900;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

@media (max-width: 1024px) {
  .score-column {
    flex-direction: row;
    flex-wrap: wrap;
    min-width: auto;
  }
  
  .score-box {
    flex: 1;
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .score-column {
    flex-direction: column;
  }
  
  .score-box {
    width: 100%;
  }
}

@media print {
  .score-box {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .score-box:hover {
    transform: none;
  }
}
</style>

