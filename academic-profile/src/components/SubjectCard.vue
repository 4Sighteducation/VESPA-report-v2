<template>
  <div class="subject-card" :class="qualTypeClass" :style="cardStyle">
    <div class="subject-title">
      <div class="subject-name">{{ displaySubjectName }}</div>
    </div>
    
    <div class="subject-meta">
      <template v-if="editMode && isStaff && hasRecordId">
        <div class="meta-edit-grid">
          <input
            class="meta-input"
            :value="subject.subjectName || ''"
            @input="handleGradeChange('subjectName', $event.target.value)"
            placeholder="Subject name"
          />
          <input
            class="meta-input"
            :value="subject.examType || ''"
            @input="handleGradeChange('examType', $event.target.value)"
            placeholder="Exam type (e.g. A Level - AQA)"
          />
          <input
            class="meta-input"
            :value="subject.examBoard || ''"
            @input="handleGradeChange('examBoard', $event.target.value)"
            placeholder="Exam board (optional)"
          />
        </div>
      </template>
      <template v-else>
        {{ subject.examType || 'N/A' }}
        <span v-if="subject.examBoard"> • {{ subject.examBoard }}</span>
      </template>
    </div>

    <!-- Grades Container -->
    <div class="grades-container">
      <!-- MEG -->
      <div v-if="showMeg" class="grade-item">
        <div class="grade-label">
          MEG
          <span class="meg-info-button" @click="showMEGInfo = true" title="Understanding MEG">i</span>
        </div>
        <div class="grade-value grade-meg">
          <input
            v-if="editMode && isStaff && hasRecordId"
            type="text"
            class="grade-input-dynamic"
            :value="subject.minimumExpectedGrade || ''"
            @input="handleGradeChange('minimumExpectedGrade', $event.target.value)"
            placeholder="N/A"
          />
          <span v-else class="grade-text">{{ subject.minimumExpectedGrade || 'N/A' }}</span>
        </div>
      </div>

      <!-- STG -->
      <div v-if="showStg" class="grade-item">
        <div class="grade-label">STG</div>
        <div class="grade-value grade-stg">
          <input
            v-if="editMode && isStaff && hasRecordId"
            type="text"
            class="grade-input-dynamic"
            :value="subject.subjectTargetGrade || ''"
            @input="handleGradeChange('subjectTargetGrade', $event.target.value)"
            placeholder="N/A"
          />
          <span v-else class="grade-text">{{ subject.subjectTargetGrade || subject.minimumExpectedGrade || 'N/A' }}</span>
        </div>
      </div>

      <!-- Current Grade -->
      <div class="grade-item current-grade-item">
        <div class="grade-label">Current</div>
        <div class="grade-value-display">
          <input 
            v-if="editMode && isStaff && hasRecordId"
            type="text"
            class="grade-input-dynamic"
            :value="subject.currentGrade || ''"
            @input="handleGradeChange('currentGrade', $event.target.value)"
            placeholder="-"
          />
          <span v-else class="grade-text" :class="!isBlankishGrade(subject.currentGrade) ? getGradeColorClass(subject.currentGrade, stgGrade) : ''">
            {{ displayGrade(subject.currentGrade) }}
          </span>
        </div>
      </div>

      <!-- Target Grade -->
      <div class="grade-item target-grade-item">
        <div class="grade-label">Target</div>
        <div class="grade-value-display">
          <input 
            v-if="editMode && hasRecordId && (isStaff || allowStudentTargetEdit)"
            type="text"
            class="grade-input-dynamic"
            :value="subject.targetGrade || ''"
            @input="handleGradeChange('targetGrade', $event.target.value)"
            placeholder="-"
          />
          <span v-else class="grade-text" :class="!isBlankishGrade(subject.targetGrade) ? getGradeColorClass(subject.targetGrade, stgGrade) : ''">
            {{ displayGrade(subject.targetGrade) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Optional Grades (Effort, Behaviour, Attendance) -->
    <div v-if="hasOptionalGrades || (editMode && isStaff)" class="optional-grades-container">
      <!-- Effort -->
      <div class="optional-grade-item">
        <span class="optional-grade-label">Eff:</span>
        <input 
          v-if="editMode && isStaff && hasRecordId"
          type="text"
          class="optional-grade-input"
          :value="subject.effortGrade || ''"
          @input="handleGradeChange('effortGrade', $event.target.value)"
          placeholder="-"
        />
        <span v-else>{{ subject.effortGrade || '-' }}</span>
      </div>

      <!-- Behaviour -->
      <div class="optional-grade-item">
        <span class="optional-grade-label">Beh:</span>
        <input 
          v-if="editMode && isStaff && hasRecordId"
          type="text"
          class="optional-grade-input"
          :value="subject.behaviourGrade || ''"
          @input="handleGradeChange('behaviourGrade', $event.target.value)"
          placeholder="-"
        />
        <span v-else>{{ subject.behaviourGrade || '-' }}</span>
      </div>

      <!-- Attendance -->
      <div class="optional-grade-item">
        <span class="optional-grade-label">Att:</span>
        <input 
          v-if="editMode && isStaff && hasRecordId"
          type="text"
          class="optional-grade-input attendance-input"
          :value="subject.subjectAttendance ? Math.round(subject.subjectAttendance * 100) : ''"
          @input="handleAttendanceChange($event.target.value)"
          placeholder="%"
        />
        <span v-else>{{ formatPercentage(subject.subjectAttendance) }}</span>
      </div>
    </div>

    <!-- Progress to target (best-effort; only shown when grades are comparable) -->
    <div v-if="progressInfo" class="progress-indicator">
      <div class="progress-label">
        <span>Progress to Target</span>
        <span :class="progressInfo.statusClass">{{ progressInfo.label }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :class="progressInfo.statusClass" :style="{ width: progressInfo.percent + '%' }"></div>
      </div>
    </div>

    <!-- MEG Info Modal -->
    <div v-if="showMEGInfo" class="meg-info-overlay" @click="showMEGInfo = false">
      <div class="meg-info-modal" @click.stop>
        <span class="modal-close" @click="showMEGInfo = false">&times;</span>
        <h4>Understanding MEG (Minimum Expected Grade)</h4>
        <p v-if="isStaff">
          <strong>Teacher View:</strong> The MEG provides a baseline expectation derived from national data for students with similar prior attainment. 
          Schools can adjust ambition levels - some choose aspirational targets to drive achievement. 
          Consider all factors when setting targets: prior attainment, subject difficulty, student circumstances, and school context.
        </p>
        <p v-else>
          <strong>Your MEG:</strong> This represents an aspirational grade based on how students with similar GCSE results have performed nationally. 
          It's a starting point showing what's typically achievable. Many students exceed their MEG! 
          Check your Subject Target Grade (STG) for a more personalized target.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getGradeColorClass } from '../utils/gradeColors.js'

const props = defineProps({
  subject: {
    type: Object,
    required: true
  },
  editMode: {
    type: Boolean,
    default: false
  },
  isStaff: {
    type: Boolean,
    default: false
  },
  allowStudentTargetEdit: {
    type: Boolean,
    default: false
  },
  showMeg: {
    type: Boolean,
    default: true
  },
  showStg: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update'])

// Helpers
const isBlankishGrade = (v) => {
  if (v === null || v === undefined) return true
  const s = String(v).trim()
  if (!s) return true
  const u = s.toUpperCase()
  return u === 'N/A' || u === 'NA' || s === '-' || s === '—'
}

const displayGrade = (v) => (isBlankishGrade(v) ? '-' : String(v).trim())

// Progress-to-target (A-level letters + GCSE numbers only)
function parseComparableGrade(v) {
  const s = displayGrade(v).toUpperCase()
  if (!s || s === '-') return null

  // A-level
  const aLevelOrder = ['A*', 'A', 'B', 'C', 'D', 'E', 'U']
  const idx = aLevelOrder.indexOf(s)
  if (idx !== -1) return { scheme: 'alevel', idx }

  // GCSE / numeric
  const num = parseFloat(s)
  if (!Number.isNaN(num)) return { scheme: 'num', num }

  return null
}

const progressInfo = computed(() => {
  const cur = parseComparableGrade(props.subject.currentGrade)
  const tgt = parseComparableGrade(props.subject.targetGrade)
  if (!cur || !tgt) return null
  if (cur.scheme !== tgt.scheme) return null

  let belowBy = 0
  if (cur.scheme === 'alevel') {
    // Lower idx is better (A* = 0)
    belowBy = Math.max(0, cur.idx - tgt.idx)
  } else if (cur.scheme === 'num') {
    belowBy = Math.max(0, tgt.num - cur.num)
  }

  const onTrack = belowBy <= 0
  const label = onTrack ? 'On target' : `${belowBy} grade${belowBy === 1 ? '' : 's'} below`
  const statusClass = onTrack ? 'on-track' : 'below'
  const percent = onTrack ? 100 : (belowBy === 1 ? 70 : belowBy === 2 ? 40 : belowBy === 3 ? 25 : 15)

  return { label, statusClass, percent }
})

// State
const showMEGInfo = ref(false)

// Computed
const stgGrade = computed(() => {
  return displayGrade(props.subject.subjectTargetGrade || props.subject.minimumExpectedGrade)
})

const hasRecordId = computed(() => {
  return !!(props.subject.id || props.subject.originalRecordId)
})

const hasOptionalGrades = computed(() => {
  return props.subject.effortGrade || 
         props.subject.behaviourGrade || 
         props.subject.subjectAttendance
})

// Display subject name (strip prefixes like "A - " / "AS - " etc)
const displaySubjectName = computed(() => {
  const raw = (props.subject.subjectName || '').toString().trim()
  if (!raw) return 'Unknown Subject'
  // Remove common leading prefixes like: "A - Physics", "AS - Chemistry", "B - Maths"
  return raw.replace(/^\s*(?:[a-z]{1,2}\d?\s*-\s*)+/i, '').trim() || raw
})

// Deterministic per-subject accent color (so each subject is visually distinct, but stable)
const accentColor = computed(() => {
  const key = (props.subject.subjectName || props.subject.originalRecordId || props.subject.id || '').toString()
  const palette = [
    '#00e5db', // turquoise
    '#86b4f0', // blue
    '#72cb44', // green
    '#ff8f00', // orange
    '#f032e6', // pink
    '#7f31a4', // purple
    '#f3f553', // yellow
    '#ff5252', // red
    '#00c853', // emerald
    '#00b0ff', // light blue
    '#ff6d00', // deep orange
    '#aa00ff'  // violet
  ]
  let h = 0
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h) + key.charCodeAt(i)
  const idx = Math.abs(h) % palette.length
  return palette[idx]
})

const cardStyle = computed(() => ({
  '--accent': accentColor.value
}))

const qualTypeClass = computed(() => {
  // Exam type strings often come through as "A Level - AQA", "BTEC (2016) - Pearson", etc.
  // Use fuzzy matching so styling reliably applies.
  const examType = (props.subject.examType || '').trim().toLowerCase()
  const t = examType.replace(/\s+/g, ' ')

  if (!t) return ''

  // A Level
  if (t.includes('a level') || t.includes('a-level') || t.includes('alevel')) return 'qual-a-level'

  // GCSE
  if (t.includes('gcse')) return 'qual-gcse'

  // IB / Pre-U
  if (t.includes('ib')) return 'qual-ib'
  if (t.includes('pre-u') || t.includes('pre u')) return 'qual-pre-u'

  // BTEC
  if (t.includes('btec')) {
    if (t.includes('2016')) return 'qual-btec-2016'
    if (t.includes('2010')) return 'qual-btec-2010'
    return 'qual-btec-2016'
  }

  // Other vocational-ish
  if (t.includes('ual')) return 'qual-ual'
  if (t.includes('wjec')) return 'qual-wjec'
  if (t.includes('cache')) return 'qual-cache'
  if (t.includes('voc')) return 'qual-vocational-generic'

  return ''
})

// Methods
const handleGradeChange = (field, value) => {
  emit('update', props.subject.id, field, value)
}

const handleAttendanceChange = (value) => {
  // Convert percentage input to decimal (89 → 0.89)
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    emit('update', props.subject.id, 'subjectAttendance', numValue / 100)
  } else {
    emit('update', props.subject.id, 'subjectAttendance', null)
  }
}

const formatPercentage = (decimal) => {
  if (decimal === null || decimal === undefined) return 'N/A'
  return `${Math.round(decimal * 100)}%`
}
</script>

<style scoped>
/* Subject Card */
.subject-card {
  background: linear-gradient(145deg, rgba(36, 47, 78, 0.96) 0%, rgba(45, 58, 92, 0.96) 100%);
  color: var(--text-primary, #ffffff);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  border: 1px solid rgba(78, 205, 196, 0.12);
  border-left: 6px solid var(--accent, #4ecdc4);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Accent overlay */
.subject-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
  opacity: 0.55;
  background: linear-gradient(180deg, var(--accent, #00e5db) 0%, rgba(0,0,0,0) 100%);
}

.subject-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.38);
  border-color: rgba(78, 205, 196, 0.22);
}

.subject-title {
  text-align: center;
  margin-bottom: 8px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.14);
}

.subject-name {
  font-weight: 800;
  color: #ffffff;
  font-size: 1.05em;
  line-height: 1.15;
}

.subject-meta {
  font-size: 0.75em;
  color: rgba(255,255,255,0.75);
  margin-bottom: 8px;
  text-align: center;
}

.meta-edit-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.meta-input {
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.12);
  color: #ffffff;
  border-radius: 6px;
}

.meta-input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

/* Grades */
.grades-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.10);
  flex: 1;
}

