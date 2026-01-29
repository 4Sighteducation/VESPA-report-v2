// Knack Authentication Service
// Same as individual report - get logged-in user

const STAFF_ROLE_IDS = ['object_5', 'object_7', 'object_18', 'object_78']
const STAFF_ROLE_NAME_HINTS = ['tutor', 'staff', 'admin', 'head', 'teacher', 'subject']

const normalizeRoleTokens = (roles) => {
  if (!Array.isArray(roles)) return []
  return roles
    .flatMap((r) => {
      if (!r) return []
      if (typeof r === 'string') return [r]
      // Knack can return role objects for multi-role users (id/key/name/identifier)
      const tokens = []
      if (r.identifier) tokens.push(r.identifier)
      if (r.id) tokens.push(r.id)
      if (r.key) tokens.push(r.key)
      if (r.name) tokens.push(r.name)
      return tokens
    })
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
}

const isStaffFromRoles = (roles) => {
  const tokens = normalizeRoleTokens(roles)
  const staffIds = STAFF_ROLE_IDS.map((t) => t.toLowerCase())

  return (
    tokens.some((t) => staffIds.includes(t)) ||
    tokens.some((t) => STAFF_ROLE_NAME_HINTS.some((h) => t.includes(h)))
  )
}

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

      // Detect if user is staff based on roles (robust to role objects + names)
      const isStaff = isStaffFromRoles(userRoles)
      const roleTokens = normalizeRoleTokens(userRoles)

      return {
        email: userAttrs.email,
        name: userAttrs.name || userAttrs.full_name || '',
        roles: userRoles,
        roleTokens,
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

