// VESPA Brand Colors (same as individual report)

export const brandColors = {
  primary: '#079baa',
  secondary: '#7bd8d0',
  accent: '#62d1d2',
  dark: '#23356f',
  darker: '#2a3c7a'
}

export const vespaColors = {
  vision: '#ff8f00',
  effort: '#86b4f0',
  systems: '#72cb44',
  practice: '#7f31a4',
  attitude: '#f032e6'
}

export const getCategoryColor = (category) => {
  const categoryLower = category.toLowerCase()
  return vespaColors[categoryLower] || '#ccc'
}

export const getScoreColor = (score) => {
  if (score === null || score === undefined) return '#eee'
  if (score >= 9) return '#4caf50'  // Excellent - green
  if (score >= 7) return '#8bc34a'  // Good - light green
  if (score >= 5) return '#ffeb3b'  // Average - yellow
  if (score >= 3) return '#ff9800'  // Below average - orange
  return '#f44336'                  // Needs improvement - red
}

