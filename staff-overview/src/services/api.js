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
  }
}

