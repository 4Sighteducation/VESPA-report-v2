<template>
  <div class="smart-filters-section">
    <div class="smart-filters-header" @click="toggleExpanded">
      <div class="header-left">
        <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
        <h3>Smart Filters</h3>
        <span v-if="smartFilters.length > 0" class="filter-count-badge">{{ smartFilters.length }}</span>
      </div>
      <button 
        @click.stop="addFilter" 
        class="add-filter-button"
        :class="{ compact: !isExpanded }"
      >
        +
      </button>
    </div>
    
    <div v-show="isExpanded" class="smart-filters-content">
      <div v-if="smartFilters.length === 0" class="no-filters-message">
        <p>Click "+ Add Filter" to filter by VESPA scores (e.g., Vision ≥ 7)</p>
      </div>
      
      <div v-else class="smart-filters-list">
      <div 
        v-for="(filter, index) in smartFilters" 
        :key="filter.id"
        class="smart-filter-row"
      >
        <!-- Dimension (Vision, Effort, etc) - Current cycle only -->
        <select v-model="filter.dimension" @change="emitFilters" class="filter-select dimension-select">
          <option value="vision">Vision</option>
          <option value="effort">Effort</option>
          <option value="systems">Systems</option>
          <option value="practice">Practice</option>
          <option value="attitude">Attitude</option>
          <option value="overall">Overall</option>
        </select>
        
        <!-- Operator -->
        <select v-model="filter.operator" @change="emitFilters" class="filter-select operator-select">
          <option value="gt">Greater than</option>
          <option value="gte">Greater or equal to</option>
          <option value="lt">Less than</option>
          <option value="lte">Less than or equal to</option>
          <option value="eq">Equal to</option>
        </select>
        
        <!-- Value -->
        <input 
          type="number" 
          v-model.number="filter.value" 
          @input="emitFilters"
          min="0" 
          max="10" 
          step="0.1"
          class="filter-input value-input"
          placeholder="0-10"
        />
        
        <!-- Remove button -->
        <button 
          @click="removeFilter(index)" 
          class="remove-filter-button"
          title="Remove filter"
        >
          ×
        </button>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Expand/collapse state
const isExpanded = ref(false)

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Local state for filters
const smartFilters = ref([...props.modelValue])

// Counter for unique IDs
let filterIdCounter = 0

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const addFilter = () => {
  smartFilters.value.push({
    id: `filter-${Date.now()}-${filterIdCounter++}`,
    dimension: 'vision',
    operator: 'gte',
    value: 5
  })
  isExpanded.value = true // Auto-expand when adding filter
  emitFilters()
}

const removeFilter = (index) => {
  smartFilters.value.splice(index, 1)
  emitFilters()
}

const emitFilters = () => {
  emit('update:modelValue', smartFilters.value)
}
</script>

<style scoped>
.smart-filters-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
}

.smart-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.3s;
  border-bottom: 2px solid #e0e0e0;
}

.smart-filters-header:hover {
  background: #f0f1f2;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s;
}

.smart-filters-header h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
  font-weight: 700;
}

.filter-count-badge {
  background: #079baa;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.add-filter-button {
  padding: 6px 12px;
  background: linear-gradient(135deg, #079baa, #7bd8d0);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(7, 155, 170, 0.3);
  line-height: 1;
  min-width: 32px;
  height: 32px;
}

.add-filter-button:hover {
  background: linear-gradient(135deg, #067a87, #62d1d2);
  transform: scale(1.05);
  box-shadow: 0 3px 6px rgba(7, 155, 170, 0.4);
}

.smart-filters-content {
  padding: 12px 16px;
}

.no-filters-message {
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
}

.no-filters-message p {
  margin: 0;
}

.smart-filters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.smart-filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  transition: border-color 0.3s;
}

.smart-filter-row:hover {
  border-color: #079baa;
}

.filter-select,
.filter-input {
  padding: 6px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  transition: border-color 0.3s;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #079baa;
  box-shadow: 0 0 0 3px rgba(7, 155, 170, 0.1);
}

.dimension-select {
  flex: 1;
  min-width: 120px;
}

.operator-select {
  flex: 1;
  min-width: 160px;
}

.value-input {
  flex: 0 0 100px;
  text-align: center;
  font-weight: 600;
}

/* Remove spinner arrows for Chrome, Safari, Edge, Opera */
.value-input::-webkit-outer-spin-button,
.value-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Keep number input for Firefox but style it */
.value-input[type=number] {
  -moz-appearance: textfield;
}

.remove-filter-button {
  flex: 0 0 32px;
  height: 32px;
  background: #fee;
  color: #c00;
  border: 2px solid #fcc;
  border-radius: 4px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.remove-filter-button:hover {
  background: #fcc;
  border-color: #faa;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .smart-filter-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-select,
  .filter-input {
    width: 100%;
  }
  
  .remove-filter-button {
    width: 100%;
  }
  
  .smart-filters-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .add-filter-button {
    width: 100%;
  }
}
</style>

