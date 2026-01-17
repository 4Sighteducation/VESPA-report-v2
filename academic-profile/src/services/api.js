/**
 * API Service for Academic Profile V2
 * Handles all communication with Flask backend
 */

/**
 * Fetch academic profile for a student
 * @param {string} email - Student email
 * @param {string} apiUrl - Base API URL
 * @param {string} academicYear - Optional academic year filter
 * @returns {Promise<Object>}
 */
export async function fetchAcademicProfile(email, apiUrl, academicYear = null) {
  try {
    console.log('[Academic Profile API] Fetching profile for:', email)

    // Helper: coerce json-ish values into clean strings for UI safety
    const coerceText = (v) => {
      if (v === null || v === undefined) return null
      if (Array.isArray(v)) return v.length ? coerceText(v[0]) : null
      if (typeof v === 'object') {
        for (const k of ['identifier', 'name', 'text', 'label', 'value']) {
          if (v && v[k]) return String(v[k]).trim()
        }
        return null
      }
      return String(v).trim()
    }
    
    // Build URL with query parameters
    let url = `${apiUrl}/api/academic-profile/${encodeURIComponent(email)}`
    
    const params = new URLSearchParams()
    if (academicYear) {
      params.append('academic_year', academicYear)
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    // Make request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: Knack auth handled by backend via session
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Profile not found'
        }
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('[Academic Profile API] Profile fetched:', data.dataSource)

    // Normalize student display fields (prevents "[object Object]" if API returns structured values)
    if (data && data.student) {
      data.student.name = coerceText(data.student.name) || data.student.name
      data.student.school = coerceText(data.student.school) || data.student.school
      data.student.yearGroup = coerceText(data.student.yearGroup) || data.student.yearGroup
      data.student.tutorGroup = coerceText(data.student.tutorGroup) || data.student.tutorGroup
    }
    
    return data
    
  } catch (error) {
    console.error('[Academic Profile API] Fetch error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch profile'
    }
  }
}

/**
 * Sync academic profile to both Supabase and Knack
 * @param {Object} profileData - Complete profile data
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<Object>}
 */
