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
        :key="`response-${selectedCycle}`"
        :cycle="selectedCycle"
        :existing="currentProfile.response"
        @save="handleSaveResponse"
      />
      
      <!-- Student goals section -->
      <StudentGoals
        :key="`goals-${selectedCycle}`"
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
  const profile = reportData.value.studentProfile[selectedCycle.value] || {
    response: null,
    goals: null,
    coaching: null
  }
  console.log(`[App] Cycle ${selectedCycle.value} profile:`, {
    hasResponse: !!profile.response?.response_text,
    hasGoals: !!profile.goals?.goal_text,
    responsePreview: profile.response?.response_text?.substring(0, 50)
  })
  return profile
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
    
    // Check for email parameter in URL (for staff viewing student reports)
    // Knack uses hash-based routing, so check hash for query parameters
    let studentEmail = null
    const hash = window.location.hash
    if (hash && hash.includes('?')) {
      const queryString = hash.split('?')[1]
      const urlParams = new URLSearchParams(queryString)
      studentEmail = urlParams.get('email')
    }
    
    // Use student email from URL if provided (staff view), otherwise use logged-in user's email
    const targetEmail = studentEmail || user.value.email
    
    console.log('[VESPA Report] Loading data for:', targetEmail, studentEmail ? '(staff view)' : '(student view)')
    
    // Fetch report data from API
    const data = await reportAPI.getReportData(targetEmail)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load report data')
    }
    
    reportData.value = data
    
    // Extract question responses for View Answers modal
    if (data.responses) {
      questionResponses.value = data.responses
    }
    
    // Set selected cycle to Cycle 1 by default
    // Users should start with Cycle 1 even if they completed later cycles
    if (data.scores && data.scores.length > 0) {
      selectedCycle.value = 1  // Always default to Cycle 1
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
  
  // Watch for hash changes (for staff viewing different students)
  window.addEventListener('hashchange', () => {
    console.log('[VESPA Report] Hash changed, reloading data...')
    loadReportData()
  })
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

/* ============================================
   PRINT STYLES - ULTRA AGGRESSIVE
   Goal: Fit entire report on 1-2 A4 pages MAX
   ============================================ */
@media print {
  /* Page setup - minimal margins */
  @page {
    size: A4 portrait;
    margin: 5mm !important;
  }
  
  /* Global resets */
  * {
    box-sizing: border-box !important;
    max-width: 100% !important;
  }
  
  body,
  html {
    font-size: 7pt !important;
    line-height: 1.1 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Container resets */
  #vespa-report-app,
  .report-container {
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    background: white !important;
  }
  
  /* ========== HIDE ALL INTERACTIVE ELEMENTS ========== */
  button,
  .help-button,
  .expand-button,
  .save-button,
  .print-button,
  .view-answers-button,
  .action-button,
  .action-buttons,
  .action-bar,
  .cycle-selector,
  .cycle-button,
  .error-message,
  .success-message,
  .last-saved,
  .date-fields,
  .textarea-wrapper .expand-button,
  input[type="date"] {
    display: none !important;
    visibility: hidden !important;
  }
  
  /* ========== HEADER - ULTRA COMPACT ========== */
  .report-header {
    padding: 3mm 4mm !important;
    min-height: auto !important;
    max-height: 35mm !important;
    page-break-after: avoid !important;
    background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%) !important;
  }
  
  .header-top {
    display: flex !important;
    gap: 3mm !important;
    align-items: center !important;
  }
  
  .header-left {
    display: flex !important;
    align-items: center !important;
    gap: 3mm !important;
  }
  
  .school-logo {
    height: 15mm !important;
    max-height: 15mm !important;
    width: auto !important;
  }
  
  .student-info {
    gap: 1mm !important;
  }
  
  .student-info h1 {
    font-size: 12pt !important;
    margin: 0 !important;
    line-height: 1.1 !important;
    font-weight: 700 !important;
  }
  
  .student-details {
    font-size: 7pt !important;
    margin-top: 1mm !important;
    gap: 2mm !important;
  }
  
  .student-details span {
    padding: 1mm 2mm !important;
    font-size: 7pt !important;
  }
  
  /* HIDE radar chart in print */
  .header-center {
    display: none !important;
  }
  
  .radar-chart-container {
    display: none !important;
  }
  
  /* ========== CATEGORY ROWS - EXTREME COMPRESSION ========== */
  .coaching-content {
    padding: 1mm !important;
    gap: 1mm !important;
  }
  
  .category-row {
    margin-bottom: 1mm !important;
    padding: 0 !important;
    page-break-inside: avoid !important;
    box-shadow: none !important;
    border: 0.3pt solid #999 !important;
    border-left-width: 2pt !important;
  }
  
  .category-header {
    padding: 1mm 2mm !important;
  }
  
  .category-header h3 {
    font-size: 9pt !important;
    margin: 0 !important;
    letter-spacing: 0 !important;
    font-weight: 700 !important;
  }
  
  /* FORCE 3-column structure: score | statement | coaching */
  .row-content {
    display: grid !important;
    grid-template-columns: 18mm 1fr 1fr !important;
    grid-template-rows: auto !important;
    padding: 2mm !important;
    gap: 2mm !important;
  }
  
  /* Ensure student content stays in column 2 */
  .student-content {
    grid-column: 2 !important;
    grid-row: 1 !important;
  }
  
  /* Ensure staff content stays in column 3 */
  .staff-content {
    grid-column: 3 !important;
    grid-row: 1 !important;
  }
  
  /* Score card - minimal */
  .score-card {
    padding: 2mm 1mm !important;
    min-height: auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .score-number {
    font-size: 18pt !important;
    line-height: 1 !important;
    font-weight: 900 !important;
  }
  
  .score-label {
    font-size: 6pt !important;
    margin-top: 0 !important;
  }
  
  /* Student content - very compact */
  .student-content {
    font-size: 7pt !important;
    line-height: 1.2 !important;
  }
  
  .statement p {
    margin: 0 0 1mm 0 !important;
    font-size: 7pt !important;
    line-height: 1.2 !important;
  }
  
  .questions {
    margin-top: 1mm !important;
  }
  
  .questions h4 {
    font-size: 7pt !important;
    margin: 0 0 0.5mm 0 !important;
    font-weight: 700 !important;
  }
  
  .questions ul {
    margin: 0 !important;
    padding-left: 3mm !important;
  }
  
  .questions li {
    font-size: 6pt !important;
    margin-bottom: 0.5mm !important;
    line-height: 1.1 !important;
  }
  
  /* HIDE reflection questions to save space */
  .questions {
    display: none !important;
  }
  
  /* SHOW staff content (coaching comments and activities) */
  .staff-content {
    display: block !important;
    background: #f8f9fa !important;
    padding: 2mm !important;
    border-left: 1pt solid #ff9800 !important;
  }
  
  .coaching-comments,
  .activities {
    display: block !important;
  }
  
  .coaching-comments h4,
  .activities h4 {
    font-size: 7pt !important;
    margin: 0 0 1mm 0 !important;
  }
  
  .coaching-comments ul,
  .activities ul {
    margin: 0 !important;
    padding-left: 3mm !important;
  }
  
  .coaching-comments li {
    font-size: 6pt !important;
    line-height: 1.1 !important;
    margin-bottom: 0.5mm !important;
  }
  
  .activity-buttons {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 1mm !important;
  }
  
  .activity-button {
    display: inline-block !important;
    padding: 0.5mm 2mm !important;
    font-size: 6pt !important;
    border-width: 0.3pt !important;
  }
  
  /* SHOW student response/goals textareas, HIDE staff coaching record */
  .student-response,
  .student-goals {
    display: block !important;
    margin-bottom: 2mm !important;
    padding: 2mm !important;
    page-break-inside: avoid !important;
  }
  
  .staff-coaching-record {
    display: none !important;
  }
  
  .section-header {
    margin-bottom: 1mm !important;
  }
  
  .section-header h3 {
    font-size: 9pt !important;
    margin: 0 !important;
    font-weight: 700 !important;
  }
  
  /* Textareas as static text */
  .response-textarea,
  .goal-textarea,
  textarea {
    border: 0.3pt solid #ccc !important;
    padding: 1mm !important;
    min-height: 8mm !important;
    max-height: 12mm !important;
    height: auto !important;
    font-size: 6pt !important;
    line-height: 1.1 !important;
    overflow: hidden !important;
    resize: none !important;
    background: white !important;
  }
  
  .textarea-wrapper {
    position: static !important;
  }
  
  /* ========== TYPOGRAPHY ========== */
  h1 {
    font-size: 12pt !important;
    line-height: 1.1 !important;
    margin: 0 !important;
  }
  
  h2 {
    font-size: 10pt !important;
    line-height: 1.1 !important;
    margin: 0 !important;
  }
  
  h3 {
    font-size: 9pt !important;
    line-height: 1.1 !important;
    margin: 0 !important;
  }
  
  h4 {
    font-size: 7pt !important;
    line-height: 1.1 !important;
    margin: 0 !important;
  }
  
  p,
  li,
  span {
    font-size: 7pt !important;
    line-height: 1.2 !important;
  }
  
  /* ========== PREVENT PAGE BREAKS ========== */
  .report-header,
  .category-row,
  .student-response,
  .student-goals {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  /* ========== FORCE MINIMAL SPACING ========== */
  div,
  section,
  article {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
}
</style>

