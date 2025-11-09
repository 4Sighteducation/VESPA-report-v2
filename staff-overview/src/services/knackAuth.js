// Knack Authentication Service
// Same as individual report - get logged-in user

export const knackAuth = {
  /**
   * Get logged-in user from Knack
   * @returns {object|null} User object with email, name, and roles
   */
  getUser() {
    try {
      if (typeof Knack === 'undefined' || !Knack.getUserAttributes) {
        console.warn('[Knack Auth] Knack not available')
        return null
      }

      const userAttrs = Knack.getUserAttributes()
      const userRoles = Knack.getUserRoles ? Knack.getUserRoles() : []

      if (!userAttrs || !userAttrs.email) {
        console.warn('[Knack Auth] No user logged in')
        return null
      }

      // Detect if user is staff based on roles
      const staffRoles = ['object_5', 'object_7', 'object_18', 'object_78']
      const isStaff = userRoles.some(role => staffRoles.includes(role))

      return {
        email: userAttrs.email,
        name: userAttrs.name || userAttrs.full_name || '',
        roles: userRoles,
        isStaff: isStaff,
        attributes: userAttrs
      }
    } catch (error) {
      console.error('[Knack Auth] Error getting user:', error)
      return null
    }
  },

  /**
   * Check if user has staff role
   * @returns {boolean}
   */
  isStaff() {
    const user = this.getUser()
    return user ? user.isStaff : false
  },

  /**
   * Get user email
   * @returns {string|null}
   */
  getUserEmail() {
    const user = this.getUser()
    return user ? user.email : null
  }
}

