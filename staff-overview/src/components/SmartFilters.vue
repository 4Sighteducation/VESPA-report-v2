<template>
  <div class="smart-filters-section">
    <div class="smart-filters-header">
      <h3>Smart Filters</h3>
      <button @click="addFilter" class="add-filter-button">
        + Add Filter
      </button>
    </div>
    
    <div v-if="smartFilters.length === 0" class="no-filters-message">
      <p>No smart filters applied. Click "+ Add Filter" to filter by VESPA scores.</p>
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
</template>

<script setup>
import { ref } from 'vue'

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

const addFilter = () => {
  smartFilters.value.push({
    id: `filter-${Date.now()}-${filterIdCounter++}`,
    dimension: 'vision',
    operator: 'gte',
    value: 5
  })
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
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.smart-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.smart-filters-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 700;
}

.add-filter-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #079baa, #7bd8d0);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(7, 155, 170, 0.3);
}

.add-filter-button:hover {
  background: linear-gradient(135deg, #067a87, #62d1d2);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(7, 155, 170, 0.4);
}

.no-filters-message {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
  background: #f9f9f9;
  border-radius: 6px;
  border: 2px dashed #e0e0e0;
}

.no-filters-message p {
  margin: 0;
}

.smart-filters-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.smart-filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px solid #e0e0e0;
  transition: border-color 0.3s;
}

.smart-filter-row:hover {
  border-color: #079baa;
}

.filter-select,
.filter-input {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
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
  flex: 0 0 40px;
  height: 40px;
  background: #fee;
  color: #c00;
  border: 2px solid #fcc;
  border-radius: 6px;
  font-size: 24px;
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
  transform: scale(1.1);
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

