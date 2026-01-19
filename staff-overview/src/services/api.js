// API Service for VESPA Staff Overview
const API_BASE_URL = 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com'

export const staffAPI = {
  /**
   * Fetch staff overview data (all connected students)
   * @param {string} staffEmail - Staff member email
   * @param {number|null} cycle - Optional cycle filter (1, 2, 3, or null for all)
   * @returns {Promise} Staff info and student list with scores
   */
  async getStaffOverview(staffEmail, cycle = null) {
    try {
      let url = `${API_BASE_URL}/api/vespa/staff-overview?email=${encodeURIComponent(staffEmail)}`
      if (cycle !== null && cycle !== undefined && cycle !== '') {
        url += `&cycle=${cycle}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('[Staff API] Error fetching overview:', error)
      throw error
    }
  },
  
  /**
   * Save student goals (Action Plan)
   * @param {string} studentEmail - Student email
   * @param {number} cycle - Cycle number (1, 2, or 3)
   * @param {object} goalData - Goal data {goalText, goalSetDate, goalDueDate, knackRecordId}
   * @returns {Promise} Save result
   */
  async saveStudentGoals(studentEmail, cycle, goalData) {
    try {
      console.log('[Staff API] Saving student goals:', { studentEmail, cycle, knackRecordId: goalData.knackRecordId })
      
      const response = await fetch(`${API_BASE_URL}/api/vespa/report/save-goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentEmail,
          cycle,
          goalText: goalData.goalText || '',
          goalSetDate: goalData.goalSetDate || null,
          goalDueDate: goalData.goalDueDate || null,
          knackRecordId: goalData.knackRecordId || null
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[Staff API] Goals saved successfully:', data)
      return data
    } catch (error) {
      console.error('[Staff API] Error saving goals:', error)
      throw error
    }
  },
  
  /**
   * Save staff coaching comments
   * @param {string} studentEmail - Student email
   * @param {number} cycle - Cycle number (1, 2, or 3)
   * @param {object} coachingData - Coaching data {coachingText, coachingDate, knackRecordId}
   * @returns {Promise} Save result
   */
  async saveCoachingComments(studentEmail, cycle, coachingData) {
    try {
      console.log('[Staff API] Saving coaching comments:', { studentEmail, cycle, knackRecordId: coachingData.knackRecordId })
      
      // Get current staff email from Knack
      let staffEmail = null
      if (typeof Knack !== 'undefined' && Knack.getUserAttributes) {
        const userAttrs = Knack.getUserAttributes()
        staffEmail = userAttrs?.email
      }
      
      if (!staffEmail) {
        throw new Error('Staff email not available')
      }
      
      const response = await fetch(`${API_BASE_URL}/api/vespa/report/save-coaching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentEmail,
          staffEmail,
          cycle,
          coachingText: coachingData.coachingText || '',
          coachingDate: coachingData.coachingDate || null,
          knackRecordId: coachingData.knackRecordId || null
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[Staff API] Coaching comments saved successfully:', data)
      return data
    } catch (error) {
      console.error('[Staff API] Error saving coaching comments:', error)
      throw error
    }
  }
  ,

  /**
   * Fetch UCAS application data for a student (staff-only endpoint)
   * @param {string} studentEmail
   * @param {string} academicYear - 'current' or 'YYYY-YYYY'
   */
  async getUcasApplication(studentEmail, academicYear = 'current') {
    try {
      const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application?academicYear=${encodeURIComponent(academicYear)}`
      const response = await fetch(url)
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[Staff API] Error fetching UCAS application:', error)
      throw error
    }
  },

  /**
   * Fetch full reference (invites + contributions + tutor compiled narrative)
   * @param {string} studentEmail
   * @param {string} academicYear - 'current' or 'YYYY-YYYY'
   */
  async getReferenceFull(studentEmail, academicYear = 'current') {
    try {
      const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/full?academicYear=${encodeURIComponent(academicYear)}`
      const response = await fetch(url)
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[Staff API] Error fetching reference full:', error)
      throw error
    }
  },

  /**
   * Save tutor compiled narrative (Section 3 collation)
   */
  async saveTutorCompiled(studentEmail, payload) {
    try {
      const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/tutor-compiled`
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[Staff API] Error saving tutor compiled narrative:', error)
      throw error
    }
  },

  async markTutorCompiledComplete(studentEmail, payload) {
    try {
      const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/tutor-compiled/mark-complete`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[Staff API] Error marking tutor compiled complete:', error)
      throw error
    }
  },

  async unmarkTutorCompiledComplete(studentEmail, payload) {
    try {
      const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}/reference/tutor-compiled/unmark-complete`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[Staff API] Error unmarking tutor compiled complete:', error)
      throw error
    }
  },

  async requestUcasStatementEdits(studentEmail, payload) {
    try {
      const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}/ucas-application/request-edits`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[Staff API] Error requesting UCAS statement edits:', error)
      throw error
    }
  }
  ,

  /**
   * Fetch Academic Profile (subjects + offers) for UCAS rendering
   * @param {string} studentEmail
   * @param {string} academicYear - 'current' or 'YYYY/YY' etc
   * @param {{ staffEmail?: string, roleHint?: string }} opts
   */
  async getAcademicProfile(studentEmail, academicYear = 'current', opts = {}) {
    try {
      const qs = new URLSearchParams()
      // If academicYear is "current"/empty, omit the param so backend can pick best match
      const ay = (academicYear === null || academicYear === undefined) ? '' : String(academicYear).trim()
      if (ay && ay.toLowerCase() !== 'current') qs.append('academic_year', ay)
      const url = `${API_BASE_URL}/api/academic-profile/${encodeURIComponent(studentEmail)}${qs.toString() ? `?${qs.toString()}` : ''}`

      const headers = {}
      // Best-effort: provide staff hint headers (backend tolerates missing)
      if (opts?.roleHint) headers['X-User-Role'] = String(opts.roleHint)
      if (opts?.staffEmail) headers['X-User-Email'] = String(opts.staffEmail)

      const response = await fetch(url, { headers })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[Staff API] Error fetching academic profile:', error)
      throw error
    }
  }
}

