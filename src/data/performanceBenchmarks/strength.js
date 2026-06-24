/** Repères street workout — max reps sur une série / séance. */

export const STRENGTH_BENCHMARKS = {
  pullups: {
    label: 'tractions',
    tiers: [
      { id: 'beginner', label: 'débutant', minReps: 1, maxReps: 3 },
      { id: 'intermediate', label: 'intermédiaire', minReps: 4, maxReps: 10 },
      { id: 'good', label: 'bon', minReps: 11, maxReps: 15 },
      { id: 'advanced', label: 'avancé', minReps: 16, maxReps: 20 },
      { id: 'elite_amateur', label: 'élite amateur', minReps: 21, maxReps: 999 }
    ]
  },
  dips: {
    label: 'dips',
    tiers: [
      { id: 'beginner', label: 'débutant', minReps: 1, maxReps: 5 },
      { id: 'intermediate', label: 'intermédiaire', minReps: 6, maxReps: 10 },
      { id: 'good', label: 'bon', minReps: 11, maxReps: 20 },
      { id: 'advanced', label: 'avancé', minReps: 21, maxReps: 30 },
      { id: 'elite_amateur', label: 'élite amateur', minReps: 31, maxReps: 999 }
    ]
  },
  pushups: {
    label: 'pompes',
    tiers: [
      { id: 'beginner', label: 'débutant', minReps: 1, maxReps: 20 },
      { id: 'intermediate', label: 'intermédiaire', minReps: 21, maxReps: 40 },
      { id: 'good', label: 'bon', minReps: 41, maxReps: 60 },
      { id: 'advanced', label: 'avancé', minReps: 61, maxReps: 80 },
      { id: 'elite_amateur', label: 'élite amateur', minReps: 81, maxReps: 999 }
    ]
  }
};
