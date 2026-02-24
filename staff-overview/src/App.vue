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

      <!-- Role-aware tabs (prevents tutor vs subject-teacher confusion) -->
      <div v-if="showTabs" class="overview-tabs" role="tablist" aria-label="Staff tabs">
        <button
          v-if="hasCoachingTab"
          class="overview-tab"
          :class="{ active: activeTab === 'coaching' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'coaching'"
          @click="activeTab = 'coaching'"
        >
          Coaching
        </button>
        <button
          v-if="hasSubjectTeacherTab"
          class="overview-tab"
          :class="{ active: activeTab === 'subject_teacher' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'subject_teacher'"
          @click="activeTab = 'subject_teacher'"
        >
          Subject teacher
        </button>
      </div>
      
      <!-- Filter bar -->
      <FilterBar
        :filters="overviewData.filters"
        :lockedFilters="lockedFilters"
        :preservedValues="preservedFilterValues"
        @filter-changed="handleFilterChange"
        @lock-changed="handleLockChange"
      />
      
      <!-- Smart Filters (VESPA Score filtering) -->
      <SmartFilters v-model="smartFilters" />
      
      <!-- Coaching (tutor/HOY/admin) -->
      <StudentTable
        v-if="activeTab === 'coaching'"
        :students="overviewData.students"
        :activeFilters="activeFilters"
        :smartFilters="smartFilters"
        @view-report="handleViewReport"
        @data-updated="handleDataUpdated"
      />

      <!-- Subject teacher (references only) -->
      <SubjectTeacherReferences
        v-else
        :students="overviewData.students"
        :activeFilters="activeFilters"
        :smartFilters="smartFilters"
        :staffEmail="user?.email || ''"
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
import { computed, ref, onMounted, watch } from 'vue'
import LoadingState from './components/LoadingState.vue'
import ErrorState from './components/ErrorState.vue'
import StaffOverviewHeader from './components/StaffOverviewHeader.vue'
import FilterBar from './components/FilterBar.vue'
import SmartFilters from './components/SmartFilters.vue'
import StudentTable from './components/StudentTable.vue'
import SubjectTeacherReferences from './components/SubjectTeacherReferences.vue'
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

// Tabs: coaching vs subject teacher
const activeTab = ref('coaching') // 'coaching' | 'subject_teacher'

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

// Track previous cycle to detect changes (MUST be declared before loadOverviewData uses it!)
const previousCycle = ref(null)
const initialLoadDone = ref(false) // Prevent unnecessary reload on FilterBar mount

// Smart filters for VESPA score filtering
const smartFilters = ref([])

const staffRoles = computed(() => overviewData.value?.staffMember?.roles || [])
const hasSubjectTeacherTab = computed(() => staffRoles.value.includes('subject_teacher'))
const hasCoachingTab = computed(() => staffRoles.value.some(r => r !== 'subject_teacher'))
const showTabs = computed(() => hasSubjectTeacherTab.value && hasCoachingTab.value)

watch(
  () => staffRoles.value.join(','),
  () => {
    // Default: coaching if available, otherwise subject teacher.
    if (hasCoachingTab.value) activeTab.value = 'coaching'
    else if (hasSubjectTeacherTab.value) activeTab.value = 'subject_teacher'
  },
  { immediate: true }
)

// Methods
const loadOverviewData = async (cycleFilter = 1) => {
  // Store cycle for comparison (default to Cycle 1)
  previousCycle.value = cycleFilter
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
    
    // Fetch overview data from API with cycle filter.
    // When the Subject Teacher tab is active, restrict to subject-teacher-linked students only.
    const opts = activeTab.value === 'subject_teacher' ? { connectionRole: 'subject_teacher' } : null
    const data = await staffAPI.getStaffOverview(user.value.email, cycleFilter, opts)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load staff overview')
    }
    
    overviewData.value = data
    console.log('[Staff Overview] Data loaded successfully:', data)
    initialLoadDone.value = true // Mark initial load as complete
    
  } catch (err) {
    console.error('[Staff Overview] Error loading data:', err)
    error.value = err.message || 'Failed to load overview. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleFilterChange = (filters) => {
  activeFilters.value = filters
  
  // Update preserved values to sync filter display state
  preservedFilterValues.value.cycle = filters.cycle || ''
  if (filters.group) preservedFilterValues.value.group = filters.group
  if (filters.year) preservedFilterValues.value.year = filters.year
  if (filters.status) preservedFilterValues.value.status = filters.status
  if (filters.search) preservedFilterValues.value.search = filters.search
  
  // Preserve locked filter values for persistence
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
  
  // ONLY reload if cycle filter actually changed (not for other filters!)
  const cycleFilter = filters.cycle && filters.cycle !== '' ? parseInt(filters.cycle) : null
  const cycleChanged = cycleFilter !== previousCycle.value
  
  // Skip reload if this is the initial filter emit (FilterBar mounting)
  if (cycleChanged && initialLoadDone.value) {
    console.log('[Staff Overview] Cycle filter changed, re-fetching data for cycle:', cycleFilter)
    previousCycle.value = cycleFilter
    loadOverviewData(cycleFilter)
  } else if (cycleChanged && !initialLoadDone.value) {
    // First filter emit - just sync the state, don't reload
    console.log('[Staff Overview] Initial filter sync, skipping reload')
    previousCycle.value = cycleFilter
  } else {
    console.log('[Staff Overview] Filter changed (non-cycle), updating local state only')
    // Just update activeFilters - no backend reload needed for group/year/status/search
  }
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
  
  // Refresh data to show any changes made in the report
  console.log('[Staff Overview] Refreshing data after report modal closed')
  loadOverviewData(previousCycle.value)
}

const handleDataUpdated = () => {
  // Refresh data when student table emits update (after inline edits)
  console.log('[Staff Overview] Data updated, refreshing from Knack')
  loadOverviewData(previousCycle.value)
}

// Lifecycle
onMounted(() => {
  loadOverviewData(1) // Default to Cycle 1
})

watch(
  () => activeTab.value,
  () => {
    // Switching tabs should re-fetch using the correct connection_role filter.
    loadOverviewData(previousCycle.value || 1)
  }
)
</script>

<style scoped>
#staff-overview-app {
  max-width: 1600px;
  margin: 0 auto;
  padding: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.overview-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overview-tabs {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
}

.overview-tab {
  border: none;
  background: transparent;
  color: #374151;
  font-weight: 900;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.overview-tab:hover {
  background: #f3f4f6;
}

.overview-tab.active {
  background: #111827;
  color: #fff;
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

