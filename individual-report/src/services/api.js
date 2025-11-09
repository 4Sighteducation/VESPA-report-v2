// API Service for VESPA Report V2
const API_BASE_URL = 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com'

export const reportAPI = {
  /**
   * Fetch complete report data for a student
   * @param {string} email - Student email
   * @returns {Promise} Report data with scores, responses, coaching content
   */
  async getReportData(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vespa/report/data?email=${encodeURIComponent(email)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('[Report API] Error fetching report data:', error)
      throw error
    }
  },

  /**
   * Save student response
   * @param {string} studentEmail - Student email
   * @param {number} cycle - Cycle number (1, 2, or 3)
   * @param {string} responseText - Student's reflection text
   * @param {string} knackRecordId - Object_10 record ID (optional)
   * @returns {Promise}
   */
  async saveStudentResponse(studentEmail, cycle, responseText, knackRecordId = null) {
    try {
      console.log('[Report API] Saving student response:', { studentEmail, cycle })
      
      const response = await fetch(`${API_BASE_URL}/api/vespa/report/save-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentEmail,
          cycle,
          responseText,
          knackRecordId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[Report API] Response saved successfully:', data)
      return data
    } catch (error) {
      console.error('[Report API] Error saving response:', error)
      throw error
    }
  },

  /**
   * Save student goals
   * @param {string} studentEmail - Student email
   * @param {number} cycle - Cycle number
   * @param {object} goals - Goals data (goalText, goalSetDate, goalDueDate)
   * @param {string} knackRecordId - Object_10 record ID (optional)
   * @returns {Promise}
   */
  async saveStudentGoals(studentEmail, cycle, goals, knackRecordId = null) {
    try {
      console.log('[Report API] Saving student goals:', { studentEmail, cycle })
      
      const response = await fetch(`${API_BASE_URL}/api/vespa/report/save-goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentEmail,
          cycle,
          goalText: goals.goalText || '',
          goalSetDate: goals.goalSetDate || null,
          goalDueDate: goals.goalDueDate || null,
          knackRecordId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[Report API] Goals saved successfully:', data)
      return data
    } catch (error) {
      console.error('[Report API] Error saving goals:', error)
      throw error
    }
  },

  /**
   * Save staff coaching notes (staff only)
   * @param {string} studentEmail - Student email
   * @param {string} staffEmail - Staff email (for tracking who wrote the note)
   * @param {number} cycle - Cycle number
   * @param {object} coaching - Coaching data (coachingText, coachingDate)
   * @param {string} knackRecordId - Object_10 record ID (optional)
   * @returns {Promise}
   */
  async saveStaffCoaching(studentEmail, staffEmail, cycle, coaching, knackRecordId = null) {
    try {
      console.log('[Report API] Saving staff coaching:', { studentEmail, cycle })
      
      const response = await fetch(`${API_BASE_URL}/api/vespa/report/save-coaching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentEmail,
          staffEmail,
          cycle,
          coachingText: coaching.coachingText || '',
          coachingDate: coaching.coachingDate || null,
          knackRecordId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[Report API] Coaching saved successfully:', data)
      return data
    } catch (error) {
      console.error('[Report API] Error saving coaching notes:', error)
      throw error
    }
  }
}