export async function syncAcademicProfile(profileData, apiUrl) {
  try {
    console.log('[Academic Profile API] Syncing profile:', profileData.studentEmail)
    
    const response = await fetch(`${apiUrl}/api/academic-profile/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[Academic Profile API] Sync result:', data)
    
    return data
    
  } catch (error) {
    console.error('[Academic Profile API] Sync error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Update individual subject grades (staff editing)
 * @param {string} subjectId - Supabase subject ID
 * @param {Object} updates - Fields to update
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<Object>}
 */
export async function updateSubjectGrade(subjectId, updates, apiUrl) {
  try {
    console.log('[Academic Profile API] Updating subject:', subjectId, updates)

    // Best-effort role hint (used by backend to restrict student writes to Target only)
    let roleHeader = null
    try {
      if (typeof Knack !== 'undefined' && Knack.getUserRoles) {
        const roles = Knack.getUserRoles() || []
        const isStudent = roles.some(r => (r && r.name === 'Student') || (typeof r === 'string' && r.toLowerCase().includes('student')))
        roleHeader = isStudent ? 'student' : 'staff'
      }
    } catch (_) {}
    
    const response = await fetch(`${apiUrl}/api/academic-profile/subject/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(roleHeader ? { 'X-User-Role': roleHeader } : {})
      },
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      // Try to read JSON error payload for better UX
      let msg = `API error: ${response.status}`
      try {
        const errJson = await response.json()
        if (errJson && (errJson.error || errJson.message)) {
          msg = errJson.error || errJson.message
        }
      } catch (e) {
        // ignore JSON parse issues
      }
      throw new Error(msg)
    }
    
    const data = await response.json()
    console.log('[Academic Profile API] Update result:', data)
    
    return data
    
  } catch (error) {
    console.error('[Academic Profile API] Update error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Update university offers for a student's academic profile (Supabase-backed)
 * @param {string} studentEmail
 * @param {Array} offers
 * @param {string} apiUrl
 * @param {string|null} academicYear
 * @returns {Promise<Object>}
 */
export async function updateUniversityOffers(studentEmail, offers, apiUrl, academicYear = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/university-offers`

    // Best-effort role hint (students + staff can edit offers, but keep parity with subject updates)
    let roleHeader = null
    try {
      if (typeof Knack !== 'undefined' && Knack.getUserRoles) {
        const roles = Knack.getUserRoles() || []
        const isStudent = roles.some(r => (r && r.name === 'Student') || (typeof r === 'string' && r.toLowerCase().includes('student')))
        roleHeader = isStudent ? 'student' : 'staff'
      }
    } catch (_) {}

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(roleHeader ? { 'X-User-Role': roleHeader } : {}) },
      body: JSON.stringify({
        academicYear,
        offers
      })
    })

    if (!response.ok) {
      let msg = `API error: ${response.status}`
      try {
        const errJson = await response.json()
        if (errJson && (errJson.error || errJson.message)) msg = errJson.error || errJson.message
      } catch (_) {}
      throw new Error(msg)
    }

    return await response.json()
  } catch (error) {
    console.error('[Academic Profile API] updateUniversityOffers error:', error)
    return { success: false, error: error.message || 'Failed to update university offers' }
  }
}

/**
 * Fetch UCAS Application draft (Supabase-backed)
 * @param {string} studentEmail
 * @param {string} apiUrl
 * @param {string|null} academicYear
 * @returns {Promise<Object>}
 */
export async function fetchUcasApplication(studentEmail, apiUrl, academicYear = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application`
    const qs = new URLSearchParams()
    if (academicYear) qs.append('academic_year', academicYear)

    const response = await fetch(qs.toString() ? `${url}?${qs.toString()}` : url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      if (response.status === 404) return { success: true, data: null }
      let msg = `API error: ${response.status}`
      try {
        const errJson = await response.json()
        if (errJson && (errJson.error || errJson.message)) msg = errJson.error || errJson.message
      } catch (_) {}
      throw new Error(msg)
    }

    return await response.json()
  } catch (error) {
    console.error('[Academic Profile API] fetchUcasApplication error:', error)
    return { success: false, error: error.message || 'Failed to fetch UCAS Application' }
  }
}

/**
 * Save UCAS Application draft (student-write only)
 * @param {string} studentEmail
 * @param {Object} payload
 * @param {string} apiUrl
 * @param {string|null} academicYear
 * @returns {Promise<Object>}
 */
export async function saveUcasApplication(studentEmail, payload, apiUrl, academicYear = null, options = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application`

    // Best-effort role hint (backend uses it to block staff writes to student-only fields)
    let roleHeader = null
    const roleHintOverride = options && typeof options === 'object' ? options.roleHint : null
    if (roleHintOverride) {
      roleHeader = String(roleHintOverride).trim().toLowerCase()
    }
    try {
      if (typeof Knack !== 'undefined' && Knack.getUserRoles) {
        const roles = Knack.getUserRoles() || []
        const isStudent = roles.some(r => (r && r.name === 'Student') || (typeof r === 'string' && r.toLowerCase().includes('student')))
        if (!roleHeader) roleHeader = isStudent ? 'student' : 'staff'
      }
    } catch (_) {}

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(roleHeader ? { 'X-User-Role': roleHeader } : {}) },
      body: JSON.stringify({ academicYear, ...payload })
    })

    if (!response.ok) {
      let msg = `API error: ${response.status}`
      try {
        const errJson = await response.json()
        if (errJson && (errJson.error || errJson.message)) msg = errJson.error || errJson.message
      } catch (_) {}
      throw new Error(msg)
    }

    return await response.json()
  } catch (error) {
    console.error('[Academic Profile API] saveUcasApplication error:', error)
    return { success: false, error: error.message || 'Failed to save UCAS Application' }
  }
}

/**
 * Add staff comment to UCAS Application
 * @param {string} studentEmail
 * @param {{comment: string, staffEmail?: string|null}} payload
 * @param {string} apiUrl
 * @param {string|null} academicYear
 * @returns {Promise<Object>}
 */
export async function addUcasApplicationComment(studentEmail, payload, apiUrl, academicYear = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application/comment`

    // Best-effort role hint (backend blocks students)
    let roleHeader = null
    const roleHintOverride = payload && typeof payload === 'object' ? payload.__roleHint : null
    if (roleHintOverride) {
      roleHeader = String(roleHintOverride).trim().toLowerCase()
    }
    try {
      if (typeof Knack !== 'undefined' && Knack.getUserRoles) {
        const roles = Knack.getUserRoles() || []
        const isStudent = roles.some(r => (r && r.name === 'Student') || (typeof r === 'string' && r.toLowerCase().includes('student')))
        if (!roleHeader) roleHeader = isStudent ? 'student' : 'staff'
      }
    } catch (_) {}

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(roleHeader ? { 'X-User-Role': roleHeader } : {}) },
      body: JSON.stringify({ academicYear, ...(payload || {}) })
    })

    if (!response.ok) {
      let msg = `API error: ${response.status}`
      try {
        const errJson = await response.json()
        if (errJson && (errJson.error || errJson.message)) msg = errJson.error || errJson.message
      } catch (_) {}
      throw new Error(msg)
    }

    return await response.json()
  } catch (error) {
    console.error('[Academic Profile API] addUcasApplicationComment error:', error)
    return { success: false, error: error.message || 'Failed to add comment' }
  }
}

