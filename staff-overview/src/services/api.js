// API Service for VESPA Staff Overview
const API_BASE_URL = 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com'

export const staffAPI = {
  /**
   * Fetch staff overview data (all connected students)
   * @param {string} staffEmail - Staff member email
   * @returns {Promise} Staff info and student list with scores
   */
  async getStaffOverview(staffEmail) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vespa/staff-overview?email=${encodeURIComponent(staffEmail)}`)
      
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

