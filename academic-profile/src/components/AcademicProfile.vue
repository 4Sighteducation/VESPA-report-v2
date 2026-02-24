<template>
  <div class="vespa-profile-display" data-vespa-academic-profile="1">
    <section class="vespa-section profile-section" :class="{ 'ks4-theme': isKs4 }">
      <div class="profile-header">
        <div class="profile-header-left">
          <div class="profile-avatar" aria-hidden="true">{{ studentInitials }}</div>
          <div class="profile-header-text">
            <div class="profile-title-row">
              <div class="profile-title">Student Profile</div>
              <button class="profile-info-button" type="button" @click="showInfoModal = true" title="Understanding These Grades">
                i
              </button>
            </div>
            <div class="profile-student-name">{{ displayStudentName }}</div>
            <div class="profile-meta">
              <div class="profile-meta-item">
                <span class="profile-meta-label">School</span>
                <span class="profile-meta-value">{{ displaySchool }}</span>
              </div>
              <div v-if="displayYearGroup" class="profile-meta-item">
                <span class="profile-meta-label">Year</span>
                <span class="profile-meta-value">{{ displayYearGroup }}</span>
              </div>
              <div v-if="displayTutorGroup" class="profile-meta-item">
                <span class="profile-meta-label">Tutor</span>
                <span class="profile-meta-value">{{ displayTutorGroup }}</span>
              </div>
              <div v-if="!isKs4 && student.priorAttainment" class="profile-meta-item">
                <span class="profile-meta-label">Prior</span>
                <span class="profile-meta-value">{{ student.priorAttainment }}</span>
              </div>
              <div v-if="!isKs4 && student.attendance" class="profile-meta-item">
                <span class="profile-meta-label">Attendance</span>
                <span class="profile-meta-value">{{ formatPercentage(student.attendance) }}</span>
              </div>
              <div v-if="formattedUpdatedAt" class="profile-meta-item">
                <span class="profile-meta-label">Updated</span>
                <span class="profile-meta-value">{{ formattedUpdatedAt }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button
            v-if="!isStudent && !isKs4"
            class="small-toggle"
            type="button"
            @click="toggleMeg"
            :title="showMeg ? 'Hide MEG' : 'Show MEG'">
            MEG: {{ showMeg ? 'On' : 'Off' }}
          </button>
          <button
            v-if="!isStudent && !isKs4"
            class="small-toggle"
            type="button"
            @click="toggleStg"
            :title="showStg ? 'Hide STG' : 'Show STG'">
            STG: {{ showStg ? 'On' : 'Off' }}
          </button>
          <button
            v-if="!isStudent && isKs4"
            class="small-toggle"
            type="button"
            @click="togglePredicted"
            :title="showPredicted ? 'Hide Predicted Grade' : 'Show Predicted Grade'">
            Predicted: {{ showPredicted ? 'On' : 'Off' }}
          </button>

          <span v-if="editable && isStaff"
                class="master-edit-icon"
                :class="isEditMode ? 'save-icon' : 'edit-icon'"
                @click="toggleEditMode"
                :title="isEditMode ? 'Save All Changes' : 'Edit All Grades'">
            {{ isEditMode ? '💾 Save All' : '✏️ Edit Grades' }}
          </span>

          <span v-if="editable && isStudent"
                class="master-edit-icon"
                :class="isEditMode ? 'save-icon' : 'edit-icon'"
                @click="toggleEditMode"
                :title="isEditMode ? 'Save Target Grades' : 'Edit Target Grades'">
            {{ isEditMode ? '💾 Save Targets' : '✏️ Edit Targets' }}
          </span>
        </div>
      </div>

      <div class="profile-info" :class="{ 'ks4-layout': isKs4, 'ks5-layout': !isKs4 }">
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
                :allow-student-target-edit="editable && isStudent"
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
                :allow-student-target-edit="editable && isStudent"
                :show-meg="showMeg"
                :show-stg="showStg"
                @update="handleSubjectUpdate"
              />
            </template>
          </div>
          
          <div v-if="subjects.length === 0" class="no-subjects">
            No subjects available
          </div>

          <!-- University Choices (KS5 / Level 3 only) -->
          <div v-if="!isKs4" class="university-offers">
            <div class="university-offers-header">
              <div class="offers-header-left">
                <div class="offers-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <div class="offers-title-group">
                  <div class="university-offers-title">University Choices</div>
                  <div class="offers-count">{{ offers.length }} {{ offers.length === 1 ? 'university' : 'universities' }} saved</div>
                </div>
              </div>
              <div class="university-offers-actions">
                <button
                  class="offers-ucasapp-btn"
                  type="button"
                  @click="openUcasApplication"
                  :disabled="offers.length === 0"
                  :title="offers.length ? 'Write your UCAS 3-question statement' : 'Add a University Choice first'">
                  {{ isStudent ? '📝 UCAS Application' : '👀 View UCAS Application' }}
                </button>
                <button
                  v-if="offersEditable"
                  class="offers-edit-btn"
                  @click="openOffersEditor"
                  title="Open UniGuide to build your 5 university choices">
                  🔎 UniGuide
                </button>
                <button
                  v-if="offers.length > 0"
                  class="offers-toggle-btn"
                  :disabled="offers.length <= 1"
                  @click="toggleOffersExpanded">
                  <span class="offers-chevron" :class="{ open: offersExpanded }">▾</span>
                  {{ offersExpanded ? 'Hide choices' : `View choices (${offers.length})` }}
                </button>
              </div>
            </div>

            <button
              v-if="topOffer"
              type="button"
              class="university-offers-top offer-top-toggle"
              :title="offers.length > 1 ? 'Click to expand/collapse all offers' : 'Top offer'"
              @click="offers.length > 1 ? toggleOffersExpanded() : null">
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
                <a
                  v-if="safeCourseLink(topOffer.courseLink)"
                  class="offer-link-btn"
                  :href="safeCourseLink(topOffer.courseLink)"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.stop
                >
                  🔗 Course link
                </a>
              </div>
              <div v-if="offers.length > 1" class="offer-expand-hint">
                <span class="offers-chevron" :class="{ open: offersExpanded }">▾</span>
                <span>{{ offersExpanded ? 'Click to collapse' : 'Click to expand' }}</span>
              </div>
            </button>

            <div v-else class="university-offers-empty">
              <span>No choices added yet.</span>
              <button v-if="offersEditable" class="offers-add-btn" @click="openOffersEditor">➕ Add choices</button>
            </div>

            <div v-if="offersExpanded && offers.length" class="university-offers-list" aria-label="All university choices">
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
                  <a
                    v-if="safeCourseLink(o.courseLink)"
                    class="offer-link-btn"
                    :href="safeCourseLink(o.courseLink)"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop
                  >
                    🔗 Course link
                  </a>
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

    <!-- UCAS Application Modal -->
    <UcasApplicationModal
      v-if="ucasModalOpen"
      :student-email="props.student?.email || ''"
      :academic-year="props.academicYear || ''"
      :subjects="props.subjects || []"
      :offers="sortedOffers"
      :top-offer="topOffer"
      :api-url="academicProfileApiUrl"
      :can-edit="isStudent"
      :comments-enabled="true"
      :can-add-comment="isStaff"
      :staff-email="currentUserEmail"
      @close="ucasModalOpen = false"
    />

    <!-- Saving Overlay -->
    <div v-if="saving" class="saving-overlay">
      <div class="spinner"></div>
      <p>Saving changes...</p>
    </div>

    <!-- UniGuide Modal (includes manual editor) -->
    <div v-if="offersEditorOpen" class="offers-modal-overlay" @click.self="closeOffersEditor">
      <div class="offers-modal">
        <div class="offers-modal-header">
          <div class="offers-modal-title">UniGuide</div>
          <a
            class="offers-ucas-link"
            href="https://www.ucas.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open UCAS in a new tab">
            🔎 UCAS search
          </a>
          <button class="offers-modal-close" @click="closeOffersEditor">✖</button>
        </div>
        <div class="offers-modal-body">
          <div class="offers-modal-tabs" role="tablist" aria-label="UniGuide tabs">
            <button
              class="offers-modal-tab"
              :class="{ active: offersEditorTab === 'uniguide' }"
              type="button"
              role="tab"
              :aria-selected="offersEditorTab === 'uniguide'"
              @click="offersEditorTab = 'uniguide'"
            >
              UniGuide
            </button>
            <button
              class="offers-modal-tab"
              :class="{ active: offersEditorTab === 'manual' }"
              type="button"
              role="tab"
              :aria-selected="offersEditorTab === 'manual'"
              @click="offersEditorTab = 'manual'"
            >
              Manual edit
            </button>
          </div>

          <div v-if="offersEditorTab === 'uniguide'" class="uniguide-shell" role="tabpanel">
            <div class="uniguide-shell-title">Find and build your 5 university choices</div>
            <div class="uniguide-shell-sub">
              This is where the Discover Uni dataset search and the AI advisor chat will live.
              For now, use <strong>Manual edit</strong> to set your 5 choices.
            </div>
            <div class="uniguide-shell-actions">
              <button class="offers-secondary" type="button" @click="offersEditorTab = 'manual'">
                ✏️ Open manual editor
              </button>
            </div>
          </div>

          <div v-else class="uniguide-manual" role="tabpanel">
            <div class="offers-help">
              Add up to 5 choices. The profile displays your <strong>#1 ranked</strong> choice by default.
            </div>

            <div class="offers-grid">
              <div class="offers-grid-head">Rank</div>
              <div class="offers-grid-head">University</div>
              <div class="offers-grid-head">Course</div>
              <div class="offers-grid-head">Link</div>
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
                <div><input v-model="row.courseLink" class="offers-input" placeholder="https://…" /></div>
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
                type="button"
                @click="addOfferRow"
                :disabled="offersDraft.length >= 5">
                ➕ Add Choice
              </button>
            </div>
          </div>
        </div>
        <div class="offers-modal-footer">
          <button class="offers-secondary" @click="closeOffersEditor">Cancel</button>
          <button class="offers-primary" @click="saveOffers" :disabled="offersSaving">
            {{ offersSaving ? 'Saving…' : 'Save choices' }}
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
import UcasApplicationModal from './UcasApplicationModal.vue'
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
const offersEditorTab = ref('uniguide') // 'uniguide' | 'manual'

// UCAS Application modal state (student edits; staff read + comment)
const ucasModalOpen = ref(false)
const openUcasApplication = () => {
  ucasModalOpen.value = true
}

// Allow deep-linking to UCAS Application from staff tools (e.g. Staff Overview).
// Example:
//   https://...#vespa-coaching-report?email=student@...&open=ucas
try {
  const hash = String(window.location.hash || '')
  const qIdx = hash.indexOf('?')
  const qs = qIdx >= 0 ? hash.slice(qIdx + 1) : ''
  const params = new URLSearchParams(qs)
  const open = (params.get('open') || '').toLowerCase().trim()
  if (open === 'ucas') {
    // Open immediately so staff land straight on the UCAS Application modal.
    setTimeout(() => {
      try {
        openUcasApplication()
      } catch (_) {}
    }, 250)
  }
} catch (_) {}

// Fallback deep-linking: Staff Overview sets a localStorage flag before opening the report.
// This works even if Knack strips unknown hash parameters.
try {
  const raw = localStorage.getItem('vespa_open_ucas')
  if (raw) {
    const payload = JSON.parse(raw)
    const flagEmail = String(payload?.email || '').trim().toLowerCase()
    const ts = Number(payload?.ts || 0)
    const ageMs = Date.now() - ts
    const target = String(props.student?.email || '').trim().toLowerCase()
    if (flagEmail && target && flagEmail === target && ageMs >= 0 && ageMs < 2 * 60 * 1000) {
      setTimeout(() => {
        try {
          openUcasApplication()
        } catch (_) {}
      }, 350)
    }
  }
  // Always clear the one-shot flag
  localStorage.removeItem('vespa_open_ucas')
} catch (_) {}

const academicProfileApiUrl = computed(() => {
  try {
    return (window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl || '').toString()
  } catch (_) {
    return ''
  }
})

const currentUserEmail = computed(() => {
  try {
    if (typeof Knack === 'undefined') return ''
    if (Knack.getUserAttributes) {
      return (Knack.getUserAttributes()?.email || '').toString().trim()
    }
    // Fallbacks for older/embedded Knack contexts
    const fromSession =
      Knack?.session?.user?.attributes?.email ||
      Knack?.session?.user?.email ||
      ''
    return String(fromSession || '').trim()
  } catch (_) {
    return ''
  }
})

// In this report context, "student" means the logged-in user is viewing their own profile.
// This is more reliable than role-name heuristics (staff often have multiple roles).
const isStudent = computed(() => {
  const me = (currentUserEmail.value || '').toString().trim().toLowerCase()
  const target = (props.student?.email || '').toString().trim().toLowerCase()
  return !!me && !!target && me === target
})

const isStaff = computed(() => !isStudent.value)

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

const studentInitials = computed(() => {
  const name = (displayStudentName.value || '').trim()
  if (!name) return '—'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || '—'
})

const normalizeOffer = (o) => {
  const uni = coerceText(o?.universityName ?? o?.university_name)
  const course = coerceText(o?.courseTitle ?? o?.course_title)
  const link = coerceText(o?.courseLink ?? o?.course_link)
  const offer = coerceText(o?.offer ?? o?.offerText ?? o?.offer_text)
  const ucasRaw = (o?.ucasPoints ?? o?.ucas_points)
  const rankRaw = (o?.ranking ?? o?.rank)
  const ranking = Number.isFinite(Number(rankRaw)) ? parseInt(rankRaw, 10) : 1
  const ucasPoints = (ucasRaw === null || ucasRaw === undefined || String(ucasRaw).trim() === '') ? null : parseInt(ucasRaw, 10)
  return {
    _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    universityName: uni,
    courseTitle: course,
    courseLink: link,
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
    .filter(o => (o.universityName || o.courseTitle || o.courseLink || o.offer || (o.ucasPoints !== null && o.ucasPoints !== undefined)))
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

const toggleOffersExpanded = () => {
  offersExpanded.value = !offersExpanded.value
}

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
    courseLink: o.courseLink || '',
    offer: o.offer || '',
    ucasPoints: (o.ucasPoints === null || o.ucasPoints === undefined) ? '' : String(o.ucasPoints),
    ranking: o.ranking || 1
  }))
  if (offersDraft.value.length === 0) {
    offersDraft.value = [{
      _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      universityName: '',
      courseTitle: '',
      courseLink: '',
      offer: '',
      ucasPoints: '',
      ranking: 1
    }]
  }
  offersEditorTab.value = 'uniguide'
  offersEditorOpen.value = true
}

