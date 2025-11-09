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
        @view-answers="showViewAnswersModal = true"
      >
        <template #radar-chart>
          <RadarChart
            :allScores="reportData.scores"
            :selectedCycle="selectedCycle"
            :compact="true"
          />
        </template>
      </ReportHeader>
      
      <!-- View Answers Modal -->
      <ViewAnswersModal
        :isOpen="showViewAnswersModal"
        :cycle="selectedCycle"
        :responses="questionResponses"
        @close="showViewAnswersModal = false"
        @cycle-changed="handleCycleChange"
      />
      
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
import ViewAnswersModal from './components/ViewAnswersModal.vue'
import { reportAPI } from './services/api.js'
import { knackAuth } from './services/knackAuth.js'

// State
const reportData = ref(null)
const selectedCycle = ref(1)
const loading = ref(true)
const error = ref(null)
const user = ref(null)
const showViewAnswersModal = ref(false)
const questionResponses = ref({})

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
    
    // Extract question responses for View Answers modal
    if (data.responses) {
      questionResponses.value = data.responses
    }
    
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
  /* ULTRA-COMPACT PRINT STYLES - FIT ON 1-2 PAGES */
  
  * {
    box-sizing: border-box;
  }
  
  #vespa-report-app {
    max-width: none;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .report-container {
    border-radius: 0;
    background: white;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Minimal page margins */
  @page {
    size: A4 portrait;
    margin: 10mm 8mm;
  }
  
  /* Hide ALL interactive elements */
  button,
  .help-button,
  .expand-button,
  .save-button,
  .print-button,
  .action-bar,
  .action-buttons,
  .error-message,
  .success-message,
  .last-saved,
  .cycle-selector,
  .textarea-wrapper button,
  .date-fields {
    display: none !important;
  }
  
  /* ULTRA-COMPACT HEADER */
  .report-header {
    padding: 6px 8px !important;
    min-height: auto !important;
    page-break-after: avoid;
  }
  
  .header-top {
    gap: 8px !important;
    grid-template-columns: auto 1fr auto !important;
  }
  
  .school-logo {
    height: 30px !important;
    max-height: 30px !important;
  }
  
  .student-info h1 {
    font-size: 14pt !important;
    margin: 0 !important;
    line-height: 1.2 !important;
  }
  
  .student-details {
    font-size: 8pt !important;
    margin-top: 2px !important;
  }
  
  /* VERY COMPACT RADAR CHART */
  .header-center {
    max-height: 120px !important;
    max-width: 120px !important;
  }
  
  .header-center canvas {
    max-height: 120px !important;
    max-width: 120px !important;
  }
  
  /* ULTRA-COMPACT CATEGORY ROWS */
  .coaching-content {
    padding: 4px !important;
    gap: 4px !important;
  }
  
  .category-row {
    margin-bottom: 4px !important;
    padding: 0 !important;
    page-break-inside: avoid;
    box-shadow: none !important;
    border: 0.5px solid #ccc !important;
  }
  
  .category-header {
    padding: 4px 8px !important;
  }
  
  .category-header h3 {
    font-size: 10pt !important;
    margin: 0 !important;
    letter-spacing: 0 !important;
  }
  
  .row-content {
    padding: 6px !important;
    gap: 6px !important;
    grid-template-columns: 60px 1fr !important;
  }
  
  .score-card {
    padding: 8px 6px !important;
    min-height: auto !important;
  }
  
  .score-number {
    font-size: 24pt !important;
  }
  
  .score-label {
    font-size: 7pt !important;
  }
  
  /* Hide staff content in print to save space */
  .staff-content {
    display: none !important;
  }
  
  .student-content {
    font-size: 8pt !important;
    line-height: 1.3 !important;
  }
  
  .statement p {
    margin: 0 !important;
    font-size: 8pt !important;
  }
  
  .questions h4 {
    font-size: 8pt !important;
    margin: 4px 0 2px 0 !important;
  }
  
  .questions ul {
    margin: 0 !important;
    padding-left: 12px !important;
  }
  
  .questions li {
    font-size: 7pt !important;
    margin-bottom: 2px !important;
    line-height: 1.2 !important;
  }
  
  /* ULTRA-COMPACT TEXT SECTIONS */
  .student-response,
  .student-goals {
    margin-bottom: 6px !important;
    padding: 6px !important;
    page-break-inside: avoid;
  }
  
  .section-header h3 {
    font-size: 10pt !important;
    margin: 0 0 4px 0 !important;
  }
  
  textarea {
    border: 0.5px solid #ccc !important;
    padding: 4px !important;
    min-height: 40px !important;
    max-height: 40px !important;
    font-size: 7pt !important;
    line-height: 1.2 !important;
    overflow: hidden !important;
  }
  
  /* Hide staff coaching completely */
  .staff-coaching-record {
    display: none !important;
  }
  
  /* Global font optimizations */
  body {
    font-size: 8pt !important;
    line-height: 1.2 !important;
  }
  
  h1 {
    font-size: 14pt !important;
  }
  
  h2 {
    font-size: 12pt !important;
  }
  
  h3 {
    font-size: 10pt !important;
  }
  
  h4 {
    font-size: 9pt !important;
  }
  
  /* Prevent page breaks in bad places */
  .report-header,
  .category-row,
  .student-response,
  .student-goals {
    page-break-inside: avoid;
  }
  
  /* Force content to fit */
  * {
    max-width: 100% !important;
  }
}
</style>

