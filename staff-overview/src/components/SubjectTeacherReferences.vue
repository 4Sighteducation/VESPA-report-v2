<template>
  <div class="strefs">
    <div class="strefs-head">
      <div>
        <h3>Subject teacher</h3>
        <div class="strefs-sub">
          Review VESPA scores and open student reports. Submit short subject references (UCAS Section 3) when requested.
          <div class="strefs-subnote">
            If a student emails you a reference link, you can still complete it that way (no VESPA account needed).
            If you do have a VESPA account, you can also <a class="strefs-login" href="https://vespaacademy.knack.com/vespa-academy" target="_blank" rel="noopener">log in here</a>.
          </div>
        </div>
      </div>
      <div class="strefs-badges">
        <div class="strefs-pill">
          {{ filteredStudents.length }} students
        </div>
        <div v-if="pendingRequestsCount > 0" class="strefs-pill strefs-pill--alert" :title="`${pendingRequestsCount} pending reference requests`">
          {{ pendingRequestsCount }} pending requests
        </div>
      </div>
    </div>

    <div v-if="filteredStudents.length === 0" class="strefs-empty">
      No students match the current filters.
    </div>

    <div v-else class="strefs-tablewrap">
      <table class="strefs-table">
        <thead>
          <tr>
            <th class="col-name">Student</th>
            <th class="col-group">Group</th>
            <th class="col-report">Report</th>
            <th class="col-request">UCAS request</th>
            <th class="col-write">Reference</th>
            <th class="score" title="Vision">V</th>
            <th class="score" title="Effort">E</th>
            <th class="score" title="Systems">S</th>
            <th class="score" title="Practice">P</th>
            <th class="score" title="Attitude">A</th>
            <th class="score" title="Overall">O</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in paginatedStudents" :key="s.id || s.email">
            <td>
              <div class="name">{{ s.name || s.email }}</div>
              <div class="meta">
                <span v-if="s.email">{{ s.email }}</span>
                <span v-if="s.yearGroup">· Y{{ s.yearGroup }}</span>
                <span v-if="s.course">· {{ s.course }}</span>
              </div>
            </td>
            <td>{{ s.group || '-' }}</td>
            <td class="center">
              <button class="icon-btn" type="button" @click="emitViewReport(s)" :disabled="!s.email" title="Open VESPA report">
                📄
              </button>
            </td>
            <td>
              <div :class="['req-pill', requestPillClass(requestFor(s))]" :title="requestTitle(requestFor(s))">
                {{ requestLabel(requestFor(s)) }}
              </div>
            </td>
            <td class="center">
              <button class="strefs-btn" type="button" :disabled="!s.email" @click="openReference(s)">
                ✍️ Open
              </button>
            </td>
            <td class="score" :style="{ background: getScoreColor(s.scores?.vision) }">{{ s.scores?.vision ?? '-' }}</td>
            <td class="score" :style="{ background: getScoreColor(s.scores?.effort) }">{{ s.scores?.effort ?? '-' }}</td>
            <td class="score" :style="{ background: getScoreColor(s.scores?.systems) }">{{ s.scores?.systems ?? '-' }}</td>
            <td class="score" :style="{ background: getScoreColor(s.scores?.practice) }">{{ s.scores?.practice ?? '-' }}</td>
            <td class="score" :style="{ background: getScoreColor(s.scores?.attitude) }">{{ s.scores?.attitude ?? '-' }}</td>
            <td class="score" :style="{ background: getScoreColor(s.scores?.overall) }">{{ formatOverall(s.scores?.overall) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pager">
        <div class="pager-info">Showing {{ pageStart }}–{{ pageEnd }} of {{ filteredStudents.length }}</div>
        <div class="pager-actions">
          <button class="pager-btn" type="button" @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1">
            Prev
          </button>
          <button class="pager-btn" type="button" @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages">
            Next
          </button>
          <select class="pager-select" v-model.number="pageSize">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <SubjectTeacherReferenceModal
      :isOpen="refModalOpen"
      :student="selectedStudent"
      :staffEmail="staffEmail"
      academicYear="current"
      @close="closeReference"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SubjectTeacherReferenceModal from './SubjectTeacherReferenceModal.vue'
import { getScoreColor } from '../data/vespaColors.js'
import { API_BASE_URL } from '../services/api.js'

const props = defineProps({
  students: { type: Array, required: true },
  activeFilters: { type: Object, default: () => ({}) },
  smartFilters: { type: Array, default: () => [] },
  staffEmail: { type: String, default: '' }
})

const emit = defineEmits(['view-report'])

const refModalOpen = ref(false)
const selectedStudent = ref(null)

// Simple pagination (keeps reference-status polling manageable)
const currentPage = ref(1)
const pageSize = ref(50)

const filteredStudents = computed(() => {
  let filtered = [...(props.students || [])]

  if (props.activeFilters.group) {
    filtered = filtered.filter(s => s.group === props.activeFilters.group)
  }
  if (props.activeFilters.year) {
    filtered = filtered.filter(s => s.yearGroup === props.activeFilters.year)
  }
  if (props.activeFilters.status === 'completed') {
    filtered = filtered.filter(s => s.hasCompleted)
  } else if (props.activeFilters.status === 'not_completed') {
    filtered = filtered.filter(s => !s.hasCompleted)
  }
  if (props.activeFilters.search) {
    const search = String(props.activeFilters.search || '').toLowerCase()
    filtered = filtered.filter(s =>
      String(s.name || '').toLowerCase().includes(search) ||
      String(s.email || '').toLowerCase().includes(search) ||
      String(s.group || '').toLowerCase().includes(search)
    )
  }

  // Smart filters (VESPA scores) are optional here; if present, apply them exactly like the coaching tab.
  if (props.smartFilters && props.smartFilters.length > 0) {
    filtered = filtered.filter(student => {
      return props.smartFilters.every(filter => {
        const score = student.scores?.[filter.dimension]
        if (score === null || score === undefined) return false
        const numericScore = parseFloat(score)
        const filterValue = parseFloat(filter.value)
        switch (filter.operator) {
          case 'gt': return numericScore > filterValue
          case 'gte': return numericScore >= filterValue
          case 'lt': return numericScore < filterValue
          case 'lte': return numericScore <= filterValue
          case 'eq': return Math.abs(numericScore - filterValue) < 0.01
          default: return true
        }
      })
    })
  }

  // Stable sort by name/email for usability
  filtered.sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')))
  return filtered
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredStudents.value.length / pageSize.value)))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})
const pageStart = computed(() => (filteredStudents.value.length ? ((currentPage.value - 1) * pageSize.value + 1) : 0))
const pageEnd = computed(() => Math.min(filteredStudents.value.length, currentPage.value * pageSize.value))

