/**
 * Grade comparison utilities
 * Determines color class based on grade vs target
 */

/**
 * Get CSS class for grade comparison
 * @param {string} grade - Current/target grade
 * @param {string} expectedGrade - MEG/STG grade
 * @returns {string} CSS class name
 */
export function getGradeColorClass(grade, expectedGrade) {
  if (!grade || !expectedGrade || grade === 'N/A' || expectedGrade === 'N/A') {
    return ''
  }

  const gradeStr = String(grade).trim()
  const expectedStr = String(expectedGrade).trim()

  // A-Level grades (A*, A, B, C, D, E, U)
  const aLevelOrder = ['A*', 'A', 'B', 'C', 'D', 'E', 'U']
  const gradeIndex = aLevelOrder.indexOf(gradeStr.toUpperCase())
  const expectedIndex = aLevelOrder.indexOf(expectedStr.toUpperCase())

  if (gradeIndex !== -1 && expectedIndex !== -1) {
    const diff = expectedIndex - gradeIndex // Higher is better for A-Level (A* = 0, U = 6)
    
    if (diff >= 2) return 'grade-significantly-above'
    if (diff === 1) return 'grade-above'
    if (diff === 0) return 'grade-matching'
    if (diff === -1) return 'grade-one-below'
    if (diff === -2) return 'grade-two-below'
    if (diff <= -3) return 'grade-far-below'
  }

  // Numerical grades (GCSE: 9, 8, 7, 6, 5, 4, 3, 2, 1)
  const numGrade = parseFloat(gradeStr)
  const numExpected = parseFloat(expectedStr)

  if (!isNaN(numGrade) && !isNaN(numExpected)) {
    const diff = numGrade - numExpected
    
    if (diff >= 2) return 'grade-significantly-above'
    if (diff === 1) return 'grade-above'
    if (diff === 0) return 'grade-matching'
    if (diff === -1) return 'grade-one-below'
    if (diff === -2) return 'grade-two-below'
    if (diff <= -3) return 'grade-far-below'
  }

  // Vocational grades (D*, D, M, P combinations)
  const vocationalGrades = {
    'D*': 4, 'D*D*': 8, 'D*D*D*': 12,
    'D': 3, 'DD': 6, 'DDD': 9,
    'M': 2, 'MM': 4, 'MMM': 6,
    'P': 1, 'PP': 2, 'PPP': 3,
    'D*D': 7, 'D*DD': 10, 'DM': 5, 'DMM': 7,
    'MP': 3, 'MPP': 4
  }

  const currentValue = vocationalGrades[gradeStr.toUpperCase()]
  const expectedValue = vocationalGrades[expectedStr.toUpperCase()]

  if (currentValue && expectedValue) {
    const diff = currentValue - expectedValue
    
    if (diff >= 2) return 'grade-significantly-above'
    if (diff === 1) return 'grade-above'
    if (diff === 0) return 'grade-matching'
    if (diff === -1) return 'grade-one-below'
    if (diff === -2) return 'grade-two-below'
    if (diff <= -3) return 'grade-far-below'
  }

  // Default: No class if grades match as strings
  if (gradeStr.toUpperCase() === expectedStr.toUpperCase()) {
    return 'grade-matching'
  }

  return ''
}

