<template>
  <div class="filter-bar">
    <div class="filter-group">
      <label for="cycle-filter">Cycle:</label>
      <select id="cycle-filter" v-model="selectedCycle" @change="emitFilters">
        <option value="">All Cycles</option>
        <option v-for="cycle in filters.cycles" :key="cycle" :value="cycle">
          Cycle {{ cycle }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label for="group-filter">Group:</label>
      <select id="group-filter" v-model="selectedGroup" @change="emitFilters">
        <option value="">All Groups</option>
        <option v-for="group in filters.groups" :key="group" :value="group">
          {{ group }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label for="year-filter">Year:</label>
      <select id="year-filter" v-model="selectedYear" @change="emitFilters">
        <option value="">All Years</option>
        <option v-for="year in filters.yearGroups" :key="year" :value="year">
          Year {{ year }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label for="status-filter">Status:</label>
      <select id="status-filter" v-model="selectedStatus" @change="emitFilters">
        <option value="">All Students</option>
        <option value="completed">Completed</option>
        <option value="not_completed">Not Completed</option>
      </select>
    </div>

    <div class="filter-group">
      <input
        type="text"
        v-model="searchText"
        @input="emitFilters"
        placeholder="Search by name..."
        class="search-input"
      />
    </div>

    <button @click="clearFilters" class="clear-button">Clear Filters</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['filter-changed'])

const selectedCycle = ref('')
const selectedGroup = ref('')
const selectedYear = ref('')
const selectedStatus = ref('')
const searchText = ref('')

const emitFilters = () => {
  emit('filter-changed', {
    cycle: selectedCycle.value,
    group: selectedGroup.value,
    year: selectedYear.value,
    status: selectedStatus.value,
    search: searchText.value
  })
}

const clearFilters = () => {
  selectedCycle.value = ''
  selectedGroup.value = ''
  selectedYear.value = ''
  selectedStatus.value = ''
  searchText.value = ''
  emitFilters()
}
</script>

<style scoped>
.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-group select,
.search-input {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  background: white;
}

.filter-group select:focus,
.search-input:focus {
  outline: none;
  border-color: #079baa;
}

.search-input {
  min-width: 200px;
}

.clear-button {
  padding: 10px 20px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  color: #666;
}

.clear-button:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-group,
  .search-input {
    width: 100%;
    min-width: auto;
  }
  
  .clear-button {
    width: 100%;
  }
}
</style>

