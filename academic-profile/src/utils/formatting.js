/**
 * Formatting utilities for Academic Profile
 */

/**
 * Format decimal as percentage
 * @param {number} decimal - Value between 0 and 1
 * @returns {string} Formatted percentage (e.g., "89%")
 */
export function formatPercentage(decimal) {
  if (decimal === null || decimal === undefined) return 'N/A'
  if (typeof decimal === 'string') {
    const parsed = parseFloat(decimal)
    if (isNaN(parsed)) return 'N/A'
    decimal = parsed
  }
  return `${Math.round(decimal * 100)}%`
}

/**
 * Sanitize HTML from field values
 * @param {any} value - Value to sanitize
 * @returns {string} Clean text
 */
export function sanitizeField(value) {
  if (value === null || value === undefined) return ''
  
  let str = String(value)
  
  // Remove HTML tags
  str = str.replace(/<[^>]*>/g, '')
  
  // Remove markdown-style formatting
  str = str.replace(/[_~`#]/g, '')
  
  // Decode HTML entities
  str = str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
  
  return str.trim()
}

/**
 * Validate Knack record ID format
 * @param {string} id - Potential Knack ID
 * @returns {boolean} True if valid format
 */
export function isValidKnackId(id) {
  if (!id || typeof id !== 'string') return false
  return /^[0-9a-f]{24}$/i.test(id)
}

/**
 * Extract valid record ID from various Knack field formats
 * @param {any} value - Field value (string, object, array)
 * @returns {string|null} Valid ID or null
 */
export function extractRecordId(value) {
  if (!value) return null

  // Direct string ID
  if (typeof value === 'string' && isValidKnackId(value)) {
    return value
  }

  // Object with id property
  if (typeof value === 'object' && value !== null) {
    if (value.id && isValidKnackId(value.id)) return value.id
    if (value.identifier && isValidKnackId(value.identifier)) return value.identifier
    
    // Array of objects
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0]
      if (typeof first === 'string' && isValidKnackId(first)) return first
      if (typeof first === 'object' && first.id && isValidKnackId(first.id)) return first.id
    }
  }

  return null
}