watch(
  () => [filteredStudents.value.length, pageSize.value],
  () => {
    // Keep current page valid when filters/page-size change
    currentPage.value = Math.min(currentPage.value, totalPages.value)
    if (currentPage.value < 1) currentPage.value = 1
  }
)

function openReference(student) {
  selectedStudent.value = student || null
  refModalOpen.value = true
}

function closeReference() {
  refModalOpen.value = false
  selectedStudent.value = null
}

function emitViewReport(student) {
  emit('view-report', student)
}

function formatOverall(v) {
  if (v === null || v === undefined || v === '') return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n.toFixed(1)
}

// ---- Reference request / progress (per-student, per-teacher) ----
const requestByStudentEmail = ref({}) // email -> { status, sentAt, submittedAt }
const loadingEmails = ref(new Set())

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase()
}

function requestFor(student) {
  const email = normalizeEmail(student?.email)
  return email ? (requestByStudentEmail.value[email] || null) : null
}

const pendingRequestsCount = computed(() => {
  const m = requestByStudentEmail.value || {}
  return Object.values(m).filter(r => r && r.status === 'pending').length
})

function requestLabel(r) {
  if (!r) return 'Not requested'
  if (r.status === 'submitted') return 'Submitted'
  if (r.status === 'pending') return 'Pending'
  return 'Not requested'
}

function requestPillClass(r) {
  if (!r) return 'none'
  if (r.status === 'submitted') return 'ok'
  if (r.status === 'pending') return 'wait'
  return 'none'
}

