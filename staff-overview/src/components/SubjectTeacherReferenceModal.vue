<template>
  <div v-if="isOpen" class="stref-overlay" @click.self="handleClose">
    <div class="stref-modal">
      <div class="stref-header">
        <div class="stref-title">
          <h3>{{ student?.name || 'Student' }} — Subject teacher reference</h3>
          <div class="stref-sub">{{ student?.email || '' }}</div>
        </div>
        <button class="stref-close" @click="handleClose">&times;</button>
      </div>

      <div class="stref-body">
        <div v-if="loading" class="stref-loading">
          <div class="spinner"></div>
          <div>Loading…</div>
        </div>

        <div v-else-if="error" class="stref-error">
          <div class="stref-error-title">Could not load student profile</div>
          <div class="stref-error-msg">{{ error }}</div>
          <button class="stref-btn" @click="load">Try again</button>
        </div>

        <div v-else class="stref-content">
          <UcasApplicationModal
            embedded
            :studentEmail="student?.email || ''"
            :academicYear="resolvedAcademicYear"
            :subjects="subjects"
            :offers="offers"
            :topOffer="topOffer"
            :apiUrl="apiUrl"
            :canEdit="false"
            :staffEmail="staffEmail"
            initialPanel="reference"
            @close="handleClose"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { staffAPI, API_BASE_URL } from '../services/api.js'
import UcasApplicationModal from '../../../academic-profile/src/components/UcasApplicationModal.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  student: { type: Object, default: null },
  staffEmail: { type: String, default: '' },
  academicYear: { type: String, default: 'current' }
})

const emit = defineEmits(['close'])

const apiUrl = API_BASE_URL
const loading = ref(false)
const error = ref('')
const profile = ref(null)

function normalizeAy(v) {
  const s = (v ?? '').toString().trim()
  if (!s) return 'current'
  const low = s.toLowerCase()
  if (low === 'current') return 'current'
  return s
}

const desiredAcademicYear = computed(() => normalizeAy(props.academicYear))
const resolvedAcademicYear = computed(() => {
  const p = profile.value?.data || profile.value || {}
  return (p.academic_year || p.academicYear || desiredAcademicYear.value || 'current')
})

const subjects = computed(() => {
  const p = profile.value?.data || profile.value || {}
  return Array.isArray(p.subjects) ? p.subjects : []
})

const offers = computed(() => {
  const p = profile.value?.data || profile.value || {}
  return Array.isArray(p.offers) ? p.offers : []
})

const topOffer = computed(() => {
  const p = profile.value?.data || profile.value || {}
  const list = Array.isArray(p.offers) ? p.offers : []
  return list.length ? list[0] : (p.topOffer || null)
})

async function load() {
  const email = String(props.student?.email || '').trim()
  if (!email) return
  loading.value = true
  error.value = ''
  try {
    // Ask backend to resolve 'current' into a concrete academic year for this student.
    profile.value = await staffAPI.getAcademicProfile(email, desiredAcademicYear.value)
  } catch (e) {
    error.value = e?.message || 'Failed to load'
    profile.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.isOpen, props.student?.email, props.academicYear],
  ([isOpen]) => {
    if (isOpen) load()
  }
)

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.stref-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10050;
  padding: 18px;
}

.stref-modal {
  width: min(1600px, 94vw);
  max-width: 94vw;
  height: min(92vh, 980px);
  max-height: 92vh;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
}

.stref-header {
  padding: 14px 16px;
  background: linear-gradient(135deg, #111827 0%, #374151 100%);
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.stref-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
}

.stref-sub {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.95;
}

.stref-close {
  background: rgba(255, 255, 255, 0.18);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.stref-close:hover {
  background: rgba(255, 255, 255, 0.28);
}

.stref-body {
  padding: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.stref-content {
  height: 100%;
}

.stref-loading {
  padding: 22px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #444;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e0e0e0;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stref-error {
  padding: 18px;
  background: #fff5f5;
  border: 1px solid #ffd2d2;
  border-radius: 10px;
  margin: 16px;
}

.stref-error-title {
  font-weight: 900;
  color: #b91c1c;
  margin-bottom: 6px;
}

.stref-error-msg {
  color: #7f1d1d;
  margin-bottom: 10px;
  white-space: pre-wrap;
}

.stref-btn {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 9px 12px;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
}

.stref-btn:hover {
  background: #e9edf2;
}
</style>