/**
 * Generate UCAS feedback (student-only)
 * NOTE: UI must not label this as "AI".
 * @param {string} studentEmail
 * @param {Object} payload
 * @param {string} apiUrl
 * @param {string|null} academicYear
 * @param {{roleHint?: string}|null} options
 * @returns {Promise<Object>}
 */
export async function generateUcasFeedback(studentEmail, payload, apiUrl, academicYear = null, options = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application/feedback`

    // Best-effort role hint (backend uses it to block staff access)
    let roleHeader = null
    const roleHintOverride = options && typeof options === 'object' ? options.roleHint : null
    if (roleHintOverride) {
      roleHeader = String(roleHintOverride).trim().toLowerCase()
    }
    try {
      if (typeof Knack !== 'undefined' && Knack.getUserRoles) {
        const roles = Knack.getUserRoles() || []
        const isStudent = roles.some(r => (r && r.name === 'Student') || (typeof r === 'string' && r.toLowerCase().includes('student')))
        if (!roleHeader) roleHeader = isStudent ? 'student' : 'staff'
      }
    } catch (_) {}

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(roleHeader ? { 'X-User-Role': roleHeader } : {}) },
      body: JSON.stringify({ academicYear, ...(payload || {}) })
    })

    if (!response.ok) {
      let msg = `API error: ${response.status}`
      try {
        const errJson = await response.json()
        if (errJson && (errJson.error || errJson.message)) msg = errJson.error || errJson.message
      } catch (_) {}
      throw new Error(msg)
    }

    return await response.json()
  } catch (error) {
    console.error('[Academic Profile API] generateUcasFeedback error:', error)
    return { success: false, error: error.message || 'Failed to generate feedback' }
  }
}

/**
 * Add "Virtual Tutor" feedback as a tutor comment (student-initiated)
 * @param {string} studentEmail
 * @param {{comment: string}} payload
 * @param {string} apiUrl
 * @param {string|null} academicYear
 * @param {{roleHint?: string}|null} options
 * @returns {Promise<Object>}
 */
export async function addVirtualTutorComment(studentEmail, payload, apiUrl, academicYear = null, options = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application/virtual-tutor-comment`

    // Best-effort role hint (backend expects student here)
    let roleHeader = null
    const roleHintOverride = options && typeof options === 'object' ? options.roleHint : null
    if (roleHintOverride) {
      roleHeader = String(roleHintOverride).trim().toLowerCase()
    }
    try {
      if (typeof Knack !== 'undefined' && Knack.getUserRoles) {
        const roles = Knack.getUserRoles() || []
        const isStudent = roles.some(r => (r && r.name === 'Student') || (typeof r === 'string' && r.toLowerCase().includes('student')))
        if (!roleHeader) roleHeader = isStudent ? 'student' : 'staff'
      }
    } catch (_) {}

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(roleHeader ? { 'X-User-Role': roleHeader } : {}) },
      body: JSON.stringify({ academicYear, ...(payload || {}) })
    })

    if (!response.ok) {
      let msg = `API error: ${response.status}`
      try {
        const errJson = await response.json()
        if (errJson && (errJson.error || errJson.message)) msg = errJson.error || errJson.message
      } catch (_) {}
      throw new Error(msg)
    }

    return await response.json()
  } catch (error) {
    console.error('[Academic Profile API] addVirtualTutorComment error:', error)
    return { success: false, error: error.message || 'Failed to add comment' }
  }
}