function requestTitle(r) {
  if (!r) return 'No reference request for you yet.'
  const parts = []
  if (r.sentAt) parts.push(`Sent: ${formatDate(r.sentAt)}`)
  if (r.submittedAt) parts.push(`Submitted: ${formatDate(r.submittedAt)}`)
  return parts.join(' · ') || requestLabel(r)
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

async function loadRequestsForStudents(rows) {
  const staff = normalizeEmail(props.staffEmail)
  if (!staff) return

  const students = Array.isArray(rows) ? rows : []
  const queue = students
    .map(s => normalizeEmail(s?.email))
    .filter(Boolean)
    .filter(e => !requestByStudentEmail.value[e])
    .filter(e => !loadingEmails.value.has(e))

  if (!queue.length) return

  const nextLoading = new Set(loadingEmails.value)
  queue.forEach(e => nextLoading.add(e))
  loadingEmails.value = nextLoading

  // Concurrency limit to avoid hammering the backend
  const concurrency = 6
  let idx = 0

  const worker = async () => {
    while (idx < queue.length) {
      const email = queue[idx]
      idx += 1
      try {
        const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(email)}/reference/status`
        const resp = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok || !data?.success) {
          continue
        }
        const inv = pickLatestInvite(data?.data?.invites, staff)
        if (!inv) continue
        const status = String(inv?.status || '').trim().toLowerCase() || 'pending'
        requestByStudentEmail.value = {
          ...requestByStudentEmail.value,
          [email]: {
            status: status === 'submitted' ? 'submitted' : 'pending',
            sentAt: inviteSentAt(inv),
            submittedAt: inviteSubmittedAt(inv)
          }
        }
      } catch (_) {
        // ignore per-row failures
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()))

  // Clear loading flags
  const done = new Set(loadingEmails.value)
  queue.forEach(e => done.delete(e))
  loadingEmails.value = done
}

watch(
  () => [paginatedStudents.value.map(s => s.email).join('|'), props.staffEmail],
  () => {
    loadRequestsForStudents(paginatedStudents.value)
  },
  { immediate: true }
)
</script>

<style scoped>
.strefs {
  margin-top: 12px;
}

.strefs-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.strefs-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #111827;
}

.strefs-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.strefs-subnote {
  margin-top: 6px;
  color: #4b5563;
  font-size: 12px;
  line-height: 1.35;
}

.strefs-login {
  color: #4338ca;
  font-weight: 900;
  text-decoration: none;
}

.strefs-login:hover {
  text-decoration: underline;
}

.strefs-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.strefs-pill {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  background: #f3f4f6;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
}

.strefs-pill--alert {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.strefs-empty {
  margin-top: 12px;
  padding: 14px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  color: #6b7280;
  font-style: italic;
  background: #fff;
}

.strefs-tablewrap {
  margin-top: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.strefs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.strefs-table th {
  text-align: left;
  font-size: 11px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #6b7280;
  padding: 10px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.strefs-table td {
  padding: 10px 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.strefs-table tr:hover td {
  background: #fafafa;
}

.col-report,
.col-write,
.center {
  text-align: center;
}

.name {
  font-weight: 900;
  color: #111827;
}

.meta {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
}

.icon-btn {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 8px;
  cursor: pointer;
}

.icon-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.req-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 900;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #374151;
  white-space: nowrap;
}

.req-pill.ok {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

.req-pill.wait {
  background: #ffedd5;
  border-color: #fed7aa;
  color: #9a3412;
}

.req-pill.none {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #374151;
}

.score {
  text-align: center;
  font-weight: 900;
  border-left: 1px solid #f1f5f9;
}

.strefs-btn {
  background: #4338ca;
  color: #fff;
  border: 1px solid #4338ca;
  border-radius: 10px;
  padding: 9px 12px;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
}

.strefs-btn:hover:not(:disabled) {
  background: #3730a3;
}

.strefs-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  flex-wrap: wrap;
}

.pager-info {
  font-size: 12px;
  color: #6b7280;
  font-weight: 800;
}

.pager-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pager-btn {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 7px 10px;
  font-weight: 900;
  cursor: pointer;
}

.pager-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pager-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pager-select {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 7px 10px;
  font-weight: 900;
  background: #fff;
}
</style>

