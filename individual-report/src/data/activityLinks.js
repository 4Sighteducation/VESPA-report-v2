// VESPA Activity Links Mapping
// Maps activity names to their Knack activity IDs for direct linking
// Base URL: https://vespaacademy.knack.com/vespa-academy#my-vespa-activities?activity={ID}&action=start

export const activityLinks = {
  // VISION Activities
  '20 Questions': '5fcb62a903d876001c5e1fcf',
  'Getting Dreams Done': '5fcccf1303d876001c5f371e',
  '21st Birthday': '5fcd2a08a8369b001b9f8883',
  'Perfect Day': '5fcd3fa0a8369b001b9fa1cf',
  'Fake It!': '5fcd49ed0e734a001db4166f',
  'Fix your dashboard': '5fcd517ba74fa2001bd48dad',
  'SMART Goals': '5fcd52390dcf37001c0cc901',
  'Mental Contrasting': '5fcd52daa8369b001b9fb551',
  'Motivation Diamond': '5ffdfaed86917a001be07f6f',
  'Personal Compass': '5ffdfc0d1e82a6001e41e96e',
  'What\'s Stopping You': '5ffdfd68226f20001b05eb8f',
  'Roadmap': '5ffdffb386917a001be0853a',
  'Five Roads': '5ffe00e19ff689001bcb12ce',
  'Now vs Most': '5ffe01865c1cca001b161e42',
  'Rule of 3': '5ffe02d95d4ee5001c30f11d',

  // EFFORT Activities
  'One to Ten': '5fcf4ac1e54816001f9c60ce',
  'Recognising your blockers': '5fd01084e2bca3001bbe0283',
  'Frogs & Bannisters': '5fd4ed8929b5fa001b3567a5',
  '10min Rule': '5fd50afe5dbce5001b882d67',
  'Inner Story Telling': '5fd5197510f706001b0465d6',
  'Power of If': '5fd5217af9fddc001cf453e5',
  'Working Weeks': '5fd52773ccb3a3002350961d',
  '3R\'s of Habit': '5fd626af3f7ed1001b80b269',
  '25min Sprints': '5ffe054a5d4ee5001c30f3a1',
  'Mission & Medal': '5ffe05c11e82a6001e41f2c5',
  'Looking under Rocks': '5ffe06d11e82a6001e41f3eb',
  'Packing Bags': '5ffe07ef1e82a6001e41f4cf',
  'Independent Work': '5ffe0876226f20001b05f671',
  'Pre-Made Decisions': '5ffe09425c1cca001b16253e',
  'Effort Thermometer': '5ffe09d15d4ee5001c30f799',

  // SYSTEMS Activities
  'Energy Line': '5fd68bf12fb80d001b8fdff5',
  'Breakfast Club': '5fdbaedfdb58e5001be744a1',
  'Snack Don\'t Binge': '5fdfe9bbae492f001c04a05c',
  '2-4-8 Rule': '5fe08034a529d3001b2b5b29',
  'The Lead Domino': '5fe0dcf4590766001ba431cf',
  'STQR': '5fe0ec9d45b5d5001bb535f8',
  'Project Progress Chart': '5fe28f3c514b63001bb3a768',
  'Eisenhower Matrix': '5fe2940aafeba3001dcc5f77',
  'Revision Questionnaire': '5fe38371c76bfd001b459923',
  'Weekly Planner': '5ffe0b461e82a6001e41f77d',
  'Priority Matrix': '5ffe0bec5d4ee5001c30f992',
  'The Bottom Left': '5ffe0d2186917a001be091a6',
  'Types of Attention': '5ffe0dd186917a001be0923d',
  'Chunking Steps': '5ffe0eb05d4ee5001c30fbdb',

  // PRACTICE Activities
  'Leitner Box': '5fe8ca680c7c48001bd7db56',
  'Right-Wrong-Right': '5fe8d54dc4627e001b8ccd12',
  'Graphic Organisers': '5feb62388fd0f4001b0e9d04',
  'Learn from Mistakes': '5fec5dc532f5b1001bb756bf',
  '2 Slow, 1 Fast': '5fecf758845cf7001bd26679',
  'Know the Skills': '5fed8f7f8ff75c001b6ebd5f',
  'Mechanical vs Flexible': '5fedaf2e19a8b7001c29cace',
  'Practice Questionnaire': '5ffe0fa4aaec95001b10f70b',
  'Spaced Practice': '5ffe101f226f20001b05fcd4',
  'Will vs Skill': '5ffe108e5c1cca001b162b8c',
  '9 Box Grid': '5ffe111a1e82a6001e41fe2b',
  'High Flow Spaces': '5ffe11ac86917a001be095b6',
  'Independent Learning': '5ffe12545d4ee5001c30fefa',
  'Time to Teach': '5ffe12c89ff689001bcb2281',
  'Test Yourself': '5ffe134d1e82a6001e41ffe7',

  // ATTITUDE Activities
  'Change Curve': '5fedc39cf3be06001b6ddbe3',
  'Vampire Test': '5fef592f648880001c1b7296',
  'There and Back': '5ff1f0b28a0c35001c57fb89',
  'Force Field': '5ff36ee0f46ecd001bcafaa4',
  'Success Leaves Clues': '5ff3841848789d001c52ed81',
  'Kill Your Critic': '5ffc7453482dc4001cf6730d',
  'Problem Solving': '5ffe13feaaec95001b10fa95',
  'Growth Mindset': '5ffe1476226f20001b060044',
  'Network Audits': '5ffe15505c1cca001b162f4b',
  'The Battery': '5ffe15ccf6034a001b98b749',
  'The First Aid Kit': '5ffe16205c1cca001b162fe2',
  'Benefit Finding': '5ffe169f656c5e001c712382',
  'Managing Reactions': '5ffe1700f6034a001b98b834',
  'Failing Forwards': '6005d84a236fdb001eb25437',
  'Stand Tall': '6005de7c1e85bf001c4c451e',
  'Stopping Negative Thoughts': '6005f0b6041501001c676cb8'
}

/**
 * Get activity URL for opening in Knack
 * @param {string} activityName - Name of the activity
 * @param {string} action - Action to perform (view|start|add) default: start
 * @returns {string} Full URL to the activity
 */
export function getActivityUrl(activityName, action = 'start') {
  const activityId = activityLinks[activityName]
  
  if (!activityId) {
    console.warn(`[Activity Links] No ID found for activity: "${activityName}"`)
    return 'https://vespaacademy.knack.com/vespa-academy#my-vespa-activities'
  }
  
  return `https://vespaacademy.knack.com/vespa-academy#my-vespa-activities?activity=${activityId}&action=${action}`
}

