<template>
  <!-- Teleport prevents Knack containers from clipping the modal (overflow/transform issues). -->
  <teleport to="body">
    <div v-if="isOpen" class="stref-overlay" @click.self="handleClose">
      <div class="stref-modal" role="dialog" aria-modal="true">
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

          <div v-else class="stref-split" :class="{ 'stref-split--app-open': ucasAppOpen }">
            <!-- Left: reference writing -->
            <div class="stref-pane stref-pane--left">
              <div class="stref-actions">
                <button class="stref-btn stref-btn--primary" type="button" @click="toggleUcasPanel">
                  {{ ucasAppOpen ? 'Back to reference' : 'View student application' }}
                </button>
                <div class="stref-actions-spacer"></div>
                <button class="stref-btn stref-btn--ghost" type="button" @click="load">Reload</button>
              </div>

              <div class="stref-reference-shell">
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
                />
              </div>
            </div>

            <!-- Right: student UCAS application (slide-in) -->
            <div class="stref-pane stref-pane--right" :class="{ 'is-open': ucasAppOpen }">
              <div class="stref-app-head">
                <div class="stref-app-title">Student UCAS application</div>
                <button class="stref-btn stref-btn--sm stref-btn--ghost" type="button" @click="closeUcasApp">
                  Close
                </button>
              </div>

              <div v-if="ucasAppError" class="stref-app-error">
                {{ ucasAppError }}
              </div>

              <div v-else class="stref-app-body">
                <UcasApplicationModal
                  v-if="ucasAppOpen"
                  embedded
                  :studentEmail="student?.email || ''"
                  :academicYear="resolvedAcademicYear"
                  :subjects="subjects"
                  :offers="offers"
                  :topOffer="topOffer"
                  :apiUrl="apiUrl"
                  :canEdit="false"
                  :staffEmail="staffEmail"
                  initialPanel="application"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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

// Slide-in application panel
const ucasAppOpen = ref(false)
const ucasAppError = ref('')

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
  ucasAppError.value = ''
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
  closeUcasApp()
  emit('close')
}

function toggleUcasPanel() {
  ucasAppOpen.value = !ucasAppOpen.value
}

function closeUcasApp() {
  ucasAppOpen.value = false
  ucasAppError.value = ''
}

// Lock background scroll when this modal is open (prevents "scrolling the page behind")
const prevBodyOverflow = ref('')
watch(
  () => props.isOpen,
  (open) => {
    try {
      if (open) {
        prevBodyOverflow.value = document.body.style.overflow || ''
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = prevBodyOverflow.value || ''
      }
    } catch (_) {}
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  try {
    document.body.style.overflow = prevBodyOverflow.value || ''
  } catch (_) {}
})
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
  padding: 8px;
}

.stref-modal {
  width: 98vw;
  max-width: 98vw;
  height: 96vh;
  max-height: 96vh;
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

.stref-split {
  display: flex;
  gap: 12px;
  height: 100%;
  padding: 14px 16px 18px;
  box-sizing: border-box;
}

.stref-pane {
  min-width: 0;
  min-height: 0;
}

.stref-pane--left {
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stref-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.stref-actions-spacer {
  flex: 1;
}

.stref-reference-shell {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #ececec;
  border-radius: 12px;
}

.stref-pane--right {
  flex: 0 0 0;
  width: 0;
  opacity: 0;
  pointer-events: none;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
  transition: width 0.22s ease, flex-basis 0.22s ease, opacity 0.18s ease;
  display: flex;
  flex-direction: column;
}

.stref-pane--right.is-open {
  flex: 0 0 60%;
  width: 60%;
  opacity: 1;
  pointer-events: auto;
}

.stref-app-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #ececec;
  background: #f8fafc;
}

.stref-app-title {
  font-weight: 900;
  color: #111827;
  font-size: 14px;
}

.stref-app-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.stref-app-error {
  padding: 12px;
  color: #991b1b;
  font-weight: 800;
  background: #fff5f5;
}

/* Fix: embedded UCAS modal uses transform scaling which breaks fixed overlays in split-panel context */
.stref-reference-shell :deep(.ucas-overlay--embedded .ucas-modal),
.stref-app-body :deep(.ucas-overlay--embedded .ucas-modal) {
  transform: none !important;
  transform-origin: initial !important;
  width: 100% !important;
  height: 100% !important;
}

.stref-reference-shell :deep(.ucas-overlay--embedded .ucas-body),
.stref-app-body :deep(.ucas-overlay--embedded .ucas-body) {
  padding: 14px !important;
}

.stref-reference-shell :deep(.ucas-expand-body),
.stref-app-body :deep(.ucas-expand-body) {
  overflow: auto !important;
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

.stref-btn--primary {
  background: #111827;
  border-color: #111827;
  color: #fff;
}

.stref-btn--primary:hover {
  background: #0b1220;
}

.stref-btn--ghost {
  background: #fff;
}

.stref-btn--sm {
  padding: 7px 10px;
  border-radius: 9px;
  font-size: 13px;
}

.stref-btn:hover {
  background: #e9edf2;
}

@media (max-width: 900px) {
  .stref-split {
    flex-direction: column;
  }

  .stref-pane--right,
  .stref-pane--right.is-open {
    flex: 0 0 auto;
    width: 100%;
    opacity: 1;
    pointer-events: auto;
  }

  .stref-overlay {
    padding: 0;
  }

  .stref-modal {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>

