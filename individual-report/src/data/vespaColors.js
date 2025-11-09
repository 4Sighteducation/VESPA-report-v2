// VESPA Brand Colors and Theme

export const brandColors = {
  primary: '#079baa',      // Turquoise
  secondary: '#7bd8d0',    // Light turquoise
  accent: '#62d1d2',       // Accent turquoise
  accent2: '#00e5db',      // Bright turquoise
  accent3: '#5899a8',      // Muted blue
  accent4: '#2f8dcb',      // Sky blue
  dark: '#23356f',         // Navy
  darker: '#2a3c7a'        // Dark blue
}

export const vespaColors = {
  vision: '#ff8f00',    // Orange
  effort: '#86b4f0',    // Light blue
  systems: '#72cb44',   // Green
  practice: '#7f31a4',  // Purple
  attitude: '#f032e6'   // Pink
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

