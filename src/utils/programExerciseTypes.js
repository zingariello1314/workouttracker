/**
 * Typologie des exercices dans les programmes (séparation du champ legacy `type` : circuit, superset…)
 */

import { exerciseDatabase } from '../data/exerciseDatabase';

export const PROGRAM_CATEGORIES = [
  { id: 'muscu', label: 'Musculation' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'street_workout', label: 'Street workout' },
  { id: 'mobilite', label: 'Mobilité' },
  { id: 'core', label: 'Core / gainage' },
  { id: 'autre', label: 'Autre' }
];

/** Sous-types quand catégorie = cardio (course, corde, autre cardio) */
export const CARDIO_KINDS = [
  { id: 'running', label: 'Course à pied' },
  { id: 'jump_rope', label: 'Corde à sauter' },
  { id: 'other', label: 'Autre cardio (vélo, rameur, etc.)' }
];

export const RUNNING_SUBTYPES = [
  { id: 'running_long', label: 'Sortie longue' },
  { id: 'running_short', label: 'Sortie courte / footing' },
  { id: 'running_interval', label: 'Fractionné / VMA' },
  { id: 'running_sprint', label: 'Sprints' },
  { id: 'running_tempo', label: 'Tempo / seuil' },
  { id: 'running_recovery', label: 'Récupération active' },
  { id: 'running_easy', label: 'Endurance facile' }
];

export const JUMP_ROPE_MODES = [
  { id: 'time', label: 'Par durée (min)' },
  { id: 'reps', label: 'Par nombre de sauts' },
  { id: 'rounds', label: 'Par rounds (séries × temps ou sauts)' }
];

export const MUSCU_PATTERNS = [
  { id: '', label: '— Classique —' },
  { id: 'straight', label: 'Séries droites' },
  { id: 'pyramid', label: 'Pyramide' },
  { id: '5x5', label: '5×5' },
  { id: 'amrap', label: 'AMRAP' },
  { id: 'emom', label: 'EMOM' },
  { id: 'superset', label: 'Superset' },
  { id: 'circuit', label: 'Circuit' }
];

export function getCategoryLabel(id) {
  return PROGRAM_CATEGORIES.find((c) => c.id === id)?.label || id || '';
}

/**
 * Inférence depuis nom, matériel, type legacy (ignore un « muscu » par défaut erroné).
 * @param {object} exercise
 * @returns {'muscu'|'cardio'|'street_workout'|'mobilite'|'core'|'autre'}
 */
export function inferProgramExerciseCategoryFromSignals(exercise) {
  const type = String(exercise?.type || '').toLowerCase();
  const name = String(exercise?.name || '').toLowerCase();
  const materiel = String(exercise?.materiel || '').toLowerCase();
  const bankKey = String(exercise?.exerciseBankKey || '').toLowerCase();

  if (type.includes('cardio') || type === 'cardio_technique') return 'cardio';
  if (
    name.includes('course') ||
    name.includes('fractionné') ||
    name.includes('fractionne') ||
    name.includes('footing') ||
    name.includes('running') ||
    name.includes('natation') ||
    name.includes('boxe') ||
    name.includes('vélo') ||
    name.includes('rameur')
  ) {
    return 'cardio';
  }
  if (
    name.includes('corde') ||
    name.includes('burpee') ||
    bankKey.includes('course') ||
    bankKey.includes('corde')
  ) {
    return 'cardio';
  }

  if (type.includes('circuit_abdos') || type === 'core' || name.includes('gainage') || name.includes('planche')) {
    return 'core';
  }

  const muscuEquip =
    /haltère|haltères|barbell|kettlebell|machine|câble|presse|smith|squat rack|leg press|poulie/i;
  const muscuName =
    /développé|couché|soulevé de terre|rowing barre|presse à|leg curl|extension triceps|curl barre|tirage horizontal/i;
  if (muscuEquip.test(materiel) || muscuName.test(name)) return 'muscu';

  const streetName =
    /traction|dip|pompe|pull-up|muscle-up|australien|parallèle|relevé de genoux|muscle up|front lever|back lever/i;
  const streetEquip = /parallèle|poids du corps|barre fixe|barre de traction/i;
  if (streetName.test(name)) return 'street_workout';
  if (streetEquip.test(materiel) && !muscuEquip.test(materiel)) return 'street_workout';
  if (materiel === 'barre' && streetName.test(name)) return 'street_workout';

  if (bankKey && exerciseDatabase[bankKey]?.category === 'Cardio') return 'cardio';
  if (bankKey && exerciseDatabase[bankKey]?.category === 'Abdominaux') return 'core';

  if (materiel.includes('banc') && name.includes('pompe')) return 'street_workout';

  return 'muscu';
}

/** Catégorie affichée : ré-infère toujours (corrige les « muscu » hérités du template). */
export function resolveProgramExerciseCategory(exercise) {
  return inferProgramExerciseCategoryFromSignals(exercise);
}

export function resolveCardioKindForExercise(exercise, category = resolveProgramExerciseCategory(exercise)) {
  if (category !== 'cardio') return '';
  if (exercise?.cardioKind) return exercise.cardioKind;
  const blob = `${exercise?.name || ''} ${exercise?.exerciseBankKey || ''}`.toLowerCase();
  if (blob.includes('course') || blob.includes('running') || blob.includes('footing')) return 'running';
  if (blob.includes('corde')) return 'jump_rope';
  return '';
}

/** Enrichit les exercices d'un programme sans écraser les catégories déjà correctes. */
export function enrichProgramScheduleCategories(program) {
  if (!program?.schedule) return { program, changed: false };

  let changed = false;
  const schedule = { ...program.schedule };

  const patchExercise = (ex) => {
    const programCategory = inferProgramExerciseCategoryFromSignals(ex);
    const cardioKind = resolveCardioKindForExercise(ex, programCategory);
    if (ex.programCategory === programCategory && (ex.cardioKind || '') === cardioKind) return ex;
    changed = true;
    return { ...ex, programCategory, ...(cardioKind ? { cardioKind } : {}) };
  };

  const patchList = (list) => (Array.isArray(list) ? list.map(patchExercise) : list);

  for (const dayKey of Object.keys(schedule)) {
    const day = schedule[dayKey];
    if (!day) continue;
    const next = { ...day };
    if (day.exercises) next.exercises = patchList(day.exercises);
    if (day.salleVariants) {
      const sv = { ...day.salleVariants };
      for (const vk of ['semaineA', 'semaineB']) {
        if (sv[vk]?.exercises) {
          sv[vk] = { ...sv[vk], exercises: patchList(sv[vk].exercises) };
        }
      }
      next.salleVariants = sv;
    }
    schedule[dayKey] = next;
  }

  if (!changed) return { program, changed: false };
  return {
    program: { ...program, schedule, updatedAt: new Date().toISOString() },
    changed: true
  };
}

export function createDefaultExercise() {
  const id = `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: 'Nouvel exercice',
    series: '3×10',
    reps: '',
    rest: 90,
    intensity: 'moderate',
    materiel: '',
    notes: '',
    type: 'standard',
    programCategory: 'muscu',
    programSubType: '',
    cardioKind: '',
    meta: {}
  };
}

export function normalizeExerciseMeta(ex) {
  if (!ex || typeof ex !== 'object') return {};
  const m = ex.meta && typeof ex.meta === 'object' ? { ...ex.meta } : {};
  return m;
}
