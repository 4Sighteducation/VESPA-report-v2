<template>
  <div class="report-header">
    <div class="header-top">
      <!-- Left: Logo + Student Info -->
      <div class="header-left">
        <img 
          v-if="student.logoUrl" 
          :src="getLogoUrl(student.logoUrl)" 
          alt="School logo" 
          class="school-logo"
          @error="handleLogoError"
        />
        <div class="student-info">
          <h1>{{ student.name }}</h1>
          <div class="student-details">
            <span v-if="student.yearGroup">Year {{ student.yearGroup }}</span>
            <span v-if="student.group">{{ student.group }}</span>
            <span v-if="student.establishment">{{ student.establishment }}</span>
          </div>
        </div>
      </div>

      <!-- Center: Radar Chart Slot -->
      <div class="header-center">
        <slot name="radar-chart"></slot>
      </div>

      <!-- Right: Cycle Selector -->
      <div class="header-right">
        <div class="cycle-selector">
          <button
            v-for="cycleNum in availableCycles"
            :key="cycleNum"
            @click="$emit('cycle-changed', cycleNum)"
            :class="['cycle-button', { active: cycleNum === selectedCycle }]"
          >
            {{ cycleNum }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  availableCycles: {
    type: Array,
    default: () => [1, 2, 3]
  },
  selectedCycle: {
    type: Number,
    required: true
  },
  allScores: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['cycle-changed'])

const getLogoUrl = (url) => {
  if (!url) return ''
  
  // Handle non-string values (objects, arrays, etc.)
  if (typeof url !== 'string') {
    console.warn('[Report Header] Logo URL is not a string:', url)
    // If it's an object with a url property, use that
    if (typeof url === 'object' && url.url) return url.url
    return ''
  }
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) return url
  // If it's a Knack asset, construct proper URL
  if (url.includes('knack.com')) return url
  // Otherwise return as-is
  return url
}

const handleLogoError = (e) => {
  console.warn('[Report Header] Logo failed to load:', props.student.logoUrl)
  e.target.style.display = 'none'
}
</script>

<style scoped>
.report-header {
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  padding: 30px 40px;
  color: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-height: 280px;
}

.header-top {
  display: grid;
  grid-template-columns: 1fr 300px 150px;
  gap: 30px;
  align-items: center;
}

/* Left: Logo + Student Info */
.header-left {
  display: flex;
  gap: 20px;
  align-items: center;
}

.school-logo {
  height: 80px;
  width: auto;
  object-fit: contain;
  background: white;
  padding: 10px;
  border-radius: 8px;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  min-width: 200px;
}

.student-info h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
}

.student-details {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  opacity: 0.95;
}

.student-details span {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

/* Center: Radar Chart */
.header-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Right: Cycle Selector */
.header-right {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.cycle-selector {
  display: flex;
  gap: 12px;
}

.cycle-button {
  width: 50px;
  height: 50px;
  border: 2px solid white;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.cycle-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.cycle-button.active {
  background: white;
  color: #079baa;
  border-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .report-header {
    padding: 20px;
  }
  
  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .school-logo {
    height: 60px;
  }
  
  .student-info h1 {
    font-size: 24px;
  }
  
  .cycle-selector {
    width: 100%;
    justify-content: center;
  }
}

@media print {
  .cycle-selector {
    display: none;
  }
}
</style>

