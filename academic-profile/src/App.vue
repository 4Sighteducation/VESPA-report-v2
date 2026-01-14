<template>
  <div id="academic-profile-v2" class="academic-profile-container">
    <!-- Toggle Button (always visible) -->
    <div class="profile-toggle-bar">
      <button @click="toggleProfile" class="toggle-button" :class="{ collapsed: !isVisible }">
        <span class="toggle-icon">{{ isVisible ? '▼' : '▶' }}</span>
        <span class="toggle-text">{{ isVisible ? 'Hide' : 'Show' }} Academic Profile</span>
      </button>
    </div>

    <!-- Profile Content (collapsible) -->
    <div v-show="isVisible" class="profile-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="profile-loading">
        <div class="spinner"></div>
        <p>Loading academic profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="profile-error">
        <p>{{ error }}</p>
        <button @click="loadProfile" class="retry-btn">Retry</button>
      </div>

      <!-- Main Content -->
      <div v-else-if="profileData" class="profile-content">
        <AcademicProfile
          :student="profileData.student"
          :subjects="profileData.subjects"
          :updated-at="profileData.updatedAt"
          :academic-year="profileData.academicYear"
          :ui-defaults="profileData.uiDefaults"
          :editable="canEdit"
          :offers-editable="canEditOffers"
          :mode="config.mode || 'inline'"
          :data-source="profileData.dataSource"
          @reload="loadProfile"
        />
      </div>

      <!-- No Data State -->
      <div v-else class="profile-empty">
        <p>Academic profile not available for this student.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AcademicProfile from './components/AcademicProfile.vue'
import { fetchAcademicProfile } from './services/api.js'

// Props from parent
const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

// State
const profileData = ref(null)
const loading = ref(false)
const error = ref(null)
const config = ref(props.config)
// Toggle state for show/hide - default to hidden unless config says otherwise
const isVisible = ref(!!(props.config && props.config.defaultVisible))

// Computed
const studentEmail = computed(() => {
  // Allow parent app (e.g., Account Manager) to force a specific student
  if (config.value && config.value.forcedStudentEmail) {
    return config.value.forcedStudentEmail
  }

  // Get student email from Knack context or URL parameter
  if (typeof Knack === 'undefined') return null
  
  // Check for email parameter in URL (for staff viewing student profiles)
  let urlEmail = null
  const hash = window.location.hash
  if (hash && hash.includes('?')) {
    const queryString = hash.split('?')[1]
    const urlParams = new URLSearchParams(queryString)
    urlEmail = urlParams.get('email')
  }
  
  // Use URL email if provided (staff view), otherwise use logged-in user's email
  if (urlEmail) {
    console.log('[Academic Profile V2] Using email from URL:', urlEmail)
    return urlEmail
  }
  
  const user = Knack.getUserAttributes()
  return user?.email || null
})

const STAFF_ROLE_IDS = ['object_5', 'object_7', 'object_18', 'object_78']
const STAFF_ROLE_NAME_HINTS = ['tutor', 'staff', 'admin', 'head', 'teacher', 'subject']

const normalizeRoleTokens = (roles) => {
  if (!Array.isArray(roles)) return []
  return roles.flatMap((r) => {
    if (!r) return []
    if (typeof r === 'string') return [r]
    const tokens = []
    if (r.id) tokens.push(r.id)
    if (r.key) tokens.push(r.key)
    if (r.name) tokens.push(r.name)
    return tokens
  }).map(t => String(t).trim().toLowerCase()).filter(Boolean)
}

const canEdit = computed(() => {
  // Allow embedding contexts (e.g. Account Manager) to force editing on
  if (config.value && config.value.forceEditable) {
    return true
  }

  if (typeof Knack === 'undefined') return false
  
  const roles = Knack.getUserRoles ? Knack.getUserRoles() : []
  const tokens = normalizeRoleTokens(roles)
  
  const isStaff = tokens.some(t => STAFF_ROLE_IDS.includes(t)) ||
    tokens.some(t => STAFF_ROLE_NAME_HINTS.some(h => t.includes(h)))
  const isStudent = !isStaff
  
  console.log('[Academic Profile V2] User roles:', roles, 'Is staff:', isStaff, 'Is student:', isStudent)
  
  if (isStudent) {
    return config.value.studentTargetEditable !== false && config.value.editable !== false
  }
  
  return isStaff && config.value.editable !== false
})

const canEditOffers = computed(() => {
  // Offers are intended to be editable by BOTH students and staff (unless explicitly disabled)
  if (config.value && config.value.forceEditableOffers) return true
  if (typeof Knack === 'undefined') return false
  return config.value.offersEditable !== false
})

// Methods
const loadProfile = async () => {
  if (!studentEmail.value) {
    error.value = 'Student email not available'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('[Academic Profile V2] Loading profile for:', studentEmail.value)
    
    const response = await fetchAcademicProfile(
      studentEmail.value,
      config.value.apiUrl
    )

    if (response.success) {
      profileData.value = response
      console.log('[Academic Profile V2] Profile loaded:', response.dataSource)
    } else {
      error.value = response.error || 'Failed to load profile'
    }
  } catch (err) {
    console.error('[Academic Profile V2] Load error:', err)
    error.value = 'Error loading profile. Please try again.'
  } finally {
    loading.value = false
  }
}

const toggleProfile = () => {
  isVisible.value = !isVisible.value
  console.log('[Academic Profile V2] Toggled visibility:', isVisible.value)
}

// Watch for hash changes (if student email changes via URL parameter)
watch(() => window.location.hash, () => {
  console.log('[Academic Profile V2] Hash changed, reloading...')
  loadProfile()
})

// Initialize
onMounted(() => {
  console.log('[Academic Profile V2] Component mounted')
  loadProfile()
})
</script>

<style>
/* Import existing academicProfile.css styles */
.academic-profile-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 1400px !important; /* Match report width */
  width: 100%;
  margin: 20px auto 20px auto; /* Top margin to clear header */
  padding: 0 20px;
  color: #ffffff;
  box-sizing: border-box;
}

/* Toggle Button Styles */
.profile-toggle-bar {
  margin-bottom: 12px;
  margin-top: 20px; /* Extra space to clear any overlapping headers */
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #079baa, #7bd8d0);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(7, 155, 170, 0.3);
}

.toggle-button:hover {
  background: linear-gradient(135deg, #067a87, #62d1d2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(7, 155, 170, 0.4);
}

.toggle-button.collapsed {
  background: #f5f5f5;
  color: #079baa;
  border: 2px solid #079baa;
}

.toggle-button.collapsed:hover {
  background: #e8f5f5;
}

.toggle-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.toggle-text {
  font-weight: 600;
}

.profile-wrapper {
  transition: all 0.3s ease;
}

.profile-loading,
.profile-error,
.profile-empty {
  background: linear-gradient(135deg, #2a3c7a 0%, #23356f 100%);
  border: 2px solid #079baa;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  color: #ffffff;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(7, 155, 170, 0.3);
  border-top-color: #00e5db;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  background-color: #00e5db;
  color: #23356f;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 15px;
  transition: all 0.3s;
}

.retry-btn:hover {
  background-color: #00c5c0;
  transform: translateY(-2px);
}
</style>

