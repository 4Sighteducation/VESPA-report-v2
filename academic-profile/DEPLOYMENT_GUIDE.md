# 🚀 Academic Profile V2 - Complete Deployment Guide

## ✅ CHECKLIST OVERVIEW

- [ ] Backend deployed to Heroku (v357)
- [ ] Frontend built and pushed to GitHub
- [ ] KnackAppLoader updated
- [ ] Tested on safe Knack pages
- [ ] Ready to expose to users

---

## 📋 STEP-BY-STEP DEPLOYMENT

### STEP 1: Deploy Backend (30 minutes)

#### 1.1 Add Code to app.py

```bash
# Navigate to backend
cd "C:\Users\tonyd\OneDrive - 4Sight Education Ltd\Apps\DASHBOARD\DASHBOARD"

# Open app.py in your editor
```

**Find this section** (around line 150):
```python
CACHE_TTL = {
    'vespa_results': 300,
    'national_data': 3600,
    'filter_options': 600,
    'establishments': 3600,
    'question_mappings': 86400,
    'dashboard_data': 600,
}
```

**Add this line:**
```python
    'academic_profile': 300,  # 5 minutes like vespa_results
```

**Then find** the end of your existing endpoints (around line 2000-2500).

**Copy-paste everything** from `ACADEMIC_PROFILE_BACKEND_CODE.py` there.

#### 1.2 Test Locally (Optional)

```bash
# Install dependencies if needed
pip install flask flask-cors supabase

# Run local server
python app.py

# In another terminal, test health endpoint
curl http://localhost:5000/api/academic-profile/health
```

Expected response:
```json
{
  "success": true,
  "health": {
    "supabaseConnected": true,
    "tablesExist": true,
    "sampleData": {"profileCount": 0}
  }
}
```

#### 1.3 Deploy to Heroku

```bash
# Commit changes
git add app.py
git commit -m "Add Academic Profile V2 endpoints (v357)"

# Push to Heroku
git push heroku main

# Watch deployment
heroku logs --tail --app vespa-dashboard
```

#### 1.4 Verify Deployment

```bash
# Test health endpoint on production
curl https://vespa-dashboard-9a1f84ee5341.herokuapp.com/api/academic-profile/health
```

Should return `"success": true`

---

### STEP 2: Build and Deploy Frontend (20 minutes)

#### 2.1 Initialize Node Project

```bash
# Navigate to frontend folder
cd "C:\Users\tonyd\OneDrive - 4Sight Education Ltd\Apps\Homepage\VESPAReportV2\academic-profile"

# Install dependencies
npm install

# Test dev server (optional)
npm run dev
# Opens at http://localhost:5173
```

#### 2.2 Build for Production

```bash
# Build (creates dist/academic-profile1a.js and academic-profile1a.css)
npm run build

# Check output
ls dist/
# Should see: academic-profile1a.js, academic-profile1a.css
```

#### 2.3 Initialize Git Repo (First Time Only)

```bash
# In the academic-profile folder
git init
git add .
git commit -m "Initial commit - Academic Profile V2"

# Create GitHub repo (via browser or CLI)
# Name: VESPA-academic-profile

# Link and push
git remote add origin https://github.com/4Sighteducation/VESPA-academic-profile.git
git branch -M main
git push -u origin main
```

#### 2.4 Subsequent Deployments

```bash
# After code changes
npm run build
git add .
git commit -m "Version 1a - description of changes"
git push origin main

# Wait 5 minutes for JSDelivr to update
```

---

### STEP 3: Update KnackAppLoader (10 minutes)

#### 3.1 Edit KnackAppLoader(copy).js

Find the `APPS` object (around line 418) and add this entry:

```javascript
'academicProfileV2': {
  scenes: ['scene_43'],  // Start with just student report
  views: ['view_3046'],  // Academic profile view (safe page)
  scriptUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/VESPA-academic-profile@main/dist/academic-profile1a.js',
  cssUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/VESPA-academic-profile@main/dist/academic-profile1a.css',
  configBuilder: (baseConfig, sceneKey, viewKey) => ({
    ...baseConfig,
    appType: 'academicProfileV2',
    sceneKey: sceneKey,
    viewKey: viewKey,
    elementSelector: '#view_3046',  // Or your safe view ID
    apiUrl: 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com',
    editable: true,
    debugMode: true  // Enable for testing
  }),
  configGlobalVar: 'ACADEMIC_PROFILE_V2_CONFIG',
  initializerFunctionName: 'initializeAcademicProfileV2'
},
```

