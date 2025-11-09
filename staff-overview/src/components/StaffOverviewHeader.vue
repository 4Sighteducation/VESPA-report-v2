<template>
  <div class="staff-overview-header">
    <div class="header-content">
      <div class="staff-info">
        <h1>{{ staffMember.name || 'Staff Overview' }}</h1>
        <div class="staff-details">
          <span class="role-badge" v-for="role in displayRoles" :key="role">
            {{ role }}
          </span>
        </div>
      </div>
      <div class="student-count">
        <div class="count-number">{{ totalStudents }}</div>
        <div class="count-label">Students</div>
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
  padding: 30px 40px;
  color: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.staff-info {
  flex: 1;
}

.staff-info h1 {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
}

.staff-details {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.role-badge {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.student-count {
  text-align: center;
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  min-width: 120px;
}

.count-number {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 8px;
}

.count-label {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .staff-overview-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .staff-info h1 {
    font-size: 24px;
  }
  
  .student-count {
    width: 100%;
  }
}
</style>

