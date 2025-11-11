<template>
  <div class="coaching-content">
    <!-- 5 Stacked Rows - One per VESPA category -->
    <div 
      v-for="category in categories" 
      :key="category.name" 
      class="category-row"
      :class="{ 'mobile-collapsed': isMobile && !expandedThemes[category.name] }"
      :style="{ borderLeftColor: category.color }"
    >
      <!-- Category Header - Clickable on Mobile -->
      <div 
        class="category-header" 
        :style="{ background: category.color }"
        :class="{ 'clickable': isMobile }"
        @click="isMobile && toggleTheme(category.name, $event)"
      >
        <div class="header-content">
          <h3>{{ category.name }}</h3>
          <!-- Mobile: Score Badge + Expand/Collapse Icon -->
          <div v-if="isMobile" class="mobile-header-controls">
            <span class="score-badge">
              {{ scores[category.key] !== null && scores[category.key] !== undefined ? scores[category.key] : '-' }}/10
            </span>
            <span class="expand-icon" :class="{ 'expanded': expandedThemes[category.name] }">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Mobile: Collapsed Preview -->
      <div v-if="isMobile && !expandedThemes[category.name]" class="mobile-preview">
        <div class="preview-content">
          <p class="preview-text">{{ getPreviewSnippet(category.name) }}</p>
          <button class="expand-preview-button" @click.stop="toggleTheme(category.name)">
            Tap to read full report →
          </button>
        </div>
      </div>

      <!-- Full Content (Desktop always shown, Mobile only when expanded) -->
      <div 
        v-if="!isMobile || expandedThemes[category.name]"
        class="row-content"
        :class="{ 'mobile-expanded': isMobile && expandedThemes[category.name] }"
      >
        <!-- Column 1: Large Score Card -->
        <div class="score-card" :style="{ background: category.color }">
          <div class="score-number">
            {{ scores[category.key] !== null && scores[category.key] !== undefined ? scores[category.key] : '-' }}
          </div>
          <div class="score-label">out of 10</div>
        </div>

        <!-- Column 2: Student Content (Statement + Questions) -->
        <div class="student-content">
          <div v-if="content[category.name]">
            <!-- Statement Text -->
            <div v-if="content[category.name].statement_text" class="statement">
              <p v-html="content[category.name].statement_text"></p>
            </div>

            <!-- Reflection Questions -->
            <div v-if="getQuestions(content[category.name]).length > 0" class="questions">
              <h4>Reflection Questions:</h4>
              <ul>
                <li v-for="(question, qIndex) in getQuestions(content[category.name])" :key="qIndex">
                  {{ question }}
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="no-content">
            <p>Complete the questionnaire to see personalized content.</p>
          </div>
        </div>

        <!-- Column 3: Staff Content (Coaching Comments + Activities) -->
        <div class="staff-content">
          <div v-if="content[category.name]">
            <!-- Coaching Comments -->
            <div v-if="getCoachingComments(content[category.name]).length > 0" class="coaching-comments">
              <h4>Coaching Points:</h4>
              <ul>
                <li v-for="(comment, cIndex) in getCoachingComments(content[category.name])" :key="cIndex">
                  {{ comment }}
                </li>
              </ul>
            </div>

            <!-- Suggested Activities -->
            <div v-if="content[category.name].suggested_tools" class="activities">
              <h4>Suggested Activities:</h4>
              <div class="activity-buttons">
                <a 
                  v-for="(activity, aIndex) in parseActivities(content[category.name].suggested_tools)" 
                  :key="aIndex"
                  :href="getActivityUrl(activity, 'start')"
                  target="_blank"
                  class="activity-button"
                  :style="{ 
                    background: category.color + '15', 
                    borderColor: category.color, 
                    color: category.color 
                  }"
                >
                  {{ activity }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { vespaColors } from '../data/vespaColors.js'
import { getActivityUrl } from '../data/activityLinks.js'

const props = defineProps({
  scores: {
    type: Object,
    required: true
  },
  content: {
    type: Object,
    required: true
  }
})

// Mobile detection
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

// Expanded themes state (mobile only)
const expandedThemes = ref({
  Vision: false,
  Effort: false,
  Systems: false,
  Practice: false,
  Attitude: false
})

// Toggle theme expand/collapse
const toggleTheme = (themeName, event) => {
  if (event) {
    event.stopPropagation()
  }
  if (isMobile.value) {
    expandedThemes.value[themeName] = !expandedThemes.value[themeName]
    // Scroll to top of expanded section
    if (expandedThemes.value[themeName]) {
      setTimeout(() => {
        // Find the category row by looking for the header with matching text
        const headers = document.querySelectorAll('.category-header h3')
        headers.forEach((header, index) => {
          if (header.textContent.trim() === themeName) {
            const categoryRow = header.closest('.category-row')
            if (categoryRow) {
              categoryRow.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }
        })
      }, 350) // Wait for animation to complete
    }
  }
}

// Get preview snippet for collapsed view
const getPreviewSnippet = (categoryName) => {
  const categoryContent = props.content[categoryName]
  if (!categoryContent || !categoryContent.statement_text) {
    return 'Complete the questionnaire to see personalized content.'
  }
  
  // Strip HTML tags and get first 120 characters
  const text = categoryContent.statement_text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  if (text.length <= 120) {
    return text
  }
  
  // Find last space before 120 chars to avoid cutting words
  const truncated = text.substring(0, 120)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace > 80 ? lastSpace : 120) + '...'
}

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const categories = [
  { name: 'Vision', key: 'vision', color: vespaColors.vision },
  { name: 'Effort', key: 'effort', color: vespaColors.effort },
  { name: 'Systems', key: 'systems', color: vespaColors.systems },
  { name: 'Practice', key: 'practice', color: vespaColors.practice },
  { name: 'Attitude', key: 'attitude', color: vespaColors.attitude }
]

// Parse questions array - handle both array and string
const getQuestions = (categoryContent) => {
  if (!categoryContent || !categoryContent.questions) return []
  
  // If it's already an array, return it
  if (Array.isArray(categoryContent.questions)) {
    return categoryContent.questions.filter(q => q && q.trim())
  }
  
  // If it's a string, split by common delimiters
  const questionsStr = categoryContent.questions
  return questionsStr.split(/[?]\s*/).filter(q => q && q.trim()).map(q => q.trim() + '?')
}

// Parse coaching comments - handle both array and string with <br /> tags
const getCoachingComments = (categoryContent) => {
  if (!categoryContent || !categoryContent.coaching_comments) return []
  
  // If it's already an array, return it
  if (Array.isArray(categoryContent.coaching_comments)) {
    return categoryContent.coaching_comments.filter(c => c && c.trim())
  }
  
  // If it's a string with <br /> tags, split by them
  const commentsStr = categoryContent.coaching_comments
  return commentsStr
    .split(/<br\s*\/?>/i)
    .map(c => c.replace(/^\d+\.\s*/, '').trim()) // Remove leading numbers like "1."
    .filter(c => c)
}

// Parse activities from suggested_tools string
const parseActivities = (toolsStr) => {
  if (!toolsStr) return []
  
  // Split by comma or <br /> tags
  return toolsStr
    .split(/,|<br\s*\/?>/i)
    .map(a => a.trim())
    .filter(a => a)
}
</script>

<style scoped>
.coaching-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 30px;
  background: #f5f5f5;
}

