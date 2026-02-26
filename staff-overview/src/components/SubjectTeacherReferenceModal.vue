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

              <div class="stref-card">
                <div class="stref-card-head">
                  <div>
                    <div class="stref-card-title">Subject teacher contribution</div>
                    <div class="stref-card-sub">
                      Add a short subject reference for UCAS Section 3. This is visible to the tutor who compiles the final narrative.
                    </div>
                  </div>
                  <div class="stref-status">
                    <div class="stref-status-pill" :class="statusPillClass" :title="statusTitle">
                      {{ statusLabel }}
                    </div>
                  </div>
                </div>

                <div class="stref-form">
                  <label class="stref-label">
                    Subject
                    <select v-model="selectedSubjectKey" class="stref-select">
                      <option v-for="opt in subjectOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                  </label>

                  <label class="stref-label">
                    Your reference
                    <textarea
                      v-model="contributionText"
                      class="stref-textarea"
                      rows="8"
                      :disabled="saving || !staffEmailSafe"
                      placeholder="Describe the student's ability, achievements, and potential in your subject."
                    />
                  </label>

                  <div class="stref-form-footer">
                    <div class="stref-inline-error" v-if="saveError">{{ saveError }}</div>
                    <div class="stref-inline-hint" v-else>
                      <span v-if="!staffEmailSafe">Saving is unavailable because your staff email is missing.</span>
                      <span v-else>Tip: keep it specific and evidence-based (examples of work, behaviours, strengths).</span>
                    </div>
                    <div class="stref-form-actions">
                      <button class="stref-btn" type="button" @click="clearDraft" :disabled="saving || !contributionTextTrimmed">
                        Clear
                      </button>
                      <button class="stref-btn stref-btn--primary" type="button" @click="saveContribution" :disabled="saving || !staffEmailSafe || !canSaveContribution">
                        {{ saving ? 'Saving…' : 'Save contribution' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="stref-card" v-if="mySubmissions.length">
                <div class="stref-card-head">
                  <div>
                    <div class="stref-card-title">Your submitted contributions</div>
                    <div class="stref-card-sub">For context and copying. (Only your submissions are shown here.)</div>
                  </div>
                  <div class="stref-count">{{ mySubmissions.length }}</div>
                </div>
                <div class="stref-submissions">
                  <div v-for="c in mySubmissions" :key="c.id" class="stref-submission">
                    <div class="stref-submission-head">
                      <div class="stref-submission-subject">{{ c.subjectKey }}</div>
                      <div class="stref-submission-meta">
                        <span v-if="c.submittedAt">Submitted: {{ formatDate(c.submittedAt) }}</span>
                        <span v-else-if="c.updatedAt">Updated: {{ formatDate(c.updatedAt) }}</span>
                      </div>
                    </div>
                    <div class="stref-submission-text">{{ c.text }}</div>
                    <div class="stref-submission-actions">
                      <button class="stref-btn stref-btn--sm" type="button" @click="copyText(c.text)">Copy</button>
                      <button class="stref-btn stref-btn--sm stref-btn--ghost" type="button" @click="loadDraftFrom(c)">
                        Load into editor
                      </button>
                    </div>
                  </div>
                </div>
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
const refFull = ref(null)

// Slide-in application panel
const ucasAppOpen = ref(false)
const ucasAppError = ref('')

// Subject teacher contribution editor
const selectedSubjectKey = ref('General')
const contributionText = ref('')
const saving = ref(false)
const saveError = ref('')

function normalizeAy(v) {
  const s = (v ?? '').toString().trim()
  if (!s) return 'current'
  const low = s.toLowerCase()
  if (low === 'current') return 'current'
  return s
}

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase()
}

const staffEmailSafe = computed(() => normalizeEmail(props.staffEmail))

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

const subjectOptions = computed(() => {
  const out = []
  const seen = new Set()
  const list = subjects.value || []
  for (const s of list) {
    const label =
      String(s?.subjectName || s?.name || s?.title || s?.subject || '')
        .trim()
    if (!label) continue
    if (seen.has(label)) continue
    seen.add(label)
    out.push(label)
  }
  if (!seen.has('General')) out.unshift('General')
  return out.length ? out : ['General']
})

function inviteSentAt(inv) {
  return inv?.sentAt || inv?.sent_at || inv?.createdAt || inv?.created_at || null
}

function inviteSubmittedAt(inv) {
  return (
    inv?.submittedAt ||
    inv?.submitted_at ||
    inv?.respondedAt ||
    inv?.responded_at ||
    inv?.completedAt ||
    inv?.completed_at ||
    inv?.existing?.['3']?.updatedAt ||
    inv?.existing?.[3]?.updatedAt ||
    inv?.existing?.['3']?.createdAt ||
    inv?.existing?.[3]?.createdAt ||
    null
  )
}

function inviteReferenceText(inv) {
  const candidate =
    inv?.referenceText ||
    inv?.reference_text ||
    inv?.submittedText ||
    inv?.submitted_text ||
    inv?.section3Text ||
    inv?.section_3_text ||
    inv?.latestContribution?.text ||
    inv?.existing?.['3']?.text ||
    inv?.existing?.[3]?.text ||
    ''
  return String(candidate || '').trim()
}

function pickLatestInvite(invites, teacherEmail) {
  const email = normalizeEmail(teacherEmail)
  const list = Array.isArray(invites) ? invites : []
  const matching = list.filter(i => normalizeEmail(i?.teacherEmail || i?.email) === email)
  if (!matching.length) return null
  matching.sort((a, b) => {
    const at = Date.parse(a?.createdAt || a?.sentAt || a?.expiresAt || '') || 0
    const bt = Date.parse(b?.createdAt || b?.sentAt || b?.expiresAt || '') || 0
    return bt - at
  })
  return matching[0]
}

const latestRequest = computed(() => {
  const inv = pickLatestInvite(refFull.value?.data?.invites || refFull.value?.invites, staffEmailSafe.value)
  if (!inv) return null
  const status = String(inv?.status || '').trim().toLowerCase() || 'pending'
  return {
    status: status === 'submitted' ? 'submitted' : 'pending',
    subjectKey: String(inv?.subjectKey || '').trim() || null,
    sentAt: inviteSentAt(inv),
    submittedAt: inviteSubmittedAt(inv)
  }
})

const statusLabel = computed(() => {
  const r = latestRequest.value
  if (!r) return 'Not requested'
  return r.status === 'submitted' ? 'Submitted' : 'Pending'
})

const statusPillClass = computed(() => {
  const r = latestRequest.value
  if (!r) return 'none'
  return r.status === 'submitted' ? 'ok' : 'wait'
})

const statusTitle = computed(() => {
  const r = latestRequest.value
  if (!r) return 'No UCAS reference request for you yet.'
  const parts = []
  if (r.sentAt) parts.push(`Sent: ${formatDate(r.sentAt)}`)
  if (r.submittedAt) parts.push(`Submitted: ${formatDate(r.submittedAt)}`)
  return parts.join(' · ') || statusLabel.value
})

const mySubmissions = computed(() => {
  const out = []
  const seen = new Set()
  const staff = staffEmailSafe.value
  const full = refFull.value?.data || refFull.value || {}

  const section3 = Array.isArray(full.section3) ? full.section3 : []
  for (const c of section3) {
    const email = normalizeEmail(c?.authorEmail || c?.author_email)
    if (!staff || !email || email !== staff) continue
    const text = String(c?.text || '').trim()
    if (!text) continue
    const subjectKey = String(c?.subjectKey || c?.subject_key || 'General').trim() || 'General'
    const submittedAt = c?.submittedAt || c?.submitted_at || c?.updatedAt || c?.updated_at || null
    const id = c?.id || `${email}__${subjectKey}__${text.slice(0, 40)}`
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id, subjectKey, text, submittedAt, updatedAt: c?.updatedAt || c?.updated_at || null })
  }

  const invites = Array.isArray(full.invites) ? full.invites : []
  for (const inv of invites) {
    const email = normalizeEmail(inv?.teacherEmail || inv?.email)
    if (!staff || !email || email !== staff) continue
    const text = inviteReferenceText(inv)
    if (!text) continue
    const subjectKey = String(inv?.subjectKey || 'General').trim() || 'General'
    const submittedAt = inviteSubmittedAt(inv)
    const id = inv?.id || `${email}__${subjectKey}__${text.slice(0, 40)}`
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id, subjectKey, text, submittedAt, updatedAt: submittedAt })
  }

  out.sort((a, b) => String(b.submittedAt || b.updatedAt || '').localeCompare(String(a.submittedAt || a.updatedAt || '')))
  return out
})

