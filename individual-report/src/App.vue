<template>
  <div id="vespa-report-app">
    <LoadingState v-if="loading" message="Loading your VESPA report..." />
    
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadReportData"
    />
    
    <div v-else-if="reportData" class="report-container">
      <!-- Header with student info, radar chart, and cycle selector -->
      <ReportHeader
        :student="reportData.student"
        :availableCycles="availableCycles"
        :selectedCycle="selectedCycle"
        :allScores="reportData.scores"
        @cycle-changed="handleCycleChange"
      >
        <template #radar-chart>
          <RadarChart
            :allScores="reportData.scores"
            :selectedCycle="selectedCycle"
            :compact="true"
          />
        </template>
      </ReportHeader>
      
      <!-- Main report content - 5 stacked rows -->
      <CoachingContent
        :scores="currentCycleScores"
        :content="currentCoachingContent"
      />
      
      <!-- Student reflection section -->
      <StudentResponse
        :cycle="selectedCycle"
        :existing="currentProfile.response"
        @save="handleSaveResponse"
      />
      
      <!-- Student goals section -->
      <StudentGoals
        :cycle="selectedCycle"
        :existing="currentProfile.goals"
        @save="handleSaveGoals"
      />
      
      <!-- Staff coaching notes (only visible to staff) -->
      <StaffCoachingRecord
        v-if="isStaff"
        :cycle="selectedCycle"
        :existing="currentProfile.coaching"
        @save="handleSaveCoaching"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingState from './components/LoadingState.vue'
import ErrorState from './components/ErrorState.vue'
import ReportHeader from './components/ReportHeader.vue'
import RadarChart from './components/RadarChart.vue'
import CoachingContent from './components/CoachingContent.vue'
import StudentResponse from './components/StudentResponse.vue'
import StudentGoals from './components/StudentGoals.vue'
import StaffCoachingRecord from './components/StaffCoachingRecord.vue'
import { reportAPI } from './services/api.js'
import { knackAuth } from './services/knackAuth.js'

// State
const reportData = ref(null)
const selectedCycle = ref(1)
const loading = ref(true)
const error = ref(null)
const user = ref(null)

// Computed properties
const isStaff = computed(() => {
  return user.value && user.value.isStaff
})

const availableCycles = computed(() => {
  if (!reportData.value || !reportData.value.scores) return [1, 2, 3]
  // Return cycles that have scores
  const completedCycles = reportData.value.scores.map(s => s.cycle)
  // Always show all 3 cycle buttons, but data will be missing for incomplete cycles
  return [1, 2, 3]
})

const currentCycleScores = computed(() => {
  if (!reportData.value || !reportData.value.scores) {
    return {
      vision: null,
      effort: null,
      systems: null,
      practice: null,
      attitude: null,
      overall: null
    }
  }
  
  const cycleData = reportData.value.scores.find(s => s.cycle === selectedCycle.value)
  return cycleData || {
    vision: null,
    effort: null,
    systems: null,
    practice: null,
    attitude: null,
    overall: null
  }
})

const currentCoachingContent = computed(() => {
  if (!reportData.value || !reportData.value.coachingContent) return {}
  return reportData.value.coachingContent[selectedCycle.value] || {}
})

const currentProfile = computed(() => {
  if (!reportData.value || !reportData.value.studentProfile) {
    return {
      response: null,
      goals: null,
      coaching: null
    }
  }
  return reportData.value.studentProfile[selectedCycle.value] || {
    response: null,
    goals: null,
    coaching: null
  }
})

// Methods
const handleCycleChange = (newCycle) => {
  selectedCycle.value = newCycle
}

const loadReportData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Get logged-in user
    user.value = knackAuth.getUser()
    
    if (!user.value || !user.value.email) {
      throw new Error('Please log in to view your report')
    }
    
    console.log('[VESPA Report] Loading data for:', user.value.email)
    
    // Fetch report data from API
    const data = await reportAPI.getReportData(user.value.email)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load report data')
    }
    
    reportData.value = data
    
    // Set selected cycle to most recent completed cycle
    if (data.scores && data.scores.length > 0) {
      const maxCycle = Math.max(...data.scores.map(s => s.cycle))
      selectedCycle.value = maxCycle
    }
    
    console.log('[VESPA Report] Data loaded successfully:', data)
  } catch (err) {
    console.error('[VESPA Report] Error loading data:', err)
    error.value = err.message || 'Failed to load report. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleSaveResponse = async (data) => {
  try {
    console.log('[VESPA Report] Saving student response:', data)
    
    // TODO: Implement save to Supabase + Knack
    // For now, just update local state
    if (reportData.value.studentProfile && reportData.value.studentProfile[data.cycle]) {
      if (!reportData.value.studentProfile[data.cycle].response) {
        reportData.value.studentProfile[data.cycle].response = {}
      }
      reportData.value.studentProfile[data.cycle].response.response_text = data.responseText
      reportData.value.studentProfile[data.cycle].response.submitted_at = new Date().toISOString()
    }
    
    // In production, call API:
    // await reportAPI.saveStudentResponse(user.value.email, data.cycle, data.responseText, recordId)
    
  } catch (err) {
    console.error('[VESPA Report] Error saving response:', err)
    throw err
  }
}

const handleSaveGoals = async (data) => {
  try {
    console.log('[VESPA Report] Saving student goals:', data)
    
    // TODO: Implement save to Supabase + Knack
    // For now, just update local state
    if (reportData.value.studentProfile && reportData.value.studentProfile[data.cycle]) {
      if (!reportData.value.studentProfile[data.cycle].goals) {
        reportData.value.studentProfile[data.cycle].goals = {}
      }
      reportData.value.studentProfile[data.cycle].goals.goal_text = data.goalText
      reportData.value.studentProfile[data.cycle].goals.goal_set_date = data.goalSetDate
      reportData.value.studentProfile[data.cycle].goals.goal_due_date = data.goalDueDate
    }
    
    // In production, call API:
    // await reportAPI.saveStudentGoals(user.value.email, data.cycle, data, recordId)
    
  } catch (err) {
    console.error('[VESPA Report] Error saving goals:', err)
    throw err
  }
}

const handleSaveCoaching = async (data) => {
  try {
    console.log('[VESPA Report] Saving staff coaching:', data)
    
    // TODO: Implement save to Supabase + Knack
    // For now, just update local state
    if (reportData.value.studentProfile && reportData.value.studentProfile[data.cycle]) {
      if (!reportData.value.studentProfile[data.cycle].coaching) {
        reportData.value.studentProfile[data.cycle].coaching = {}
      }
      reportData.value.studentProfile[data.cycle].coaching.coaching_text = data.coachingText
      reportData.value.studentProfile[data.cycle].coaching.coaching_date = data.coachingDate
    }
    
    // In production, call API:
    // await reportAPI.saveStaffCoaching(user.value.email, data.cycle, data, recordId)
    
  } catch (err) {
    console.error('[VESPA Report] Error saving coaching notes:', err)
    throw err
  }
}

// Lifecycle
onMounted(() => {
  loadReportData()
})
</script>

<style scoped>
#vespa-report-app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.report-container {
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 768px) {
  #vespa-report-app {
    padding: 10px;
  }
}

@media print {
  #vespa-report-app {
    max-width: none;
    padding: 0;
  }
  
  .report-container {
    border-radius: 0;
  }
}
</style>

