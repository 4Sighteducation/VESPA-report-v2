<template>
  <div class="filter-bar">
    <div class="filter-group" :class="{ 'locked': lockedFilters.group }">
      <div class="filter-label-row">
        <label for="cycle-filter">Cycle:</label>
        <button 
          @click="toggleLock('cycle')" 
          class="lock-button"
          :title="lockedFilters.cycle ? 'Unlock filter' : 'Lock filter'"
        >
          {{ lockedFilters.cycle ? '🔒' : '🔓' }}
        </button>
      </div>
      <select id="cycle-filter" v-model="selectedCycle" @change="emitFilters">
        <option value="">All Cycles</option>
        <option v-for="cycle in filters.cycles" :key="cycle" :value="cycle">
          Cycle {{ cycle }}
        </option>
      </select>
    </div>

    <div class="filter-group" :class="{ 'locked': lockedFilters.group }">
      <div class="filter-label-row">
        <label for="group-filter">Group:</label>
        <button 
          @click="toggleLock('group')" 
          class="lock-button"
          :title="lockedFilters.group ? 'Unlock filter' : 'Lock filter'"
        >
          {{ lockedFilters.group ? '🔒' : '🔓' }}
        </button>
      </div>
      <select id="group-filter" v-model="selectedGroup" @change="emitFilters">
        <option value="">All Groups</option>
        <option v-for="group in filters.groups" :key="group" :value="group">
          {{ group }}
        </option>
      </select>
    </div>

    <div class="filter-group" :class="{ 'locked': lockedFilters.year }">
      <div class="filter-label-row">
        <label for="year-filter">Year:</label>
        <button 
          @click="toggleLock('year')" 
          class="lock-button"
          :title="lockedFilters.year ? 'Unlock filter' : 'Lock filter'"
        >
          {{ lockedFilters.year ? '🔒' : '🔓' }}
        </button>
      </div>
      <select id="year-filter" v-model="selectedYear" @change="emitFilters">
        <option value="">All Years</option>
        <option v-for="year in filters.yearGroups" :key="year" :value="year">
          Year {{ year }}
        </option>
      </select>
    </div>

    <div class="filter-group" :class="{ 'locked': lockedFilters.status }">
      <div class="filter-label-row">
        <label for="status-filter">Status:</label>
        <button 
          @click="toggleLock('status')" 
          class="lock-button"
          :title="lockedFilters.status ? 'Unlock filter' : 'Lock filter'"
        >
          {{ lockedFilters.status ? '🔒' : '🔓' }}
        </button>
      </div>
      <select id="status-filter" v-model="selectedStatus" @change="emitFilters">
        <option value="">All Students</option>
        <option value="completed">Completed</option>
        <option value="not_completed">Not Completed</option>
      </select>
    </div>

    <div class="filter-group" :class="{ 'locked': lockedFilters.search }">
      <div class="filter-label-row">
        <label for="search-input">Search:</label>
        <button 
          @click="toggleLock('search')" 
          class="lock-button"
          :title="lockedFilters.search ? 'Unlock filter' : 'Lock filter'"
        >
          {{ lockedFilters.search ? '🔒' : '🔓' }}
        </button>
      </div>
      <input
        id="search-input"
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
import { ref, watch } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  lockedFilters: {
    type: Object,
    default: () => ({
      cycle: false,
      group: false,
      year: false,
      status: false,
      search: false
    })
  },
  preservedValues: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['filter-changed', 'lock-changed'])

const selectedCycle = ref(props.preservedValues.cycle || '')
const selectedGroup = ref(props.preservedValues.group || '')
const selectedYear = ref(props.preservedValues.year || '')
const selectedStatus = ref(props.preservedValues.status || '')
const searchText = ref(props.preservedValues.search || '')

// Watch for preserved values changes (when cycle changes and locked filters are restored)
watch(() => props.preservedValues, (newValues) => {
  let changed = false
  if (newValues.cycle !== undefined && selectedCycle.value !== newValues.cycle) {
    selectedCycle.value = newValues.cycle || ''
    changed = true
  }
  if (newValues.group !== undefined && selectedGroup.value !== newValues.group) {
    selectedGroup.value = newValues.group || ''
    changed = true
  }
  if (newValues.year !== undefined && selectedYear.value !== newValues.year) {
    selectedYear.value = newValues.year || ''
    changed = true
  }
  if (newValues.status !== undefined && selectedStatus.value !== newValues.status) {
    selectedStatus.value = newValues.status || ''
    changed = true
  }
  if (newValues.search !== undefined && searchText.value !== newValues.search) {
    searchText.value = newValues.search || ''
    changed = true
  }
  // Re-emit filters if values were restored (but don't trigger cycle change if cycle wasn't locked)
  if (changed) {
    emitFilters()
  }
}, { deep: true })

const toggleLock = (filterName) => {
  const newLockState = { ...props.lockedFilters }
  newLockState[filterName] = !newLockState[filterName]
  emit('lock-changed', newLockState)
}

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
  // Only clear unlocked filters
  if (!lockedFilters.value.cycle) selectedCycle.value = ''
  if (!lockedFilters.value.group) selectedGroup.value = ''
  if (!lockedFilters.value.year) selectedYear.value = ''
  if (!lockedFilters.value.status) selectedStatus.value = ''
  if (!lockedFilters.value.search) searchText.value = ''
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
  padding: 8px;
  border-radius: 6px;
  transition: background 0.3s, border 0.3s;
  border: 2px solid transparent;
}

.filter-group.locked {
  background: #e3f2fd;
  border-color: #079baa;
}

.filter-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lock-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
  line-height: 1;
}

.lock-button:hover {
  background: rgba(7, 155, 170, 0.1);
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

