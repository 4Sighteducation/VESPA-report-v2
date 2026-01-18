<template>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <div>
          <div class="title">Teacher Reference Inbox</div>
          <div class="sub" v-if="loaded">
            <span v-if="teacherName">{{ teacherName }}</span>
            <span v-else>{{ teacherEmail || 'Teacher' }}</span>
            <span v-if="teacherEmail"> — {{ teacherEmail }}</span>
          </div>
          <div class="sub" v-else>Loading…</div>
        </div>
        <div class="pill" v-if="loaded">
          {{ filteredInvites.length }} students
        </div>
      </div>

      <div class="content">
        <div v-if="loading" class="alert" style="display:flex;gap:10px;align-items:center;justify-content:center;">
          <span class="spinner"></span>
          Loading your inbox…
        </div>
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <template v-else>
          <div class="toolbar">
            <div class="grid">
              <div>
                <div class="label">Search</div>
                <input class="input" v-model="q" placeholder="Student name, email, subject…" />
              </div>
              <div>
                <div class="label">Status</div>
                <select class="select" v-model="statusFilter">
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>
              <div>
                <div class="label">Action</div>
                <div style="display:flex;gap:10px;align-items:center;">
                  <button class="btn btn-outline" type="button" @click="reload" :disabled="savingAny">
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Academic year</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th style="text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in filteredInvites" :key="inv.groupKey">
                  <td>
                    <div class="name">{{ inv.studentName || '—' }}</div>
                    <div class="muted">{{ fmtDate(inv.createdAt) }}</div>
                  </td>
                  <td>
                    <div>{{ inv.studentEmail || '—' }}</div>
                  </td>
                  <td>{{ inv.academicYear || '—' }}</td>
                  <td>
                    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                      <span>{{ inv.subjectKey || 'General' }}</span>
                      <span v-if="inv.inviteCount > 1" class="pill" style="padding:6px 8px;font-size:11px;">
                        {{ inv.inviteCount }} invites collapsed
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="status">
                      <span class="dot" :class="inv.status === 'submitted' ? 'ok' : 'wait'"></span>
                      {{ inv.status === 'submitted' ? 'Submitted' : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <div class="rowActions">
                      <button class="btn btn-outline" type="button" @click="openStatement(inv)" :disabled="savingAny || !inv.studentEmail">
                        View statement
                      </button>
                      <button class="btn btn-outline" type="button" @click="toggle(inv.groupKey)">
                        {{ expandedId === inv.groupKey ? 'Close' : (inv.status === 'submitted' ? 'View / edit' : 'Write') }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="expandedInvite" class="expand">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
              <div>
                <div class="name">{{ expandedInvite.studentName || expandedInvite.studentEmail || 'Student' }}</div>
                <div class="muted">
                  <span v-if="expandedInvite.subjectKey">{{ expandedInvite.subjectKey }}</span>
                  <span v-if="expandedInvite.academicYear"> • {{ expandedInvite.academicYear }}</span>
                </div>
              </div>
              <div style="display:flex;gap:10px;align-items:center;">
                <button class="btn btn-outline" type="button" @click="openStatement(expandedInvite)" :disabled="savingAny || !expandedInvite.studentEmail">
                  View statement
                </button>
                <button class="btn btn-outline" type="button" @click="reload" :disabled="savingAny">Refresh</button>
              </div>
            </div>

            <div style="margin-top:12px;display:grid;grid-template-columns: 1fr 1fr; gap:10px;">
              <div>
                <div class="label">Your name (optional)</div>
                <input class="input" v-model="draft.authorName" placeholder="e.g. Ms Smith" />
              </div>
              <div>
                <div class="label">Section</div>
                <select class="select" v-model.number="draft.section">
                  <option v-for="s in allowedSections" :key="s" :value="s">
                    {{ s === 2 ? 'Section 2 — Extenuating circumstances' : 'Section 3 — Supportive information' }}
                  </option>
                </select>
              </div>
            </div>

            <div style="margin-top:12px;">
              <div class="label">Your contribution</div>
              <textarea class="textarea" v-model="draft.text" :placeholder="draft.section === 2 ? section2Placeholder : section3Placeholder" />
              <div class="muted" style="margin-top:6px;">
                {{ (draft.text || '').length.toLocaleString() }} characters (max 4,000)
              </div>
            </div>

            <div style="margin-top:12px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
              <button class="btn btn-primary" type="button" @click="saveExpanded" :disabled="draftSaving || !canSave">
                <span v-if="draftSaving" class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.35)"></span>
                {{ draftSaving ? 'Saving…' : 'Save contribution' }}
              </button>
            </div>

            <div v-if="savedMsg" class="alert alert-success">{{ savedMsg }}</div>
            <div v-if="saveErr" class="alert alert-danger">{{ saveErr }}</div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="statementOpen" class="modalOverlay" @click.self="closeStatement">
      <div class="modal">
        <div class="modalHeader">
          <div>
            <div class="modalTitle">UCAS draft (read-only)</div>
            <div class="muted" v-if="statementMeta">
              <span>{{ statementMeta.studentName || statementMeta.studentEmail || 'Student' }}</span>
              <span v-if="statementMeta.studentEmail"> — {{ statementMeta.studentEmail }}</span>
              <span v-if="statementMeta.academicYear"> • {{ statementMeta.academicYear }}</span>
              <span v-if="statementMeta.statementCompletedAt"> • Marked complete</span>
            </div>
          </div>
          <button class="btn btn-outline" type="button" @click="closeStatement">Close</button>
        </div>

        <div class="modalBody">
          <div v-if="statementLoading" class="alert" style="display:flex;gap:10px;align-items:center;justify-content:center;">
            <span class="spinner"></span>
            Loading statement…
          </div>
          <div v-else-if="statementError" class="alert alert-danger">{{ statementError }}</div>
          <template v-else>
            <div class="statementBlock">
              <div class="label">Why do you want to study this course or subject?</div>
              <div class="statementText">{{ statementAnswers.q1 || '—' }}</div>
            </div>
            <div class="statementBlock">
              <div class="label">How have your qualifications and studies helped you to prepare for this course or subject?</div>
              <div class="statementText">{{ statementAnswers.q2 || '—' }}</div>
            </div>
            <div class="statementBlock">
              <div class="label">What else have you done to prepare outside of education, and why are these experiences useful?</div>
              <div class="statementText">{{ statementAnswers.q3 || '—' }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const params = new URLSearchParams(window.location.search || '')
const token = (params.get('token') || '').trim()
const apiBase = (params.get('api') || 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com').trim().replace(/\/$/, '')

const loading = ref(true)
const loaded = ref(false)
const error = ref('')

const teacherEmail = ref('')
const teacherName = ref('')
const invites = ref([])

const q = ref('')
const statusFilter = ref('all')
const expandedId = ref('')

const draft = reactive({ authorName: '', section: 3, text: '' })
const draftSaving = ref(false)
const savedMsg = ref('')
const saveErr = ref('')

const statementOpen = ref(false)
const statementLoading = ref(false)
const statementError = ref('')
const statementMeta = ref(null)
const statementAnswers = reactive({ q1: '', q2: '', q3: '' })

const section2Placeholder =
  'If you are aware of anything that materially affected attainment/trajectory, note it here (with student permission). Keep it factual.'
const section3Placeholder =
  'Add course-relevant evidence of academic potential and engagement: how they compare, projects, specialisms, reading, curiosity, participation.'

const savingAny = computed(() => draftSaving.value)

function _ms(v) {
  const n = Date.parse(v || '')
  return Number.isFinite(n) ? n : 0
}

const groupedInvites = computed(() => {
  const map = new Map()
  for (const inv of invites.value || []) {
    const refId = String(inv.referenceId || '').trim()
    const ay = String(inv.academicYear || '').trim()
    const subj = String(inv.subjectKey || '').trim()
    const key = `${refId}|${ay}|${subj}`
    const createdMs = _ms(inv.createdAt)
    const hasExisting =
      inv?.existing && Object.values(inv.existing).some((x) => String(x?.text || '').trim().length > 0)

    if (!map.has(key)) {
      map.set(key, {
        ...inv,
        groupKey: key,
        latestInviteId: inv.inviteId,
        inviteCount: 1,
        _latestMs: createdMs,
        _hasExisting: !!hasExisting
      })
      continue
    }

    const cur = map.get(key)
    cur.inviteCount = (cur.inviteCount || 0) + 1
    cur._hasExisting = cur._hasExisting || !!hasExisting

    // Keep the most recent invite as the representative (for submit-by-id)
    if (createdMs >= (cur._latestMs || 0)) {
      Object.assign(cur, inv)
      cur._latestMs = createdMs
      cur.latestInviteId = inv.inviteId
      cur.groupKey = key
    }
  }

  const out = Array.from(map.values())
  for (const g of out) {
    g.status = g._hasExisting ? 'submitted' : String(g.status || 'pending')
  }
  out.sort((a, b) => (b._latestMs || 0) - (a._latestMs || 0))
  return out
})

const filteredInvites = computed(() => {
  const term = (q.value || '').trim().toLowerCase()
  const st = (statusFilter.value || 'all').toLowerCase()

  return (groupedInvites.value || []).filter((inv) => {
    if (st !== 'all' && String(inv.status || '') !== st) return false
    if (!term) return true
    const hay = `${inv.studentName || ''} ${inv.studentEmail || ''} ${inv.subjectKey || ''} ${inv.academicYear || ''}`.toLowerCase()
    return hay.includes(term)
  })
})

const expandedInvite = computed(() => {
  if (!expandedId.value) return null
  return (groupedInvites.value || []).find((i) => i.groupKey === expandedId.value) || null
})

const allowedSections = computed(() => {
  const a = expandedInvite.value?.allowedSections
  if (Array.isArray(a) && a.length) return a
  return [3]
})

const canSave = computed(() => {
  if (!token) return false
  const txt = (draft.text || '').trim()
  if (!txt) return false
  if (txt.length > 4000) return false
  return allowedSections.value.includes(draft.section)
})

function fmtDate(v) {
  if (!v) return ''
  try {
    return new Date(v).toLocaleString()
  } catch {
    return ''
  }
}

function hydrateDraftFromInvite(inv) {
  savedMsg.value = ''
  saveErr.value = ''
  draft.authorName = ''
  const secs = allowedSections.value
  draft.section = secs.includes(3) ? 3 : secs[0]
  const existing = inv?.existing || {}
  const maybe = existing[String(draft.section)]?.text || ''
  draft.text = maybe
}

async function fetchInbox() {
  if (!token) {
    error.value = 'This link is missing a token. Please request a new link from a student.'
    loading.value = false
    loaded.value = false
    return
  }

  loading.value = true
  error.value = ''
  savedMsg.value = ''
  saveErr.value = ''
  try {
    const r = await fetch(`${apiBase}/api/reference/invite/${encodeURIComponent(token)}/inbox`, { method: 'GET' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j?.success) throw new Error(j?.error || j?.message || `Error ${r.status}`)
    const d = j.data || {}
    teacherEmail.value = d.teacherEmail || ''
    teacherName.value = d.teacherName || ''
    invites.value = Array.isArray(d.invites) ? d.invites : []
    expandedId.value = expandedInvite.value ? expandedId.value : ''
    loaded.value = true
  } catch (e) {
    error.value = e?.message || 'Failed to load inbox'
    loaded.value = false
  } finally {
    loading.value = false
  }
}

function toggle(id) {
  if (expandedId.value === id) {
    expandedId.value = ''
    return
  }
  expandedId.value = id
  const inv = (groupedInvites.value || []).find((i) => i.groupKey === id)
  if (inv) hydrateDraftFromInvite(inv)
}

async function saveExpanded() {
  savedMsg.value = ''
  saveErr.value = ''
  if (!expandedInvite.value) return
  if (!canSave.value) return
  draftSaving.value = true
  try {
    const r = await fetch(`${apiBase}/api/reference/invite/${encodeURIComponent(token)}/submit-by-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteId: expandedInvite.value.latestInviteId || expandedInvite.value.inviteId,
        section: draft.section,
        text: draft.text,
        authorName: draft.authorName
      })
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j?.success) throw new Error(j?.error || j?.message || `Error ${r.status}`)
    savedMsg.value = 'Saved. Thank you — your contribution has been added.'
    await fetchInbox()
  } catch (e) {
    saveErr.value = e?.message || 'Save failed'
  } finally {
    draftSaving.value = false
  }
}

async function reload() {
  await fetchInbox()
  if (expandedId.value) {
    const inv = (groupedInvites.value || []).find((i) => i.groupKey === expandedId.value)
    if (inv) hydrateDraftFromInvite(inv)
  }
}

onMounted(fetchInbox)

function closeStatement() {
  statementOpen.value = false
  statementLoading.value = false
  statementError.value = ''
  statementMeta.value = null
  statementAnswers.q1 = ''
  statementAnswers.q2 = ''
  statementAnswers.q3 = ''
}

async function openStatement(inv) {
  if (!token) return
  const inviteId = inv?.latestInviteId || inv?.inviteId
  if (!inviteId) return

  statementOpen.value = true
  statementLoading.value = true
  statementError.value = ''
  statementMeta.value = null
  statementAnswers.q1 = ''
  statementAnswers.q2 = ''
  statementAnswers.q3 = ''

  try {
    const url = `${apiBase}/api/reference/invite/${encodeURIComponent(token)}/student-statement?inviteId=${encodeURIComponent(inviteId)}`
    const r = await fetch(url, { method: 'GET' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j?.success) throw new Error(j?.error || j?.message || `Error ${r.status}`)
    const d = j.data || {}
    statementMeta.value = {
      studentName: d.studentName || inv?.studentName || '',
      studentEmail: d.studentEmail || inv?.studentEmail || '',
      academicYear: d.academicYear || inv?.academicYear || '',
      statementCompletedAt: d.statementCompletedAt || null
    }
    const a = d.answers || {}
    statementAnswers.q1 = String(a.q1 || '')
    statementAnswers.q2 = String(a.q2 || '')
    statementAnswers.q3 = String(a.q3 || '')
  } catch (e) {
    statementError.value = e?.message || 'Failed to load statement'
  } finally {
    statementLoading.value = false
  }
}
</script>

