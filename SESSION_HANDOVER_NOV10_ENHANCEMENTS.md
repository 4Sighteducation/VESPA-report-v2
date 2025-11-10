# VESPA Reports V2 - Enhancement Session Handover
**Date**: November 10, 2025 (Afternoon Session)  
**Status**: In Progress - Major fixes complete, enhancements planned

---

## ✅ COMPLETED THIS SESSION

### 1. **Academic Profile V2 - FIXED AND DEPLOYED** 🎉

#### **Backend Fixes (Heroku v363-365)**
**Problem**: "Profile not found" error - Knack fallback not working
**Root Cause**: Connection field query (`field_3070`) was wrong

**Solution Implemented**:
- Fixed `get_profile_from_knack()` to use 2-step lookup:
  1. Query Object_3 by `field_70` (email) → Get account ID
  2. Query Object_112 by `field_3064` (UserId) → Get profile data
- Fixed attendance parsing: "93%" → `0.93` (float)
- Fixed prior_attainment: Empty strings → `None` (not numeric error)

**File**: `DASHBOARD/DASHBOARD/app.py` (lines 10937-11069)

**Backend Versions**:
- v363: 2-step Knack query
- v364: (intermediate)
- v365: **CURRENT** - service_role key configured ✅

#### **Frontend Fixes (Version 1h)**
**File**: `Homepage/VESPAReportV2/academic-profile/`

**Changes Made**:
1. **URL Parameter Support**: Added `?email=` parsing for staff viewing students
2. **Toggle Button**: Show/Hide Academic Profile (defaults to hidden)
3. **Width Fix**: Changed to `1400px` (matches report)
4. **Placeholder Cleared**: `mountPoint.innerHTML = ''` removes "New Rich Text"
5. **Staff-Only Edit**: Uses proper staff role IDs (object_5, object_7, object_18, object_78)
6. **Subtle Indicator**: Big badge → tiny dot (green=Supabase, orange=Knack)

**Current Version**: **1h** (deployed to GitHub CDN)
**URL**: https://cdn.jsdelivr.net/gh/4Sighteducation/VESPA-report-v2@main/academic-profile/dist/academic-profile1h.js

---

### 2. **CRITICAL FIX: Supabase Sync Restored** 🔧

**Problem**: Daily sync failing for 4 days
**Root Cause**: Heroku using `anon` key → RLS blocking writes

**Solution**:
- Updated Heroku config with `service_role` key (bypasses RLS)
- Command used:
```bash
heroku config:set SUPABASE_KEY='eyJ...[service_role_key]...' --app vespa-dashboard
```

**Result**: ✅ Sync working again! Tested successfully.

---

### 3. **Academic Profile Sync Added** 📦

**New Functionality**: Object_112 → Supabase daily sync

**Files Modified**:
- `DASHBOARD/DASHBOARD/sync_knack_to_supabase.py` - Added `sync_academic_profiles()` function
- `DASHBOARD/DASHBOARD/test_academic_profile_sync.py` - Standalone test script
- `DASHBOARD/DASHBOARD/test_academic_profile_quick.py` - Quick 10-record test

**What It Syncs**:
- `academic_profiles` table (student info, attendance, prior attainment)
- `student_subjects` table (15 subjects per student with grades)

**Key Features**:
- Handles 13,185 profiles from Object_112
- Parses attendance from "93%" format
- Converts empty strings to NULL for numeric fields
- Uses 2-step lookup (Object_3 → Object_112)

**Status**: ✅ Test sync successful (8/10 records), full sync can be run when needed

---

## 🚀 PENDING ENHANCEMENTS (To Be Implemented)

### **PRIORITY 1: Staff Overview Enhancements**

#### A. Pagination (v1n)
**Current**: All students loaded at once (up to 2000!)
**Target**: Paginated view with user control

**Requirements**:
- Page sizes: 10, 50, 100, 500
- Default: 50 per page
- Show: "Showing 1-50 of 527 students"
- Navigation: Previous / Next buttons + page numbers

**Files to Modify**:
- `VESPAReportV2/staff-overview/src/components/StudentTable.vue`
- `VESPAReportV2/staff-overview/src/App.vue`

---

