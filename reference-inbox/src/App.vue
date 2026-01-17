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
          {{ filteredInvites.length }} requests
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
                <tr v-for="inv in filteredInvites" :key="inv.inviteId">
                  <td>
                    <div class="name">{{ inv.studentName || '—' }}</div>
                    <div class="muted">{{ fmtDate(inv.createdAt) }}</div>
                  </td>
                  <td>
                    <div>{{ inv.studentEmail || '—' }}</div>
                  </td>
                  <td>{{ inv.academicYear || '—' }}</td>
                  <td>
                    <div>{{ inv.subjectKey || 'General' }}</div>
                  </td>
                  <td>
                    <span class="status">
                      <span class="dot" :class="inv.status === 'submitted' ? 'ok' : 'wait'"></span>
                      {{ inv.status === 'submitted' ? 'Submitted' : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <div class="rowActions">
                      <button class="btn btn-outline" type="button" @click="toggle(inv.inviteId)">
                        {{ expandedId === inv.inviteId ? 'Close' : (inv.status === 'submitted' ? 'View / edit' : 'Write') }}
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

const section2Placeholder =
  'If you are aware of anything that materially affected attainment/trajectory, note it here (with student permission). Keep it factual.'
const section3Placeholder =
  'Add course-relevant evidence of academic potential and engagement: how they compare, projects, specialisms, reading, curiosity, participation.'

const savingAny = computed(() => draftSaving.value)

const filteredInvites = computed(() => {
  const term = (q.value || '').trim().toLowerCase()
  const st = (statusFilter.value || 'all').toLowerCase()

  return (invites.value || []).filter((inv) => {
    if (st !== 'all' && String(inv.status || '') !== st) return false
    if (!term) return true
    const hay = `${inv.studentName || ''} ${inv.studentEmail || ''} ${inv.subjectKey || ''} ${inv.academicYear || ''}`.toLowerCase()
    return hay.includes(term)
  })
})

const expandedInvite = computed(() => {
  if (!expandedId.value) return null
  return (invites.value || []).find((i) => i.inviteId === expandedId.value) || null
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
  const inv = (invites.value || []).find((i) => i.inviteId === id)
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
        inviteId: expandedInvite.value.inviteId,
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
    const inv = (invites.value || []).find((i) => i.inviteId === expandedId.value)
    if (inv) hydrateDraftFromInvite(inv)
  }
}

onMounted(fetchInbox)
</script>

