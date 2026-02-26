<template>
  <!-- Teleport prevents Knack containers from clipping the modal (overflow/transform issues). -->
  <teleport to="body">
    <div v-if="isOpen" class="tutor-ucas-overlay" @click.self="handleClose">
      <div class="tutor-ucas-modal" role="dialog" aria-modal="true">
        <div class="tutor-ucas-header">
          <div class="tutor-ucas-title">
            <h3>{{ student?.name || 'Student' }} — UCAS</h3>
            <div class="tutor-ucas-sub">{{ student?.email || '' }}</div>
          </div>
          <button class="tutor-ucas-close" @click="handleClose">&times;</button>
        </div>

        <div class="tutor-ucas-body">
          <div v-if="loading" class="tutor-ucas-loading">
            <div class="spinner"></div>
            <div>Loading UCAS data…</div>
          </div>

          <div v-else-if="error" class="tutor-ucas-error">
            <div class="tutor-ucas-error-title">Could not load UCAS data</div>
            <div class="tutor-ucas-error-msg">{{ error }}</div>
            <button class="tutor-ucas-btn" @click="reload">Try again</button>
          </div>

          <div v-else class="tutor-ucas-split" :class="{ 'tutor-ucas-split--app-open': ucasAppOpen }">
            <!-- Left: tutor reference + statuses -->
            <div class="tutor-ucas-pane tutor-ucas-pane--left">
          <!-- Status row -->
          <div class="tutor-ucas-status-row">
            <div class="tutor-ucas-status-card">
              <div class="label">Application</div>
              <div :class="['pill', appStarted ? 'pill--ok' : 'pill--muted']">
                {{ appStarted ? 'Started' : 'Not started' }}
              </div>
              <div class="detail">
                {{ appStarted ? 'Course / offers started' : 'No course/offers yet' }}
              </div>
            </div>

            <div class="tutor-ucas-status-card">
              <div class="label">Personal statement</div>
              <div :class="['pill', statementPillClass]">
                {{ statementStatusLabel }}
              </div>
              <div class="detail">
                {{ statementChars }} chars
                <span v-if="statementCompletedAt"> · completed</span>
              </div>
            </div>

            <div class="tutor-ucas-status-card">
              <div class="label">Tutor reference</div>
              <div :class="['pill', tutorCompiledCompletedAt ? 'pill--ok' : (compiledHasText ? 'pill--warn' : 'pill--muted')]">
                {{ tutorCompiledCompletedAt ? 'Complete' : (compiledHasText ? 'In progress' : 'Not started') }}
              </div>
              <div class="detail">
                {{ compiledTextTrimmed.length }} chars
                <span v-if="tutorCompiledCompletedAt"> · marked complete</span>
              </div>
            </div>
          </div>

          <div class="tutor-ucas-actions">
            <button class="tutor-ucas-btn tutor-ucas-btn--primary" :disabled="ucasAppLoading" @click="toggleUcasPanel">
              {{ ucasAppOpen ? 'Back to tutor reference' : (ucasAppLoading ? 'Opening…' : 'View student application') }}
            </button>
            <button class="tutor-ucas-btn" :disabled="requestingEdits" @click="requestStatementEdits">
              {{ requestingEdits ? 'Requesting…' : 'Request edits (statement)' }}
            </button>
            <div class="tutor-ucas-actions-spacer"></div>
            <button class="tutor-ucas-btn tutor-ucas-btn--ghost" @click="reload">
              Reload
            </button>
          </div>

          <!-- Incoming teacher contributions -->
          <div class="tutor-ucas-section">
            <div class="tutor-ucas-section-head">
              <h4>Incoming subject teacher references</h4>
              <div class="muted">{{ incomingAllSection3.length }} submitted</div>
            </div>

            <div v-if="incomingAllSection3.length === 0" class="tutor-ucas-empty">
              No subject teacher contributions yet.
            </div>

            <div v-else class="tutor-ucas-contribs">
              <div
                v-for="group in groupedSection3"
                :key="group.subjectKey"
                class="tutor-ucas-contrib-group"
              >
                <div class="tutor-ucas-contrib-group-title">
                  {{ group.subjectKey }}
                </div>
                <div v-for="c in group.items" :key="c.id" class="tutor-ucas-contrib">
                  <div class="tutor-ucas-contrib-meta">
                    <div class="name">{{ c.authorName || c.authorEmail || 'Teacher' }}</div>
                    <div class="muted">
                      <span v-if="c.submittedAt">Submitted: {{ formatDate(c.submittedAt) }}</span>
                      <span v-else>{{ formatDate(c.updatedAt || c.createdAt) }}</span>
                      <span v-if="c.sentAt"> · Sent: {{ formatDate(c.sentAt) }}</span>
                    </div>
                  </div>
                  <div class="tutor-ucas-contrib-text">{{ c.text }}</div>
                  <div class="tutor-ucas-contrib-actions">
                    <button class="tutor-ucas-btn tutor-ucas-btn--sm" @click="appendToCompiled(c)">
                      Add to compiled
                    </button>
                    <button class="tutor-ucas-btn tutor-ucas-btn--sm tutor-ucas-btn--ghost" @click="copyText(c.text)">
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tutor compiled narrative editor -->
          <div class="tutor-ucas-section">
            <div class="tutor-ucas-section-head">
              <h4>Tutor compiled reference (final narrative)</h4>
              <div class="muted">
                Saved: {{ tutorCompiledUpdatedAt ? formatDate(tutorCompiledUpdatedAt) : '—' }}
              </div>
            </div>

            <textarea
              v-model="compiledText"
              class="tutor-ucas-textarea"
              placeholder="Build the final tutor narrative here…"
              :disabled="saving || markingComplete"
              rows="10"
            ></textarea>

            <div class="tutor-ucas-editor-footer">
              <div v-if="saveError" class="tutor-ucas-inline-error">{{ saveError }}</div>
              <div class="tutor-ucas-editor-actions">
                <button class="tutor-ucas-btn" :disabled="saving || !hasChanges" @click="saveCompiled">
                  {{ saving ? 'Saving…' : 'Save draft' }}
                </button>
                <button
                  v-if="!tutorCompiledCompletedAt"
                  class="tutor-ucas-btn tutor-ucas-btn--primary"
                  :disabled="markingComplete || !compiledHasText"
                  @click="markComplete"
                >
                  {{ markingComplete ? 'Marking…' : 'Mark ready for UCAS' }}
                </button>
                <button
                  v-else
                  class="tutor-ucas-btn tutor-ucas-btn--danger"
                  :disabled="markingComplete"
                  @click="unmarkComplete"
                >
                  {{ markingComplete ? 'Updating…' : 'Send back (unmark complete)' }}
                </button>
              </div>
            </div>
          </div>

          <div class="tutor-ucas-footnote">
            Students can see status, not the reference content. Subject teachers submit into “Incoming…” above; tutors collate into the final narrative.
          </div>
          </div>

            <!-- Right: student UCAS application (slide-in) -->
            <div class="tutor-ucas-pane tutor-ucas-pane--right" :class="{ 'is-open': ucasAppOpen }">
              <div class="tutor-ucas-app-head">
                <div class="tutor-ucas-app-title">Student UCAS application</div>
                <button class="tutor-ucas-btn tutor-ucas-btn--sm tutor-ucas-btn--ghost" type="button" @click="closeUcasApp">
                  Close
                </button>
              </div>

              <div v-if="ucasAppError" class="tutor-ucas-app-error">
                {{ ucasAppError }}
              </div>

              <div v-else class="tutor-ucas-app-body">
                <UcasApplicationModal
                  v-if="ucasAppOpen"
                  embedded
                  :studentEmail="student?.email || ''"
                  :academicYear="ucasAcademicYear"
                  :subjects="ucasSubjects"
                  :offers="ucasOffers"
                  :apiUrl="apiUrl"
                  :canEdit="false"
                  :staffEmail="staffEmail"
                  @close="closeUcasApp"
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
  staffName: { type: String, default: '' },
  academicYear: { type: String, default: 'current' },
  autoOpenApplication: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')