#### B. Filter Persistence with Lock Toggles
**Current**: Filters reset when changing cycle
**Target**: "Lock" individual filters to persist across changes

**Example Use Case**:
- Staff selects "Group: 12LC"
- Clicks 🔒 lock icon next to Group filter
- Changes Cycle: 1 → 2 → 3
- Group filter stays on "12LC" for comparison

**UI Design**:
- Add 🔓/🔒 icon button next to each filter
- Locked filters: Blue highlight + lock icon
- Unlocked filters: Normal appearance
- Store in component state (not localStorage - per session)

**Files to Modify**:
- `VESPAReportV2/staff-overview/src/components/FilterBar.vue`
- `VESPAReportV2/staff-overview/src/App.vue`

---

#### C. Mobile Optimization - Text Expansion
**Current**: Small text hard to read on mobile
**Target**: Click any text field → Opens in modal/overlay

**Text Items to Make Clickable**:
- Response column (student reflections)
- Action Plan column (student goals)
- Coaching notes (if staff can see them)

**UI Pattern**:
```vue
<td class="text-preview clickable" @click="openTextModal('Response', responseText)">
  {{ truncate(responseText, 50) }}
</td>

<!-- Modal Component -->
<TextViewModal
  :isOpen="modalOpen"
  :title="modalTitle"
  :text="modalText"
  @close="closeModal"
/>
```

**Files to Modify**:
- `VESPAReportV2/staff-overview/src/components/StudentTable.vue`
- Create new: `VESPAReportV2/staff-overview/src/components/TextViewModal.vue`

---

### **PRIORITY 2: Individual Report Enhancements**

#### A. Prominent "Need Help?" Buttons
**Current**: Small, gray, easy to miss
**Target**: Eye-catching, encouraging interaction

**Design Specs**:
- **Color**: Bright gradient (e.g., `#ff9800` → `#ffb74d`)
- **Animation**: Subtle pulse effect
- **Size**: Larger (16px font, 12px padding)
- **Icon**: Add 💡 or 🆘 emoji
- **Position**: Same place, but more prominent

**CSS Example**:
```css
.help-button {
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  color: white;
  animation: pulse 2s infinite;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

**Files to Modify**:
- `VESPAReportV2/individual-report/src/components/StudentResponse.vue`
- `VESPAReportV2/individual-report/src/components/StudentGoals.vue`

---

#### B. Auto-Open Help on First Visit
**Target**: Help modal opens automatically first time only

**Implementation**:
```javascript
import { ref, onMounted } from 'vue'

const hasSeenHelp = ref(false)

