<template>
  <div id="academic-profile-v2" class="academic-profile-container">
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
        :editable="canEdit"
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

// Computed
const studentEmail = computed(() => {
  // Get student email from Knack context
  if (typeof Knack === 'undefined') return null
  
  const user = Knack.getUserAttributes()
  return user?.email || null
})

const canEdit = computed(() => {
  // Staff can edit, students cannot
  if (typeof Knack === 'undefined') return false
  
  const roles = Knack.getUserRoles ? Knack.getUserRoles() : []
  const isStudent = roles.some(role => 
    role.name === 'Student' || 
    role.toLowerCase().includes('student')
  )
  
  return !isStudent && config.value.editable !== false
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
  max-width: 1200px;
  margin: 0 auto 20px auto;
  color: #ffffff;
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