const closeOffersEditor = () => {
  offersEditorOpen.value = false
  offersEditorTab.value = 'uniguide'
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
    courseLink: '',
    offer: '',
    ucasPoints: '',
    ranking: nextRank
  })
}

const safeCourseLink = (raw) => {
  const s = (raw || '').toString().trim()
  if (!s) return null
  const low = s.toLowerCase()
  if (low.startsWith('javascript:') || low.startsWith('data:')) return null
  if (low.startsWith('http://') || low.startsWith('https://')) return s
  if (low.startsWith('www.')) return `https://${s}`
  if (s.includes('.') && !s.includes(' ')) return `https://${s}`
  return null
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
        courseLink: (safeCourseLink(r.courseLink) || ''),
        offer: (r.offer || '').trim(),
        ucasPoints: (r.ucasPoints === null || r.ucasPoints === undefined || String(r.ucasPoints).trim() === '') ? null : parseInt(r.ucasPoints, 10),
        ranking: parseInt(r.ranking, 10)
      }))
      .filter(r => r.universityName || r.courseTitle || r.courseLink || r.offer || (r.ucasPoints !== null && r.ucasPoints !== undefined))
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
  // Students can edit ONLY Target grade
  if (isStudent.value && field !== 'targetGrade') {
    console.warn('[Academic Profile] Student attempted to edit forbidden field:', field)
    showTemporaryMessage('You can only edit your Target grade.', 'error')
    return
  }
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
      const safeChanges = isStudent.value ? { targetGrade: changes.targetGrade } : changes
      // Skip if student has no target changes for this subject
      if (isStudent.value && safeChanges.targetGrade === undefined) continue
      updatePromises.push(
        updateSubjectGrade(subjectId, safeChanges, window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl)
      )
    }

    if (updatePromises.length === 0) {
      pendingChanges.value = {}
      return
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
  /* Palette (from redesign prototype) */
  --brand-darkest: #0f1629;
  --brand-dark: #1a2342;
  --brand-mid: #242f4e;
  --brand-light: #2d3a5c;
  --accent: #4ecdc4;
  --accent-light: #7ee8e2;
  --accent-glow: rgba(78, 205, 196, 0.15);
  --purple: #8b7ec8;
  --purple-light: #a99fda;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.75);
  --text-muted: rgba(255, 255, 255, 0.5);

  background: linear-gradient(145deg, var(--brand-dark) 0%, var(--brand-mid) 100%);
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  padding: 16px;
  border: 1px solid rgba(78, 205, 196, 0.16);
  position: relative;
  overflow: hidden;
}