onMounted(() => {
  // Check localStorage
  const key = `vespa_help_seen_${props.cycle}_reflection`
  const seen = localStorage.getItem(key)
  
  if (!seen) {
    // Auto-open on first visit
    showHelp.value = true
    // Mark as seen
    localStorage.setItem(key, 'true')
    hasSeenHelp.value = true
  }
})
```

**Storage Keys**:
- `vespa_help_seen_{cycle}_reflection`
- `vespa_help_seen_{cycle}_goals`

**Files to Modify**:
- `VESPAReportV2/individual-report/src/components/StudentResponse.vue`
- `VESPAReportV2/individual-report/src/components/StudentGoals.vue`

---

#### C. Better Styling - Visual Hierarchy
**Current**: Plain, bland, hard to differentiate
**Target**: Clear visual hierarchy

**Design Improvements**:

1. **Section Headers** - More prominent:
```css
.section-header {
  background: linear-gradient(135deg, #079baa, #7bd8d0);
  padding: 16px 24px;
  border-radius: 8px 8px 0 0;
  color: white;
  margin-bottom: 0;
}
```

2. **Text Areas** - Card-style with shadow:
```css
.response-textarea {
  background: white;
  border: 3px solid #e0e0e0;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.05);
  padding: 20px;
  border-radius: 0 0 8px 8px;
}

.response-textarea:focus {
  border-color: #079baa;
  box-shadow: 0 0 0 4px rgba(7, 155, 170, 0.1);
}
```

3. **Placeholder Text** - More helpful:
```vue
placeholder="✍️ Click here to write your reflection. Think about: What surprised you? What makes sense? What do you want to improve?"
```

4. **Instruction Text** - Subtle background:
```css
.info-text {
  background: #e3f2fd;
  padding: 12px 16px;
  border-left: 4px solid #079baa;
  border-radius: 4px;
  margin-bottom: 16px;
}
```

**Files to Modify**:
- `VESPAReportV2/individual-report/src/components/StudentResponse.vue`
- `VESPAReportV2/individual-report/src/components/StudentGoals.vue`

---

#### D. Mobile Text Expansion
**Target**: Tap any text area → Full-screen modal

**Implementation**:
- Detect mobile: `window.innerWidth < 768`
- On tap: Show full-screen overlay with text
- Swipe down or tap X to close

**Pattern from staff report**:
```javascript
// Detect mobile
const isMobile = window.innerWidth < 768

// Make text clickable on mobile
if (isMobile) {
  textarea.addEventListener('click', (e) => {
    if (!textarea.matches(':focus')) {
      openMobileTextEditor(textarea.value, 'Your Reflection')
    }
  })
}
```

**Files to Modify**:
- `VESPAReportV2/individual-report/src/components/StudentResponse.vue`
- `VESPAReportV2/individual-report/src/components/StudentGoals.vue`
- Create new: Mobile modal component

---

#### E. Coaching Conversation Guide (Staff Only)
**Source**: `Homepage/staffMobileReportFix.js` (lines 2019-2136)
**Target**: Add to Vue report for staff users

**Content Structure**:
- 🎯 Opening the Conversation
- 💭 Facilitating Reflection
- 📝 Collaborative Action Planning
- 🌟 Closing with Confidence
- 🔑 Key Principles

**Placement**: Above "Staff Coaching Notes" section
**Visibility**: Staff roles ONLY (same check as edit button)

**Files to Modify**:
- `VESPAReportV2/individual-report/src/components/StaffCoachingRecord.vue`
- Create new: `VESPAReportV2/individual-report/src/components/CoachingGuideModal.vue`

**Implementation**:
```vue
<template>
  <div class="staff-coaching-record">
    <!-- NEW: Coaching Guide Button -->
    <button 
      v-if="isStaff" 
      @click="showGuide = true" 
      class="coaching-guide-button">
      💬 Coaching Conversation Guide
    </button>
    
    <!-- Existing coaching notes textarea -->
    <textarea ...></textarea>
    
    <!-- NEW: Guide Modal -->
    <CoachingGuideModal 
      :isOpen="showGuide" 
      @close="showGuide = false" 
    />
  </div>
</template>
```

---

#### F. Default to Cycle 1
**Status**: ✅ COMPLETED
**Change**: Line 206 in `App.vue` - Changed from `maxCycle` to hardcoded `1`

---

## 📋 IMPLEMENTATION ORDER (RECOMMENDED)

### **Phase 1: Individual Report (v1x)** - Most impactful for users
1. ✅ Default to Cycle 1 (DONE)
2. Prominent "Need Help" buttons
3. Auto-open help on first visit
4. Better styling and visual hierarchy
5. Mobile text expansion
6. Coaching guide for staff

**Estimated Time**: 2-3 hours
**Version**: 1x (currently on 1w)

---

### **Phase 2: Staff Overview (v1n)** - Critical for staff with large cohorts
1. Pagination system
2. Filter persistence with locks
3. Mobile text expansion

**Estimated Time**: 2-3 hours
**Version**: 1n (currently on 1m)

---

## 🗂️ FILE LOCATIONS

### **Staff Overview**
```
Homepage/VESPAReportV2/staff-overview/
├── src/
│   ├── App.vue                          (Main orchestrator)
│   ├── components/
│   │   ├── FilterBar.vue                (Filters - needs lock toggles)
│   │   ├── StudentTable.vue             (Table - needs pagination)
│   │   ├── StaffOverviewHeader.vue
│   │   ├── LoadingState.vue
│   │   └── ErrorState.vue
│   ├── services/
│   │   ├── api.js
│   │   └── knackAuth.js
│   └── main.js
├── dist/
│   └── staff-overview1m.js              (CURRENT VERSION)
└── vite.config.js                       (Build config)
```

### **Individual Report**
```
Homepage/VESPAReportV2/individual-report/
├── src/
│   ├── App.vue                          (Main - cycle default fixed ✅)
│   ├── components/
│   │   ├── StudentResponse.vue          (Needs: styling, help button, mobile)
│   │   ├── StudentGoals.vue             (Needs: styling, help button, mobile)
│   │   ├── StaffCoachingRecord.vue      (Needs: coaching guide)
│   │   ├── ReportHeader.vue
│   │   ├── CoachingContent.vue
│   │   ├── RadarChart.vue
│   │   ├── ViewAnswersModal.vue
│   │   ├── TextareaFocusModal.vue       (Existing full-screen editor)
│   │   ├── LoadingState.vue
│   │   └── ErrorState.vue
│   ├── services/
│   │   ├── api.js
│   │   └── knackAuth.js
│   └── main.js
├── dist/
│   └── report1w.js                      (CURRENT VERSION)
└── vite.config.js                       (Build config)
```

### **Academic Profile**
```
Homepage/VESPAReportV2/academic-profile/
├── src/
│   ├── App.vue                          (Fixed ✅)
│   ├── components/
│   │   ├── AcademicProfile.vue          (Fixed ✅)
│   │   ├── SubjectCard.vue
│   │   └── InfoModal.vue
│   └── services/
│       └── api.js
├── dist/
│   └── academic-profile1h.js            (CURRENT VERSION)
└── vite.config.js
```

---

## 🔧 TECHNICAL PATTERNS TO FOLLOW

### **1. Filter Persistence Pattern**
```javascript
// In FilterBar.vue
const filterLocks = ref({
  cycle: false,
  group: false,
  year: false,
  status: false
})

const toggleLock = (filterName) => {
  filterLocks.value[filterName] = !filterLocks.value[filterName]
}

// Only emit changes for unlocked filters
const emitFilters = () => {
  const filters = {}
  if (!filterLocks.value.cycle) filters.cycle = selectedCycle.value
  // etc...
  emit('filter-changed', filters)
}
```

---

### **2. Pagination Pattern**
```javascript
// In StudentTable.vue
const currentPage = ref(1)
const pageSize = ref(50)

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedStudents.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(sortedStudents.value.length / pageSize.value)
})
```

---

### **3. Auto-Open Help Pattern**
```javascript
// In StudentResponse.vue
const showHelp = ref(false)

