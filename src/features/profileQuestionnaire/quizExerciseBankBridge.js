/**
 * Pont lecture seule : entrée exerciseDatabase → forme template quiz (sans toucher la banque).
 */

import {
  computeFitnessForGeneration,
  FITNESS_THRESHOLD_AUTO
} from './exerciseGenerationFitness';
import { resolveFineMuscleFromName } from './quizFineMuscleResolve';

const UPPER_CATEGORIES = /pectoraux|dorsaux|dos|épaules|epaules|bras|biceps|triceps/i;
const LOWER_CATEGORIES = /jambes|cuisses|fessiers|mollets|ischio|quadriceps/i;
const CORE_CATEGORIES = /abdominaux|core|gainage/i;

/**
 * Disciplines / familles hors génération auto quiz (restent dans la banque app).
 */
export function isExcludedFromQuizGeneration(dbKey, dbEntry) {
  const blob = `${dbKey} ${dbEntry?.name || ''} ${dbEntry?.category || ''}`.toLowerCase();
  if (/boxe|boxing|natation|swim|nage\b|piscine/.test(blob)) return true;
  if (/étirement|etirement|stretching|yoga|mobilité|mobilite/.test(blob) && !/gainage/.test(blob)) {
    return true;
  }
  return false;
}

/**
 * @returns {'upper'|'lower'|'core'|'cardio'|null}
 */
export function inferQuizMuscleGroup(dbKey, dbEntry, discipline = '') {
  const name = `${dbKey} ${dbEntry?.name || ''}`.toLowerCase();
  const cat = String(dbEntry?.category || '');

  if (
    discipline === 'endurance' ||
    /course|fractionné|fractionne|burpee|mountain climber|corde à sauter|footing|marche rapide/.test(name)
  ) {
    return 'cardio';
  }
  if (CORE_CATEGORIES.test(cat) || /gainage|abdo|planche/.test(name)) return 'core';
  if (UPPER_CATEGORIES.test(cat)) return 'upper';
  if (LOWER_CATEGORIES.test(cat)) return 'lower';

  const fine = resolveFineMuscleFromName(name);
  if (fine === 'core') return 'core';
  if (['back', 'chest', 'shoulders', 'biceps', 'triceps'].includes(fine)) return 'upper';
  if (['quads', 'hamstrings', 'glutes', 'calves'].includes(fine)) return 'lower';

  if (/pompe|traction|dips|développé|developpe|curl|rowing|tirage|épaule/.test(name)) return 'upper';
  if (/squat|fente|presse|soulevé|souleve|mollet|fessier|ischio/.test(name)) return 'lower';

  return null;
}

/**
 * @param {string} equipmentStr
 * @param {string} dbKey
 * @returns {string[]}
 */
export function mapDbEquipmentToQuizEquipment(equipmentStr, dbKey = '') {
  const eq = String(equipmentStr || '').toLowerCase();
  const key = String(dbKey || '').toLowerCase();
  const out = new Set(['bodyweight']);

  if (/poids du corps|aucun|bodyweight/.test(eq) && !/barre|haltère|machine|poulie|banc/.test(eq)) {
    out.add('bodyweight');
  }
  if (/barre(?! de traction)/.test(eq) || /barbell/.test(eq)) out.add('barbell_plates');
  if (/haltère|dumbbell/.test(eq)) out.add('dumbbells');
  if (/kettlebell|kettle/.test(eq)) out.add('kettlebells');
  if (/banc/.test(eq)) out.add('bench');
  if (/squat|rack|guidé/.test(eq) || key.includes('squat')) out.add('squat_rack');
  if (/poulie|câble|cable|machine/.test(eq)) out.add('cable_machine');
  if (/parallèle|parallel|dip/.test(eq) || key.includes('dips')) {
    out.add('parallel_bars');
    out.add('dip_station');
  }
  if (/traction|pull-up|barre de traction/.test(eq) || /traction/.test(key)) out.add('pullup_bar');
  if (/corde/.test(eq) || key.includes('corde')) out.add('jump_rope');

  if (out.size === 1 && /barre|haltère|machine|poulie|banc|disque/.test(eq)) {
    if (/barre/.test(eq)) out.add('barbell_plates');
    if (/haltère/.test(eq)) out.add('dumbbells');
    if (/banc/.test(eq)) out.add('bench');
    if (/poulie|câble/.test(eq)) out.add('cable_machine');
  }

  return [...out];
}

/**
 * @param {string[]} quizEquipment
 */
export function inferQuizLocationsFromEquipment(quizEquipment) {
  const eq = new Set(quizEquipment);
  const all = ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym', 'track'];

  if (eq.has('cable_machine') && eq.size <= 2) return ['commercial_gym'];
  if (eq.has('barbell_plates') && !eq.has('bodyweight')) {
    return ['commercial_gym', 'home_gym'];
  }
  if (eq.has('jump_rope')) return ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym', 'track'];
  if (eq.has('pullup_bar') && !eq.has('dumbbells') && !eq.has('barbell_plates')) {
    return ['commercial_gym', 'home_gym', 'outdoor'];
  }
  if (eq.size === 1 && eq.has('bodyweight')) return all;
  return all;
}

/**
 * @param {string} dbKey
 * @param {object} dbEntry
 * @param {{ score?: number, discipline?: string }} [fitness]
 * @returns {import('./quizExerciseTemplates.js').QUIZ_LEGACY_EXERCISE_TEMPLATES[0]|null}
 */
export function buildTemplateFromDbEntry(dbKey, dbEntry, fitness = null) {
  const fit = fitness || computeFitnessForGeneration(dbKey, dbEntry);
  const group = inferQuizMuscleGroup(dbKey, dbEntry, fit.discipline);
  if (!group) return null;

  const quizEquipment = mapDbEquipmentToQuizEquipment(dbEntry.equipment, dbKey);
  const locations = inferQuizLocationsFromEquipment(quizEquipment);
  const tier = fit.score >= FITNESS_THRESHOLD_AUTO && group !== 'cardio' ? 'standard' : 'classic';
  const needsLowBar = /australienne/.test(dbKey);

  return {
    dbKey,
    group,
    tier,
    quizEquipment,
    locations,
    ...(needsLowBar ? { needsLowBar: true } : {})
  };
}

export { resolveFineMuscleFromBankEntry } from './quizFineMuscleResolve';
