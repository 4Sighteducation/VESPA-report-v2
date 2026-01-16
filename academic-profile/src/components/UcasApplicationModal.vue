<template>
  <div class="ucas-overlay" role="dialog" aria-modal="true" aria-label="UCAS Application" @click.self="emit('close')">
    <div class="ucas-modal">
      <header class="ucas-header">
        <div class="ucas-header-left">
          <div class="ucas-title">UCAS Application</div>
          <div class="ucas-course-row">
            <div class="ucas-course-label">Course</div>
            <select v-model="selectedCourseKey" class="ucas-select" :disabled="courseOptions.length === 0">
              <option v-if="courseOptions.length === 0" value="">No offers yet</option>
              <option v-for="c in courseOptions" :key="c.key" :value="c.key">
                #{{ c.ranking }} {{ c.universityName }} — {{ c.courseTitle || 'Course' }}
              </option>
            </select>
            <a
              v-if="selectedCourse?.courseLink"
              class="ucas-btn ucas-btn-secondary"
              :href="selectedCourse.courseLink"
              target="_blank"
              rel="noopener noreferrer"
              title="Open course link in a new tab"
            >
              🔗 Course link
            </a>
          </div>
        </div>

        <div class="ucas-header-right">
          <a
            class="ucas-btn ucas-btn-secondary"
            href="https://www.ucas.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open UCAS in a new tab"
          >
            🔎 UCAS search
          </a>
          <button class="ucas-btn ucas-btn-secondary" type="button" @click="copyCombined" :disabled="!combinedStatement">
            📋 Copy statement
          </button>
          <button
            class="ucas-btn ucas-btn-primary"
            type="button"
            @click="saveToServer"
            :disabled="saving || totalChars > MAX_TOTAL_CHARS || totalChars < MIN_TOTAL_CHARS || !studentEmail"
          >
            {{ saving ? 'Saving…' : '💾 Save' }}
          </button>
          <button class="ucas-btn ucas-btn-close" type="button" @click="emit('close')">✖</button>
        </div>
      </header>

      <main class="ucas-body">
        <section class="ucas-top-grid">
          <div class="ucas-card">
            <div class="ucas-card-title">Subjects + offer requirements</div>
            <div class="ucas-card-hint">Enter the grades required by the university for this course (max 5 subjects).</div>

            <div v-if="subjectRows.length === 0" class="ucas-empty">
              No subjects found in the academic profile.
            </div>
            <div v-else class="ucas-subjects-grid">
              <div class="ucas-subjects-head">Subject</div>
              <div class="ucas-subjects-head">Offer</div>
              <template v-for="s in subjectRows" :key="s.key">
                <div class="ucas-subject-name" :title="s.label">{{ s.label }}</div>
                <div>
                  <input
                    class="ucas-input"
                    type="text"
                    :disabled="!canEdit"
                    :value="currentCourseSubjectOffers[s.key] || ''"
                    @input="(e) => setSubjectOffer(s.key, e.target.value)"
                    placeholder="e.g. AAA"
                  />
                </div>
              </template>
            </div>
          </div>

          <div class="ucas-card">
            <div class="ucas-card-title">Character budget</div>
            <div class="ucas-metrics">
              <div class="ucas-metric">
                <div class="ucas-metric-label">Total</div>
                <div class="ucas-metric-value" :class="{ bad: totalChars >= MAX_TOTAL_CHARS }">
                  {{ totalChars }} / {{ MAX_TOTAL_CHARS }}
                </div>
                <div class="ucas-metric-sub">Remaining: {{ remainingChars }}</div>
              </div>
              <div class="ucas-metric">
                <div class="ucas-metric-label">Minimum</div>
                <div class="ucas-metric-value" :class="{ bad: totalChars > 0 && totalChars < MIN_TOTAL_CHARS }">
                  {{ MIN_TOTAL_CHARS }} total
                </div>
                <div class="ucas-metric-sub" v-if="totalChars < MIN_TOTAL_CHARS">Not met yet</div>
                <div class="ucas-metric-sub" v-else>Ready</div>
              </div>
            </div>

            <div class="ucas-preview">
              <div class="ucas-preview-head">
                <div class="ucas-preview-title">Preview (combined statement)</div>
                <div class="ucas-preview-hint">This is how it will be read as one statement.</div>
              </div>
              <div class="ucas-preview-box">{{ combinedStatement || 'Start typing below…' }}</div>
            </div>
          </div>
        </section>

        <section class="ucas-questions">
          <div class="ucas-q">
            <div class="ucas-q-head">
              <div class="ucas-q-title">1) Why do you want to study this course or subject?</div>
              <div class="ucas-q-count">{{ answers.q1.length }} chars</div>
            </div>
            <textarea
              class="ucas-textarea"
              :disabled="!canEdit"
              :value="answers.q1"
              @input="(e) => handleAnswerInput('q1', e.target.value)"
              placeholder="Be specific. What sparked your interest, and why this course?"
            />
          </div>

          <div class="ucas-q">
            <div class="ucas-q-head">
              <div class="ucas-q-title">2) How have your qualifications and studies prepared you?</div>
              <div class="ucas-q-count">{{ answers.q2.length }} chars</div>
            </div>
            <textarea
              class="ucas-textarea"
              :disabled="!canEdit"
              :value="answers.q2"
              @input="(e) => handleAnswerInput('q2', e.target.value)"
              placeholder="Use evidence: topics, projects, what you learned, and how it links."
            />
          </div>

          <div class="ucas-q">
            <div class="ucas-q-head">
              <div class="ucas-q-title">3) What have you done outside education to prepare, and why is it useful?</div>
              <div class="ucas-q-count">{{ answers.q3.length }} chars</div>
            </div>
            <textarea
              class="ucas-textarea"
              :disabled="!canEdit"
              :value="answers.q3"
              @input="(e) => handleAnswerInput('q3', e.target.value)"
              placeholder="Super-curricular, work experience, reading, volunteering, clubs… what did it develop?"
            />
          </div>
        </section>

        <section v-if="commentsEnabled" class="ucas-comments">
          <div class="ucas-card-title">Tutor comments</div>
          <div class="ucas-card-hint">Staff can add comments; students can read them.</div>

          <div v-if="canAddComment" class="ucas-comment-compose">
            <textarea v-model="newComment" class="ucas-textarea ucas-textarea-sm" placeholder="Add a comment…" />
            <div class="ucas-comment-actions">
              <button class="ucas-btn ucas-btn-secondary" type="button" @click="newComment = ''" :disabled="commentSaving">Clear</button>
              <button class="ucas-btn ucas-btn-primary" type="button" @click="submitComment" :disabled="commentSaving || !newComment.trim()">
                {{ commentSaving ? 'Posting…' : 'Post comment' }}
              </button>
            </div>
          </div>

          <div v-if="staffComments.length === 0" class="ucas-empty">No comments yet.</div>
          <div v-else class="ucas-comment-list">
            <div v-for="c in staffComments" :key="c.id" class="ucas-comment">
              <div class="ucas-comment-meta">
                <span class="ucas-comment-author">{{ c.staffEmail || 'Staff' }}</span>
                <span class="ucas-comment-date">{{ formatDate(c.createdAt) }}</span>
              </div>
              <div class="ucas-comment-body">{{ c.comment }}</div>
            </div>
          </div>
        </section>
      </main>

      <footer class="ucas-footer">
        <div class="ucas-footer-left">
          <div><strong>{{ totalChars }}</strong> / {{ MAX_TOTAL_CHARS }} (Remaining: {{ remainingChars }})</div>
          <div v-if="totalChars > 0 && totalChars < MIN_TOTAL_CHARS" class="ucas-warn">
            Add {{ MIN_TOTAL_CHARS - totalChars }} more characters to reach the minimum.
          </div>
          <div v-if="totalChars >= MAX_TOTAL_CHARS" class="ucas-warn">You’ve reached the maximum character limit.</div>
        </div>
        <div class="ucas-footer-right">
          <span v-if="toast" class="ucas-toast">{{ toast }}</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { fetchUcasApplication, saveUcasApplication, addUcasApplicationComment } from '../services/api.js'