/* KS4 theme (distinct from KS5): dark green */
.vespa-section.ks4-theme {
  background-color: #0f2b1a;
  border-color: rgba(124, 255, 154, 0.55);
}

.vespa-section.ks4-theme .profile-info-button {
  color: #7CFF9A;
  border-color: rgba(124, 255, 154, 0.8);
}

.vespa-section.ks4-theme .profile-info-button:hover {
  background-color: #7CFF9A;
  color: #0f2b1a;
}

.vespa-section.ks4-theme .small-toggle {
  border-color: rgba(124, 255, 154, 0.3);
}

.vespa-section.ks4-theme .master-edit-icon.edit-icon {
  color: #7CFF9A;
  border-color: rgba(124, 255, 154, 0.85);
}

/* Header (new redesign) */
.profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 14px;
  margin: -16px -16px 14px;
  background: linear-gradient(135deg, var(--brand-mid) 0%, var(--brand-light) 100%);
  border-bottom: 1px solid rgba(78, 205, 196, 0.12);
  position: relative;
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--purple), var(--accent));
  opacity: 0.85;
}

.vespa-section.ks4-theme .profile-header {
  background: linear-gradient(135deg, rgba(18, 53, 34, 0.92) 0%, rgba(15, 43, 26, 0.92) 100%);
  border-bottom-color: rgba(124, 255, 154, 0.22);
}

