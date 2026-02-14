<template>
  <div v-if="isOpen" class="sp-overlay" @click.self="emit('close')">
    <div class="sp-modal">
      <div class="sp-header">
        <div>
          <h3>{{ student?.name || 'Student' }} — Study Planner</h3>
          <div class="sp-sub">{{ student?.email || '' }}</div>
        </div>
        <button class="sp-close" @click="emit('close')">&times;</button>
      </div>

      <div class="sp-toolbar">
        <div class="sp-tabs">
          <button :class="['sp-tab', { active: activeTab === 'week' }]" @click="activeTab = 'week'">Week</button>
          <button :class="['sp-tab', { active: activeTab === 'list' }]" @click="activeTab = 'list'">List</button>
        </div>
        <div class="sp-actions">
          <button class="sp-btn" @click="reload">Reload</button>
        </div>
      </div>

      <div class="sp-body">
        <div v-if="loading" class="sp-loading">Loading study planner…</div>
        <div v-else-if="error" class="sp-error">{{ error }}</div>
        <div v-else-if="!plans.length" class="sp-empty">No plans found for this student.</div>

        <template v-else>
          <div v-if="activeTab === 'week'" class="sp-week-wrap">
            <div class="sp-week-nav">
              <button class="sp-btn" :disabled="activePlanIndex >= plans.length - 1" @click="prevWeek">← Prev</button>
              <div class="sp-week-label">{{ currentWeekLabel }}</div>
              <button class="sp-btn" :disabled="activePlanIndex <= 0" @click="nextWeek">Next →</button>
            </div>

            <div v-if="backendNotice" class="sp-warning">{{ backendNotice }}</div>
            <div v-if="!sessions.length" class="sp-empty">
              No sessions found for this week.
              <br>
              Open the <strong>List</strong> tab and select a different week.
            </div>
            <div v-else class="sp-grid">
              <div class="sp-grid-head"></div>
              <div v-for="day in dayLabels" :key="`h-${day}`" class="sp-grid-head">{{ day }}</div>

              <template v-for="time in times" :key="`row-${time}`">
                <div class="sp-time">{{ time }}</div>
                <button
                  v-for="day in dayLabels"
                  :key="`${time}-${day}`"
                  class="sp-cell"
                  :class="{ 'sp-cell--filled': !!slotFor(time, day) }"
                  @click="openSession(slotFor(time, day))"
                >
                  <span v-if="slotFor(time, day)">{{ slotFor(time, day).label || 'Session' }}</span>
                </button>
              </template>
            </div>
          </div>

          <div v-else class="sp-list-wrap">
            <div class="sp-list-col">
              <h4>Upcoming plans</h4>
              <div v-if="upcomingPlans.length === 0" class="sp-empty-small">No upcoming plans</div>
              <button
                v-for="p in upcomingPlans"
                :key="`u-${p.id}`"
                class="sp-plan"
                :class="{ active: p.id === activePlan?.id }"
                @click="loadPlan(p.id)"
              >
                <div>{{ formatWeekRange(p.week_start_date) }}</div>
                <small>{{ p.session_count || 0 }} sessions</small>
              </button>
            </div>
            <div class="sp-list-col">
              <h4>Past plans</h4>
              <div v-if="pastPlans.length === 0" class="sp-empty-small">No past plans</div>
              <button
                v-for="p in pastPlans"
                :key="`p-${p.id}`"
                class="sp-plan"
                :class="{ active: p.id === activePlan?.id }"
                @click="loadPlan(p.id)"
              >
                <div>{{ formatWeekRange(p.week_start_date) }}</div>
                <small>{{ p.session_count || 0 }} sessions</small>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="sessionModal" class="sp-session-overlay" @click.self="sessionModal = null">
      <div class="sp-session-modal">
        <h4>Planned session</h4>
        <p><strong>Day:</strong> {{ dayLabels[(sessionModal.day_of_week || 1) - 1] }}</p>
        <p><strong>Start:</strong> {{ normalizeTime(sessionModal.start_time) }}</p>
        <p><strong>Duration:</strong> {{ sessionModal.duration_minutes || 0 }} mins</p>
        <p><strong>Subject:</strong> {{ sessionModal.subject || '-' }}</p>
        <p><strong>Topic:</strong> {{ sessionModal.topic || '-' }}</p>
        <p><strong>Notes:</strong> {{ sessionModal.notes || '-' }}</p>
        <button class="sp-btn sp-btn-primary" @click="sessionModal = null">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { staffAPI } from '../services/api.js'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  student: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')
