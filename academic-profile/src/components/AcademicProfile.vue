<template>
  <div class="vespa-profile-display">
    <section class="vespa-section profile-section" :class="{ 'ks4-theme': isKs4 }">
      <h2 class="vespa-section-title">
        <span style="display: inline-flex; align-items: center;">
          Student Profile
          <span class="profile-info-button" @click="showInfoModal = true" title="Understanding These Grades">i</span>
        </span>
        
        <div class="profile-actions">
          <button
            v-if="!isStudent && !isKs4"
            class="small-toggle"
            @click="toggleMeg"
            :title="showMeg ? 'Hide MEG' : 'Show MEG'">
            MEG: {{ showMeg ? 'On' : 'Off' }}
          </button>
          <button
            v-if="!isStudent && !isKs4"
            class="small-toggle"
            @click="toggleStg"
            :title="showStg ? 'Hide STG' : 'Show STG'">
            STG: {{ showStg ? 'On' : 'Off' }}
          </button>
          <button
            v-if="!isStudent && isKs4"
            class="small-toggle"
            @click="togglePredicted"
            :title="showPredicted ? 'Hide Predicted Grade' : 'Show Predicted Grade'">
            Predicted: {{ showPredicted ? 'On' : 'Off' }}
          </button>

        <!-- Edit/Save button for staff -->
          <span v-if="editable && isStaff" 
              class="master-edit-icon"
              :class="isEditMode ? 'save-icon' : 'edit-icon'"
              @click="toggleEditMode"
              :title="isEditMode ? 'Save All Changes' : 'Edit All Grades'">
          {{ isEditMode ? '💾 Save All' : '✏️ Edit Grades' }}
          </span>
        </div>
      </h2>

      <div class="profile-info" :class="{ 'ks4-layout': isKs4 }">
        <!-- Student Details -->
        <div class="profile-details" :class="{ 'ks4-profile-strip': isKs4 }">
          <div class="profile-name">{{ displayStudentName }}</div>

          <div class="profile-items">
            <div class="profile-item">
              <span class="profile-label">School:</span>
              <span class="profile-value">{{ displaySchool }}</span>
            </div>
            
            <div v-if="displayYearGroup" class="profile-item">
              <span class="profile-label">Year Group:</span>
              <span class="profile-value">{{ displayYearGroup }}</span>
            </div>
            
            <div v-if="displayTutorGroup" class="profile-item">
              <span class="profile-label">Tutor Group:</span>
              <span class="profile-value">{{ displayTutorGroup }}</span>
            </div>
            
            <div v-if="!isKs4 && student.attendance" class="profile-item">
              <span class="profile-label">Attendance:</span>
              <span class="profile-value">{{ formatPercentage(student.attendance) }}</span>
            </div>

            <div v-if="!isKs4 && student.priorAttainment" class="profile-item">
              <span class="profile-label">Prior attainment:</span>
              <span class="profile-value">{{ student.priorAttainment }}</span>
            </div>

            <div v-if="formattedUpdatedAt" class="profile-item">
              <span class="profile-label">Last update:</span>
              <span class="profile-value">{{ formattedUpdatedAt }}</span>
            </div>
          </div>
        </div>

        <!-- Subjects Grid -->
        <div class="subjects-container">
          <div class="subjects-grid" :class="{ 'ks4-grid': isKs4 }">
            <template v-if="isKs4">
              <SubjectCardKs4
                v-for="subject in subjects"
                :key="subject.id || subject.position"
                :subject="subject"
                :edit-mode="isEditMode"
                :is-staff="isStaff"
                :show-predicted="showPredicted"
                @update="handleSubjectUpdate"
              />
            </template>
            <template v-else>
              <SubjectCard
                v-for="subject in subjects"
                :key="subject.id || subject.position"
                :subject="subject"
                :edit-mode="isEditMode"
                :is-staff="isStaff"
                :show-meg="showMeg"
                :show-stg="showStg"
                @update="handleSubjectUpdate"
              />
            </template>
          </div>
          
          <div v-if="subjects.length === 0" class="no-subjects">
            No subjects available
          </div>
        </div>
      </div>

      <!-- Data source indicator (subtle dot for admin) -->
      <div v-if="dataSource" class="data-source-dot" 
           :class="dataSource === 'supabase' ? 'live-source' : 'fallback-source'"
           :title="`Data loaded from ${dataSource === 'supabase' ? 'Supabase (live)' : 'Knack (fallback)'}`">
      </div>
    </section>

    <!-- Info Modal -->
    <InfoModal 
      v-if="showInfoModal" 
      :is-staff="isStaff"
      :is-ks4="isKs4"
      @close="showInfoModal = false" 
    />

    <!-- Saving Overlay -->
    <div v-if="saving" class="saving-overlay">
      <div class="spinner"></div>
      <p>Saving changes...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SubjectCard from './SubjectCard.vue'
