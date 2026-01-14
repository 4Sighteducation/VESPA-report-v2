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

      <div class="profile-info" :class="{ 'ks4-layout': isKs4, 'ks5-layout': !isKs4 }">
        <!-- Student Details -->
        <div class="profile-details" :class="{ 'ks4-profile-strip': isKs4, 'ks5-profile-strip': !isKs4 }">
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

          <!-- University Offers (simple v1) -->
          <div class="university-offers">
            <div class="university-offers-header">
              <div class="university-offers-title">University Offers</div>
              <div class="university-offers-actions">
                <button
                  v-if="offersEditable"
                  class="offers-edit-btn"
                  @click="openOffersEditor"
                  title="Add or edit up to 5 university offers">
                  ✏️ Edit Offers
                </button>
                <button
                  v-if="offers.length > 1"
                  class="offers-toggle-btn"
                  @click="offersExpanded = !offersExpanded">
                  {{ offersExpanded ? 'Hide all' : `View all (${offers.length})` }}
                </button>
              </div>
            </div>

            <div v-if="topOffer" class="university-offers-top">
              <div class="offer-line">
                <span class="offer-rank">#{{ topOffer.ranking }}</span>
                <span class="offer-uni">{{ topOffer.universityName || 'University' }}</span>
                <span class="offer-course" v-if="topOffer.courseTitle">— {{ topOffer.courseTitle }}</span>
              </div>
              <div class="offer-meta">
                <span v-if="topOffer.offer" class="offer-pill">Offer: {{ topOffer.offer }}</span>
                <span v-if="topOffer.ucasPoints !== null && topOffer.ucasPoints !== undefined && topOffer.ucasPoints !== ''" class="offer-pill">
                  UCAS: {{ topOffer.ucasPoints }}
                </span>
              </div>
            </div>

            <div v-else class="university-offers-empty">
              <span>No offers added yet.</span>
              <button v-if="offersEditable" class="offers-add-btn" @click="openOffersEditor">➕ Add offers</button>
            </div>

            <div v-if="offersExpanded && offers.length" class="university-offers-list">
              <div v-for="o in sortedOffers" :key="o._key" class="offer-item">
                <div class="offer-line">
                  <span class="offer-rank">#{{ o.ranking }}</span>
                  <span class="offer-uni">{{ o.universityName || 'University' }}</span>
                  <span class="offer-course" v-if="o.courseTitle">— {{ o.courseTitle }}</span>
                </div>
                <div class="offer-meta">
                  <span v-if="o.offer" class="offer-pill">Offer: {{ o.offer }}</span>
                  <span v-if="o.ucasPoints !== null && o.ucasPoints !== undefined && o.ucasPoints !== ''" class="offer-pill">
                    UCAS: {{ o.ucasPoints }}
                  </span>
                </div>
              </div>
            </div>
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

    <!-- University Offers Editor Modal -->
    <div v-if="offersEditorOpen" class="offers-modal-overlay" @click.self="closeOffersEditor">
      <div class="offers-modal">
        <div class="offers-modal-header">
          <div class="offers-modal-title">University Offers (max 5)</div>
          <button class="offers-modal-close" @click="closeOffersEditor">✖</button>
        </div>
        <div class="offers-modal-body">
          <div class="offers-help">
            Add up to 5 offers. The profile displays your <strong>#1 ranked</strong> offer by default.
          </div>

          <div class="offers-grid">
            <div class="offers-grid-head">Rank</div>
            <div class="offers-grid-head">University</div>
            <div class="offers-grid-head">Course</div>
            <div class="offers-grid-head">Offer</div>
            <div class="offers-grid-head">UCAS</div>
            <div class="offers-grid-head"></div>

            <template v-for="(row, idx) in offersDraft" :key="row._key">
              <div>
                <select v-model.number="row.ranking" class="offers-input">
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                  <option :value="3">3</option>
                  <option :value="4">4</option>
                  <option :value="5">5</option>
                </select>
              </div>
              <div><input v-model="row.universityName" class="offers-input" placeholder="e.g. Manchester" /></div>
              <div><input v-model="row.courseTitle" class="offers-input" placeholder="e.g. Computer Science" /></div>
              <div><input v-model="row.offer" class="offers-input" placeholder="e.g. AAB" /></div>
              <div><input v-model="row.ucasPoints" class="offers-input" placeholder="e.g. 128" /></div>
              <div>
                <button class="offers-remove" @click="removeOfferRow(idx)" title="Remove">🗑️</button>
              </div>
            </template>
          </div>

          <div class="offers-modal-actions">
            <button
              class="offers-secondary"
              @click="addOfferRow"
              :disabled="offersDraft.length >= 5">
              ➕ Add Offer
            </button>
          </div>
        </div>
        <div class="offers-modal-footer">
          <button class="offers-secondary" @click="closeOffersEditor">Cancel</button>
          <button class="offers-primary" @click="saveOffers" :disabled="offersSaving">
            {{ offersSaving ? 'Saving...' : 'Save Offers' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SubjectCard from './SubjectCard.vue'
import SubjectCardKs4 from './SubjectCardKs4.vue'
import InfoModal from './InfoModal.vue'
import { updateSubjectGrade, updateUniversityOffers } from '../services/api.js'

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
  academicYear: {
    type: String,
    default: null
  },
  editable: {
    type: Boolean,
    default: false
  },
  offersEditable: {
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

// University Offers state
const offersExpanded = ref(false)
const offersEditorOpen = ref(false)
const offersSaving = ref(false)
const offersDraft = ref([])

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

const normalizeOffer = (o) => {
  const uni = coerceText(o?.universityName ?? o?.university_name)
  const course = coerceText(o?.courseTitle ?? o?.course_title)
  const offer = coerceText(o?.offer ?? o?.offerText ?? o?.offer_text)
  const ucasRaw = (o?.ucasPoints ?? o?.ucas_points)
  const rankRaw = (o?.ranking ?? o?.rank)
  const ranking = Number.isFinite(Number(rankRaw)) ? parseInt(rankRaw, 10) : 1
  const ucasPoints = (ucasRaw === null || ucasRaw === undefined || String(ucasRaw).trim() === '') ? null : parseInt(ucasRaw, 10)
  return {
    _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    universityName: uni,
    courseTitle: course,
    offer: offer,
    ucasPoints: Number.isFinite(ucasPoints) ? ucasPoints : null,
    ranking: Math.min(5, Math.max(1, Number.isFinite(ranking) ? ranking : 1))
  }
}

const offers = computed(() => {
  const raw = props.student?.universityOffers
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .map(normalizeOffer)
    .filter(o => (o.universityName || o.courseTitle || o.offer || (o.ucasPoints !== null && o.ucasPoints !== undefined)))
    .slice(0, 5)
})

const sortedOffers = computed(() => {
  return [...offers.value]
    .sort((a, b) => (a.ranking || 999) - (b.ranking || 999))
    .map((o, idx) => ({ ...o, _key: o._key || `${idx}` }))
})

const topOffer = computed(() => {
  return sortedOffers.value.length ? sortedOffers.value[0] : null
})

const formattedUpdatedAt = computed(() => {
  if (!props.updatedAt) return ''
  const d = new Date(props.updatedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
})

const openOffersEditor = () => {
  offersDraft.value = sortedOffers.value.map(o => ({
    _key: o._key || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    universityName: o.universityName || '',
    courseTitle: o.courseTitle || '',
    offer: o.offer || '',
    ucasPoints: (o.ucasPoints === null || o.ucasPoints === undefined) ? '' : String(o.ucasPoints),
    ranking: o.ranking || 1
  }))
  if (offersDraft.value.length === 0) {
    offersDraft.value = [{
      _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      universityName: '',
      courseTitle: '',
      offer: '',
      ucasPoints: '',
      ranking: 1
    }]
  }
  offersEditorOpen.value = true
}

const closeOffersEditor = () => {
  offersEditorOpen.value = false
  offersDraft.value = []
}

const addOfferRow = () => {
  if (offersDraft.value.length >= 5) return
  const used = new Set(offersDraft.value.map(r => Number(r.ranking)))
  let nextRank = 1
  for (const r of [1, 2, 3, 4, 5]) {
    if (!used.has(r)) { nextRank = r; break }
  }
  offersDraft.value.push({
    _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    universityName: '',
    courseTitle: '',
    offer: '',
    ucasPoints: '',
    ranking: nextRank
  })
}

const removeOfferRow = (idx) => {
  offersDraft.value.splice(idx, 1)
  if (offersDraft.value.length === 0) addOfferRow()
}

const saveOffers = async () => {
  if (!props.offersEditable) return
  offersSaving.value = true
  try {
    const cleaned = offersDraft.value
      .map(r => ({
        universityName: (r.universityName || '').trim(),
        courseTitle: (r.courseTitle || '').trim(),
        offer: (r.offer || '').trim(),
        ucasPoints: (r.ucasPoints === null || r.ucasPoints === undefined || String(r.ucasPoints).trim() === '') ? null : parseInt(r.ucasPoints, 10),
        ranking: parseInt(r.ranking, 10)
      }))
      .filter(r => r.universityName || r.courseTitle || r.offer || (r.ucasPoints !== null && r.ucasPoints !== undefined))
      .slice(0, 5)

    const ranks = cleaned.map(r => r.ranking).filter(Boolean)
    const unique = new Set(ranks)
    if (ranks.length !== unique.size) throw new Error('Each offer must have a unique ranking (1-5).')
    for (const r of cleaned) {
      if (!(r.ranking >= 1 && r.ranking <= 5)) throw new Error('Ranking must be between 1 and 5.')
      if (r.ucasPoints !== null && !Number.isFinite(r.ucasPoints)) throw new Error('UCAS points must be a number.')
    }

    const apiUrl = window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl
    const email = props.student?.email
    const year = props.academicYear || null
    const resp = await updateUniversityOffers(email, cleaned, apiUrl, year)
    if (!resp || !resp.success) throw new Error(resp?.error || 'Failed to save offers')

    closeOffersEditor()
    emit('reload')
    showTemporaryMessage('University offers saved.', 'success')
  } catch (e) {
    console.error('[Academic Profile] saveOffers error:', e)
    showTemporaryMessage(e.message || 'Failed to save offers', 'error')
  } finally {
    offersSaving.value = false
  }
}

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

/* KS4 subjects layout is controlled by `.subjects-grid.ks4-grid` below */

/* KS4 layout: compact strip on top, then a 3-column grid by default */
.profile-info.ks4-layout {
  flex-direction: column;
}

.profile-info.ks5-layout {
  flex-direction: column;
}

.profile-details.ks4-profile-strip {
  width: 100%;
  min-height: auto;
  padding: 12px 14px;
}

.profile-details.ks5-profile-strip {
  width: 100%;
  min-height: auto;
  padding: 12px 14px;
}

.profile-details.ks4-profile-strip .profile-name {
  font-size: 20px;
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.profile-details.ks5-profile-strip .profile-name {
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

.profile-details.ks5-profile-strip .profile-item {
  margin-bottom: 0;
  padding: 4px 0;
}

.vespa-section.ks4-theme .subjects-grid.ks4-grid {
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  gap: 8px;
  align-items: start;
  grid-auto-rows: auto;
}

/* KS5 layout: profile strip on top, subjects full width */
.profile-info.ks5-layout .subjects-container {
  width: 100%;
  min-width: 0;
  min-height: auto;
}

@media (max-width: 1050px) {
  .vespa-section.ks4-theme .subjects-grid.ks4-grid {
    grid-template-columns: repeat(2, minmax(190px, 1fr));
  }
}

@media (max-width: 620px) {
  .vespa-section.ks4-theme .subjects-grid.ks4-grid {
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
  flex-direction: column;
  gap: 12px;
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

/* University Offers */
.university-offers {
  padding: 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.university-offers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.university-offers-title {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.2px;
  color: #ffffff;
}

.university-offers-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offers-edit-btn,
.offers-toggle-btn,
.offers-add-btn {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  padding: 6px 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

.offers-edit-btn:hover,
.offers-toggle-btn:hover,
.offers-add-btn:hover {
  background: rgba(255, 255, 255, 0.10);
}

.university-offers-top,
.offer-item {
  margin-top: 10px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.offer-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.offer-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(7, 155, 170, 0.25);
  border: 1px solid rgba(7, 155, 170, 0.55);
  font-weight: 900;
  color: #7bd8d0;
}

.offer-uni {
  font-weight: 900;
  color: #ffffff;
}

.offer-course {
  color: rgba(255,255,255,0.85);
  font-weight: 600;
}

.offer-meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.offer-pill {
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
}

.university-offers-empty {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: rgba(255,255,255,0.85);
  font-weight: 600;
}

.university-offers-list {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

/* Offers modal */
.offers-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 10001;
}

.offers-modal {
  width: 100%;
  max-width: 980px;
  background: #14224a;
  border: 2px solid rgba(7, 155, 170, 0.6);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  overflow: hidden;
}

.offers-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #2a3c7a 0%, #079baa 100%);
  color: #fff;
}

.offers-modal-title {
  font-weight: 900;
  letter-spacing: 0.2px;
}

.offers-modal-close {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

.offers-modal-body {
  padding: 14px 16px;
}

.offers-help {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: rgba(255,255,255,0.92);
}

.offers-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 90px 1.2fr 1.4fr 160px 110px 48px;
  gap: 8px;
  align-items: center;
}

.offers-grid-head {
  font-weight: 900;
  font-size: 12px;
  color: rgba(255,255,255,0.85);
}

.offers-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-weight: 600;
  box-sizing: border-box;
}

.offers-remove {
  width: 40px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  cursor: pointer;
}

.offers-modal-actions {
  margin-top: 12px;
}

.offers-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(0,0,0,0.18);
  border-top: 1px solid rgba(255,255,255,0.10);
}

.offers-secondary,
.offers-primary {
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 800;
  cursor: pointer;
}

.offers-secondary {
  background: rgba(255,255,255,0.06);
  color: #fff;
}

.offers-primary {
  background: rgba(7, 155, 170, 0.85);
  color: #072b33;
  border-color: rgba(7, 155, 170, 0.9);
}

.offers-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