/**
 * Fetch UCAS teacher reference status (student-safe)
 */
export async function fetchReferenceStatus(studentEmail, apiUrl, academicYear = null) {
  try {
    const qs = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : ''
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/status${qs}`
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error || data?.message || `API error: ${response.status}`)
    return data
  } catch (error) {
    console.error('[Academic Profile API] fetchReferenceStatus error:', error)
    return { success: false, error: error.message || 'Failed to fetch reference status' }
  }
}

/**
 * Invite a teacher by email (student-initiated)
 */
export async function createReferenceInvite(studentEmail, payload, apiUrl, academicYear = null, options = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/invite`

    // Force student role hint (this is a student UX flow)
    const roleHeader = (options && options.roleHint) ? String(options.roleHint).trim().toLowerCase() : 'student'

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': roleHeader },
      body: JSON.stringify({ academicYear, ...(payload || {}) })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error || data?.message || `API error: ${response.status}`)
    return data
  } catch (error) {
    console.error('[Academic Profile API] createReferenceInvite error:', error)
    return { success: false, error: error.message || 'Failed to invite teacher' }
  }
}

/**
 * Staff/tutor fetches full teacher reference (including text)
 */
export async function fetchReferenceFull(studentEmail, apiUrl, academicYear = null, options = null) {
  try {
    const qs = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : ''
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/full${qs}`

    const roleHeader = (options && options.roleHint) ? String(options.roleHint).trim().toLowerCase() : 'staff'
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json', 'X-User-Role': roleHeader } })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error || data?.message || `API error: ${response.status}`)
    return data
  } catch (error) {
    console.error('[Academic Profile API] fetchReferenceFull error:', error)
    return { success: false, error: error.message || 'Failed to fetch reference' }
  }
}

/**
 * Staff saves a reference contribution (Section 2 or 3)
 * @param {string} studentEmail
 * @param {{section: 2|3, text: string, subjectKey?: string|null, authorName?: string|null, staffEmail: string}} payload
 * @param {string} apiUrl
 * @param {string|null} academicYear
 * @param {{roleHint?: string}|null} options
 */
export async function saveReferenceContribution(studentEmail, payload, apiUrl, academicYear = null, options = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/contribution`

    const roleHeader = (options && options.roleHint) ? String(options.roleHint).trim().toLowerCase() : 'staff'
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': roleHeader },
      body: JSON.stringify({ academicYear, ...(payload || {}) })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error || data?.message || `API error: ${response.status}`)
    return data
  } catch (error) {
    console.error('[Academic Profile API] saveReferenceContribution error:', error)
    return { success: false, error: error.message || 'Failed to save contribution' }
  }
}

/**
 * Student marks UCAS personal statement complete (not the teacher reference).
 * This triggers email notifications to linked staff (best-effort).
 */
export async function markUcasStatementComplete(studentEmail, apiUrl, academicYear = null, options = null) {
  try {
    const url = `${apiUrl}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application/mark-complete`

    const roleHeader = (options && options.roleHint) ? String(options.roleHint).trim().toLowerCase() : 'student'
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': roleHeader },
      body: JSON.stringify({ academicYear })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error || data?.message || `API error: ${response.status}`)
    return data
  } catch (error) {
    console.error('[Academic Profile API] markUcasStatementComplete error:', error)
    return { success: false, error: error.message || 'Failed to mark complete' }
  }
}

/**
 * Health check for academic profile system
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<Object>}
 */
export async function checkAcademicProfileHealth(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/api/academic-profile/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const data = await response.json()
    return data
    
  } catch (error) {
    console.error('[Academic Profile API] Health check error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