import SubjectCardKs4 from './SubjectCardKs4.vue'
import InfoModal from './InfoModal.vue'
import { updateSubjectGrade } from '../services/api.js'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  subjects: {
    type: Array,
    default: () => []
  },
  updatedAt: {
    type: String,
    default: null
  },
  editable: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'inline' // 'inline' or 'modal'
  },
  dataSource: {
    type: String,
    default: 'unknown'
  },
  // School-wide defaults (primarily for STUDENTS; students do not get MEG/STG toggles)
  uiDefaults: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['reload'])

// State
const isEditMode = ref(false)
const showInfoModal = ref(false)
const saving = ref(false)
const pendingChanges = ref({}) // Track changes before save
const showMeg = ref(false)
const showStg = ref(false)
const userOverrodeVisibility = ref(false)
const showPredicted = ref(false)

// Check if user is staff
const isStaff = computed(() => {
  if (typeof Knack === 'undefined') return false
  const roles = Knack.getUserRoles ? Knack.getUserRoles() : []
  return !roles.some(r => r.name === 'Student' || r.toLowerCase().includes('student'))
})

const isStudent = computed(() => !isStaff.value)

const isKs4 = computed(() => {
  const raw = (props.student?.yearGroup ?? '').toString()
  const m = raw.match(/(\d{1,2})/)
  const n = m ? parseInt(m[1], 10) : NaN
  return Number.isFinite(n) && n <= 11
})

const defaultMegFromSchool = computed(() => {
  const v = props.uiDefaults && Object.prototype.hasOwnProperty.call(props.uiDefaults, 'studentsShowMeg')
    ? props.uiDefaults.studentsShowMeg
    : undefined
  return v === undefined || v === null ? true : !!v
})

const defaultStgFromSchool = computed(() => {
  const v = props.uiDefaults && Object.prototype.hasOwnProperty.call(props.uiDefaults, 'studentsShowStg')
    ? props.uiDefaults.studentsShowStg
    : undefined
  return v === undefined || v === null ? false : !!v
})

// Apply school defaults everywhere on first load.
// - Students: always enforced (no toggles)
// - Staff: used as initial state, then staff can override locally
watch(
  [defaultMegFromSchool, defaultStgFromSchool, isStudent],
  () => {
    // KS4: no STG; "MEG visibility" becomes "Predicted grade visibility"
    if (isKs4.value) {
      if (isStudent.value) {
        showPredicted.value = defaultMegFromSchool.value
        showMeg.value = false
        showStg.value = false
        return
      }
      if (!userOverrodeVisibility.value) {
        showPredicted.value = defaultMegFromSchool.value
        showMeg.value = false
        showStg.value = false
      }
      return
    }
    if (isStudent.value) {
      // Enforced for students (source of truth = school settings)
      showMeg.value = defaultMegFromSchool.value
      showStg.value = defaultStgFromSchool.value
      return
    }
    // Staff: only set defaults if they haven't toggled yet this session
    if (!userOverrodeVisibility.value) {
      showMeg.value = defaultMegFromSchool.value
      showStg.value = defaultStgFromSchool.value
    }
  },
  { immediate: true }
)