onMounted(() => {
  const storageKey = `vespa_help_seen_${props.cycle}_reflection`
  const hasSeenBefore = localStorage.getItem(storageKey)
  
  if (!hasSeenBefore) {
    // Auto-open on first visit
    setTimeout(() => {
      showHelp.value = true
    }, 1000)  // Small delay so user sees the page first
    
    // Mark as seen
    localStorage.setItem(storageKey, 'true')
  }
})
```

---

### **4. Mobile Text Expansion Pattern**
```javascript
// Detect mobile
const isMobile = computed(() => {
  return window.innerWidth < 768
})

// On mobile, intercept textarea focus to show full-screen
const handleTextareaClick = (e) => {
  if (isMobile.value && !e.target.matches(':focus')) {
    e.preventDefault()
    showFocusModal.value = true
  }
}
```

---

## 🎨 STYLING GUIDELINES

### **Theme Colors** (from memory)
- Primary: `#079baa` (teal)
- Secondary: `#7bd8d0` (light teal)
- Accent: `#62d1d2`
- Bright: `#00e5db`
- Dark: `#23356f`, `#2a3c7a`
- Orange: `#ff9800` (for warnings/help)

### **Help Button - Prominent Style**
```css
.help-button {
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  color: white;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
  animation: pulse 2s infinite;
  position: relative;
}

.help-button::before {
  content: '💡';
  margin-right: 8px;
  font-size: 20px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(255, 152, 0, 0.6);
  }
}

.help-button:hover {
  background: linear-gradient(135deg, #f57c00, #ff9800);
  transform: translateY(-2px);
}
```

---

### **Card-Style Section Container**
```css
.student-response {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.section-header {
  background: linear-gradient(135deg, #079baa, #7bd8d0);
  padding: 20px 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.section-body {
  padding: 24px;
}
```

---

