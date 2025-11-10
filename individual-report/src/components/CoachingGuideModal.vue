<template>
  <div v-if="isOpen" class="coaching-guide-overlay" @click="handleClose">
    <div class="coaching-guide-content" @click.stop>
      <div class="coaching-guide-header">
        <h2>💬 Coaching Conversation Guide</h2>
        <button class="close-button" @click="handleClose" aria-label="Close">&times;</button>
      </div>
      
      <div class="coaching-guide-body">
        <div class="guide-intro">
          <p>Effective coaching conversations build trust, encourage reflection, and empower students to take ownership of their learning journey.</p>
        </div>
        
        <div class="guide-section">
          <h3>🎯 Opening the Conversation</h3>
          <p>Start with appreciation and curiosity:</p>
          <ul>
            <li><strong>Acknowledge their effort:</strong> "Thank you for sharing your thoughts about..."</li>
            <li><strong>Show you've read their response:</strong> "I noticed you mentioned..."</li>
            <li><strong>Express genuine interest:</strong> "I'd love to understand more about..."</li>
          </ul>
          
          <div class="conversation-starters">
            <h4>Opening phrases:</h4>
            <p class="starter">"I appreciate your honesty about [specific challenge]..."</p>
            <p class="starter">"Your reflection on [score/area] shows good self-awareness..."</p>
            <p class="starter">"Let's explore what you said about..."</p>
          </div>
        </div>
        
        <div class="guide-section">
          <h3>💭 Facilitating Reflection</h3>
          <p>Guide students to deeper insights:</p>
          <ul>
            <li><strong>Explore patterns:</strong> Help them see connections across themes</li>
            <li><strong>Challenge gently:</strong> Question assumptions without judgment</li>
            <li><strong>Celebrate progress:</strong> Highlight improvements, however small</li>
            <li><strong>Normalize struggles:</strong> Share that challenges are part of growth</li>
          </ul>
          
          <div class="conversation-starters">
            <h4>Reflective questions:</h4>
            <p class="starter">"What do you think is behind your [high/low] score in...?"</p>
            <p class="starter">"How does this connect to what you told me about...?"</p>
            <p class="starter">"What would success look like for you in this area?"</p>
            <p class="starter">"What's one small change that might make a difference?"</p>
          </div>
        </div>
        
        <div class="guide-section">
          <h3>📝 Collaborative Action Planning</h3>
          <p>Co-create next steps with the student:</p>
          <ul>
            <li><strong>Start small:</strong> Focus on 1-2 achievable actions</li>
            <li><strong>Be specific:</strong> "This week" not "soon"</li>
            <li><strong>Student-led:</strong> Let them propose solutions first</li>
            <li><strong>Remove barriers:</strong> Problem-solve obstacles together</li>
          </ul>
          
          <div class="conversation-starters">
            <h4>Action-focused prompts:</h4>
            <p class="starter">"Based on our discussion, what feels like a good first step?"</p>
            <p class="starter">"How can I support you with...?"</p>
            <p class="starter">"What might get in the way, and how can we plan for that?"</p>
            <p class="starter">"When would be a good time to check in on progress?"</p>
          </div>
        </div>
        
        <div class="guide-section">
          <h3>🌟 Closing with Confidence</h3>
          <p>End on an empowering note:</p>
          <ul>
            <li><strong>Summarize commitments:</strong> Both theirs and yours</li>
            <li><strong>Express confidence:</strong> Show you believe in them</li>
            <li><strong>Open door:</strong> Remind them you're available</li>
            <li><strong>Set follow-up:</strong> Schedule next check-in</li>
          </ul>
          
          <div class="conversation-starters">
            <h4>Closing statements:</h4>
            <p class="starter">"I'm confident you can make progress with..."</p>
            <p class="starter">"Remember, I'm here if you need support with..."</p>
            <p class="starter">"I look forward to hearing how [specific action] goes..."</p>
          </div>
        </div>
        
        <div class="key-principles">
          <h4>🔑 Key Principles</h4>
          <ul>
            <li><strong>Listen more than you speak</strong> - Their insights matter most</li>
            <li><strong>Ask, don't tell</strong> - Questions empower; advice can disempower</li>
            <li><strong>Focus on strengths</strong> - Build from what's working</li>
            <li><strong>Small steps count</strong> - Progress over perfection</li>
            <li><strong>Partnership approach</strong> - You're allies, not adversaries</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.coaching-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.coaching-guide-content {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.coaching-guide-header {
  padding: 24px 30px;
  background: linear-gradient(135deg, #079baa, #7bd8d0);
  color: white;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.coaching-guide-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.close-button {
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

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.coaching-guide-body {
  padding: 30px;
  color: #333;
}

.guide-intro {
  background: #e8f4f8;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border-left: 4px solid #079baa;
}

.guide-intro p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #1a4d4d;
  font-weight: 500;
}

.guide-section {
  margin-bottom: 32px;
}

.guide-section h3 {
  color: #079baa;
  margin: 0 0 12px 0;
  font-size: 22px;
  font-weight: 700;
}

.guide-section > p {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #555;
  line-height: 1.6;
}

.guide-section ul {
  margin: 0 0 20px 0;
  padding-left: 24px;
}

.guide-section li {
  margin-bottom: 12px;
  line-height: 1.7;
  color: #666;
}

.conversation-starters {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.conversation-starters h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 700;
  color: #555;
}

.starter {
  margin: 8px 0;
  padding: 10px 14px;
  background: white;
  border-left: 3px solid #079baa;
  border-radius: 4px;
  font-style: italic;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.key-principles {
  background: #fff9e6;
  border: 1px solid #ffd700;
  padding: 20px;
  margin-top: 32px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.key-principles h4 {
  color: #856404;
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
}

.key-principles ul {
  margin: 0;
  padding-left: 24px;
}

.key-principles li {
  color: #704000;
  margin-bottom: 10px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .coaching-guide-overlay {
    padding: 0;
  }
  
  .coaching-guide-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .coaching-guide-header {
    border-radius: 0;
    padding: 20px;
  }
  
  .coaching-guide-header h2 {
    font-size: 20px;
  }
  
  .coaching-guide-body {
    padding: 20px;
  }
  
  .guide-section h3 {
    font-size: 20px;
  }
}

@media print {
  .coaching-guide-overlay {
    display: none;
  }
}
</style>

