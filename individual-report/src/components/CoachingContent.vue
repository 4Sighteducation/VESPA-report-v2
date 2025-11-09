<template>
  <div class="coaching-content">
    <div v-for="(category, index) in categories" :key="category" class="category-section">
      <h3 :style="{ color: getCategoryColor(category) }">
        {{ category }}
      </h3>
      
      <div v-if="content[category]" class="content-block">
        <!-- Statement Text -->
        <div v-if="content[category].statement_text" class="statement">
          <p>{{ content[category].statement_text }}</p>
        </div>

        <!-- Questions -->
        <div v-if="content[category].questions && content[category].questions.length > 0" class="questions">
          <h4>Reflection Questions:</h4>
          <ul>
            <li v-for="(question, qIndex) in content[category].questions" :key="qIndex">
              {{ question }}
            </li>
          </ul>
        </div>

        <!-- Suggested Tools/Activities -->
        <div v-if="content[category].suggested_tools" class="tools">
          <h4>Suggested Activities:</h4>
          <p>{{ content[category].suggested_tools }}</p>
        </div>
      </div>
      
      <div v-else class="no-content">
        <p>Complete the questionnaire to see personalized coaching content.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { getCategoryColor } from '../data/vespaColors.js'

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

const categories = ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude']
</script>

<style scoped>
.coaching-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  background: #f9f9f9;
  border-radius: 12px;
}

.category-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-section h3 {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.content-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.statement p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

.questions,
.tools {
  margin-top: 12px;
}

.questions h4,
.tools h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #555;
}

.questions ul {
  margin: 0;
  padding-left: 20px;
}

.questions li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #666;
}

.tools p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #666;
  font-style: italic;
}

.no-content {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}

@media (max-width: 768px) {
  .coaching-content {
    padding: 15px;
    gap: 20px;
  }
  
  .category-section {
    padding: 16px;
  }
  
  .category-section h3 {
    font-size: 20px;
  }
}

@media print {
  .coaching-content {
    break-inside: avoid;
    background: white;
  }
  
  .category-section {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
  }
}
</style>