.category-row {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-left: 6px solid;
}

.category-header {
  padding: 16px 24px;
  color: white;
}

.category-header.clickable {
  cursor: pointer;
  user-select: none;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.category-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.mobile-header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-badge {
  background: rgba(255, 255, 255, 0.25);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.expand-icon {
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* Mobile Preview (Collapsed State) */
.mobile-preview {
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

.expand-preview-button {
  align-self: flex-start;
  padding: 8px 16px;
  background: transparent;
  border: 2px solid #079baa;
  color: #079baa;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.expand-preview-button:hover {
  background: #079baa;
  color: white;
}

.row-content {
  display: grid;
  grid-template-columns: 150px 1fr 1fr;
  gap: 24px;
  padding: 24px;
}

/* Column 1: Large Score Card */
.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-height: 150px;
}

.score-number {
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.score-label {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.9;
  font-weight: 600;
}

/* Column 2: Student Content */
.student-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.statement p {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: #333;
}

.questions {
  margin-top: 12px;
}

.questions h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 700;
  color: #555;
}

.questions ul {
  margin: 0;
  padding-left: 20px;
}

.questions li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #666;
  font-size: 14px;
}

/* Column 3: Staff Content */
.staff-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 3px solid #ff9800;
}

.coaching-comments h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 700;
  color: #ff9800;
}