const ucasApp = ref(null)
const refFull = ref(null)

// Direct UCAS application modal state
const ucasAppOpen = ref(false)
const ucasAppLoading = ref(false)
const ucasAppError = ref('')
const ucasProfile = ref(null)

const apiUrl = API_BASE_URL

const effectiveAcademicYear = ref(props.academicYear || 'current')
const ucasAcademicYear = computed(() => {
  const p = ucasProfile.value?.data || ucasProfile.value || {}
  return (p.academic_year || p.academicYear || effectiveAcademicYear.value || 'current')
})
const ucasSubjects = computed(() => {
  const p = ucasProfile.value?.data || ucasProfile.value || {}
  return Array.isArray(p.subjects) ? p.subjects : []
})
const ucasOffers = computed(() => {
  const p = ucasProfile.value?.data || ucasProfile.value || {}
  return Array.isArray(p.offers) ? p.offers : []
})

const compiledText = ref('')
const compiledOriginal = ref('')
const saving = ref(false)
const saveError = ref('')
const markingComplete = ref(false)
const requestingEdits = ref(false)

const tutorCompiledUpdatedAt = ref(null)
const tutorCompiledCompletedAt = ref(null)
const statementCompletedAt = ref(null)

const statementChars = computed(() => {
  const answers = ucasApp.value?.data?.answers || {}
  const q1 = (answers.q1 || '').length
  const q2 = (answers.q2 || '').length
  const q3 = (answers.q3 || '').length
  return q1 + q2 + q3
})

