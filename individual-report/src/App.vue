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
    
    // Save to Supabase + Knack via API
    const result = await reportAPI.saveStudentResponse(
      user.value.email,
      data.cycle,
      data.responseText
    )
    
    // Update local state on success
    if (result.success && reportData.value.studentProfile && reportData.value.studentProfile[data.cycle]) {
      if (!reportData.value.studentProfile[data.cycle].response) {
        reportData.value.studentProfile[data.cycle].response = {}
      }
      reportData.value.studentProfile[data.cycle].response.response_text = data.responseText
      reportData.value.studentProfile[data.cycle].response.submitted_at = result.submittedAt || new Date().toISOString()
    }
    
    // Log dual-write status
    if (!result.knackWritten) {
      console.warn('[VESPA Report] Supabase saved but Knack write failed:', result.knackError)
    }
    
  } catch (err) {
    console.error('[VESPA Report] Error saving response:', err)
    throw err
  }
}

const handleSaveGoals = async (data) => {
  try {
    console.log('[VESPA Report] Saving student goals:', data)
    
    // Save to Supabase + Knack via API
    const result = await reportAPI.saveStudentGoals(
      user.value.email,
      data.cycle,
      {
        goalText: data.goalText,
        goalSetDate: data.goalSetDate,
        goalDueDate: data.goalDueDate
      }
    )
    
    // Update local state on success
    if (result.success && reportData.value.studentProfile && reportData.value.studentProfile[data.cycle]) {
      if (!reportData.value.studentProfile[data.cycle].goals) {
        reportData.value.studentProfile[data.cycle].goals = {}
      }
      reportData.value.studentProfile[data.cycle].goals.goal_text = data.goalText
      reportData.value.studentProfile[data.cycle].goals.goal_set_date = data.goalSetDate
      reportData.value.studentProfile[data.cycle].goals.goal_due_date = data.goalDueDate
    }
    
    // Log dual-write status
    if (!result.knackWritten) {
      console.warn('[VESPA Report] Supabase saved but Knack write failed:', result.knackError)
    }
    
  } catch (err) {
    console.error('[VESPA Report] Error saving goals:', err)
    throw err
  }
}

const handleSaveCoaching = async (data) => {
  try {
    console.log('[VESPA Report] Saving staff coaching:', data)
    
    // Save to Supabase + Knack via API
    const result = await reportAPI.saveStaffCoaching(
      user.value.email,
      user.value.email, // Staff email (same as logged-in user if staff)
      data.cycle,
      {
        coachingText: data.coachingText,
        coachingDate: data.coachingDate
      }
    )
    
    // Update local state on success
    if (result.success && reportData.value.studentProfile && reportData.value.studentProfile[data.cycle]) {
      if (!reportData.value.studentProfile[data.cycle].coaching) {
        reportData.value.studentProfile[data.cycle].coaching = {}
      }
      reportData.value.studentProfile[data.cycle].coaching.coaching_text = data.coachingText
      reportData.value.studentProfile[data.cycle].coaching.coaching_date = data.coachingDate
    }
    
    // Log dual-write status
    if (!result.knackWritten) {
      console.warn('[VESPA Report] Supabase saved but Knack write failed:', result.knackError)
    }
    
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
    background: white;
  }
  
  /* Print optimization for A4 */
  @page {
    size: A4;
    margin: 15mm;
  }
  
  /* Hide interactive elements */
  button:not(.cycle-button),
  .help-button,
  .expand-button,
  .save-button,
  .print-button,
  .action-bar,
  .error-message,
  .success-message,
  .last-saved {
    display: none !important;
  }
  
  /* Make textareas look like static text */
  textarea {
    border: 1px solid #ddd;
    padding: 8px;
    min-height: auto !important;
    resize: none;
    background: white;
    font-size: 11pt;
    line-height: 1.4;
  }
  
  /* Optimize text sizes for print */
  body {
    font-size: 11pt;
    line-height: 1.4;
  }
  
  h1 {
    font-size: 18pt;
  }
  
  h2 {
    font-size: 16pt;
  }
  
  h3 {
    font-size: 14pt;
  }
  
  h4 {
    font-size: 12pt;
  }
  
  /* Ensure content fits on page */
  .category-row {
    page-break-inside: avoid;
    margin-bottom: 15px;
  }
  
  /* Compact spacing */
  .coaching-content {
    padding: 10px;
    gap: 15px;
  }
  
  .row-content {
    padding: 10px;
    gap: 10px;
  }
  
  .student-response,
  .student-goals {
    margin-bottom: 15px;
    padding: 10px;
  }
  
  /* Hide staff coaching notes in print */
  .staff-coaching-record {
    display: none;
  }
  
  /* Make sure links are visible in print */
  .activity-button {
    border: 1px solid #ccc;
    padding: 4px 8px;
    font-size: 9pt;
  }
  
  /* Compact radar chart */
  .header-center {
    max-height: 200px;
  }
}
</style>