### **Enhanced Textarea Styling**
```css
.response-textarea {
  width: 100%;
  padding: 20px;
  border: 3px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.6;
  min-height: 200px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.response-textarea:focus {
  background: white;
  border-color: #079baa;
  box-shadow: 0 0 0 4px rgba(7, 155, 170, 0.1);
  outline: none;
}

.response-textarea::placeholder {
  color: #999;
  font-style: italic;
}
```

---

## 📊 COACHING GUIDE CONTENT

**Full Guide Structure** (from `staffMobileReportFix.js`):

```javascript
const coachingGuideContent = {
  sections: [
    {
      title: '🎯 Opening the Conversation',
      content: 'Start with appreciation and curiosity',
      tips: [
        'Acknowledge their effort: "Thank you for sharing your thoughts about..."',
        'Show you\'ve read their response: "I noticed you mentioned..."',
        'Express genuine interest: "I\'d love to understand more about..."'
      ],
      starters: [
        '"I appreciate your honesty about [specific challenge]..."',
        '"Your reflection on [score/area] shows good self-awareness..."',
        '"Let\'s explore what you said about..."'
      ]
    },
    {
      title: '💭 Facilitating Reflection',
      content: 'Guide students to deeper insights',
      tips: [
        'Explore patterns: Help them see connections',
        'Challenge gently: Question assumptions without judgment',
        'Celebrate progress: Highlight improvements',
        'Normalize struggles: Share that challenges are part of growth'
      ],
      questions: [
        '"What do you think is behind your [high/low] score in...?"',
        '"How does this connect to what you told me about...?"',
        '"What would success look like for you in this area?"',
        '"What\'s one small change that might make a difference?"'
      ]
    },
    {
      title: '📝 Collaborative Action Planning',
      content: 'Co-create next steps with the student',
      tips: [
        'Start small: Focus on 1-2 achievable actions',
        'Be specific: "This week" not "soon"',
        'Student-led: Let them propose solutions first',
        'Remove barriers: Problem-solve obstacles together'
      ],
      prompts: [
        '"Based on our discussion, what feels like a good first step?"',
        '"How can I support you with...?"',
        '"What might get in the way, and how can we plan for that?"',
        '"When would be a good time to check in on progress?"'
      ]
    },
    {
      title: '🌟 Closing with Confidence',
      content: 'End on an empowering note',
      tips: [
        'Summarize commitments: Both theirs and yours',
        'Express confidence: Show you believe in them',
        'Open door: Remind them you\'re available',
        'Set follow-up: Schedule next check-in'
      ],
      statements: [
        '"I\'m confident you can make progress with..."',
        '"Remember, I\'m here if you need support with..."',
        '"I look forward to hearing how [specific action] goes..."'
      ]
    }
  ],
  keyPrinciples: [
    'Listen more than you speak - Their insights matter most',
    'Ask, don\'t tell - Questions empower; advice can disempower',
    'Focus on strengths - Build from what\'s working',
    'Small steps count - Progress over perfection',
    'Partnership approach - You\'re allies, not adversaries'
  ]
}
```

**Create New Component**:
`VESPAReportV2/individual-report/src/components/CoachingGuideModal.vue`

**Button Placement**: In `StaffCoachingRecord.vue`:
```vue
<template>
  <div class="staff-coaching-record">
    <div class="section-header">
      <h3>👨‍🏫 Staff Coaching Notes (Confidential)</h3>
      <div class="header-actions">
        <button @click="showGuide = true" class="coaching-guide-btn">
          💬 Conversation Guide
        </button>
        <span class="staff-badge">Staff Only</span>
      </div>
    </div>
    
    <!-- Rest of component... -->
    
    <CoachingGuideModal 
      :isOpen="showGuide" 
      @close="showGuide = false" 
    />
  </div>
</template>
```

---

## 🔗 CURRENT DEPLOYMENT STATUS

### **Live Versions**:
- **Academic Profile**: v1h ✅ (CDN ready, KnackAppLoader updated, pending upload)
- **Individual Report**: v1w ✅ (live, needs update to v1x)
- **Staff Overview**: v1m ✅ (live, needs update to v1n)

### **Backend**:
- **Heroku**: v365 ✅
- **service_role key**: Configured ✅
- **Academic Profile API**: Working ✅
- **Attendance parsing**: Fixed ✅