.grade-item {
  text-align: center;
  padding: 10px 8px;
  background: rgba(0,0,0,0.16);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
}

.grade-label {
  font-size: 0.7em;
  color: rgba(255,255,255,0.70);
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 800;
}

.meg-info-button {
  font-size: 11px;
  color: #00e5db;
  cursor: pointer;
  border: 1px solid #00e5db;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-style: normal;
  transition: all 0.2s;
}

.meg-info-button:hover {
  background-color: #00e5db;
  color: #23356f;
  transform: scale(1.1);
}

.grade-value-display {
  font-size: 1em;
}

.grade-text {
  font-weight: 800;
  color: #ffffff;
  font-size: 22px;
  letter-spacing: 0.02em;
}

.grade-meg .grade-text {
  color: #00e5db;
}

.grade-stg .grade-text {
  color: #79d2e6;
}

/* Make Current/Target bigger (highest-salience grades) */
.current-grade-item .grade-text,
.target-grade-item .grade-text {
  font-size: 28px;
}

/* Grade input fields */
.grade-input-dynamic {
  width: 100%;
  max-width: 84px;
  padding: 4px;
  font-size: 0.9em;
  text-align: center;
  border: 1px solid #079baa;
  background-color: #23356f;
  color: #ffffff;
  border-radius: 3px;
}

