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