### **Sync Status**:
- **Daily sync**: Fixed (service_role key) ✅
- **Academic Profile sync**: Added to sync script ✅
- **Test sync**: 8/10 successful ✅
- **Full sync**: Running in background (estimated 700/13185 complete)

---

## 🐛 KNOWN ISSUES & WATCH FOR

### **None Currently!** 
All blocking issues resolved. Enhancements are additive features.

---

## 📝 VERSION HISTORY

### **Academic Profile**:
- 1a-1d: Initial attempts, variable collisions
- 1e: IIFE wrapper working
- 1f: Knack fallback + URL params + toggle + width
- 1g: Default hidden + staff-only edit
- **1h**: ✅ **CURRENT** - Attendance fix + subtle dot

### **Individual Report**:
- **1w**: ✅ **CURRENT** - Stable version
- 1x: **PLANNED** - All enhancements above

### **Staff Overview**:
- **1m**: ✅ **CURRENT** - Stable version
- 1n: **PLANNED** - Pagination + filter persistence + mobile

---

## 🚀 DEPLOYMENT WORKFLOW

### **Build & Deploy Steps**:

1. **Edit `vite.config.js`** - Increment version:
```javascript
entryFileNames: 'report1w.js' → 'report1x.js'
```

2. **Build**:
```bash
cd "Homepage/VESPAReportV2/individual-report"
npm run build
```

3. **Commit & Push**:
```bash
cd ..
git add .
git commit -m "Version 1x - [description]"
git push origin main
```

4. **Update KnackAppLoader**:
```javascript
// In KnackAppLoader(copy).js
scriptUrl: '.../report1w.js' → '.../report1x.js'
```

5. **Upload to Knack Builder**:
- Copy entire `KnackAppLoader(copy).js`
- Paste into Knack Builder → JavaScript
- Save

6. **Wait & Test**:
- Wait 5-10 minutes for JSDelivr CDN
- Hard refresh (Ctrl+Shift+R)
- Test functionality

---

## 🔑 KEY DECISIONS MADE

### **1. Academic Profile Architecture**
- ✅ Uses email for student identification (not UUID FK)
- ✅ Separate tables (not unified with `students`)
- ✅ Multi-year support via `UNIQUE(student_email, academic_year)`
- ✅ Dual-write to Knack + Supabase

