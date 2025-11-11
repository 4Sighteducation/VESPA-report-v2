<template>
  <div class="vespa-profile-display">
    <section class="vespa-section profile-section">
      <h2 class="vespa-section-title">
        <span style="display: inline-flex; align-items: center;">
          Student Profile
          <span class="profile-info-button" @click="showInfoModal = true" title="Understanding These Grades">i</span>
        </span>
        
        <!-- Edit/Save button for staff -->
        <span v-if="editable && isStaff" 
              class="master-edit-icon"
              :class="isEditMode ? 'save-icon' : 'edit-icon'"
              @click="toggleEditMode"
              :title="isEditMode ? 'Save All Changes' : 'Edit All Grades'">
          {{ isEditMode ? '💾 Save All' : '✏️ Edit Grades' }}
        </span>
      </h2>

      <div class="profile-info">
        <!-- Student Details -->
        <div class="profile-details">
          <div class="profile-name">{{ student.name || 'Student' }}</div>
          
          <div class="profile-item">
            <span class="profile-label">School:</span>
            <span class="profile-value">{{ student.school || 'N/A' }}</span>
          </div>
          
          <div v-if="student.yearGroup" class="profile-item">
            <span class="profile-label">Year Group:</span>
            <span class="profile-value">{{ student.yearGroup }}</span>
          </div>
          
          <div v-if="student.tutorGroup" class="profile-item">
            <span class="profile-label">Tutor Group:</span>
            <span class="profile-value">{{ student.tutorGroup }}</span>
          </div>
          
          <div v-if="student.attendance" class="profile-item">
            <span class="profile-label">Attendance:</span>
            <span class="profile-value">{{ formatPercentage(student.attendance) }}</span>
          </div>
        </div>

        <!-- Subjects Grid -->
        <div class="subjects-container">
          <div class="subjects-grid">
            <SubjectCard
              v-for="subject in subjects"
              :key="subject.id || subject.position"
              :subject="subject"
              :edit-mode="isEditMode"
              :is-staff="isStaff"
              @update="handleSubjectUpdate"
            />
          </div>
          
          <div v-if="subjects.length === 0" class="no-subjects">
            No subjects available
          </div>
        </div>
      </div>

      <!-- Data source indicator (subtle dot for admin) -->
      <div v-if="dataSource" class="data-source-dot" 
           :class="dataSource === 'supabase' ? 'live-source' : 'fallback-source'"
           :title="`Data loaded from ${dataSource === 'supabase' ? 'Supabase (live)' : 'Knack (fallback)'}`">
      </div>
    </section>

    <!-- Info Modal -->
    <InfoModal 
      v-if="showInfoModal" 
      :is-staff="isStaff"
      @close="showInfoModal = false" 
    />

    <!-- Saving Overlay -->
    <div v-if="saving" class="saving-overlay">
      <div class="spinner"></div>
      <p>Saving changes...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SubjectCard from './SubjectCard.vue'
import InfoModal from './InfoModal.vue'
import { updateSubjectGrade } from '../services/api.js'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  subjects: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'inline' // 'inline' or 'modal'
  },
  dataSource: {
    type: String,
    default: 'unknown'
  }
})

const emit = defineEmits(['reload'])

// State
const isEditMode = ref(false)
const showInfoModal = ref(false)
const saving = ref(false)
const pendingChanges = ref({}) // Track changes before save

// Check if user is staff
const isStaff = computed(() => {
  if (typeof Knack === 'undefined') return false
  const roles = Knack.getUserRoles ? Knack.getUserRoles() : []
  return !roles.some(r => r.name === 'Student' || r.toLowerCase().includes('student'))
})

// Toggle edit mode
const toggleEditMode = async () => {
  if (isEditMode.value) {
    // Save all changes
    await saveAllChanges()
  }
  isEditMode.value = !isEditMode.value
}

