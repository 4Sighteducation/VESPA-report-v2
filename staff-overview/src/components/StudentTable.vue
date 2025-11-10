<template>
  <div class="student-table-container">
    <div class="table-header">
      <h3>Student Overview</h3>
      <div class="header-controls">
        <p class="student-count">{{ paginationInfo }}</p>
        <div class="page-size-selector">
          <label for="page-size">Show:</label>
          <select id="page-size" v-model="pageSize" @change="handlePageSizeChange">
            <option :value="10">10</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="student-table">
        <thead>
          <tr>
            <th @click="sortBy('name')" class="sortable">
              Student Name
              <span class="sort-indicator">{{ getSortIndicator('name') }}</span>
            </th>
            <th @click="sortBy('group')" class="sortable">
              Group
              <span class="sort-indicator">{{ getSortIndicator('group') }}</span>
            </th>
            <th>Focus</th>
            <th @click="sortBy('vision')" class="score-cell sortable" title="Vision">
              V
              <span class="sort-indicator">{{ getSortIndicator('vision') }}</span>
            </th>
            <th @click="sortBy('effort')" class="score-cell sortable" title="Effort">
              E
              <span class="sort-indicator">{{ getSortIndicator('effort') }}</span>
            </th>
            <th @click="sortBy('systems')" class="score-cell sortable" title="Systems">
              S
              <span class="sort-indicator">{{ getSortIndicator('systems') }}</span>
            </th>
            <th @click="sortBy('practice')" class="score-cell sortable" title="Practice">
              P
              <span class="sort-indicator">{{ getSortIndicator('practice') }}</span>
            </th>
            <th @click="sortBy('attitude')" class="score-cell sortable" title="Attitude">
              A
              <span class="sort-indicator">{{ getSortIndicator('attitude') }}</span>
            </th>
            <th @click="sortBy('overall')" class="score-cell sortable" title="Overall">
              O
              <span class="sort-indicator">{{ getSortIndicator('overall') }}</span>
            </th>
            <th>Response</th>
            <th>Action Plan</th>
            <th>Report</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in paginatedStudents" :key="student.id">
            <td class="student-name">{{ student.name }}</td>
            <td>{{ student.group || '-' }}</td>
            <td class="status-cell">
              <span :class="['status-badge', student.hasCompleted ? 'completed' : 'not-completed']">
                {{ student.hasCompleted ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="score-cell" :style="{ background: getScoreColor(student.scores?.vision) }">
              {{ student.scores?.vision || '-' }}
            </td>
            <td class="score-cell" :style="{ background: getScoreColor(student.scores?.effort) }">
              {{ student.scores?.effort || '-' }}
            </td>
            <td class="score-cell" :style="{ background: getScoreColor(student.scores?.systems) }">
              {{ student.scores?.systems || '-' }}
            </td>
            <td class="score-cell" :style="{ background: getScoreColor(student.scores?.practice) }">
              {{ student.scores?.practice || '-' }}
            </td>
            <td class="score-cell" :style="{ background: getScoreColor(student.scores?.attitude) }">
              {{ student.scores?.attitude || '-' }}
            </td>
            <td class="score-cell overall-cell" :style="{ background: getScoreColor(student.scores?.overall) }">
              {{ student.scores?.overall || '-' }}
            </td>
            <td 
              class="text-preview clickable"
              :class="{ 'has-content': student.hasResponse, 'no-content': !student.hasResponse }"
              @click="openTextModal(student.name, 'Response', student.response)"
              :title="student.hasResponse ? 'Click to view full response' : 'No response yet'">
              {{ truncate(student.response, 50) }}
            </td>
            <td 
              class="text-preview clickable"
              :class="{ 'has-content': student.hasGoals, 'no-content': !student.hasGoals }"
              @click="openTextModal(student.name, 'Action Plan', student.goals)"
              :title="student.hasGoals ? 'Click to view full action plan' : 'No action plan yet'">
              {{ truncate(student.goals, 50) }}
            </td>
            <td>
              <button @click="viewReport(student)" class="report-button">
                REPORT
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->
    <div v-if="filteredStudents.length > 0" class="pagination-controls">
      <button 
        @click="goToPage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="pagination-button"
      >
        Previous
      </button>
      
      <div class="page-numbers">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            @click="goToPage(page)"
            :class="['page-button', { active: page === currentPage }]"
          >
            {{ page }}
          </button>
          <span v-else class="page-ellipsis">...</span>
        </template>
      </div>
      
      <button 
        @click="goToPage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="pagination-button"
      >
        Next
      </button>
    </div>

    <div v-if="filteredStudents.length === 0" class="no-results">
      <p>No students match the current filters.</p>
    </div>
    
    <!-- Text View Modal -->
    <TextViewModal
      :isOpen="modalOpen"
      :title="modalTitle"
      :text="modalText"
      @close="closeTextModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getScoreColor } from '../data/vespaColors.js'
import TextViewModal from './TextViewModal.vue'

const props = defineProps({
  students: {
    type: Array,
    required: true
  },
  activeFilters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['view-report'])

const sortField = ref('name')
const sortDirection = ref('asc')
const modalOpen = ref(false)
const modalTitle = ref('')
const modalText = ref('')

// Pagination state
const currentPage = ref(1)
const pageSize = ref(50)

const filteredStudents = computed(() => {
  let filtered = [...props.students]

  // NOTE: Cycle filtering is now handled by backend API (via &cycle= parameter)
  // The backend returns only students who completed the selected cycle
  // So we don't filter by cycle here to avoid double-filtering

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
    const search = props.activeFilters.search.toLowerCase()
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search) ||
      (s.group && s.group.toLowerCase().includes(search))
    )
  }

  return filtered
})