const toggleMeg = () => {
  userOverrodeVisibility.value = true
  showMeg.value = !showMeg.value
}

const toggleStg = () => {
  userOverrodeVisibility.value = true
  showStg.value = !showStg.value
}

const togglePredicted = () => {
  userOverrodeVisibility.value = true
  showPredicted.value = !showPredicted.value
}

// Helper: coerce json-ish values into clean strings for UI (prevents [object Object])
const coerceText = (v) => {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.length ? coerceText(v[0]) : ''
  if (typeof v === 'object') {
    for (const k of ['identifier', 'name', 'text', 'label', 'value']) {
      if (v && v[k]) return String(v[k]).trim()
    }
    try { return JSON.stringify(v) } catch (e) { return '' }
  }
  return String(v).trim()
}

const displayStudentName = computed(() => coerceText(props.student?.name) || 'Student')
const displaySchool = computed(() => coerceText(props.student?.school) || 'N/A')
const displayYearGroup = computed(() => coerceText(props.student?.yearGroup))
const displayTutorGroup = computed(() => coerceText(props.student?.tutorGroup))

const formattedUpdatedAt = computed(() => {
  if (!props.updatedAt) return ''
  const d = new Date(props.updatedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
})

// Toggle edit mode
const toggleEditMode = async () => {
  if (isEditMode.value) {
    // Save all changes
    await saveAllChanges()
  }
  isEditMode.value = !isEditMode.value
}

// Handle individual subject update
const handleSubjectUpdate = (subjectId, field, value) => {
  // Store pending changes
  if (!pendingChanges.value[subjectId]) {
    pendingChanges.value[subjectId] = {}
  }
  pendingChanges.value[subjectId][field] = value
  
  console.log('[Academic Profile] Change tracked:', { subjectId, field, value })
}

// Save all pending changes
const saveAllChanges = async () => {
  if (Object.keys(pendingChanges.value).length === 0) {
    console.log('[Academic Profile] No changes to save')
    return
  }

  saving.value = true

  try {
    const updatePromises = []
    
    // Update each subject that has changes
    for (const [subjectId, changes] of Object.entries(pendingChanges.value)) {
      updatePromises.push(
        updateSubjectGrade(subjectId, changes, window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl)
      )
    }

    const results = await Promise.all(updatePromises)
    
    const allSuccess = results.every(r => r.success)
    
    if (allSuccess) {
      console.log('[Academic Profile] All changes saved successfully')
      
      // Clear pending changes
      pendingChanges.value = {}
      
      // Reload data from server
      emit('reload')
      
      // Show success message
      showTemporaryMessage('All changes saved successfully!', 'success')
    } else {
      throw new Error('Some updates failed')
    }
  } catch (err) {
    console.error('[Academic Profile] Save error:', err)
    showTemporaryMessage('Error saving changes. Please try again.', 'error')
  } finally {
    saving.value = false
  }
}

// Format percentage
const formatPercentage = (decimal) => {
  if (decimal === null || decimal === undefined) return 'N/A'
  return `${Math.round(decimal * 100)}%`
}

// Show temporary message
const showTemporaryMessage = (message, type) => {
  // Simple alert for now - can be enhanced with a toast component
  alert(message)
}
</script>

<style scoped>
/* Container */
.vespa-profile-display {
  margin-bottom: 24px;
  width: 100%;
  max-width: 100% !important;
  box-sizing: border-box;
}

.vespa-section {
  background-color: #2a3c7a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 16px;
  border: 2px solid #079baa;
  position: relative;
}

/* KS4 theme (distinct from KS5): dark green */
.vespa-section.ks4-theme {
  background-color: #0f2b1a;
  border-color: rgba(124, 255, 154, 0.55);
}

.vespa-section.ks4-theme .vespa-section-title {
  color: #7CFF9A !important;
  border-bottom-color: rgba(124, 255, 154, 0.45);
}

.vespa-section.ks4-theme .profile-info-button {
  color: #7CFF9A;
  border-color: rgba(124, 255, 154, 0.8);
}

.vespa-section.ks4-theme .profile-info-button:hover {
  background-color: #7CFF9A;
  color: #0f2b1a;
}

.vespa-section.ks4-theme .profile-details {
  background-color: #123522;
  border-color: rgba(124, 255, 154, 0.22);
}

.vespa-section.ks4-theme .profile-name,
.vespa-section.ks4-theme .profile-label {
  color: #7CFF9A;
}

.vespa-section.ks4-theme .small-toggle {
  border-color: rgba(124, 255, 154, 0.3);
}

.vespa-section.ks4-theme .master-edit-icon.edit-icon {
  color: #7CFF9A;
  border-color: rgba(124, 255, 154, 0.85);
}

.vespa-section.ks4-theme .subjects-grid {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

/* KS4 layout: compact strip on top, then a 3-column grid by default */
.profile-info.ks4-layout {
  flex-direction: column;
}

.profile-details.ks4-profile-strip {
  width: 100%;
  min-height: auto;
  padding: 12px 14px;
}

.profile-details.ks4-profile-strip .profile-name {
  font-size: 20px;
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.profile-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.profile-details.ks4-profile-strip .profile-item {
  margin-bottom: 0;
  padding: 4px 0;
}

.subjects-grid.ks4-grid {
  grid-template-columns: repeat(3, minmax(210px, 1fr));
  gap: 10px;
}

@media (max-width: 1050px) {
  .subjects-grid.ks4-grid {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }
}

@media (max-width: 620px) {
  .subjects-grid.ks4-grid {
    grid-template-columns: 1fr;
  }
}

.vespa-section-title {
  color: #00e5db !important;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #079baa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-actions {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.small-toggle {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.small-toggle:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* Info button */
.profile-info-button {
  font-size: 16px;
  color: #00e5db;
  cursor: pointer;
  border: 1px solid #00e5db;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-left: 10px;
  transition: all 0.3s;
}

.profile-info-button:hover {
  background-color: #00e5db;
  color: #23356f;
}

/* Edit button */
.master-edit-icon {
  cursor: pointer;
  font-size: 0.7em;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.master-edit-icon.edit-icon {
  color: #00e5db;
  border-color: #00e5db;
}

.master-edit-icon.save-icon {
  color: #4caf50;
  border-color: #4caf50;
}

.master-edit-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Profile layout */
.profile-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: stretch;
}

.profile-details {
  flex: 1;
  min-width: 200px;
  min-height: 170px;
  background-color: #334285;
  border-radius: 8px;
  border: 1px solid rgba(7, 155, 170, 0.3);
  padding: 16px;
}

.profile-name {
  font-size: 22px;
  color: #00e5db;
  margin-bottom: 12px;
  font-weight: 700;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(7, 155, 170, 0.3);
}

.profile-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.profile-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.profile-label {
  font-weight: 600;
  color: #00e5db;
  margin-right: 8px;
}

.profile-value {
  color: #f0f0f0;
}

/* Subjects */
.subjects-container {
  flex: 2;
  min-width: 280px;
  min-height: 170px;
  display: flex;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 400px) {
  .subjects-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.no-subjects {
  padding: 20px;
  text-align: center;
  color: #cccccc;
  font-style: italic;
}

/* Data source indicator */
/* Data source indicator - subtle dot */
.data-source-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: help;
  z-index: 10;
}

.data-source-dot.live-source {
  background: #4caf50; /* Green dot for live Supabase data */
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}

.data-source-dot.fallback-source {
  background: #ff9800; /* Orange dot for Knack fallback */
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.6);
}

/* Saving overlay */
.saving-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.saving-overlay p {
  color: white;
  font-size: 18px;
  margin-top: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
  }
  
  .subjects-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 400px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }
}
</style>

