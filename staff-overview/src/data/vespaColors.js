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
  if (score === null || score === undefined) return '#f5f5f5'  // Light grey for missing scores
  
  const numScore = parseFloat(score)
  
  // Subtle color scheme for better readability
  if (numScore >= 9) return '#86efac'  // 9-10: Soft green
  if (numScore >= 7) return '#bbf7d0'  // 7-8: Light green
  if (numScore >= 5) return '#fed7aa'  // 5-6: Light orange
  if (numScore >= 3) return '#fee2e2'  // 3-4: Light red
  return '#ffb5bb'                     // 1-2: Subtle pink-red
}

