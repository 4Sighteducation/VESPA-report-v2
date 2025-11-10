<template>
  <div class="staff-overview-header">
    <div class="header-content">
      <h1>Staff Overview</h1>
      <div class="header-meta">
        <span class="staff-name">{{ staffMember.name }}</span>
        <span class="role-badge" v-for="role in displayRoles" :key="role">
          {{ role }}
        </span>
        <span class="student-count">{{ totalStudents }} students</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  staffMember: {
    type: Object,
    required: true
  },
  totalStudents: {
    type: Number,
    default: 0
  }
})

const roleNames = {
  'staff_admin': 'Staff Admin',
  'tutor': 'Tutor',
  'head_of_year': 'Head of Year',
  'subject_teacher': 'Subject Teacher'
}

const displayRoles = computed(() => {
  return props.staffMember.roles?.map(role => roleNames[role] || role) || []
})
</script>

<style scoped>
.staff-overview-header {
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  padding: 16px 24px;
  color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.header-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.staff-name {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.95;
}

.role-badge {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.student-count {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .staff-overview-header {
    padding: 12px 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .header-content h1 {
    font-size: 20px;
  }
  
  .header-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

