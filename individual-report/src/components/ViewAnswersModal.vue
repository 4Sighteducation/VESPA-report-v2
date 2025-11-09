<template>
  <div v-if="isOpen" class="view-answers-modal-overlay" @click="handleClose">
    <div class="view-answers-modal-container" @click.stop>
      <div class="view-answers-modal-header">
        <h2>VESPA Questionnaire Responses - Cycle <span class="cycle-number">{{ selectedCycle }}</span></h2>
        <button class="modal-close-button" @click="handleClose">&times;</button>
      </div>
      
      <div class="cycle-selector-bar">
        <button 
          v-for="cycleNum in [1, 2, 3]" 
          :key="cycleNum"
          @click="handleCycleChange(cycleNum)"
          :class="['cycle-tab-button', { active: cycleNum === selectedCycle }]"
        >
          Cycle {{ cycleNum }}
        </button>
      </div>
      
      <div class="view-answers-modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading questionnaire responses...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>
        
        <div v-else class="questions-list">
          <div 
            v-for="(question, index) in questionMappings" 
            :key="index"
            class="question-item"
          >
            <div class="question-content">
              <div class="question-text">{{ question.questionText }}</div>
              <div class="question-response">
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill" 
                    :style="{ 
                      width: getProgressWidth(question), 
                      background: getCategoryColor(question.vespaCategory) 
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <div 
              class="question-category" 
              :style="{ background: getCategoryColor(question.vespaCategory) }"
            >
              {{ question.vespaCategory }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  cycle: {
    type: Number,
    default: 1
  },
  responses: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'cycle-changed'])

const selectedCycle = ref(props.cycle)
const loading = ref(false)
const error = ref(null)

// Watch for external cycle changes
watch(() => props.cycle, (newCycle) => {
  selectedCycle.value = newCycle
})

// Reset to current cycle when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedCycle.value = props.cycle
  }
})

const categoryColors = {
  'VISION': '#ff8f00',
  'EFFORT': '#38b6ff',
  'SYSTEMS': '#02e612',
  'PRACTICE': '#8c52ff',
  'ATTITUDE': '#ff66c4',
  'OUTCOME': '#2196f3'
}

const questionMappings = [
  { questionId: "q1", questionText: "I've worked out the next steps I need to take to reach my career goals", vespaCategory: "VISION" },
  { questionId: "q2", questionText: "I plan and organise my time so that I can fit in all my school work as well as other activities", vespaCategory: "SYSTEMS" },
  { questionId: "q3", questionText: "I give a lot of attention to my career planning", vespaCategory: "VISION" },
  { questionId: "q4", questionText: "I complete all my homework on time", vespaCategory: "SYSTEMS" },
  { questionId: "q5", questionText: "No matter who you are, you can change your intelligence a lot", vespaCategory: "ATTITUDE" },
  { questionId: "q6", questionText: "I use all my independent study time effectively", vespaCategory: "EFFORT" },
  { questionId: "q7", questionText: "I test myself on important topics until I remember them", vespaCategory: "PRACTICE" },
  { questionId: "q8", questionText: "I have a positive view of myself", vespaCategory: "ATTITUDE" },
  { questionId: "q9", questionText: "I am a hard working student", vespaCategory: "EFFORT" },
  { questionId: "q10", questionText: "I am confident in my academic ability", vespaCategory: "ATTITUDE" },
  { questionId: "q11", questionText: "I always meet deadlines", vespaCategory: "SYSTEMS" },
  { questionId: "q12", questionText: "I spread out my revision, rather than cramming at the last minute", vespaCategory: "PRACTICE" },
  { questionId: "q13", questionText: "I don't let a poor test/assessment result get me down for too long", vespaCategory: "ATTITUDE" },
  { questionId: "q14", questionText: "I strive to achieve the goals I set for myself", vespaCategory: "VISION" },
  { questionId: "q15", questionText: "I summarise important information in diagrams, tables or lists", vespaCategory: "PRACTICE" },
  { questionId: "q16", questionText: "I enjoy learning new things", vespaCategory: "VISION" },
  { questionId: "q17", questionText: "I'm not happy unless my work is the best it can be", vespaCategory: "EFFORT" },
  { questionId: "q18", questionText: "I take good notes in class which are useful for revision", vespaCategory: "SYSTEMS" },
  { questionId: "q19", questionText: "When revising I mix different kinds of topics/subjects in one study session", vespaCategory: "PRACTICE" },
  { questionId: "q20", questionText: "I feel I can cope with the pressure at school/college/University", vespaCategory: "ATTITUDE" },
  { questionId: "q21", questionText: "I work as hard as I can in most classes", vespaCategory: "EFFORT" },
  { questionId: "q22", questionText: "My books/files are organised", vespaCategory: "SYSTEMS" },
  { questionId: "q23", questionText: "I study by explaining difficult topics out loud", vespaCategory: "PRACTICE" },
  { questionId: "q24", questionText: "I'm happy to ask questions in front of a group", vespaCategory: "ATTITUDE" },
  { questionId: "q25", questionText: "When revising, I work under timed conditions answering exam-style questions", vespaCategory: "PRACTICE" },
  { questionId: "q26", questionText: "Your intelligence is something about you that you can change very much", vespaCategory: "ATTITUDE" },
  { questionId: "q27", questionText: "I like hearing feedback about how I can improve", vespaCategory: "ATTITUDE" },
  { questionId: "q28", questionText: "I can control my nerves in tests/practical assessments", vespaCategory: "ATTITUDE" },
  { questionId: "q29_vision_grades", questionText: "I know what grades I want to achieve", vespaCategory: "VISION" },
  // Outcome questions
  { questionId: "outcome_q_support", questionText: "I have the support I need to achieve this year", vespaCategory: "OUTCOME" },
  { questionId: "outcome_q_equipped", questionText: "I feel equipped to face the study and revision challenges this year", vespaCategory: "OUTCOME" },
  { questionId: "outcome_q_confident", questionText: "I am confident I will achieve my potential in my final exams", vespaCategory: "OUTCOME" }
]

