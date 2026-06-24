/**
 * Repères détaillés par exercice — max reps, holds, charges, ratios BW.
 * Utilisé par exerciseBenchmarkRegistry + recapBenchmarkInsights.
 */

export const STRENGTH_EXERCISE_BENCHMARKS = {
  pullups_strict: {
    label: 'Tractions strictes',
    metric: 'max_set_reps',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 0 },
      { id: 'novice', label: 'novice', min: 1, max: 5 },
      { id: 'intermediate', label: 'intermédiaire', min: 6, max: 10 },
      { id: 'good', label: 'bon', min: 11, max: 15 },
      { id: 'advanced', label: 'avancé', min: 16, max: 20 },
      { id: 'excellent', label: 'excellent', min: 21, max: 30 },
      { id: 'exceptional', label: 'exceptionnel', min: 31, max: 999 }
    ]
  },
  pullups_australian: {
    label: 'Tractions australiennes',
    metric: 'max_set_reps',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 5 },
      { id: 'novice', label: 'novice', min: 6, max: 12 },
      { id: 'intermediate', label: 'intermédiaire', min: 13, max: 20 },
      { id: 'good', label: 'bon', min: 21, max: 30 },
      { id: 'advanced', label: 'avancé', min: 31, max: 45 },
      { id: 'excellent', label: 'excellent', min: 46, max: 60 },
      { id: 'exceptional', label: 'exceptionnel', min: 61, max: 999 }
    ]
  },
  dips: {
    label: 'Dips',
    metric: 'max_set_reps',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 5 },
      { id: 'intermediate', label: 'intermédiaire', min: 6, max: 10 },
      { id: 'good', label: 'bon', min: 11, max: 20 },
      { id: 'advanced', label: 'avancé', min: 21, max: 30 },
      { id: 'excellent', label: 'excellent', min: 31, max: 40 },
      { id: 'exceptional', label: 'exceptionnel', min: 41, max: 999 }
    ]
  },
  pushups: {
    label: 'Pompes',
    metric: 'max_set_reps',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 10 },
      { id: 'avg', label: 'moyen', min: 11, max: 25 },
      { id: 'good', label: 'bon', min: 26, max: 50 },
      { id: 'very_good', label: 'très bon', min: 51, max: 75 },
      { id: 'excellent', label: 'excellent', min: 76, max: 100 },
      { id: 'exceptional', label: 'exceptionnel', min: 101, max: 999 }
    ]
  },
  gainage_static: {
    label: 'Gainage (planche statique)',
    metric: 'hold_seconds',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 30 },
      { id: 'avg', label: 'moyen', min: 31, max: 60 },
      { id: 'good', label: 'bon', min: 61, max: 120 },
      { id: 'very_good', label: 'très bon', min: 121, max: 240 },
      { id: 'excellent', label: 'excellent', min: 241, max: 360 },
      { id: 'exceptional', label: 'exceptionnel', min: 361, max: 99999 }
    ]
  },
  plank_straight_arm: {
    label: 'Planche bras tendus',
    metric: 'hold_seconds',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 20 },
      { id: 'avg', label: 'moyen', min: 21, max: 40 },
      { id: 'good', label: 'bon', min: 41, max: 60 },
      { id: 'very_good', label: 'très bon', min: 61, max: 90 },
      { id: 'excellent', label: 'excellent', min: 91, max: 120 },
      { id: 'exceptional', label: 'exceptionnel', min: 121, max: 99999 }
    ]
  },
  side_plank: {
    label: 'Gainage latéral',
    metric: 'hold_seconds',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 20 },
      { id: 'avg', label: 'moyen', min: 21, max: 35 },
      { id: 'good', label: 'bon', min: 36, max: 50 },
      { id: 'very_good', label: 'très bon', min: 51, max: 75 },
      { id: 'excellent', label: 'excellent', min: 76, max: 99999 }
    ]
  },
  wall_sit: {
    label: 'Wall sit / chaise',
    metric: 'hold_seconds',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 30 },
      { id: 'avg', label: 'moyen', min: 31, max: 60 },
      { id: 'good', label: 'bon', min: 61, max: 120 },
      { id: 'very_good', label: 'très bon', min: 121, max: 180 },
      { id: 'excellent', label: 'excellent', min: 181, max: 99999 }
    ]
  },
  bodyweight_squat: {
    label: 'Squats poids du corps',
    metric: 'max_set_reps',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 19 },
      { id: 'novice', label: 'novice', min: 20, max: 39 },
      { id: 'intermediate', label: 'intermédiaire', min: 40, max: 59 },
      { id: 'advanced', label: 'avancé', min: 60, max: 99 },
      { id: 'elite_amateur', label: 'élite amateur', min: 100, max: 999 }
    ]
  },
  dumbbell_curl: {
    label: 'Curl haltères',
    metric: 'max_weight_kg',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 10 },
      { id: 'novice', label: 'novice', min: 10, max: 14 },
      { id: 'intermediate', label: 'intermédiaire', min: 14, max: 18 },
      { id: 'advanced', label: 'avancé', min: 18, max: 24 },
      { id: 'very_advanced', label: 'très avancé', min: 24, max: 30 },
      { id: 'elite_amateur', label: 'élite amateur', min: 30, max: 999 }
    ]
  },
  hammer_curl: {
    label: 'Curl marteau',
    metric: 'max_weight_kg',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 8 },
      { id: 'novice', label: 'novice', min: 10, max: 12 },
      { id: 'intermediate', label: 'intermédiaire', min: 14, max: 18 },
      { id: 'advanced', label: 'avancé', min: 20, max: 24 },
      { id: 'elite_amateur', label: 'élite amateur', min: 26, max: 999 }
    ]
  },
  bench_press: {
    label: 'Développé couché',
    metric: 'max_weight_kg',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 50 },
      { id: 'novice', label: 'novice', min: 50, max: 70 },
      { id: 'intermediate', label: 'intermédiaire', min: 70, max: 90 },
      { id: 'advanced', label: 'avancé', min: 90, max: 120 },
      { id: 'elite_amateur', label: 'élite amateur', min: 120, max: 999 }
    ],
    ratioBwTiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 0.75 },
      { id: 'intermediate', label: 'intermédiaire', min: 0.75, max: 1.0 },
      { id: 'advanced', label: 'avancé', min: 1.0, max: 1.5 },
      { id: 'elite', label: 'élite', min: 1.5, max: 99 }
    ]
  },
  barbell_squat: {
    label: 'Squat barre',
    metric: 'max_weight_kg',
    ratioBwTiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 1.0 },
      { id: 'intermediate', label: 'intermédiaire', min: 1.0, max: 1.5 },
      { id: 'advanced', label: 'avancé', min: 1.5, max: 2.0 },
      { id: 'elite_amateur', label: 'élite amateur', min: 2.0, max: 99 }
    ]
  },
  deadlift: {
    label: 'Soulevé de terre',
    metric: 'max_weight_kg',
    ratioBwTiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 1.25 },
      { id: 'intermediate', label: 'intermédiaire', min: 1.25, max: 1.75 },
      { id: 'advanced', label: 'avancé', min: 1.75, max: 2.25 },
      { id: 'elite_amateur', label: 'élite amateur', min: 2.25, max: 99 }
    ]
  },
  overhead_press: {
    label: 'Développé militaire',
    metric: 'max_weight_kg',
    ratioBwTiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 0.5 },
      { id: 'intermediate', label: 'intermédiaire', min: 0.5, max: 0.75 },
      { id: 'advanced', label: 'avancé', min: 0.75, max: 1.0 },
      { id: 'elite_amateur', label: 'élite amateur', min: 1.0, max: 99 }
    ]
  },
  crunches: {
    label: 'Abdominaux / crunchs',
    metric: 'max_set_reps',
    tiers: [
      { id: 'beginner', label: 'débutant', min: 0, max: 19 },
      { id: 'novice', label: 'novice', min: 20, max: 39 },
      { id: 'intermediate', label: 'intermédiaire', min: 40, max: 59 },
      { id: 'advanced', label: 'avancé', min: 60, max: 99 },
      { id: 'elite_amateur', label: 'élite amateur', min: 100, max: 999 }
    ]
  },
  muscle_up: {
    label: 'Muscle-up strict',
    metric: 'max_set_reps',
    tiers: [
      { id: 'first', label: 'premier cap', min: 1, max: 1 },
      { id: 'advanced', label: 'avancé', min: 2, max: 5 },
      { id: 'expert', label: 'expert', min: 6, max: 10 },
      { id: 'elite_amateur', label: 'élite amateur', min: 11, max: 999 }
    ]
  }
};