// Handle individual subject update
const handleSubjectUpdate = (subjectId, field, value) => {
  // Store pending changes
  if (!pendingChanges.value[subjectId]) {
    pendingChanges.value[subjectId] = {}
  }
  pendingChanges.value[subjectId][field] = value
  
  console.log('[Academic Profile] Change tracked:', { subjectId, field, value })
}

// Save all pending changes
const saveAllChanges = async () => {
  if (Object.keys(pendingChanges.value).length === 0) {
    console.log('[Academic Profile] No changes to save')
    return
  }

  saving.value = true

  try {
    const updatePromises = []
    
    // Update each subject that has changes
    for (const [subjectId, changes] of Object.entries(pendingChanges.value)) {
      updatePromises.push(
        updateSubjectGrade(subjectId, changes, window.ACADEMIC_PROFILE_V2_CONFIG?.apiUrl)
      )
    }

    const results = await Promise.all(updatePromises)
    
    const allSuccess = results.every(r => r.success)
    
    if (allSuccess) {
      console.log('[Academic Profile] All changes saved successfully')
      
      // Clear pending changes
      pendingChanges.value = {}
      
      // Reload data from server
      emit('reload')
      
      // Show success message
      showTemporaryMessage('All changes saved successfully!', 'success')
    } else {
      throw new Error('Some updates failed')
    }
  } catch (err) {
    console.error('[Academic Profile] Save error:', err)
    showTemporaryMessage('Error saving changes. Please try again.', 'error')
  } finally {
    saving.value = false
  }
}

// Format percentage
const formatPercentage = (decimal) => {
  if (decimal === null || decimal === undefined) return 'N/A'
  return `${Math.round(decimal * 100)}%`
}

// Show temporary message
const showTemporaryMessage = (message, type) => {
  // Simple alert for now - can be enhanced with a toast component
  alert(message)
}
</script>

<style scoped>
/* Container */
.vespa-profile-display {
  margin-bottom: 24px;
  width: 100%;
  max-width: 100% !important;
  box-sizing: border-box;
}

.vespa-section {
  background-color: #2a3c7a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 16px;
  border: 2px solid #079baa;
  position: relative;
}

.vespa-section-title {
  color: #00e5db !important;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #079baa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Info button */
.profile-info-button {
  font-size: 16px;
  color: #00e5db;
  cursor: pointer;
  border: 1px solid #00e5db;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-left: 10px;
  transition: all 0.3s;
}

.profile-info-button:hover {
  background-color: #00e5db;
  color: #23356f;
}

/* Edit button */
.master-edit-icon {
  cursor: pointer;
  font-size: 0.7em;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.master-edit-icon.edit-icon {
  color: #00e5db;
  border-color: #00e5db;
}

.master-edit-icon.save-icon {
  color: #4caf50;
  border-color: #4caf50;
}

.master-edit-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Profile layout */
.profile-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.profile-details {
  flex: 1;
  min-width: 200px;
  background-color: #334285;
  border-radius: 8px;
  border: 1px solid rgba(7, 155, 170, 0.3);
  padding: 16px;
}

.profile-name {
  font-size: 22px;
  color: #00e5db;
  margin-bottom: 12px;
  font-weight: 700;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(7, 155, 170, 0.3);
}

.profile-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.profile-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.profile-label {
  font-weight: 600;
  color: #00e5db;
  margin-right: 8px;
}

.profile-value {
  color: #f0f0f0;
}

/* Subjects */
.subjects-container {
  flex: 2;
  min-width: 280px;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 400px) {
  .subjects-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.no-subjects {
  padding: 20px;
  text-align: center;
  color: #cccccc;
  font-style: italic;
}

/* Data source indicator */
/* Data source indicator - subtle dot */
.data-source-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: help;
  z-index: 10;
}

.data-source-dot.live-source {
  background: #4caf50; /* Green dot for live Supabase data */
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}

.data-source-dot.fallback-source {
  background: #ff9800; /* Orange dot for Knack fallback */
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.6);
}

/* Saving overlay */
.saving-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.saving-overlay p {
  color: white;
  font-size: 18px;
  margin-top: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
  }
  
  .subjects-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 400px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }
}
</style>

