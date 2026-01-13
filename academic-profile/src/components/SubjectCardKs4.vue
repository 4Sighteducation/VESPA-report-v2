<template>
  <div class="ks4-card" :style="cardStyle">
    <div class="ks4-header">
      <div class="ks4-subject" :title="displaySubjectName">{{ displaySubjectName }}</div>
      <div class="ks4-qual" v-if="qualLabel">{{ qualLabel }}</div>
    </div>

    <div class="ks4-grades">
      <div v-if="showPredicted" class="ks4-pill">
        <div class="ks4-pill-label">Pred</div>
        <div class="ks4-pill-value ks4-pill-value-strong">
          <input
            v-if="editMode && isStaff && hasRecordId"
            class="ks4-input"
            type="text"
            :value="subject.minimumExpectedGrade || ''"
            @input="handleChange('minimumExpectedGrade', $event.target.value)"
            placeholder="-"
          />
          <span v-else>{{ displayGrade(subject.minimumExpectedGrade) }}</span>
        </div>
      </div>

      <div class="ks4-pill">
        <div class="ks4-pill-label">Cur</div>
        <div class="ks4-pill-value">
          <input
            v-if="editMode && isStaff && hasRecordId"
            class="ks4-input"
            type="text"
            :value="subject.currentGrade || ''"
            @input="handleChange('currentGrade', $event.target.value)"
            placeholder="-"
          />
          <span v-else>{{ displayGrade(subject.currentGrade) }}</span>
        </div>
      </div>

      <div class="ks4-pill">
        <div class="ks4-pill-label">Tar</div>
        <div class="ks4-pill-value">
          <input
            v-if="editMode && isStaff && hasRecordId"
            class="ks4-input"
            type="text"
            :value="subject.targetGrade || ''"
            @input="handleChange('targetGrade', $event.target.value)"
            placeholder="-"
          />
          <span v-else>{{ displayGrade(subject.targetGrade) }}</span>
        </div>
      </div>

      <div class="ks4-pill">
        <div class="ks4-pill-label">Eff</div>
        <div class="ks4-pill-value">
          <input
            v-if="editMode && isStaff && hasRecordId"
            class="ks4-input"
            type="text"
            :value="subject.effortGrade || ''"
            @input="handleChange('effortGrade', $event.target.value)"
            placeholder="-"
          />
          <span v-else>{{ displayGrade(subject.effortGrade) }}</span>
        </div>
      </div>

      <div class="ks4-pill">
        <div class="ks4-pill-label">Beh</div>
        <div class="ks4-pill-value">
          <input
            v-if="editMode && isStaff && hasRecordId"
            class="ks4-input"
            type="text"
            :value="subject.behaviourGrade || ''"
            @input="handleChange('behaviourGrade', $event.target.value)"
            placeholder="-"
          />
          <span v-else>{{ displayGrade(subject.behaviourGrade) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  subject: { type: Object, required: true },
  editMode: { type: Boolean, default: false },
  isStaff: { type: Boolean, default: false },
  showPredicted: { type: Boolean, default: true }
})

const emit = defineEmits(['update'])

const isBlankishGrade = (v) => {
  if (v === null || v === undefined) return true
  const s = String(v).trim()
  if (!s) return true
  const u = s.toUpperCase()
  return u === 'N/A' || u === 'NA' || s === '-' || s === '—'
}

const displayGrade = (v) => (isBlankishGrade(v) ? '-' : String(v).trim())

const hasRecordId = computed(() => !!(props.subject.id || props.subject.originalRecordId))

const displaySubjectName = computed(() => {
  const raw = (props.subject.subjectName || '').toString().trim()
  if (!raw) return 'Subject'
  return raw.replace(/^\s*(?:[a-z]{1,2}\d?\s*-\s*)+/i, '').trim() || raw
})

const qualLabel = computed(() => {
  const t = (props.subject.examType || '').toString().trim()
  if (!t) return ''
  const low = t.toLowerCase()
  if (low.includes('gcse')) return 'GCSE'
  if (low.includes('level 2') || low.includes('l2')) return 'Level 2'
  return ''
})

const accentColor = computed(() => {
  const key = (props.subject.subjectName || props.subject.originalRecordId || props.subject.id || '').toString()
  const palette = [
    '#24d05a', // green
    '#7CFF9A', // light green
    '#1fbf8f', // teal-green
    '#2ee59d', // mint
    '#00c853', // emerald
    '#6dd400'  // lime
  ]
  let h = 0
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h) + key.charCodeAt(i)
  const idx = Math.abs(h) % palette.length
  return palette[idx]
})

const cardStyle = computed(() => ({
  '--ks4-accent': accentColor.value
}))

const handleChange = (field, value) => {
  const id = props.subject.id || props.subject.originalRecordId
  emit('update', id, field, value)
}
</script>

<style scoped>
.ks4-card {
  background: linear-gradient(180deg, rgba(9, 34, 22, 0.92), rgba(11, 46, 28, 0.88));
  border: 1px solid rgba(124, 255, 154, 0.18);
  border-left: 5px solid var(--ks4-accent);
  border-radius: 10px;
  padding: 10px 10px 10px 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 92px;
}

.ks4-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.ks4-subject {
  font-weight: 800;
  color: #d7ffe4;
  font-size: 14px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ks4-qual {
  font-size: 11px;
  color: rgba(215, 255, 228, 0.75);
  border: 1px solid rgba(124, 255, 154, 0.18);
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
  white-space: nowrap;
}

.ks4-grades {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}

.ks4-pill {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(124, 255, 154, 0.12);
  border-radius: 8px;
  padding: 6px 6px;
  text-align: center;
}

.ks4-pill-label {
  font-size: 10px;
  color: rgba(215, 255, 228, 0.75);
  margin-bottom: 2px;
}

.ks4-pill-value {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.1;
}

.ks4-pill-value-strong {
  color: #7CFF9A;
}

.ks4-input {
  width: 100%;
  max-width: 60px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid rgba(124, 255, 154, 0.25);
  background: rgba(0, 0, 0, 0.18);
  color: #ffffff;
  text-align: center;
  font-weight: 700;
  font-size: 12px;
  outline: none;
}

@media (max-width: 768px) {
  .ks4-grades {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .ks4-grades {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

