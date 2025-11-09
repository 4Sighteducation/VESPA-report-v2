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
        @filter-changed="handleFilterChange"
      />
      
      <!-- Student table -->
      <StudentTable
        :students="overviewData.students"
        :activeFilters="activeFilters"
        @view-report="handleViewReport"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LoadingState from './components/LoadingState.vue'
import ErrorState from './components/ErrorState.vue'
import StaffOverviewHeader from './components/StaffOverviewHeader.vue'
import FilterBar from './components/FilterBar.vue'
import StudentTable from './components/StudentTable.vue'
import { staffAPI } from './services/api.js'
import { knackAuth } from './services/knackAuth.js'

// State
const overviewData = ref(null)
const activeFilters = ref({})
const loading = ref(true)
const error = ref(null)
const user = ref(null)

// Methods
const loadOverviewData = async () => {
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
    
    console.log('[Staff Overview] Loading data for:', user.value.email)
    
    // Fetch overview data from API
    const data = await staffAPI.getStaffOverview(user.value.email)
    
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
}

const handleViewReport = (student) => {
  console.log('[Staff Overview] View report for:', student.name)
  
  // Navigate to individual report page (scene_1284)
  // Pass student email as URL parameter
  const reportUrl = `#vespa-coaching-report/?email=${encodeURIComponent(student.email)}`
  
  // Use Knack navigation if available
  if (typeof Knack !== 'undefined' && Knack.router) {
    window.location.hash = reportUrl
  } else {
    window.location.hash = reportUrl
  }
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