#### 3.2 Commit and Upload

```bash
cd "C:\Users\tonyd\OneDrive - 4Sight Education Ltd\Apps\Homepage"

git add KnackAppLoader(copy).js
git commit -m "Add Academic Profile V2 to loader"
git push

# Copy entire KnackAppLoader(copy).js content
# Paste into Knack Builder → JavaScript section
# Save in Knack
```

---

### STEP 4: Test on Safe Pages (15 minutes)

#### 4.1 Navigate to Safe Test Page

```
Go to: https://vespaacademy.knack.com/vespa-academy#your-safe-page/
```

**What to check:**
- [ ] Vue app loads (no console errors)
- [ ] Profile data appears (or "Profile not available" if no data)
- [ ] Subjects display correctly
- [ ] Grade colors work
- [ ] Info modal opens
- [ ] Data source indicator shows "⚡ Live" or "📦 Fallback"

#### 4.2 Test Staff Edit Mode

**Login as staff user:**
- [ ] "✏️ Edit Grades" button appears
- [ ] Click to enable edit mode
- [ ] Input fields appear for grades
- [ ] Change a grade
- [ ] Click "💾 Save All"
- [ ] Changes persist (reload page and verify)

#### 4.3 Check Browser Console

Look for:
```
[Academic Profile V2] Initializing...
[Academic Profile V2] Config loaded: {...}
[Academic Profile V2] Mounted successfully
[Academic Profile V2] Loading profile for: test@test.com
[Academic Profile V2] Profile loaded: supabase
```

#### 4.4 Check Network Tab

Look for API call:
```
GET https://vespa-dashboard-9a1f84ee5341.herokuapp.com/api/academic-profile/test@test.com
Status: 200 OK
Response: { "success": true, "student": {...}, "subjects": [...] }
```

---

### STEP 5: Create Test Data (If Needed)

If no profiles exist yet, create test data:

#### Option A: Via API (Quick Test)

```bash
curl -X POST https://vespa-dashboard-9a1f84ee5341.herokuapp.com/api/academic-profile/sync \
  -H "Content-Type: application/json" \
  -d '{
    "studentEmail": "test@vespa.academy",
    "studentName": "Test Student",
    "profile": {
      "yearGroup": "Year 12",
      "tutorGroup": "12TEST",
      "attendance": 0.92,
      "school": "VESPA Academy",
      "establishmentId": "your-knack-school-id"
    },
    "subjects": [
      {
        "subjectName": "Mathematics",
        "examType": "A-Level",
        "examBoard": "AQA",
        "currentGrade": "B",
        "targetGrade": "A",
        "minimumExpectedGrade": "C",
        "subjectTargetGrade": "B",
        "position": 1
      },
      {
        "subjectName": "English Literature",
        "examType": "A-Level",
        "examBoard": "AQA",
        "currentGrade": "A",
        "targetGrade": "A*",
        "minimumExpectedGrade": "B",
        "subjectTargetGrade": "A",
        "position": 2
      }
    ],
    "academicYear": "2025/2026"
  }'
```

#### Option B: Via Knack (Realistic Test)

1. Create/update a record in Knack Object_112
2. Fill in sub1 and sub2 fields with JSON:
```json
{
  "subject": "Mathematics",
  "examType": "A-Level",
  "examBoard": "AQA",
  "currentGrade": "B",
  "targetGrade": "A"
}
```
3. The GET endpoint will fallback to Knack and display it

---

### STEP 6: Troubleshooting

#### Issue: "Config not found"

**Check:**
- KnackAppLoader uploaded to Knack Builder?
- Scene/view IDs correct?
- Hard refresh (Ctrl+Shift+R)?

