# VESPA Academic Profile V2

Vue 3 component for displaying student academic profiles with Supabase integration and Knack backwards compatibility.

## Overview

This component displays:
- ✅ Student academic information (year, tutor group, attendance)
- ✅ Up to 15 subjects with grades (MEG, STG, Current, Target)
- ✅ Optional grades (Effort, Behaviour, Subject Attendance)
- ✅ Staff edit mode (update grades with dual-write to Supabase + Knack)
- ✅ Grade color coding (RAG status vs targets)
- ✅ Responsive design

## Architecture

### Data Flow
```
Student loads page → Vue app initializes
    ↓
GET /api/academic-profile/{email}
    ↓
Backend:
  1. Try Supabase (fast)
  2. Fallback to Knack Object_112 (parse JSON)
  3. Return normalized structure
    ↓
Frontend:
  1. Display profile + subjects
  2. Color-code grades vs targets
  3. Enable edit mode for staff
    ↓
Staff edits grade → PUT /api/academic-profile/subject/{id}
    ↓
Backend:
  1. Update Supabase student_subjects
  2. Update Knack Object_113
  3. Update Knack Object_112 sub{N} JSON
  4. Clear cache
    ↓
Frontend: Reload to show saved changes
```

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **Backend**: Python Flask (existing Dashboard app)
- **Database**: Supabase (primary) + Knack (legacy)
- **Hosting**: GitHub → JSDelivr CDN
- **Deployment**: Heroku (backend)

## Development

```bash
# Install dependencies
npm install

# Run dev server (test locally with backend)
npm run dev

# Build for production
npm run build
```

## Deployment

### Version Pattern
`academic-profile1a.js` → `academic-profile1b.js` → `academic-profile1c.js`

### Steps

1. **Update version in vite.config.js:**
```javascript
entryFileNames: 'academic-profile1a.js'  →  'academic-profile1b.js'
assetFileNames: 'academic-profile1a.css' →  'academic-profile1b.css'
```

2. **Build:**
```bash
npm run build
```

3. **Push to GitHub:**
```bash
git add .
git commit -m "Version 1b - description"
git push origin main
```

4. **Update KnackAppLoader(copy).js:**
```javascript
scriptUrl: '...academic-profile1a.js'  →  '...academic-profile1b.js'
cssUrl: '...academic-profile1a.css'   →  '...academic-profile1b.css'
```

5. **Wait 5 minutes for JSDelivr CDN**

6. **Hard refresh** (Ctrl+Shift+R)

## Configuration

Loaded via `KnackAppLoader(copy).js`:

```javascript
'academicProfileV2': {
  scenes: ['scene_43', 'scene_1284'],
  views: ['view_3041', 'view_3250'],
  scriptUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/VESPA-academic-profile@main/dist/academic-profile1a.js',
  cssUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/VESPA-academic-profile@main/dist/academic-profile1a.css',
  configBuilder: (baseConfig, sceneKey, viewKey) => ({
    ...baseConfig,
    appType: 'academicProfileV2',
    elementSelector: getProfileSelector(sceneKey, viewKey),
    apiUrl: 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com',
    editable: true
  }),
  configGlobalVar: 'ACADEMIC_PROFILE_V2_CONFIG',
  initializerFunctionName: 'initializeAcademicProfileV2'
}
```

## Knack Field Mappings

### Object_112 (User Profile)
- `field_3064`: UserId
- `field_3066`: Name
- `field_3069`: VESPA Customer (school)
- `field_3070`: Account connection
- `field_3076`: Attendance
- `field_3077`: Tutor Group
- `field_3078`: Year Group
- `field_3136`: UCI
- `field_3137`: UPN
- `field_3138`: Centre Number
- `field_3272`: Prior Attainment
- `field_3080-3094`: Sub1-Sub15 (JSON strings)

### Object_113 (Subjects)
- `field_3132`: Current Grade
- `field_3133`: Effort Grade
- `field_3134`: Behaviour Grade
- `field_3135`: Target Grade
- `field_3186`: Subject Attendance

## Supabase Tables

### academic_profiles
- Stores student info (name, year, attendance, etc.)
- One row per student per academic year
- Links to student_subjects via profile_id

### student_subjects
- Stores individual subjects (up to 15 per student)
- Grades: current, target, MEG, STG, effort, behaviour
- Links back to academic_profiles

## Features

### For Students
- View all subjects with color-coded grades
- See MEG/STG explanations
- Understand target vs current performance
- Mobile responsive

### For Staff
- **Edit Mode**: Click "Edit Grades" button
- Update current/target grades
- Update effort/behaviour grades
- Update subject attendance
- **Save All**: Batch update to both systems
- Changes persist immediately

## Multi-Year Support

Students can have profiles for multiple years:
```
john@school.com + 2024/2025 → Profile 1
john@school.com + 2025/2026 → Profile 2 (different subjects/grades)
```

Constraint: `UNIQUE(student_email, academic_year)`

## Australian Schools

Academic year format:
- UK: `2025/2026` (Aug-Aug)
- Australian: `2025/2025` (Calendar year)

Backend automatically determines format based on `is_australian` flag in Object_2.

## Rollback

If issues arise:
```javascript
// In KnackAppLoader(copy).js
'academicProfileV2': {
  enabled: false,  // Quick disable
  ...
}
```

Falls back to existing `ReportProfileWorking.js` system.

## Version History

- **1a**: Initial release with Supabase integration + Knack fallback

## Testing

### Safe Pages (Isolated Testing)
Load on Knack scenes/views that aren't exposed to users yet.

### Health Check
```bash
curl https://vespa-dashboard-9a1f84ee5341.herokuapp.com/api/academic-profile/health
```

### Test Profile
```bash
curl https://vespa-dashboard-9a1f84ee5341.herokuapp.com/api/academic-profile/test@test.com
```

---

**Current Version:** 1a
**Status:** Development
**Backend:** v357+

