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
    
    const response = await fetch(`${apiUrl}/api/academic-profile/subject/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
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