**Fix:**
```javascript
// Add debug logging
console.log('ACADEMIC_PROFILE_V2_CONFIG:', window.ACADEMIC_PROFILE_V2_CONFIG)
```

#### Issue: "Profile not found"

**Check:**
- Backend deployed? (check /health endpoint)
- Supabase has data? (run query: `SELECT * FROM academic_profiles`)
- Knack Object_112 has data? (check in Knack Builder)
- Student email correct?

**Debug:**
```javascript
// Check what email is being used
const user = Knack.getUserAttributes()
console.log('User email:', user.email)
```

#### Issue: CORS Error

**Check:**
- Backend has CORS enabled?
- Request coming from `vespaacademy.knack.com`?

**Fix in app.py:**
```python
# Verify this line exists:
CORS(app, resources={r"/api/*": {"origins": ["https://vespaacademy.knack.com"]}})
```

#### Issue: Styles Not Loading

**Check:**
- CSS file built? (`dist/academic-profile1a.css` exists?)
- JSDelivr URL correct in KnackAppLoader?
- Wait 5-10 minutes for CDN cache

**Temporary Fix:**
```javascript
// Use existing academicProfile.css as fallback
// Already loaded by ReportProfileWorking.js
```

---

### STEP 7: Go Live (When Ready)

#### 7.1 Expand to Real Pages

Update `KnackAppLoader(copy).js`:

```javascript
'academicProfileV2': {
  scenes: ['scene_43', 'scene_1284'],  // Add individual report
  views: ['view_3046', 'view_3250'],   // Multiple views
  ...
}
```

#### 7.2 Enable for Users

The app respects the toggle system:
- Check `field_3646` (Object_3) for student-specific override
- Check `field_3575` (Object_2) for school-wide setting

**From Staff Homepage:**
1. Staff Admin toggles "Academic Profile" ON
2. Updates all student accounts
3. Feature becomes visible

---

## 🔧 MAINTENANCE

### Update Version

When making changes:

1. **Edit `vite.config.js`:**
```javascript
entryFileNames: 'academic-profile1a.js'  →  'academic-profile1b.js'
```

2. **Build and deploy:**
```bash
npm run build
git add .
git commit -m "Version 1b - bug fixes"
git push
```

3. **Update loader:**
```javascript
scriptUrl: '...academic-profile1a.js'  →  '...academic-profile1b.js'
cssUrl: '...academic-profile1a.css'   →  '...academic-profile1b.css'
```

---

## 📊 MONITORING

### Check Logs

**Backend:**
```bash
heroku logs --tail --app vespa-dashboard --source app | grep "Academic Profile"
```

**Frontend:**
```javascript
// Browser console
localStorage.setItem('ACADEMIC_PROFILE_DEBUG', 'true')
// Then reload page
```

### Check Data

**Supabase:**
```sql
-- How many profiles?
SELECT COUNT(*) FROM academic_profiles;

-- Recent profiles
SELECT student_email, academic_year, created_at 
FROM academic_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Profiles with subjects
SELECT 
  ap.student_email,
  COUNT(ss.id) as subject_count
FROM academic_profiles ap
LEFT JOIN student_subjects ss ON ss.profile_id = ap.id
GROUP BY ap.student_email;
```

---

## 🆘 EMERGENCY ROLLBACK

If critical issues arise:

**Quick Disable:**
```javascript
// In KnackAppLoader(copy).js
'academicProfileV2': {
  enabled: false,  // ADD THIS LINE
  scenes: ['scene_43'],
  ...
}
```

Upload to Knack Builder, hard refresh - feature immediately disabled.

**Falls back to:** `ReportProfileWorking.js` (still loaded and working)

---

## 📞 SUPPORT CONTACTS

- Backend API: `https://vespa-dashboard-9a1f84ee5341.herokuapp.com`
- GitHub Repo: `https://github.com/4Sighteducation/VESPA-academic-profile`
- JSDelivr CDN: `https://cdn.jsdelivr.net/gh/4Sighteducation/VESPA-academic-profile@main/dist/`

---

**Current Status:** Ready for deployment
**Estimated Time:** 60-75 minutes total
**Risk Level:** Low (isolated pages, easy rollback)

