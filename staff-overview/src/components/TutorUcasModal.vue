<template>
  <div v-if="isOpen" class="tutor-ucas-overlay" @click.self="handleClose">
    <div class="tutor-ucas-modal">
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

        <div v-else class="tutor-ucas-content">
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
            <button class="tutor-ucas-btn tutor-ucas-btn--primary" @click="openUcasInNewTab">
              Open UCAS application
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
              <div class="muted">{{ (refFull?.section3 || []).length }} contributions</div>
            </div>

            <div v-if="(refFull?.section3 || []).length === 0" class="tutor-ucas-empty">
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
                    <div class="muted">{{ formatDate(c.updatedAt || c.createdAt) }}</div>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { staffAPI } from '../services/api.js'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  student: { type: Object, default: null },
  staffEmail: { type: String, default: '' },
  staffName: { type: String, default: '' },
  academicYear: { type: String, default: 'current' }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')

const ucasApp = ref(null)
const refFull = ref(null)

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

const groupedSection3 = computed(() => {
  const items = refFull.value?.data?.section3 || []
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
      items: [...arr].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
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
    const [appResp, refResp] = await Promise.all([
      staffAPI.getUcasApplication(props.student.email, props.academicYear),
      staffAPI.getReferenceFull(props.student.email, props.academicYear)
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

function openUcasInNewTab() {
  const email = String(props.student?.email || '').trim()
  if (!email) return
  try {
    localStorage.setItem('vespa_open_ucas', JSON.stringify({ email, ts: Date.now() }))
  } catch (_) {}
  const url = `https://vespaacademy.knack.com/vespa-academy#vespa-coaching-report?email=${encodeURIComponent(email)}&open=ucas`
  window.open(url, '_blank', 'noopener')
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
  padding: 18px;
}

.tutor-ucas-modal {
  width: 980px;
  max-width: 96vw;
  max-height: 92vh;
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
  font-size: 18px;
  font-weight: 800;
}

.tutor-ucas-sub {
  margin-top: 4px;
  font-size: 12px;
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
  padding: 14px 16px 18px;
  overflow: auto;
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
  font-size: 12px;
  color: #666;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
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
  font-size: 13px;
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
  font-size: 12px;
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
  font-size: 14px;
  line-height: 1.55;
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
}
</style>

