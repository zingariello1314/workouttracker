/**
 * 🔑 GÉNÉRATEUR DE CLÉS D'EXERCICES
 * 
 * Centralise la génération de clés pour les exercices, étirements et activités complémentaires.
 * Assure la cohérence et évite les erreurs de formatage.
 * 
 * @module exerciseKeyGenerator
 */

import { getDateStr } from './dateUtils';
import { getAutoWeekVariant } from './dateUtils';

/**
 * Types de clés supportés
 */
export const KEY_TYPES = {
  EXERCISE: 'exercise',
  EXERCISE_GYM: 'exercise_gym',
  STRETCH: 'stretch',
  COMPLEMENTARY: 'complementary',
  COMPLEMENTARY_MINUTES: 'complementary_minutes'
};

/**
 * Génère une clé pour un exercice standard
 * 
 * Format : "YYYY-MM-DD_exerciseId"
 * 
 * @param {Date|string} date - Date de l'exercice
 * @param {string|number} exerciseId - ID de l'exercice
 * @returns {string} Clé générée
 * 
 * @example
 * generateExerciseKey(new Date('2024-01-15'), 101) // "2024-01-15_101"
 */
export const generateExerciseKey = (date, exerciseId) => {
  const dateStr = getDateStr(date);
  return `${dateStr}_${exerciseId}`;
};

/**
 * Génère une clé pour un exercice en mode salle (avec variante semaine)
 * 
 * Format : "YYYY-MM-DD_exerciseId_semaineA" ou "_semaineB"
 * 
 * @param {Date|string} date - Date de l'exercice
 * @param {string|number} exerciseId - ID de l'exercice
 * @param {string} weekVariant - Variante de semaine ('A' ou 'B'), si non fourni calcule automatiquement
 * @returns {string} Clé générée
 * 
 * @example
 * generateGymExerciseKey(new Date('2024-01-15'), 631, 'A') // "2024-01-15_631_semaineA"
 */
export const generateGymExerciseKey = (date, exerciseId, weekVariant = null) => {
  const dateStr = getDateStr(date);
  
  // Si weekVariant non fourni, calculer automatiquement
  if (!weekVariant) {
    weekVariant = getAutoWeekVariant(date);
  }
  
  const weekSuffix = weekVariant === 'A' ? '_semaineA' : '_semaineB';
  return `${dateStr}_${exerciseId}${weekSuffix}`;
};

/**
 * Génère une clé intelligente pour un exercice (standard ou gym selon contexte)
 * 
 * @param {Date|string} date - Date de l'exercice
 * @param {string|number} exerciseId - ID de l'exercice
 * @param {Object} options - Options
 * @param {boolean} options.isGymMode - Si true, utilise variante gym
 * @param {boolean} options.workoutIsGymMode - Si le workout est en mode gym
 * @param {string} options.weekVariant - Variante de semaine ('A' ou 'B'), calculée si non fourni
 * @returns {string} Clé générée
 * 
 * @example
 * generateSmartExerciseKey(date, 101, { isGymMode: true, workoutIsGymMode: true })
 */
export const generateSmartExerciseKey = (date, exerciseId, options = {}) => {
  const { isGymMode = false, workoutIsGymMode = false, weekVariant = null } = options;
  
  // Si mode gym activé ET workout supporte gym, utiliser variante
  if (isGymMode && workoutIsGymMode) {
    return generateGymExerciseKey(date, exerciseId, weekVariant);
  }
  
  // Sinon, exercice standard
  return generateExerciseKey(date, exerciseId);
};

/**
 * Toutes les clés possibles pour les reps d’un même exercice (maison vs salle A/B),
 * pour retrouver les données après changement de mode ou de variante.
 */
export const collectAllExerciseRepKeys = (date, exerciseId, options = {}) => {
  const primary = generateSmartExerciseKey(date, exerciseId, options);
  const base = generateExerciseKey(date, exerciseId);
  const a = generateGymExerciseKey(date, exerciseId, 'A');
  const b = generateGymExerciseKey(date, exerciseId, 'B');
  return [...new Set([primary, base, a, b])];
};

/**
 * Clés candidates pour un objet exercice affiché (id affiché + originalId programme actif).
 */
export const collectExerciseKeysForWorkoutExercise = (date, exercise, options = {}) => {
  const ids = [];
  if (exercise?.id != null) ids.push(exercise.id);
  if (exercise?.originalId != null && String(exercise.originalId) !== String(exercise.id)) {
    ids.push(exercise.originalId);
  }
  const out = [];
  ids.forEach((eid) => {
    collectAllExerciseRepKeys(date, eid, options).forEach((k) => {
      if (!out.includes(k)) out.push(k);
    });
  });
  return out;
};

/**
 * Clés reps/checked pour le calendrier (date déjà en string) : id + originalId + variantes salle.
 */
