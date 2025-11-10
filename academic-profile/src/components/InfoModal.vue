<template>
  <div class="info-modal-overlay" @click="$emit('close')">
    <div class="info-modal-content" @click.stop>
      <span class="modal-close" @click="$emit('close')">&times;</span>
      
      <h3>Understanding Your Grades</h3>
      
      <!-- Student View -->
      <div v-if="!isStaff">
        <h4>1) Subject Target Grade (STG):</h4>
        <p>
          Your STG is a personalized target that considers your GCSE results AND the specific subject you're studying. 
          Different subjects have different difficulty levels - some tend to award higher grades than others. 
          Your STG accounts for this by applying subject-specific adjustments to give you a realistic and fair target.
        </p>
        <p>
          Your school may have chosen to set these targets at different ambition levels to inspire you to achieve your best. 
          Use your STG as a motivating target to work towards - with dedication and good support, you can exceed it!
        </p>

        <h4>2) Current Grade:</h4>
        <p>
          This is the grade you're working at right now, based on your recent work, tests, and classroom performance. 
          Your teachers assess everything you've done to determine where you currently stand. 
          This helps you see your progress and identify areas to focus on.
        </p>

        <h4>3) Target Grade:</h4>
        <p>
          This is the grade your teachers believe you can realistically achieve with consistent effort. 
          It's challenging but possible, based on your teachers' experience and understanding of your potential. 
          This target gives you something specific to aim for as you continue your studies.
        </p>
      </div>

      <!-- Staff View -->
      <div v-else>
        <h4>1) Subject Target Grade (STG) - Teacher Explainer:</h4>
        <p>
          The STG provides a more nuanced target by applying subject-specific value-added (VA) factors to the base MEG calculation. 
          These VA factors, derived from national data, reflect the relative difficulty and grade distribution patterns of individual subjects.
        </p>
        <p>
          Schools can select different benchmark levels - while many use standard national benchmarks, some may opt for more aspirational targets. 
          The calculation multiplies the student's base expected points by the subject's VA factor, then converts back to a grade.
        </p>
        <p>
          <strong>Most effective target-setting considers:</strong> prior attainment, subject difficulty, individual student needs, teaching quality, and school context.
        </p>

        <h4>2) Current Grade (Teacher Input Required):</h4>
        <p>When entering this grade, assess based on:</p>
        <ul>
          <li>Recent formal and informal assessments</li>
          <li>Quality and consistency of classwork and homework</li>
          <li>Participation and demonstration of subject knowledge</li>
          <li>Your professional judgment of current mastery</li>
        </ul>
        <p>This should reflect genuine current performance, not hoped-for future performance.</p>

        <h4>3) Target Grade (Teacher Input Required):</h4>
        <p>When setting this grade, consider:</p>
        <ul>
          <li>The student's STG as a reference point</li>
          <li>Demonstrated potential and engagement</li>
          <li>Contextual factors affecting performance</li>
          <li>Historical progression patterns</li>
          <li>Department expectations and benchmarks</li>
        </ul>
        <p>The target should be ambitious yet achievable with appropriate effort and support.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isStaff: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])
</script>

<style scoped>
.info-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
}

.info-modal-content {
  background: #1c2b5f;
  color: #ffffff;
  border: 2px solid #00e5db;
  border-radius: 8px;
  padding: 25px;
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 15px;
  font-size: 28px;
  color: #00e5db;
  cursor: pointer;
  font-weight: bold;
  line-height: 1;
}

.modal-close:hover {
  color: #ffffff;
}

.info-modal-content h3 {
  color: #00e5db;
  font-size: 1.5em;
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(0, 229, 219, 0.4);
  padding-bottom: 10px;
}

.info-modal-content h4 {
  color: #00e5db;
  font-size: 1.2em;
  margin-top: 20px;
  margin-bottom: 10px;
}

.info-modal-content p {
  line-height: 1.7;
  margin-bottom: 15px;
}

.info-modal-content ul {
  margin-left: 20px;
  margin-bottom: 15px;
}

.info-modal-content li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.info-modal-content strong {
  color: #00e5db;
}

/* Scrollbar styling */
.info-modal-content::-webkit-scrollbar {
  width: 8px;
}

.info-modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.info-modal-content::-webkit-scrollbar-thumb {
  background: #00e5db;
  border-radius: 4px;
}
</style>