const MAX_TOTAL_CHARS = 4000
const MIN_TOTAL_CHARS = 350

const props = defineProps({
  studentEmail: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  subjects: { type: Array, default: () => [] },
  offers: { type: Array, default: () => [] },
  topOffer: { type: Object, default: null },
  apiUrl: { type: String, default: '' },
  canEdit: { type: Boolean, default: false },
  commentsEnabled: { type: Boolean, default: true },
  canAddComment: { type: Boolean, default: false },
  staffEmail: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

function safeText(v) {
  return (v === null || v === undefined) ? '' : String(v)
}

function courseKeyForOffer(o) {
  const uni = safeText(o?.universityName).trim().toLowerCase()
  const course = safeText(o?.courseTitle).trim().toLowerCase()
  const link = safeText(o?.courseLink).trim().toLowerCase()
  return `${uni}|${course}|${link}`.replace(/\s+/g, ' ').trim()
}

const courseOptions = computed(() => {
  const list = Array.isArray(props.offers) ? props.offers : []
  const normalized = list.map((o) => ({
    key: courseKeyForOffer(o),
    ranking: o?.ranking ?? 1,
    universityName: safeText(o?.universityName).trim() || 'University',
    courseTitle: safeText(o?.courseTitle).trim(),
    courseLink: safeText(o?.courseLink).trim()
  }))
  return normalized
    .filter((c) => c.key)
    .sort((a, b) => (Number(a.ranking) || 999) - (Number(b.ranking) || 999))
})

const selectedCourseKey = ref('')
const selectedCourse = computed(() => courseOptions.value.find(c => c.key === selectedCourseKey.value) || null)

const answers = reactive({ q1: '', q2: '', q3: '' })

// requirementsByCourse: { [courseKey]: { [subjectKey]: offerText } }
const requirementsByCourse = reactive({})

const staffComments = ref([])
const newComment = ref('')
const commentSaving = ref(false)

const subjectRows = computed(() => {
  const list = Array.isArray(props.subjects) ? props.subjects : []
  return list.slice(0, 5).map((s, idx) => {
    const key = safeText(s?.id || s?.originalRecordId || s?.position || s?.subjectName || `idx_${idx}`)
    const raw = safeText(s?.subjectName).trim() || 'Subject'
    const label = raw.replace(/^\s*(?:[a-z]{1,2}\d?\s*-\s*)+/i, '').trim() || raw
    return { key, label }
  })
})

const currentCourseSubjectOffers = computed(() => {
  const ck = selectedCourseKey.value || ''
  if (!ck) return {}
  return requirementsByCourse[ck] || {}
})

function setSubjectOffer(subjectKey, value) {
  if (!props.canEdit) return
  const ck = selectedCourseKey.value || ''
  if (!ck) return
  if (!requirementsByCourse[ck]) requirementsByCourse[ck] = {}
  requirementsByCourse[ck][subjectKey] = safeText(value).slice(0, 24)
}

const totalChars = computed(() => answers.q1.length + answers.q2.length + answers.q3.length)
const remainingChars = computed(() => Math.max(0, MAX_TOTAL_CHARS - totalChars.value))

const combinedStatement = computed(() => {
  const a = safeText(answers.q1).trim()
  const b = safeText(answers.q2).trim()
  const c = safeText(answers.q3).trim()
  return [a, b, c].filter(Boolean).join('\n\n')
})

function handleAnswerInput(field, nextValue) {
  if (!props.canEdit) return
  const next = safeText(nextValue)
  const currentLen = answers[field].length
  const otherTotal = totalChars.value - currentLen
  const allowed = Math.max(0, MAX_TOTAL_CHARS - otherTotal)
  answers[field] = next.slice(0, allowed)
}

function copyCombined() {
  try {
    if (!combinedStatement.value) return
    navigator.clipboard.writeText(combinedStatement.value)
    showToast('Copied to clipboard')
  } catch (_) {
    showToast('Copy failed (browser blocked)')
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString()
  } catch (_) {
    return ''
  }
}

// Local autosave (fast UX) + server save (source of truth)
const localKey = computed(() => `vespa:ucas_application:v1:${(props.studentEmail || '').toLowerCase()}:${props.academicYear || 'current'}`)

function loadLocalDraft() {
  try {
    const raw = localStorage.getItem(localKey.value)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.answers) {
      answers.q1 = safeText(parsed.answers.q1)
      answers.q2 = safeText(parsed.answers.q2)
      answers.q3 = safeText(parsed.answers.q3)
    }
    if (parsed?.requirementsByCourse && typeof parsed.requirementsByCourse === 'object') {
      for (const [k, v] of Object.entries(parsed.requirementsByCourse)) {
        requirementsByCourse[k] = (v && typeof v === 'object') ? v : {}
      }
    }
    if (parsed?.selectedCourseKey) selectedCourseKey.value = safeText(parsed.selectedCourseKey)
  } catch (_) {}
}

function writeLocalDraft() {
  try {
    localStorage.setItem(localKey.value, JSON.stringify({
      updatedAt: new Date().toISOString(),
      selectedCourseKey: selectedCourseKey.value,
      answers: { ...answers },
      requirementsByCourse: { ...requirementsByCourse }
    }))
  } catch (_) {}
}

let autosaveTimer = null
watch(
  () => [answers.q1, answers.q2, answers.q3, selectedCourseKey.value, JSON.stringify(requirementsByCourse), localKey.value],
  () => {
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => writeLocalDraft(), 450)
  }
)