export const collectCalendarRepKeysForExercise = (dateStr, exercise) => {
  const ids = new Set();
  if (exercise?.id != null) ids.add(exercise.id);
  if (exercise?.originalId != null) ids.add(exercise.originalId);
  const out = [];
  ids.forEach((idPart) => {
    const base = `${dateStr}_${idPart}`;
    out.push(base, `${base}_semaineA`, `${base}_semaineB`);
  });
  return [...new Set(out)];
};

/**
 * Choisit la clé reps/checked la plus fiable parmi une liste (cohérent avec le calendrier).
 */
export const resolveBestRepsStorageKey = (currentData, keys) => {
  if (!keys?.length) return null;
  let bestKey = null;
  let bestReps = 0;
  let actualKey = null;
  for (const key of keys) {
    const keyReps = currentData?.reps?.[key];
    const keyChecked = currentData?.checkedExercises?.[key];
    if (keyChecked === true && keyReps !== undefined && parseInt(String(keyReps), 10) > 0) {
      const parsedReps = parseInt(String(keyReps), 10) || 0;
      if (parsedReps > bestReps) {
        bestKey = key;
        bestReps = parsedReps;
      }
    }
    if (!actualKey && (keyReps !== undefined || keyChecked !== undefined)) {
      actualKey = key;
    }
  }
  return bestKey || actualKey || keys[0];
};

/**
 * Génère une clé pour un étirement
 * 
 * Format : "YYYY-MM-DD_moment" (matin, midi, soir)
 * 
 * @param {Date|string} date - Date de l'étirement
 * @param {string} moment - Moment de l'étirement ('matin', 'midi', 'soir')
 * @returns {string} Clé générée
 * 
 * @example
 * generateStretchKey(new Date('2024-01-15'), 'matin') // "2024-01-15_matin"
 */
export const generateStretchKey = (date, moment) => {
  const dateStr = getDateStr(date);
  return `${dateStr}_${moment}`;
};

/**
 * Génère une clé pour une activité complémentaire (checkbox)
 * 
 * Format : "YYYY-MM-DD_complementary_activityName"
 * 
 * @param {Date|string} date - Date de l'activité
 * @param {string} activityName - Nom de l'activité (normalisé en lowercase)
 * @returns {string} Clé générée
 * 
 * @example
 * generateComplementaryKey(new Date('2024-01-15'), 'Boxe') // "2024-01-15_complementary_boxe"
 */
export const generateComplementaryKey = (date, activityName) => {
  const dateStr = getDateStr(date);
  const normalizedName = activityName.toLowerCase();
  return `${dateStr}_complementary_${normalizedName}`;
};

/**
 * Génère une clé pour les minutes d'une activité complémentaire
 * 
 * Format : "YYYY-MM-DD_complementary_activityName_minutes"
 * 
 * @param {Date|string} date - Date de l'activité
 * @param {string} activityName - Nom de l'activité (normalisé en lowercase)
 * @returns {string} Clé générée
 * 
 * @example
 * generateComplementaryMinutesKey(new Date('2024-01-15'), 'Boxe') // "2024-01-15_complementary_boxe_minutes"
 */
export const generateComplementaryMinutesKey = (date, activityName) => {
  const dateStr = getDateStr(date);
  const normalizedName = activityName.toLowerCase();
  return `${dateStr}_complementary_${normalizedName}_minutes`;
};

/**
 * Parse une clé d'exercice pour extraire ses composants
 * 
 * @param {string} key - Clé à parser
 * @returns {Object|null} { dateStr, exerciseId, weekVariant } ou null si invalide
 * 
 * @example
 * parseExerciseKey("2024-01-15_101_semaineA") // { dateStr: "2024-01-15", exerciseId: "101", weekVariant: "A" }
 */
export const parseExerciseKey = (key) => {
  if (!key || typeof key !== 'string') {
    return null;
  }
  
  const parts = key.split('_');
  if (parts.length < 2) {
    return null;
  }
  
  const dateStr = parts[0];
  const exerciseId = parts[1];
  
  // Vérifier si c'est une variante gym
  if (parts.length === 3 && (parts[2] === 'semaineA' || parts[2] === 'semaineB')) {
    const weekVariant = parts[2] === 'semaineA' ? 'A' : 'B';
    return { dateStr, exerciseId, weekVariant };
  }
  
  return { dateStr, exerciseId, weekVariant: null };
};

/**
 * Parse une clé d'étirement pour extraire ses composants
 * 
 * @param {string} key - Clé à parser
 * @returns {Object|null} { dateStr, moment } ou null si invalide
 */
export const parseStretchKey = (key) => {
  if (!key || typeof key !== 'string') {
    return null;
  }
  
  const parts = key.split('_');
  if (parts.length !== 2) {
    return null;
  }
  
  const dateStr = parts[0];
  const moment = parts[1];
  
  return { dateStr, moment };
};

/**
 * Vérifie si une clé correspond à un exercice en mode gym
 * 
 * @param {string} key - Clé à vérifier
 * @returns {boolean} True si c'est une clé gym
 */
export const isGymExerciseKey = (key) => {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  return key.includes('_semaineA') || key.includes('_semaineB');
};