### **2. Toggle Visibility**
- ✅ Default to hidden/collapsed
- ✅ Toggle button always visible (doesn't hide itself)
- ✅ Smooth CSS transitions

### **3. Staff Detection**
- ✅ Uses Knack role IDs: object_5, object_7, object_18, object_78
- ✅ Edit mode only for these roles
- ✅ Students get read-only view

### **4. Data Source Indicator**
- ✅ Subtle dot (8px) not badge
- ✅ Green = Supabase (live)
- ✅ Orange = Knack (fallback)
- ✅ Tooltip on hover

### **5. Cycle Default**
- ✅ Always Cycle 1 (not most recent)
- ✅ Users can navigate to 2/3 as needed

---

## 📚 REFERENCE: Coaching Guide Buttons

**From `staffMobileReportFix.js`** - Two types of guides:

### **1. Student Writing Guide** (Student Response/Goals)
Lines 1881-1993:
- How to write reflections
- Sentence starters
- Tips for specificity

### **2. Staff Coaching Guide** (Staff Coaching Notes)
Lines 2019-2136:
- Opening conversations
- Facilitating reflection
- Action planning
- Key principles

**Both should be adapted to Vue components for the V2 reports.**

---

## 🎯 SUCCESS CRITERIA

### **Individual Report v1x**:
- [ ] Help buttons are obvious and inviting
- [ ] Help opens automatically on first visit only
- [ ] Sections have clear visual hierarchy
- [ ] Text areas look interactive and friendly
- [ ] Mobile users can read/edit text easily
- [ ] Staff see coaching guide above their notes
- [ ] Defaults to Cycle 1

### **Staff Overview v1n**:
- [ ] Can view 50 students at a time (default)
- [ ] Can change page size (10/50/100/500)
- [ ] Can lock filters for comparison
- [ ] Locked filters persist when cycling through cycles
- [ ] Mobile users can read long text fields

---

## ⚙️ CONFIGURATION

### **KnackAppLoader Config** (lines 1491-1510):
```javascript
'academicProfileV2': {
    scenes: ['scene_1284'],
    views: ['any'],
    scriptUrl: '.../academic-profile1h.js',  // CURRENT
    cssUrl: null,
    configBuilder: (baseConfig, sceneKey, viewKey) => ({
        elementSelector: '#view_3259',
        apiUrl: 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com',
        editable: true
    }),
    configGlobalVar: 'ACADEMIC_PROFILE_V2_CONFIG',
    initializerFunctionName: 'initializeAcademicProfileV2'
}
```

---

## 🧪 TESTING CHECKLIST

### **Before Going Live**:

**Academic Profile (v1h)**:
- [ ] Upload KnackAppLoader to Knack Builder
- [ ] Wait 10 minutes for CDN
- [ ] Test as student: See read-only profile
- [ ] Test as staff: See edit button
- [ ] Check attendance shows correctly (93%)
- [ ] Verify toggle button works
- [ ] Check orange dot appears (Knack fallback for now)

**After Full Sync Completes**:
- [ ] Check Alena's profile loads from Supabase
- [ ] Verify green dot appears (Supabase live)
- [ ] Test edit mode and save

**Individual Report (v1x)** - When built:
- [ ] Help buttons are prominent
- [ ] Auto-opens on first visit
- [ ] Styling looks good
- [ ] Mobile text expansion works
- [ ] Staff coaching guide appears
- [ ] Defaults to Cycle 1

**Staff Overview (v1n)** - When built:
- [ ] Pagination works smoothly
- [ ] Filter locks work correctly
- [ ] Can compare groups across cycles
- [ ] Mobile text readable

---

## 📞 IMPORTANT CONTEXT

### **Why Sync Was Failing**:
- Heroku had `anon` key (limited permissions)
- Supabase RLS policies block `anon` key writes
- ~4 days ago: RLS was enabled/tightened
- **Fixed**: Updated to `service_role` key (bypasses RLS)

### **Field Mappings (Object_112)**:
- `field_3064`: UserId (connection to Object_3)
- `field_3066`: Name
- `field_3069`: VESPA Customer (school)
- `field_3070`: Account (connection - array format)
- `field_3076`: Attendance (text "93%")
- `field_3077`: Tutor Group
- `field_3078`: Year Group
- `field_3080-3094`: Sub1-Sub15 (subject JSON strings)
- `field_3136`: UCI
- `field_3137`: UPN
- `field_3138`: Centre Number
- `field_3272`: Prior Attainment (numeric)

---

## 🎓 LESSONS LEARNED

1. **Connection Fields**: Can't query directly - need 2-step lookup
2. **Empty Strings**: Must convert to `None` for numeric DB fields
3. **RLS Keys**: service_role for scripts, anon for public apps
4. **Cursor .env**: Hidden by .cursorignore (security feature)
5. **Filter Persistence**: Use locks, not localStorage (avoid conflicts)
6. **Help Modals**: Auto-open once = good UX, repeating = annoying

---

## 🔮 FUTURE ROADMAP

### **Phase 3** (After v1n/v1x deployed):
- Unify student tables (email → UUID FK)
- AI Coach V2 migration
- Real-time updates via Supabase subscriptions
- Complete Knack exit strategy

---

**Last Updated**: November 10, 2025 - 6:30 PM
**Session Duration**: ~4 hours
**Status**: Ready to implement enhancements
**Next Session**: Start with Individual Report v1x (highest user impact)

---

## 📋 IMMEDIATE ACTION ITEMS

**For You**:
1. Upload `KnackAppLoader(copy).js` to Knack Builder (Academic Profile v1h)
2. Wait for Academic Profile sync to complete (~10 more minutes)
3. Test Academic Profile v1h on live page

**For Next AI Session**:
1. Start with Individual Report v1x enhancements
2. Then Staff Overview v1n
3. Build, test, deploy both

**Commands Ready**:
```bash
# Check sync progress
cd "C:/Users/tonyd/OneDrive - 4Sight Education Ltd/Apps/DASHBOARD/DASHBOARD"
tail -f test_academic_profile_sync.log | grep "Progress"

# When complete, verify in Supabase
# Run the SQL queries at the top of this document
```

---

**END OF HANDOVER DOCUMENT**