const sortedStudents = computed(() => {
  const sorted = [...filteredStudents.value]

  sorted.sort((a, b) => {
    let aVal, bVal
    
    // Handle score fields (nested in scores object)
    if (['vision', 'effort', 'systems', 'practice', 'attitude', 'overall'].includes(sortField.value)) {
      aVal = a.scores?.[sortField.value]
      bVal = b.scores?.[sortField.value]
      
      // Treat null/undefined as -1 for scores (so they sort to bottom)
      if (aVal === null || aVal === undefined) aVal = -1
      if (bVal === null || bVal === undefined) bVal = -1
      
      // Convert to numbers
      aVal = parseFloat(aVal)
      bVal = parseFloat(bVal)
    } else {
      // Handle regular fields
      aVal = a[sortField.value]
      bVal = b[sortField.value]
      
      // Handle null/undefined
      if (aVal === null || aVal === undefined) aVal = ''
      if (bVal === null || bVal === undefined) bVal = ''
      
      // String comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return sorted
})

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / pageSize.value)
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedStudents.value.slice(start, end)
})

const paginationInfo = computed(() => {
  const total = filteredStudents.value.length
  if (total === 0) return 'No students'
  
  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, total)
  return `Showing ${start}-${end} of ${total} students`
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  
  if (total <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Show first page
    pages.push(1)
    
    // Add ellipsis if current page is far from start
    if (current > 3) {
      pages.push('...')
    }
    
    // Add pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    // Add ellipsis if current page is far from end
    if (current < total - 2) {
      pages.push('...')
    }
    
    // Add last page
    if (total > 1) {
      pages.push(total)
    }
  }
  
  return pages
})

// Reset to page 1 when filters change
watch(() => [props.activeFilters, filteredStudents.value.length], () => {
  currentPage.value = 1
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Scroll to top of table
    const container = document.querySelector('.student-table-container')
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1 // Reset to first page when changing page size
}

const sortBy = (field) => {
  console.log('[Table] Sorting by:', field)
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = field.includes('score') || ['vision', 'effort', 'systems', 'practice', 'attitude', 'overall'].includes(field) ? 'desc' : 'asc'
  }
}

const getSortIndicator = (field) => {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? '▲' : '▼'
}

const truncate = (text, length) => {
  if (!text) return '-'
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const viewReport = (student) => {
  emit('view-report', student)
}

const openTextModal = (studentName, type, text) => {
  if (!text || text.trim() === '' || text === '-') {
    return // Don't open modal for empty content
  }
  modalTitle.value = `${studentName} - ${type}`
  modalText.value = text
  modalOpen.value = true
}

const closeTextModal = () => {
  modalOpen.value = false
  modalTitle.value = ''
  modalText.value = ''
}
</script>

<style scoped>
.student-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 20px;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.table-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.student-count {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-selector label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.page-size-selector select {
  padding: 6px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.page-size-selector select:focus {
  outline: none;
  border-color: #079baa;
}

.table-wrapper {
  overflow-x: auto;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
}

.student-table thead {
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  color: white;
}

.student-table th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.student-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.3s;
  position: relative;
}

.student-table th.sortable:hover {
  background: rgba(255, 255, 255, 0.2);
}

.student-table th.score-cell.sortable {
  cursor: pointer;
}

.sort-indicator {
  margin-left: 6px;
  font-size: 10px;
}

.student-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.student-name {
  font-weight: 600;
  color: #333;
}

.status-cell {
  text-align: center;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.not-completed {
  background: #f8d7da;
  color: #721c24;
}

.score-cell {
  text-align: center;
  font-weight: 700;
  color: #333;
  min-width: 40px;
}

.overall-cell {
  font-size: 15px;
  font-weight: 800;
  border-left: 2px solid #ccc;
}

.text-preview {
  max-width: 200px;
  font-size: 13px;
  color: #333;
}

.text-preview.clickable {
  cursor: pointer;
  transition: all 0.2s;
  padding: 14px 12px !important;
}

.text-preview.clickable:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.text-preview.has-content {
  background-color: #d4edda !important;
  color: #155724;
  font-weight: 500;
}

.text-preview.no-content {
  background-color: #f8d7da !important;
  color: #721c24;
  font-style: italic;
}

.text-preview.clickable:hover {
  opacity: 0.85;
}

.report-button {
  padding: 8px 16px;
  background: #079baa;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.report-button:hover {
  background: #067a87;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.pagination-controls {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border-top: 2px solid #f0f0f0;
  flex-wrap: wrap;
}

.pagination-button {
  padding: 10px 20px;
  background: #079baa;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-button:hover:not(:disabled) {
  background: #067a87;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.pagination-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-numbers {
  display: flex;
  gap: 6px;
  align-items: center;
}

.page-button {
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: all 0.3s;
}

.page-button:hover {
  border-color: #079baa;
  color: #079baa;
}

.page-button.active {
  background: #079baa;
  border-color: #079baa;
  color: white;
}

.page-ellipsis {
  padding: 0 8px;
  color: #999;
  font-size: 14px;
}

.no-results {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 16px;
}

@media (max-width: 1200px) {
  .text-preview {
    max-width: 150px;
  }
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .student-table {
    font-size: 12px;
  }
  
  .student-table th,
  .student-table td {
    padding: 10px 8px;
  }
  
  .text-preview {
    max-width: 100px;
  }
}
</style>