const contributionTextTrimmed = computed(() => String(contributionText.value || '').trim())
const canSaveContribution = computed(() => {
  if (!contributionTextTrimmed.value) return false
  if (!selectedSubjectKey.value) return false
  return true
})

async function load() {
  const email = String(props.student?.email || '').trim()
  if (!email) return
  loading.value = true
  error.value = ''
  ucasAppError.value = ''
  saveError.value = ''
  try {
    const [p, r] = await Promise.all([
      // Ask backend to resolve 'current' into a concrete academic year for this student.
      staffAPI.getAcademicProfile(email, desiredAcademicYear.value),
      staffAPI.getReferenceFull(email, desiredAcademicYear.value)
    ])
    profile.value = p
    refFull.value = r

    // Default subject selection from the latest request (if present), otherwise from profile subjects.
    const requestedSubject = latestRequest.value?.subjectKey
    if (requestedSubject) {
      selectedSubjectKey.value = requestedSubject
    } else if (subjectOptions.value && subjectOptions.value.length) {
      selectedSubjectKey.value = subjectOptions.value[0]
    }
  } catch (e) {
    error.value = e?.message || 'Failed to load'
    profile.value = null
    refFull.value = null
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

function clearDraft() {
  contributionText.value = ''
  saveError.value = ''
}

function loadDraftFrom(c) {
  try {
    if (c?.subjectKey) selectedSubjectKey.value = String(c.subjectKey)
    contributionText.value = String(c?.text || '')
  } catch (_) {}
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text || '')
  } catch (_) {}
}

