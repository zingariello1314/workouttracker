/**
 * Profils mission v6.2b+ — marathon, triathlon, sports spécialisés.
 * Fusionnés dans missionProfiles.js pour l’ordonnanceur.
 */

/** @type {import('./missionProfiles.js').MissionProfileDef} */
export const MISSION_PROFILES_V6_EXTENDED = {
  run_marathon: {
    id: 'run_marathon',
    labelFr: 'Préparation marathon',
    weeklyKmRange: [55, 95],
    intensitySplit: { easy: 0.78, tempo: 0.12, intervals: 0.1 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 5,
    cardioFractionMax: 0.7,
    defaultStructure: 'running_focus',
    strengthFamilyMul: { pull: 0.8, push: 0.75, legs: 0.85, core: 1.1 }
  },
  triathlon_sprint: {
    id: 'triathlon_sprint',
    labelFr: 'Triathlon sprint',
    weeklyKmRange: [22, 38],
    intensitySplit: { easy: 0.68, tempo: 0.17, intervals: 0.15 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 5,
    cardioFractionMax: 0.6,
    defaultStructure: 'hybrid_alternating',
    strengthFamilyMul: { pull: 0.88, push: 0.85, legs: 0.95, core: 1.05 }
  },
  triathlon_olympic: {
    id: 'triathlon_olympic',
    labelFr: 'Triathlon olympique',
    weeklyKmRange: [32, 52],
    intensitySplit: { easy: 0.72, tempo: 0.18, intervals: 0.1 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 5,
    cardioFractionMax: 0.62,
    defaultStructure: 'hybrid_alternating',
    strengthFamilyMul: { pull: 0.86, push: 0.84, legs: 0.92, core: 1.08 }
  },
  triathlon_half_iron: {
    id: 'triathlon_half_iron',
    labelFr: 'Triathlon half iron',
    weeklyKmRange: [45, 70],
    intensitySplit: { easy: 0.76, tempo: 0.14, intervals: 0.1 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 5,
    cardioFractionMax: 0.65,
    defaultStructure: 'running_focus',
    strengthFamilyMul: { pull: 0.84, push: 0.8, legs: 0.9, core: 1.1 }
  },
  triathlon_iron: {
    id: 'triathlon_iron',
    labelFr: 'Triathlon iron',
    weeklyKmRange: [58, 88],
    intensitySplit: { easy: 0.8, tempo: 0.12, intervals: 0.08 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 5,
    cardioFractionMax: 0.68,
    defaultStructure: 'running_focus',
    strengthFamilyMul: { pull: 0.82, push: 0.78, legs: 0.88, core: 1.12 }
  },
  sport_collective: {
    id: 'sport_collective',
    labelFr: 'Sport collectif',
    maxStrengthDays: 4,
    strengthPriority: 'balanced',
    cardioCapSessionsPerWeek: 3,
    cardioFractionMax: 0.42,
    defaultStructure: 'full_body',
    strengthFamilyMul: { pull: 0.95, push: 0.95, legs: 1.1, core: 1.05 }
  },
  combat_sport: {
    id: 'combat_sport',
    labelFr: 'Sport de combat',
    maxStrengthDays: 4,
    strengthPriority: 'priority',
    cardioCapSessionsPerWeek: 3,
    cardioFractionMax: 0.38,
    defaultStructure: 'full_body',
    strengthFamilyMul: { pull: 1.05, push: 1.08, legs: 1, core: 1.1 }
  },
  military_prep: {
    id: 'military_prep',
    labelFr: 'Préparation militaire',
    maxStrengthDays: 5,
    strengthPriority: 'balanced',
    cardioCapSessionsPerWeek: 4,
    cardioFractionMax: 0.48,
    defaultStructure: 'full_body',
    strengthFamilyMul: { pull: 1, push: 1, legs: 1.12, core: 1.08 }
  }
};

export const TRIATHLON_DISTANCE_KEYS = ['sprint', 'olympic', 'half_iron', 'iron'];

export const TRIATHLON_WEAK_LEG_KEYS = ['swim', 'bike', 'run'];