const appStarted = computed(() => {
  const app = ucasApp.value?.data || {}
  const hasCourse = !!app.selectedCourseKey
  const hasGrades = !!(app.requirementsByCourse && Object.keys(app.requirementsByCourse).length > 0)
  return hasCourse || hasGrades
})

const statementStatusLabel = computed(() => {
  if (statementCompletedAt.value) return 'Completed'
  if (statementChars.value >= 350) return 'In progress'
  return 'Not started'
})

const statementPillClass = computed(() => {
  if (statementCompletedAt.value) return 'pill--ok'
  if (statementChars.value >= 350) return 'pill--warn'
  return 'pill--muted'
})

const compiledTextTrimmed = computed(() => (compiledText.value || '').trim())
const compiledHasText = computed(() => compiledTextTrimmed.value.length > 0)
const hasChanges = computed(() => compiledText.value.trim() !== (compiledOriginal.value || '').trim())

const incomingSection3 = computed(() => {
  const listA = refFull.value?.data?.section3
  const listB = refFull.value?.section3
  const raw = Array.isArray(listA) ? listA : (Array.isArray(listB) ? listB : [])
  return raw.map((c, idx) => ({
    id: c?.id ?? `contrib_${idx}`,
    subjectKey: c?.subjectKey ?? c?.subject_key ?? '',
    authorName: c?.authorName ?? c?.author_name ?? '',
    authorEmail: c?.authorEmail ?? c?.author_email ?? '',
    text: c?.text ?? '',
    createdAt: c?.createdAt ?? c?.created_at ?? null,
    updatedAt: c?.updatedAt ?? c?.updated_at ?? null
  }))
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

const incomingInvitesSection3 = computed(() => {
  const listA = refFull.value?.data?.invites
  const listB = refFull.value?.invites
  const raw = Array.isArray(listA) ? listA : (Array.isArray(listB) ? listB : [])
  return raw
    .filter((inv) => inv && inv.status === 'submitted' && !!inviteReferenceText(inv))
    .map((inv, idx) => ({
      id: inv?.id ?? `invite_${idx}`,
      subjectKey: String(inv?.subjectKey || '').trim(),
      authorName: String(inv?.teacherName || '').trim(),
      authorEmail: String(inv?.teacherEmail || inv?.email || '').trim(),
      text: inviteReferenceText(inv),
      sentAt: inviteSentAt(inv),
      submittedAt: inviteSubmittedAt(inv),
      source: 'invite'
    }))
})

const incomingAllSection3 = computed(() => {
  const out = []
  const seen = new Set()

  // Prefer contributions (if backend already materializes them)
  for (const c of incomingSection3.value) {
    const key = `${String(c.authorEmail || '').trim().toLowerCase()}__${String(c.subjectKey || '').trim().toLowerCase()}__${String(c.text || '').trim().slice(0, 64)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...c, source: 'contribution' })
  }

  // Add submitted invites (teacher-link submissions) if not already present
  for (const inv of incomingInvitesSection3.value) {
    const key = `${String(inv.authorEmail || '').trim().toLowerCase()}__${String(inv.subjectKey || '').trim().toLowerCase()}__${String(inv.text || '').trim().slice(0, 64)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(inv)
  }

  return out
})

const groupedSection3 = computed(() => {
  const items = incomingAllSection3.value
  const bySubject = new Map()
  for (const c of items) {
    const subjectKey = (c.subjectKey || 'General').trim() || 'General'
    const arr = bySubject.get(subjectKey) || []
    arr.push(c)
    bySubject.set(subjectKey, arr)
  }
  const out = []
  for (const [subjectKey, arr] of bySubject.entries()) {
    out.push({
      subjectKey,
      items: [...arr].sort((a, b) =>
        String(b.submittedAt || b.updatedAt || b.createdAt || '').localeCompare(
          String(a.submittedAt || a.updatedAt || a.createdAt || '')
        )
      )
    })
  }
  out.sort((a, b) => a.subjectKey.localeCompare(b.subjectKey))
  return out
})

async function load() {
  if (!props.student?.email) return
  loading.value = true
  error.value = ''
  saveError.value = ''
  try {
    await resolveAcademicYear()
    const [appResp, refResp] = await Promise.all([
      staffAPI.getUcasApplication(props.student.email, effectiveAcademicYear.value),
      staffAPI.getReferenceFull(props.student.email, effectiveAcademicYear.value)
    ])
    ucasApp.value = appResp
    refFull.value = refResp

    statementCompletedAt.value = ucasApp.value?.data?.statement_completed_at || ucasApp.value?.data?.statementCompletedAt || null

    const tutorText = refFull.value?.data?.tutorCompiledSection3 || ''
    compiledText.value = tutorText
    compiledOriginal.value = tutorText

    tutorCompiledUpdatedAt.value = refFull.value?.data?.tutorCompiledUpdatedAt || null
    tutorCompiledCompletedAt.value = refFull.value?.data?.tutorCompiledCompletedAt || null
  } catch (e) {
    error.value = e?.message || 'Failed to load'
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

function normalizeAy(v) {
  const s = (v ?? '').toString().trim()
  if (!s) return 'current'
  const low = s.toLowerCase()
  if (low === 'current') return 'current'
  return s
}

async function resolveAcademicYear() {
  const desired = normalizeAy(props.academicYear)
  if (!props.student?.email) {
    effectiveAcademicYear.value = desired
    return
  }
  if (desired !== 'current') {
    effectiveAcademicYear.value = desired
    return
  }
  // Ask backend to resolve the student's current academic year.
  try {
    const resp = await staffAPI.getAcademicProfile(props.student.email, 'current')
    const data = resp?.data || resp || {}
    const resolved = normalizeAy(data.academic_year || data.academicYear || desired)
    effectiveAcademicYear.value = resolved || desired
  } catch (_) {
    effectiveAcademicYear.value = desired
  }
}

function handleClose() {
  if (hasChanges.value && !confirm('You have unsaved changes. Close without saving?')) return
  emit('close')
}

async function saveCompiled() {
  if (!props.student?.email) return
  saveError.value = ''
  saving.value = true
  try {
    await staffAPI.saveTutorCompiled(props.student.email, {
      academicYear: props.academicYear,
      staffEmail: props.staffEmail,
      staffName: props.staffName,
      text: compiledText.value
    })
    await load()
  } catch (e) {
    saveError.value = e?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function markComplete() {
  if (!props.student?.email) return
  if (!compiledHasText.value) return
  if (!confirm('Mark this tutor reference as READY for UCAS?')) return
  markingComplete.value = true
  saveError.value = ''
  try {
    // Ensure latest draft is saved before completion (best UX)
    if (hasChanges.value) {
      await staffAPI.saveTutorCompiled(props.student.email, {
        academicYear: props.academicYear,
        staffEmail: props.staffEmail,
        staffName: props.staffName,
        text: compiledText.value
      })
    }
    await staffAPI.markTutorCompiledComplete(props.student.email, {
      academicYear: props.academicYear,
      staffEmail: props.staffEmail,
      staffName: props.staffName
    })
    await load()
  } catch (e) {
    saveError.value = e?.message || 'Failed to mark complete'
  } finally {
    markingComplete.value = false
  }
}

async function unmarkComplete() {
  if (!props.student?.email) return
  if (!confirm('Send back to tutor (unmark complete)?')) return
  markingComplete.value = true
  saveError.value = ''
  try {
    await staffAPI.unmarkTutorCompiledComplete(props.student.email, {
      academicYear: props.academicYear,
      staffEmail: props.staffEmail,
      staffName: props.staffName
    })
    await load()
  } catch (e) {
    saveError.value = e?.message || 'Failed to unmark complete'
  } finally {
    markingComplete.value = false
  }
}

function appendToCompiled(contrib) {
  const text = (contrib?.text || '').trim()
  if (!text) return
  const current = compiledText.value || ''
  const separator = current.trim().length ? '\n\n' : ''
  compiledText.value = `${current}${separator}${text}`.trimStart()
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text || '')
  } catch (_) {
    // Ignore (clipboard permissions vary in embedded contexts)
  }
}

async function openUcasInModal() {
  const email = String(props.student?.email || '').trim()
  if (!email) return
  ucasAppError.value = ''
  ucasAppLoading.value = true
  try {
    await resolveAcademicYear()
    const profileResp = await staffAPI.getAcademicProfile(email, effectiveAcademicYear.value)
    ucasProfile.value = profileResp
    ucasAppOpen.value = true
  } catch (e) {
    ucasAppError.value = e?.message || 'Failed to open UCAS application'
    error.value = ucasAppError.value
  } finally {
    ucasAppLoading.value = false
  }
}

async function toggleUcasPanel() {
  if (ucasAppOpen.value) {
    closeUcasApp()
    return
  }
  await openUcasInModal()
}

function closeUcasApp() {
  ucasAppOpen.value = false
  ucasProfile.value = null
  ucasAppError.value = ''
}

async function requestStatementEdits() {
  if (!props.student?.email) return
  if (!confirm('Request further edits to the student’s personal statement?')) return
  requestingEdits.value = true
  try {
    await staffAPI.requestUcasStatementEdits(props.student.email, {
      academicYear: props.academicYear,
      staffEmail: props.staffEmail,
      staffName: props.staffName
    })
    await load()
  } catch (e) {
    // show as modal error (simple)
    error.value = e?.message || 'Failed to request edits'
  } finally {
    requestingEdits.value = false
  }
}

function reload() {
  load()
}

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
.tutor-ucas-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10050;
  padding: 8px;
}

.tutor-ucas-modal {
  /* Fill far more of the viewport (Knack embedded pages often feel cramped) */
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

.tutor-ucas-header {
  padding: 16px 18px;
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tutor-ucas-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.tutor-ucas-sub {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.95;
}

.tutor-ucas-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.tutor-ucas-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tutor-ucas-body {
  padding: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.tutor-ucas-split {
  display: flex;
  gap: 12px;
  height: 100%;
  flex: 1;
  min-height: 0;
  padding: 14px 16px 18px;
  box-sizing: border-box;
}

.tutor-ucas-pane {
  min-width: 0;
  overflow: auto;
  min-height: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.tutor-ucas-pane--left {
  flex: 1 1 auto;
}

.tutor-ucas-pane--right {
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

.tutor-ucas-pane--right.is-open {
  flex: 0 0 60%;
  width: 60%;
  opacity: 1;
  pointer-events: auto;
}

.tutor-ucas-app-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #ececec;
  background: #f8fafc;
}

.tutor-ucas-app-title {
  font-weight: 900;
  color: #111827;
  font-size: 14px;
}

.tutor-ucas-app-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tutor-ucas-app-body :deep(.ucas-overlay--embedded) {
  height: 100%;
}

/* Fix: embedded UCAS modal uses transform scaling which breaks fixed overlays in split-panel context */
.tutor-ucas-app-body :deep(.ucas-overlay--embedded .ucas-modal) {
  transform: none !important;
  transform-origin: initial !important;
  width: 100% !important;
  height: 100% !important;
}

.tutor-ucas-app-body :deep(.ucas-overlay--embedded .ucas-body) {
  padding: 14px !important;
}

/* Fix: expanded panels must scroll within the expanded view (not the background pane) */
.tutor-ucas-app-body :deep(.ucas-expand-body) {
  overflow: auto !important;
}

.tutor-ucas-app-error {
  padding: 12px;
  color: #991b1b;
  font-weight: 800;
  background: #fff5f5;
}

.tutor-ucas-loading {
  padding: 28px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #444;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e0e0e0;
  border-top-color: #079baa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tutor-ucas-error {
  padding: 18px;
  background: #fff5f5;
  border: 1px solid #ffd2d2;
  border-radius: 10px;
}

.tutor-ucas-error-title {
  font-weight: 800;
  color: #b91c1c;
  margin-bottom: 6px;
}

.tutor-ucas-error-msg {
  color: #7f1d1d;
  margin-bottom: 10px;
  white-space: pre-wrap;
}

.tutor-ucas-status-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tutor-ucas-status-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
}

.tutor-ucas-status-card .label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 800;
}

.tutor-ucas-status-card .detail {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  margin-top: 8px;
}

.pill--ok {
  background: #dcfce7;
  color: #166534;
}

.pill--warn {
  background: #ffedd5;
  color: #9a3412;
}

.pill--muted {
  background: #f3f4f6;
  color: #374151;
}

.tutor-ucas-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.tutor-ucas-actions-spacer {
  flex: 1;
}

.tutor-ucas-btn {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 9px 12px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.tutor-ucas-btn:hover:not(:disabled) {
  background: #e9edf2;
}

.tutor-ucas-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tutor-ucas-btn--primary {
  background: #079baa;
  border-color: #079baa;
  color: #fff;
}

.tutor-ucas-btn--primary:hover:not(:disabled) {
  background: #067a87;
}

.tutor-ucas-btn--danger {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}

.tutor-ucas-btn--danger:hover:not(:disabled) {
  background: #fecaca;
}

.tutor-ucas-btn--ghost {
  background: #fff;
}

.tutor-ucas-btn--sm {
  padding: 7px 10px;
  border-radius: 9px;
  font-size: 13px;
}

.tutor-ucas-section {
  margin-top: 14px;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.tutor-ucas-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}

.tutor-ucas-section-head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}

.muted {
  color: #6b7280;
  font-size: 12px;
}

.tutor-ucas-empty {
  color: #6b7280;
  font-style: italic;
  padding: 8px 0;
}

.tutor-ucas-contrib-group-title {
  font-weight: 900;
  color: #111827;
  margin: 10px 0 8px;
}

.tutor-ucas-contrib {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 8px;
  background: #fafafa;
}

.tutor-ucas-contrib-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.tutor-ucas-contrib-meta .name {
  font-weight: 900;
  color: #111827;
  font-size: 12px;
}

.tutor-ucas-contrib-text {
  white-space: pre-wrap;
  color: #111827;
  font-size: 13px;
  line-height: 1.5;
}

.tutor-ucas-contrib-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tutor-ucas-textarea {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.65;
  resize: vertical;
  min-height: 220px;
}

.tutor-ucas-textarea:focus {
  outline: none;
  border-color: #079baa;
  box-shadow: 0 0 0 3px rgba(7, 155, 170, 0.12);
}

.tutor-ucas-editor-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tutor-ucas-editor-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tutor-ucas-inline-error {
  color: #b91c1c;
  font-weight: 800;
  font-size: 12px;
}

.tutor-ucas-footnote {
  margin-top: 12px;
  color: #6b7280;
  font-size: 12px;
}

@media (max-width: 900px) {
  .tutor-ucas-status-row {
    grid-template-columns: 1fr;
  }

  .tutor-ucas-split {
    flex-direction: column;
  }

  .tutor-ucas-pane--right,
  .tutor-ucas-pane--right.is-open {
    flex: 0 0 auto;
    width: 100%;
    opacity: 1;
    pointer-events: auto;
  }

  .tutor-ucas-overlay {
    padding: 0;
  }

  .tutor-ucas-modal {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>