async function saveContribution() {
  const studentEmail = String(props.student?.email || '').trim()
  const staffEmail = staffEmailSafe.value
  const text = contributionTextTrimmed.value
  const subjectKey = String(selectedSubjectKey.value || 'General').trim() || 'General'
  if (!studentEmail) return
  if (!staffEmail) {
    saveError.value = 'Staff email is missing; cannot save.'
    return
  }
  if (!text) {
    saveError.value = 'Please write a short reference first.'
    return
  }
  saving.value = true
  saveError.value = ''
  try {
    const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/contribution`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': 'staff' },
      body: JSON.stringify({
        academicYear: resolvedAcademicYear.value,
        section: 3,
        subjectKey,
        text,
        staffEmail
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || data?.message || `API error: ${response.status}`)
    }
    // Refresh reference data so "Your submissions" updates immediately
    refFull.value = await staffAPI.getReferenceFull(studentEmail, desiredAcademicYear.value)
  } catch (e) {
    saveError.value = e?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
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

function formatDate(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleString()
  } catch {
    return String(v)
  }
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
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.stref-pane--left {
  flex: 1 1 auto;
  overflow: auto;
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

.stref-card {
  border: 1px solid #ececec;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
}

.stref-card + .stref-card {
  margin-top: 12px;
}

.stref-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.stref-card-title {
  font-weight: 950;
  color: #111827;
  font-size: 14px;
}

.stref-card-sub {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.stref-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 950;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #374151;
  white-space: nowrap;
}

.stref-status-pill.ok {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

.stref-status-pill.wait {
  background: #ffedd5;
  border-color: #fed7aa;
  color: #9a3412;
}

.stref-status-pill.none {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #374151;
}

.stref-count {
  font-weight: 950;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #111827;
  padding: 6px 10px;
  border-radius: 999px;
}

.stref-form {
  display: grid;
  gap: 10px;
}

.stref-label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  font-weight: 900;
  color: #111827;
}

.stref-select {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 9px 10px;
  font-weight: 900;
  background: #fff;
}

.stref-textarea {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  min-height: 160px;
}

.stref-textarea:focus {
  outline: none;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.10);
}

.stref-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.stref-inline-error {
  color: #b91c1c;
  font-weight: 900;
  font-size: 12px;
}

.stref-inline-hint {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.stref-form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stref-submissions {
  display: grid;
  gap: 10px;
}

.stref-submission {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  background: #fafafa;
}

.stref-submission-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.stref-submission-subject {
  font-weight: 950;
  color: #111827;
  font-size: 12px;
}

.stref-submission-meta {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.stref-submission-text {
  white-space: pre-wrap;
  color: #111827;
  font-size: 13px;
  line-height: 1.5;
}

.stref-submission-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
.stref-app-body :deep(.ucas-overlay--embedded .ucas-modal) {
  transform: none !important;
  transform-origin: initial !important;
  width: 100% !important;
  height: 100% !important;
}

.stref-app-body :deep(.ucas-overlay--embedded .ucas-body) {
  padding: 14px !important;
}

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