const saving = ref(false)

async function loadFromServer() {
  if (!props.apiUrl || !props.studentEmail) return
  const resp = await fetchUcasApplication(props.studentEmail, props.apiUrl, props.academicYear || null)
  if (!resp?.success) return
  const data = resp.data || {}
  if (data.answers) {
    answers.q1 = safeText(data.answers.q1)
    answers.q2 = safeText(data.answers.q2)
    answers.q3 = safeText(data.answers.q3)
  }
  if (data.requirementsByCourse && typeof data.requirementsByCourse === 'object') {
    for (const [k, v] of Object.entries(data.requirementsByCourse)) {
      requirementsByCourse[k] = (v && typeof v === 'object') ? v : {}
    }
  }
  staffComments.value = Array.isArray(data.staffComments) ? data.staffComments : []
  if (data.selectedCourseKey) selectedCourseKey.value = safeText(data.selectedCourseKey)
}

async function saveToServer() {
  if (!props.canEdit) return
  if (!props.apiUrl || !props.studentEmail) return
  saving.value = true
  try {
    const payload = {
      selectedCourseKey: selectedCourseKey.value || null,
      answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3 },
      requirementsByCourse: { ...requirementsByCourse }
    }
    const resp = await saveUcasApplication(props.studentEmail, payload, props.apiUrl, props.academicYear || null)
    if (!resp?.success) throw new Error(resp?.error || 'Save failed')
    showToast('Saved')
  } catch (e) {
    showToast(e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function submitComment() {
  if (!props.canAddComment) return
  const text = newComment.value.trim()
  if (!text) return
  commentSaving.value = true
  try {
    const resp = await addUcasApplicationComment(props.studentEmail, { comment: text, staffEmail: props.staffEmail || null }, props.apiUrl, props.academicYear || null)
    if (!resp?.success) throw new Error(resp?.error || 'Comment failed')
    staffComments.value = Array.isArray(resp.data?.staffComments) ? resp.data.staffComments : staffComments.value
    newComment.value = ''
    showToast('Comment posted')
  } catch (e) {
    showToast(e?.message || 'Comment failed')
  } finally {
    commentSaving.value = false
  }
}

onMounted(async () => {
  // default selection: server → local → topOffer → first offer
  const top = props.topOffer || (props.offers && props.offers.length ? props.offers[0] : null)
  if (top) selectedCourseKey.value = courseKeyForOffer(top)
  loadLocalDraft()
  await loadFromServer()
  if (!selectedCourseKey.value && top) selectedCourseKey.value = courseKeyForOffer(top)
})
</script>

<style scoped>
.ucas-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 99999;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}
.ucas-modal {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1b1444 0%, #241c58 45%, #2f2672 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
}
.ucas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
.ucas-title { font-size: 18px; font-weight: 800; }
.ucas-course-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
.ucas-course-label { font-size: 12px; opacity: 0.8; }
.ucas-select, .ucas-input, .ucas-textarea {
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  border-radius: 10px;
}
.ucas-select { padding: 8px 10px; min-width: 340px; max-width: min(620px, 100%); }
.ucas-btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.16);
  color: #fff;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  text-decoration: none;
  font-weight: 700;
}
.ucas-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.ucas-btn-primary { background: rgba(62, 50, 133, 0.9); border-color: rgba(62, 50, 133, 0.9); }
.ucas-btn-close { padding: 8px 10px; }
.ucas-body { padding: 14px 16px 18px; overflow: auto; }
.ucas-top-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; }
@media (max-width: 1100px) { .ucas-top-grid { grid-template-columns: 1fr; } }
.ucas-card {
  background: rgba(0, 0, 0, 0.14);
  border: 1px solid rgba(62, 50, 133, 0.45);
  border-radius: 14px;
  padding: 12px;
}
.ucas-card-title { font-weight: 800; margin-bottom: 4px; }
.ucas-card-hint { opacity: 0.78; font-size: 12px; margin-bottom: 10px; }
.ucas-empty { opacity: 0.8; padding: 8px 0; }
.ucas-subjects-grid { display: grid; grid-template-columns: 1fr 220px; gap: 8px 10px; align-items: center; }
.ucas-subjects-head { font-size: 12px; opacity: 0.75; }
.ucas-subject-name { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ucas-input { width: 100%; padding: 8px 10px; }
.ucas-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.ucas-metric { background: rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; padding: 10px; }
.ucas-metric-label { font-size: 12px; opacity: 0.75; }
.ucas-metric-value { font-weight: 900; font-size: 16px; margin-top: 2px; }
.ucas-metric-value.bad { color: #ffb4b4; }
.ucas-metric-sub { font-size: 12px; opacity: 0.75; }
.ucas-preview-box {
  white-space: pre-wrap;
  background: rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 12px;
  padding: 10px;
  max-height: 180px;
  overflow: auto;
  line-height: 1.35;
}
.ucas-questions { margin-top: 12px; display: grid; gap: 12px; }
.ucas-q { background: rgba(0,0,0,0.14); border: 1px solid rgba(255,255,255,0.10); border-radius: 14px; padding: 12px; }
.ucas-q-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.ucas-q-title { font-weight: 900; }
.ucas-q-count { opacity: 0.75; font-size: 12px; }
.ucas-textarea { width: 100%; min-height: 140px; padding: 10px 12px; resize: vertical; line-height: 1.4; }
.ucas-textarea-sm { min-height: 90px; }
.ucas-comments { margin-top: 12px; }
.ucas-comment-compose { margin-top: 8px; }
.ucas-comment-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.ucas-comment-list { display: grid; gap: 10px; margin-top: 10px; }
.ucas-comment { background: rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; padding: 10px; }
.ucas-comment-meta { display: flex; gap: 10px; justify-content: space-between; opacity: 0.8; font-size: 12px; margin-bottom: 6px; }
.ucas-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.10);
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.ucas-warn { color: #ffd6a6; font-size: 12px; margin-top: 4px; }
.ucas-toast { font-size: 12px; opacity: 0.9; }
</style>