.vespa-section.ks4-theme .profile-header::before {
  background: linear-gradient(90deg, rgba(124, 255, 154, 0.95), rgba(78, 205, 196, 0.60), rgba(124, 255, 154, 0.95));
}

.profile-header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: var(--brand-darkest);
  background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  flex: 0 0 auto;
}

.vespa-section.ks4-theme .profile-avatar {
  background: linear-gradient(135deg, rgba(124, 255, 154, 0.95) 0%, rgba(78, 205, 196, 0.85) 100%);
}

.profile-header-text {
  min-width: 0;
}

.profile-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-title {
  font-weight: 950;
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.vespa-section.ks4-theme .profile-title {
  color: rgba(124, 255, 154, 0.85);
}

.profile-student-name {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 900;
  color: var(--text-primary);
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-top: 10px;
}

.profile-meta-item {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.profile-meta-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.profile-meta-value {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-primary);
}

@media (max-width: 780px) {
  .profile-header {
    flex-direction: column;
    align-items: stretch;
  }
  .profile-actions {
    justify-content: flex-start;
  }
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

.profile-actions {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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
  font-size: 14px;
  color: var(--accent);
  cursor: pointer;
  border: 1px solid rgba(78, 205, 196, 0.95);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
  background: rgba(0, 0, 0, 0.20);
}

.profile-info-button:hover {
  background-color: rgba(78, 205, 196, 0.92);
  color: var(--brand-darkest);
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

@media (max-width: 640px) {
  /* Phone: prioritize readability over density */
  .subjects-grid {
    grid-template-columns: 1fr;
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
  position: relative;
  padding: 16px;
  border-radius: 12px;
  /* Contrast palette (from redesign prototype) */
  --offers-primary: #f093a0;
  --offers-secondary: #e8788a;
  --offers-dark: #2a1f35;
  --offers-mid: #352a42;
  --offers-glow: rgba(240, 147, 160, 0.12);

  background: linear-gradient(145deg, var(--offers-dark) 0%, var(--offers-mid) 100%);
  border: 1px solid rgba(240, 147, 160, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px var(--offers-glow);
  overflow: hidden;
}

.university-offers::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--offers-primary), var(--offers-secondary));
  opacity: 0.9;
}

.university-offers::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(420px circle at 6% -20%, rgba(240, 147, 160, 0.35), transparent 55%);
  opacity: 0.5;
  pointer-events: none;
}

.university-offers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.offers-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.offers-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2a1f35;
  background: linear-gradient(135deg, var(--offers-primary) 0%, var(--offers-secondary) 100%);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  flex: 0 0 auto;
}