.grade-input-dynamic:focus {
  outline: none;
  border-color: #00e5db;
  box-shadow: 0 0 4px rgba(0, 229, 219, 0.4);
}

/* Optional grades */
.optional-grades-container {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  font-size: 0.78em;
}

.optional-grade-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0,0,0,0.18);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.9);
}

.optional-grade-label {
  font-weight: 600;
  color: var(--accent, #4ecdc4);
  margin-right: 0;
}

.optional-grade-input {
  width: 40px;
  padding: 3px;
  font-size: 0.9em;
  text-align: center;
  border: 1px solid #079baa;
  background-color: #23356f;
  color: #ffffff;
  border-radius: 3px;
}

.attendance-input {
  width: 35px;
}

/* Grade color classes */
.grade-significantly-above { color: #00E676 !important; }
.grade-above { color: #00C853 !important; }
.grade-matching { color: #4CAF50 !important; }
.grade-one-below { color: #FF9800 !important; }
.grade-two-below { color: #F44336 !important; }
.grade-far-below { color: #C62828 !important; }

/* Progress indicator */
.progress-indicator {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.10);
}
.progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
  color: rgba(255,255,255,0.80);
}
.progress-label .on-track { color: rgba(78, 205, 196, 0.95); font-weight: 900; }
.progress-label .below { color: rgba(232, 127, 127, 0.95); font-weight: 900; }
.progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}
.progress-fill.on-track {
  background: linear-gradient(90deg, rgba(78, 205, 196, 0.95), rgba(126, 232, 226, 0.85));
  box-shadow: 0 0 10px rgba(78, 205, 196, 0.35);
}
.progress-fill.below {
  background: linear-gradient(90deg, rgba(232, 127, 127, 0.95), rgba(244, 168, 168, 0.85));
  box-shadow: 0 0 10px rgba(232, 127, 127, 0.30);
}

/* Qualification-specific borders */
.qual-a-level { border-left: 5px solid #FF6347; }
.qual-btec-2016 { border-left: 5px solid #4682B4; }
.qual-btec-2010 { border-left: 5px solid #32CD32; }
.qual-ib { border-left: 5px solid #FFD700; }
.qual-pre-u { border-left: 5px solid #DA70D6; }
.qual-ual { border-left: 5px solid #FFA500; }
.qual-wjec { border-left: 5px solid #8A2BE2; }
.qual-cache { border-left: 5px solid #00CED1; }
.qual-gcse { border-left: 5px solid #DC143C; }

/* MEG Info Overlay */
.meg-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.meg-info-modal {
  background: #1c2b5f;
  color: #ffffff;
  border: 2px solid #00e5db;
  border-radius: 8px;
  padding: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  color: #00e5db;
  cursor: pointer;
  font-weight: bold;
}

.modal-close:hover {
  color: #ffffff;
}

.meg-info-modal h4 {
  color: #00e5db;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(0, 229, 219, 0.4);
  padding-bottom: 10px;
}

.meg-info-modal p {
  line-height: 1.6;
  margin-bottom: 15px;
}

.meg-info-modal strong {
  color: #00e5db;
}
</style>