.coaching-comments ul {
  margin: 0;
  padding-left: 20px;
}

.coaching-comments li {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.activities {
  margin-top: 12px;
}

.activities h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 700;
  color: #555;
}

.activity-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.activity-button {
  display: inline-block;
  padding: 6px 14px;
  border: 1.5px solid;
  border-radius: 6px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.activity-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  filter: brightness(0.95);
}

.no-content {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
  grid-column: 1 / -1;
}

/* Responsive */
@media (max-width: 1200px) {
  .row-content {
    grid-template-columns: 120px 1fr;
    gap: 16px;
  }
  
  .staff-content {
    grid-column: 1 / -1;
    margin-top: 12px;
  }
}

@media (max-width: 768px) {
  .coaching-content {
    padding: 15px;
    gap: 12px;
  }
  
  .category-row {
    transition: all 0.3s ease;
  }
  
  .category-row.mobile-collapsed {
    overflow: hidden;
  }
  
  .category-header {
    padding: 14px 18px;
  }
  
  .category-header h3 {
    font-size: 18px;
    letter-spacing: 0.5px;
  }
  
  .row-content {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 18px;
    max-height: none;
    overflow: visible;
  }
  
  .row-content.mobile-expanded {
    animation: expandContent 0.3s ease;
  }
  
  @keyframes expandContent {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 5000px;
    }
  }
  
  .score-card {
    padding: 20px;
    min-height: auto;
  }
  
  .score-number {
    font-size: 48px;
  }
  
  .staff-content {
    margin-top: 0;
  }
  
  /* Hide preview when expanded */
  .category-row:not(.mobile-collapsed) .mobile-preview {
    display: none;
  }
}

@media print {
  .coaching-content {
    background: white !important;
    padding: 1mm !important;
    gap: 1mm !important;
  }
  
  .category-row {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    box-shadow: none !important;
    border: 0.3pt solid #999 !important;
    margin-bottom: 1mm !important;
    padding: 0 !important;
  }
  
  .category-header {
    padding: 1mm 2mm !important;
  }
  
  .category-header h3 {
    font-size: 9pt !important;
    margin: 0 !important;
  }
  
  .row-content {
    display: grid !important;
    grid-template-columns: 18mm 1fr 1fr !important;
    grid-template-rows: auto !important;
    padding: 2mm !important;
    gap: 2mm !important;
  }
  
  .score-card {
    grid-column: 1 !important;
    grid-row: 1 !important;
    padding: 2mm 1mm !important;
    min-height: auto !important;
  }
  
  .score-number {
    font-size: 18pt !important;
  }
  
  .score-label {
    font-size: 6pt !important;
  }
  
  .student-content {
    grid-column: 2 !important;
    grid-row: 1 !important;
    font-size: 7pt !important;
    line-height: 1.2 !important;
  }
  
  .statement p {
    font-size: 7pt !important;
    margin: 0 0 1mm 0 !important;
  }
  
  .questions h4 {
    font-size: 7pt !important;
    margin: 0 0 0.5mm 0 !important;
  }
  
  .questions ul {
    padding-left: 3mm !important;
    margin: 0 !important;
  }
  
  .questions li {
    font-size: 6pt !important;
    margin-bottom: 0.5mm !important;
    line-height: 1.1 !important;
  }
  
  /* HIDE reflection questions */
  .questions {
    display: none !important;
  }
  
  /* SHOW staff content */
  .staff-content {
    display: block !important;
    background: #f8f9fa !important;
    padding: 2mm !important;
    border-left: 1pt solid #ff9800 !important;
  }
  
  .coaching-comments,
  .activities {
    display: block !important;
  }
  
  .coaching-comments h4,
  .activities h4 {
    font-size: 7pt !important;
    margin: 0 0 1mm 0 !important;
  }
  
  .coaching-comments ul,
  .activities ul {
    margin: 0 !important;
    padding-left: 3mm !important;
  }
  
  .coaching-comments li {
    font-size: 6pt !important;
    margin-bottom: 0.5mm !important;
  }
  
  .activity-buttons {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 1mm !important;
  }
  
  .activity-button {
    display: inline-block !important;
    padding: 0.5mm 2mm !important;
    font-size: 6pt !important;
    border-width: 0.3pt !important;
  }
}
</style>

