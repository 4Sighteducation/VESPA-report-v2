<template>
  <div id="staff-overview-app">
    <LoadingState v-if="loading" message="Loading student data..." />
    
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadOverviewData"
    />
    
    <div v-else-if="overviewData" class="overview-container">
      <!-- Header with staff info -->
      <StaffOverviewHeader
        :staffMember="overviewData.staffMember"
        :totalStudents="overviewData.students.length"
      />
      
      <!-- Filter bar -->
      <FilterBar
        :filters="overviewData.filters"
        :lockedFilters="lockedFilters"
        :preservedValues="preservedFilterValues"
        @filter-changed="handleFilterChange"
        @lock-changed="handleLockChange"
      />
      
      <!-- Student table -->
      <StudentTable
        :students="overviewData.students"
        :activeFilters="activeFilters"
        @view-report="handleViewReport"
      />
    </div>
    
    <!-- Student Report Modal -->
    <StudentReportModal
      :isOpen="reportModalOpen"
      :studentEmail="selectedStudentEmail"
      :studentName="selectedStudentName"
      @close="closeReportModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LoadingState from './components/LoadingState.vue'
import ErrorState from './components/ErrorState.vue'
import StaffOverviewHeader from './components/StaffOverviewHeader.vue'
import FilterBar from './components/FilterBar.vue'
import StudentTable from './components/StudentTable.vue'
import StudentReportModal from './components/StudentReportModal.vue'
import { staffAPI } from './services/api.js'
import { knackAuth } from './services/knackAuth.js'

// State
const overviewData = ref(null)
const activeFilters = ref({})
const loading = ref(true)
const error = ref(null)
const user = ref(null)
const reportModalOpen = ref(false)
const selectedStudentEmail = ref(null)
const selectedStudentName = ref(null)

// Filter lock state
const lockedFilters = ref({
  cycle: false,
  group: false,
  year: false,
  status: false,
  search: false
})

// Preserved filter values (for locked filters)
const preservedFilterValues = ref({})

// Methods
const loadOverviewData = async (cycleFilter = null) => {
  loading.value = true
  error.value = null
  
  try {
    // Get logged-in user
    user.value = knackAuth.getUser()
    
    if (!user.value || !user.value.email) {
      throw new Error('Please log in to view the staff overview')
    }
    
    if (!user.value.isStaff) {
      throw new Error('This page is only accessible to staff members')
    }
    
    console.log('[Staff Overview] Loading data for:', user.value.email, 'cycle filter:', cycleFilter)
    
    // Fetch overview data from API with cycle filter
    const data = await staffAPI.getStaffOverview(user.value.email, cycleFilter)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load staff overview')
    }
    
    overviewData.value = data
    console.log('[Staff Overview] Data loaded successfully:', data)
    
  } catch (err) {
    console.error('[Staff Overview] Error loading data:', err)
    error.value = err.message || 'Failed to load overview. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleFilterChange = (filters) => {
  activeFilters.value = filters
  
  // Preserve locked filter values
  if (lockedFilters.value.group && filters.group) {
    preservedFilterValues.value.group = filters.group
  }
  if (lockedFilters.value.year && filters.year) {
    preservedFilterValues.value.year = filters.year
  }
  if (lockedFilters.value.status && filters.status) {
    preservedFilterValues.value.status = filters.status
  }
  if (lockedFilters.value.search && filters.search) {
    preservedFilterValues.value.search = filters.search
  }
  
  // If cycle filter changed, re-fetch data from backend
  // But preserve locked filter values when re-fetching
  const cycleFilter = filters.cycle && filters.cycle !== '' ? parseInt(filters.cycle) : null
  console.log('[Staff Overview] Cycle filter changed, re-fetching data for cycle:', cycleFilter)
  console.log('[Staff Overview] Preserved locked values:', preservedFilterValues.value)
  loadOverviewData(cycleFilter)
}

const handleLockChange = (newLockState) => {
  lockedFilters.value = newLockState
  
  // When a filter is locked, preserve its current value
  if (newLockState.group && activeFilters.value.group) {
    preservedFilterValues.value.group = activeFilters.value.group
  }
  if (newLockState.year && activeFilters.value.year) {
    preservedFilterValues.value.year = activeFilters.value.year
  }
  if (newLockState.status && activeFilters.value.status) {
    preservedFilterValues.value.status = activeFilters.value.status
  }
  if (newLockState.search && activeFilters.value.search) {
    preservedFilterValues.value.search = activeFilters.value.search
  }
  
  // When a filter is unlocked, clear its preserved value
  if (!newLockState.group) {
    delete preservedFilterValues.value.group
  }
  if (!newLockState.year) {
    delete preservedFilterValues.value.year
  }
  if (!newLockState.status) {
    delete preservedFilterValues.value.status
  }
  if (!newLockState.search) {
    delete preservedFilterValues.value.search
  }
}

const handleViewReport = (student) => {
  console.log('[Staff Overview] Opening report modal for:', student.name, student.email)
  selectedStudentEmail.value = student.email
  selectedStudentName.value = student.name
  reportModalOpen.value = true
}

const closeReportModal = () => {
  reportModalOpen.value = false
  selectedStudentEmail.value = null
  selectedStudentName.value = null
}

// Lifecycle
onMounted(() => {
  loadOverviewData()
})
</script>

<style scoped>
#staff-overview-app {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.overview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 768px) {
  #staff-overview-app {
    padding: 10px;
  }
  
  .overview-container {
    gap: 15px;
  }
}
</style>

