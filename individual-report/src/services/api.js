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
   * @param {string} knackRecordId - Object_10 record ID
   * @returns {Promise}
   */
  async saveStudentResponse(studentEmail, cycle, responseText, knackRecordId) {
    try {
      // TODO: Implement save to Supabase + Knack dual-write
      // This will be added in the next iteration
      console.log('[Report API] Saving student response:', { studentEmail, cycle, responseText })
      return { success: true }
    } catch (error) {
      console.error('[Report API] Error saving response:', error)
      throw error
    }
  },

  /**
   * Save student goals
   * @param {string} studentEmail - Student email
   * @param {number} cycle - Cycle number
   * @param {object} goals - Goals data (text, set date, due date)
   * @param {string} knackRecordId - Object_10 record ID
   * @returns {Promise}
   */
  async saveStudentGoals(studentEmail, cycle, goals, knackRecordId) {
    try {
      // TODO: Implement save to Supabase + Knack dual-write
      console.log('[Report API] Saving student goals:', { studentEmail, cycle, goals })
      return { success: true }
    } catch (error) {
      console.error('[Report API] Error saving goals:', error)
      throw error
    }
  },

  /**
   * Save staff coaching notes (staff only)
   * @param {string} studentEmail - Student email
   * @param {number} cycle - Cycle number
   * @param {object} coaching - Coaching data (text, date)
   * @param {string} knackRecordId - Object_10 record ID
   * @returns {Promise}
   */
  async saveStaffCoaching(studentEmail, cycle, coaching, knackRecordId) {
    try {
      // TODO: Implement save to Supabase + Knack dual-write
      console.log('[Report API] Saving staff coaching:', { studentEmail, cycle, coaching })
      return { success: true }
    } catch (error) {
      console.error('[Report API] Error saving coaching notes:', error)
      throw error
    }
  }
}

