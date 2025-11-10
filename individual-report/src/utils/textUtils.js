/**
 * Utility functions for text processing
 */

/**
 * Strip HTML tags and decode HTML entities from text
 * @param {string} html - HTML string to clean
 * @returns {string} Plain text without HTML
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  
  // First convert <br> tags to newlines BEFORE stripping HTML
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p>/gi, '')
  
  // Create a temporary div to parse HTML
  const tmp = document.createElement('div')
  tmp.innerHTML = text
  
  // Extract text content (automatically strips tags)
  text = tmp.textContent || tmp.innerText || ''
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
  
  // Clean up excessive whitespace but PRESERVE single line breaks
  text = text
    .replace(/ +/g, ' ')           // Multiple spaces to single space
    .replace(/\n\n\n+/g, '\n\n')  // Max 2 consecutive line breaks
    .trim()
  
  return text
}

/**
 * Convert plain text line breaks to HTML <br> tags
 * @param {string} text - Plain text with line breaks
 * @returns {string} HTML with <br> tags
 */
export function nl2br(text) {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/\n/g, '<br>')
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 100) {
  if (!text || typeof text !== 'string') return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