const getResponseValue = (question) => {
  // Get responses for current cycle: props.responses[cycle][questionId]
  const cycleResponses = props.responses[selectedCycle.value] || {}
  const value = cycleResponses[question.questionId] || 0
  return parseInt(value) || 0
}

const getProgressWidth = (question) => {
  const value = getResponseValue(question)
  return `${(value / 5) * 100}%`  // Likert scale 1-5
}

const getCategoryColor = (category) => {
  return categoryColors[category] || '#079baa'
}

const handleCycleChange = (cycleNum) => {
  selectedCycle.value = cycleNum
  emit('cycle-changed', cycleNum)
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.view-answers-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.view-answers-modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.view-answers-modal-header {
  padding: 24px 30px;
  background: linear-gradient(135deg, #079baa 0%, #7bd8d0 100%);
  color: white;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-answers-modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.cycle-number {
  color: #fff;
  font-weight: 900;
}

.modal-close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 36px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  line-height: 1;
  padding: 0;
}

.modal-close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.cycle-selector-bar {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.cycle-tab-button {
  flex: 1;
  padding: 12px 24px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.cycle-tab-button:hover {
  border-color: #079baa;
  color: #079baa;
}

.cycle-tab-button.active {
  background: #079baa;
  border-color: #079baa;
  color: white;
  box-shadow: 0 4px 12px rgba(7, 155, 170, 0.3);
}

.view-answers-modal-body {
  padding: 20px 30px;
  flex: 1;
  overflow-y: auto;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #079baa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.question-item:hover {
  border-color: #079baa;
  box-shadow: 0 2px 8px rgba(7, 155, 170, 0.1);
}

.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  font-weight: 500;
}

.question-response {
  margin-top: 4px;
}

.progress-bar-container {
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  color: white;
  font-size: 11px;
  font-weight: 600;
}

.question-category {
  padding: 4px 12px;
  border-radius: 6px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-self: flex-start;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .view-answers-modal-overlay {
    padding: 0;
  }
  
  .view-answers-modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .view-answers-modal-header {
    border-radius: 0;
    padding: 20px;
  }
  
  .view-answers-modal-header h2 {
    font-size: 18px;
  }
  
  .view-answers-modal-body {
    padding: 16px 20px;
  }
  
  .question-item {
    flex-direction: column;
  }
  
  .cycle-selector-bar {
    flex-direction: column;
  }
  
  .cycle-tab-button {
    padding: 10px 16px;
  }
}

@media print {
  .view-answers-modal-overlay {
    display: none !important;
  }
}
</style>

