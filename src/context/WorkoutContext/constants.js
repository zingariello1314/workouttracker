/**
 * Constantes pour WorkoutContext
 * 
 * ✅ PHASE 4 : Extraction des constantes
 * 
 * @module context/WorkoutContext/constants
 */

export const DEFAULT_PROGRESS_FORM = {
  date: '',
  weight: '',
  measurements: {
    chest: '',
    waist: '',
    hips: '',
    thighs: ''
  },
  notes: ''
};

export const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export const EXERCISE_TYPES = {
  REPS: 'reps',
  DURATION: 'duration',
};

export const PROGRAM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
};
