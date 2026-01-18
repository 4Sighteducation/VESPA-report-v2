<template>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <div>
          <div class="title">Teacher Reference Contribution</div>
          <div class="sub" v-if="inviteLoaded">
            <span v-if="studentName">{{ studentName }}</span>
            <span v-else-if="studentEmail">{{ studentEmail }}</span>
            <span v-if="academicYear"> — {{ academicYear }}</span>
          </div>
          <div class="sub" v-else>Loading…</div>
        </div>
        <div v-if="inviteLoaded" class="pill">
          <span v-if="subjectKey">Subject: {{ subjectKey }}</span>
          <span v-else>General</span>
        </div>
      </div>

      <div class="content">
        <div v-if="loading" class="row" style="justify-content:center">
          <span class="spinner"></span>
          <span style="font-weight:900;color:var(--muted)">Checking your link…</span>
        </div>

        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <template v-else>
          <div v-if="inboxUrl" class="alert" style="margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div>
              <div style="font-weight:950;">Tip</div>
              <div class="hint" style="margin:0;">If you have multiple requests, use your inbox to manage them all in one place.</div>
            </div>
            <button class="btn btn-outline" type="button" @click="openInbox">
              Open inbox
            </button>
          </div>

          <div class="grid">
            <div>
              <div class="label">Your name (optional)</div>
              <input class="input" v-model="authorName" placeholder="e.g. Ms Smith" />
              <div class="hint">This will be shown to the UCAS lead / staff admin.</div>
            </div>
            <div>
              <div class="label">Section</div>
              <select class="select" v-model.number="section">
                <option v-for="s in allowedSections" :key="s" :value="s">
                  {{ s === 2 ? 'Section 2 — Extenuating circumstances (if applicable)' : 'Section 3 — Supportive information (course-relevant)' }}
                </option>
              </select>
              <div class="hint">Choose the section you’re contributing to.</div>
            </div>
          </div>

          <div style="margin-top:14px">
            <div class="label">Your contribution</div>
            <textarea
              class="textarea"
              v-model="text"
              :placeholder="section === 2 ? section2Placeholder : section3Placeholder"
            />
            <div class="hint">{{ text.length.toLocaleString() }} characters (max 4,000).</div>
          </div>

          <div class="btns">
            <button class="btn btn-outline" type="button" @click="reloadInvite" :disabled="saving">
              Refresh
            </button>
            <button class="btn btn-primary" type="button" @click="submit" :disabled="saving || !canSubmit">
              <span v-if="saving" class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.35)"></span>
              {{ saving ? 'Saving…' : 'Save contribution' }}
            </button>
          </div>

          <div v-if="success" class="alert alert-success" style="margin-top:12px">
            Saved. Thank you — your contribution has been added.
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const params = new URLSearchParams(window.location.search || '')
const token = (params.get('token') || '').trim()
const apiBase = (params.get('api') || 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com').trim().replace(/\/$/, '')

const loading = ref(true)
const saving = ref(false)
const success = ref(false)
const error = ref('')

const inviteLoaded = ref(false)
const studentEmail = ref('')
const studentName = ref('')
const academicYear = ref('')
const subjectKey = ref('')
const allowedSections = ref([3])
const inboxUrl = ref('')

const authorName = ref('')
const section = ref(3)
const text = ref('')

const section2Placeholder =
  'If you are aware of anything that materially affected attainment/trajectory in your subject, note it here (with student permission). Keep it factual and course-relevant.'
const section3Placeholder =
  'Add course-relevant evidence of academic potential and engagement: how they compare, projects, specialisms, reading, curiosity, participation, reflection. Keep it specific.'

const canSubmit = computed(() => {
  const t = text.value.trim()
  return !!token && t.length > 0 && t.length <= 4000 && allowedSections.value.includes(section.value)
})

async function fetchInvite() {
  if (!token) {
    error.value = 'This link is missing a token. Please request a new link.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  success.value = false
  try {
    const r = await fetch(`${apiBase}/api/reference/invite/${encodeURIComponent(token)}`, { method: 'GET' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j?.success) throw new Error(j?.error || j?.message || `Error ${r.status}`)

    const d = j.data || {}
    inviteLoaded.value = true
    studentEmail.value = d.studentEmail || ''
    studentName.value = d.studentName || ''
    academicYear.value = d.academicYear || ''
    subjectKey.value = d.subjectKey || ''
    inboxUrl.value = d.inboxUrl || ''
    allowedSections.value = Array.isArray(d.allowedSections) && d.allowedSections.length ? d.allowedSections : [3]
    if (!allowedSections.value.includes(section.value)) section.value = allowedSections.value[0]
  } catch (e) {
    error.value = e?.message || 'Failed to validate link'
  } finally {
    loading.value = false
  }
}

function openInbox() {
  try {
    if (!inboxUrl.value) return
    window.location.href = inboxUrl.value
  } catch (_) {}
}

async function submit() {
  success.value = false
  if (!canSubmit.value) return
  saving.value = true
  try {
    const r = await fetch(`${apiBase}/api/reference/invite/${encodeURIComponent(token)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: section.value,
        text: text.value,
        authorName: authorName.value
      })
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j?.success) throw new Error(j?.error || j?.message || `Error ${r.status}`)
    success.value = true
  } catch (e) {
    error.value = e?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

async function reloadInvite() {
  await fetchInvite()
}

onMounted(fetchInvite)
</script>