.offers-title-group {
  min-width: 0;
}

.university-offers-title {
  font-weight: 900;
  font-size: 16px;
  letter-spacing: 0.3px;
  color: #ffffff;
  line-height: 1.2;
}

.offers-count {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255,255,255,0.78);
  font-weight: 700;
}

.university-offers-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offers-ucasapp-btn,
.offers-edit-btn,
.offers-toggle-btn,
.offers-add-btn {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  padding: 9px 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.offers-ucasapp-btn {
  background: rgba(62, 50, 133, 0.35);
  border-color: rgba(62, 50, 133, 0.70);
}

.offers-edit-btn {
  background: rgba(232, 119, 34, 0.22);
  border-color: rgba(232, 119, 34, 0.55);
}

.offers-ucasapp-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.offers-toggle-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.offers-chevron {
  display: inline-block;
  margin-right: 6px;
  transition: transform 0.18s ease;
}

.offers-chevron.open {
  transform: rotate(180deg);
}

.offers-ucasapp-btn:hover,
.offers-edit-btn:hover,
.offers-toggle-btn:hover,
.offers-add-btn:hover {
  background: rgba(255, 255, 255, 0.10);
}

.university-offers-top,
.offer-item {
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(145deg, #241f55, #2c2470);
  border: 1px solid rgba(62, 50, 133, 0.35);
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}

.offer-top-toggle {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.offer-top-toggle:focus {
  outline: 2px solid rgba(62, 50, 133, 0.75);
  outline-offset: 2px;
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
  background: rgba(62, 50, 133, 0.25);
  border: 1px solid rgba(62, 50, 133, 0.78);
  font-weight: 900;
  color: #efeaff;
}

.offer-uni {
  font-weight: 950;
  font-size: 17px;
  color: #ffffff;
}

.offer-course {
  color: rgba(255,255,255,0.95);
  font-weight: 600;
}

.offer-meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.offer-pill {
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(62, 50, 133, 0.55);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 0 rgba(0,0,0,0.4);
}

.offer-link-btn {
  text-decoration: none;
  background: rgba(62, 50, 133, 0.25);
  border: 1px solid rgba(62, 50, 133, 0.7);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
  color: #ffffff;
}

.offer-link-btn:hover {
  background: rgba(62, 50, 133, 0.35);
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

/* Mobile: make University Choices header stack (avoid title/buttons overlap) */
@media (max-width: 640px) {
  .vespa-section {
    padding: 12px;
    border-radius: 12px;
  }

  .profile-header {
    padding: 14px 14px 12px;
    margin: -12px -12px 12px;
  }

  .university-offers {
    padding: 14px;
  }

  .university-offers-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .offers-header-left {
    width: 100%;
  }

  .university-offers-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .offers-toggle-btn {
    grid-column: 1 / -1;
  }

  .offers-ucasapp-btn,
  .offers-edit-btn,
  .offers-toggle-btn,
  .offers-add-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 10px 12px;
  }
}

@media (max-width: 420px) {
  .university-offers-actions {
    grid-template-columns: 1fr;
  }

  .offers-toggle-btn {
    grid-column: auto;
  }
}

.university-offers-list {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.offer-expand-hint {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.85);
  font-size: 12px;
  font-weight: 700;
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
  max-width: 1100px;
  max-height: 90vh;
  background: #14224a;
  border: 2px solid rgba(7, 155, 170, 0.6);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.offers-ucas-link {
  margin-left: auto;
  margin-right: 10px;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.20);
  background: rgba(255,255,255,0.10);
  color: #ffffff;
  padding: 8px 10px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 12px;
}

.offers-ucas-link:hover {
  background: rgba(255,255,255,0.16);
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
  overflow: auto;
  flex: 1;
}

.offers-modal-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.offers-modal-tab {
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.92);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.offers-modal-tab.active {
  border-color: rgba(7, 155, 170, 0.9);
  background: rgba(7, 155, 170, 0.35);
  color: #ffffff;
}

.uniguide-shell {
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 16px;
}

.uniguide-shell-title {
  font-size: 16px;
  font-weight: 950;
  color: #ffffff;
  margin-bottom: 6px;
}

.uniguide-shell-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  line-height: 1.55;
}

.uniguide-shell-actions {
  margin-top: 14px;
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
  grid-template-columns: 90px 1.1fr 1.2fr 1.2fr 160px 110px 48px;
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