const activeTab = ref('week')

const plans = ref([])
const activePlan = ref(null)
const sessions = ref([])
const sessionModal = ref(null)
const backendNotice = ref('')

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const times = computed(() => {
  const out = [...new Set((sessions.value || []).map((s) => normalizeTime(s.start_time)).filter(Boolean))]
  out.sort()
  return out
})

const activePlanIndex = computed(() => {
  if (!activePlan.value?.id) return 0
  const idx = plans.value.findIndex((p) => p.id === activePlan.value.id)
  return idx >= 0 ? idx : 0
})

const currentWeekLabel = computed(() => {
  const w = activePlan.value?.week_start_date
  return w ? formatWeekRange(w) : 'Current week'
})

const currentWeekStart = computed(() => startOfWeekDate(new Date()))

const upcomingPlans = computed(() =>
  plans.value.filter((p) => p.week_start_date >= currentWeekStart.value)
)
const pastPlans = computed(() =>
  plans.value.filter((p) => p.week_start_date < currentWeekStart.value)
)

function normalizeTime(v) {
  return String(v || '').slice(0, 5)
}

function startOfWeekDate(d) {
  const copy = new Date(d)
  const day = copy.getDay() || 7
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - day + 1)
  return copy.toISOString().slice(0, 10)
}

function formatWeekRange(weekStartDate) {
  const start = new Date(`${weekStartDate}T00:00:00`)
  if (Number.isNaN(start.getTime())) return String(weekStartDate || '')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`
}

function slotFor(time, day) {
  const dayIndex = dayLabels.indexOf(day) + 1
  return sessions.value.find((s) => Number(s.day_of_week) === dayIndex && normalizeTime(s.start_time) === time) || null
}

function openSession(session) {
  if (!session) return
  sessionModal.value = session
}

async function loadPlan(planId) {
  if (!props.student?.email) return
  loading.value = true
  error.value = ''
  backendNotice.value = ''
  try {
    const data = await staffAPI.getStudyPlannerContext(props.student.email, { planId })
    const normalizedPlans = normalizePlans(data?.plans)
    plans.value = normalizedPlans

    const requestedId = String(planId || '').trim()
    const activeFromApiId = String(data?.activePlan?.id || '').trim()

    let selectedPlan = null
    if (requestedId) {
      selectedPlan = normalizedPlans.find((p) => p.id === requestedId) || null
    }
    if (!selectedPlan && activeFromApiId) {
      selectedPlan = normalizedPlans.find((p) => p.id === activeFromApiId) || null
    }
    if (!selectedPlan) selectedPlan = normalizedPlans[0] || null
    activePlan.value = selectedPlan

    let resolvedSessions = Array.isArray(data?.sessions) ? data.sessions : []

    // If API defaulted to an empty/filtered-out plan, fetch the selected plan explicitly.
    if (
      selectedPlan?.id &&
      !requestedId &&
      activeFromApiId &&
      activeFromApiId !== selectedPlan.id
    ) {
      const retry = await staffAPI.getStudyPlannerContext(props.student.email, { planId: selectedPlan.id })
      const retrySessions = Array.isArray(retry?.sessions) ? retry.sessions : []
      if (retrySessions.length) {
        resolvedSessions = retrySessions
      } else if ((selectedPlan.session_count || 0) > 0) {
        backendNotice.value = 'Selected week has sessions in plan metadata, but no session rows were returned. This usually means the edge function is still on an older version.'
      }
    }

    sessions.value = resolvedSessions
  } catch (e) {
    error.value = e?.message || 'Failed to load study planner'
  } finally {
    loading.value = false
  }
}

async function reload() {
  await loadPlan(activePlan.value?.id || null)
}

async function prevWeek() {
  const idx = activePlanIndex.value
  if (idx >= plans.value.length - 1) return
  const next = plans.value[idx + 1]
  if (next?.id) await loadPlan(next.id)
}

async function nextWeek() {
  const idx = activePlanIndex.value
  if (idx <= 0) return
  const next = plans.value[idx - 1]
  if (next?.id) await loadPlan(next.id)
}

watch(
  () => [props.isOpen, props.student?.email],
  async ([open, email]) => {
    if (!open || !email) return
    activeTab.value = 'week'
    sessionModal.value = null
    await loadPlan(null)
  }
)

function normalizePlans(rawPlans) {
  const list = Array.isArray(rawPlans) ? rawPlans : []
  const filtered = list
    .filter((p) => String(p?.status || '').trim().toLowerCase() !== 'deleted')
    .map((p) => ({
      ...p,
      session_count: Number(p?.session_count || 0)
    }))
    .filter((p) => p.session_count > 0)
    .sort((a, b) => {
      if (a.week_start_date > b.week_start_date) return -1
      if (a.week_start_date < b.week_start_date) return 1
      return Number(b.session_count || 0) - Number(a.session_count || 0)
    })

  // Keep one plan per week to avoid duplicated entries.
  const seenWeeks = new Set()
  const unique = []
  for (const p of filtered) {
    const key = String(p.week_start_date || '')
    if (!key || seenWeeks.has(key)) continue
    seenWeeks.add(key)
    unique.push(p)
  }
  return unique
}
</script>

<style scoped>
.sp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:12000;padding:20px}
.sp-modal{width:min(1700px,92vw);height:min(92vh,980px);background:#fff;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.sp-header{padding:14px 18px;background:linear-gradient(135deg,#079baa,#7bd8d0);color:#fff;display:flex;justify-content:space-between;align-items:flex-start}
.sp-header h3{margin:0;font-size:20px}
.sp-sub{font-size:12px;opacity:.95;margin-top:2px}
.sp-close{border:none;background:rgba(255,255,255,.2);color:#fff;border-radius:999px;width:40px;height:40px;font-size:26px;cursor:pointer}
.sp-toolbar{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #ececec;background:#f8fafc}
.sp-tabs{display:flex;gap:8px}
.sp-tab{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}
.sp-tab.active{background:#079baa;color:#fff;border-color:#079baa}
.sp-btn{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}
.sp-btn-primary{background:#079baa;color:#fff;border-color:#079baa}
.sp-body{flex:1;min-height:0;overflow:auto;padding:14px}
.sp-loading,.sp-error,.sp-empty{padding:18px;border:1px solid #ececec;border-radius:10px}
.sp-error{background:#fff5f5;color:#991b1b;border-color:#fecaca}
.sp-warning{padding:12px;border:1px solid #fcd34d;border-radius:10px;background:#fffbeb;color:#92400e;margin-bottom:10px}
.sp-week-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
.sp-week-label{font-weight:800}
.sp-grid{display:grid;grid-template-columns:80px repeat(7,minmax(90px,1fr));gap:6px}
.sp-grid-head{font-size:12px;font-weight:800;color:#4b5563;padding:6px}
.sp-time{font-size:12px;color:#6b7280;padding:10px 6px}
.sp-cell{min-height:52px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:8px;font-size:12px;text-align:left;cursor:pointer}
.sp-cell--filled{background:#ecfeff;border-color:#67e8f9}
.sp-list-wrap{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sp-list-col h4{margin:0 0 10px 0}
.sp-plan{width:100%;text-align:left;border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:10px;margin-bottom:8px;cursor:pointer}
.sp-plan.active{border-color:#079baa;box-shadow:0 0 0 2px rgba(7,155,170,.12)}
.sp-empty-small{font-size:13px;color:#6b7280;padding:8px 0}
.sp-session-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:12100}
.sp-session-modal{width:min(560px,92vw);background:#fff;border-radius:12px;padding:16px}
.sp-session-modal h4{margin:0 0 10px 0}
@media (max-width: 1100px){.sp-list-wrap{grid-template-columns:1fr}.sp-grid{grid-template-columns:70px repeat(7,minmax(70px,1fr))}}
</style>
