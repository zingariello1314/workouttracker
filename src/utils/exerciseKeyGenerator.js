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
 * Partie date (YYYY-MM-DD) d'une clé d'exercice `YYYY-MM-DD_id[_semaineA|B]`.
 * @param {string} key
 * @returns {string}
 */
export const extractDateStrFromWorkoutKey = (key) => {
  const k = String(key || '');
  const idx = k.indexOf('_');
  if (idx < 0) return '';
  return k.slice(0, idx);
};

/**
 * Identifiant exercice (sans suffixe salle) depuis une clé reps/coché.
 * @param {string} key
 * @returns {string}
 */
export const extractExerciseIdFromWorkoutKey = (key) => {
  const k = String(key || '');
  const idx = k.indexOf('_');
  if (idx < 0) return k;
  return k.slice(idx + 1).replace(/_semaineA$|_semaineB$/, '');
};

/**
 * Dernière valeur de poids enregistrée pour un id d’exercice (toutes dates),
 * pour préremplir la saisie du jour (clés du type YYYY-MM-DD_id[_semaineA|B]).
 */
function considerLatestWeight(datePart, raw, state) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return;
  const val = String(raw).trim().replace(',', '.');
  const n = parseFloat(val);
  if (!Number.isFinite(n) || n <= 0) return;
  if (datePart >= state.bestDate) {
    state.bestDate = datePart;
    state.bestVal = val;
  }
}

export const findLatestExerciseWeightValue = (currentData, exerciseIds) => {
  const ids = [...new Set((exerciseIds || []).filter((x) => x != null).map(String))];
  if (!ids.length) return '';
  const idSet = new Set(ids);
  const state = { bestDate: '', bestVal: '' };

  const dateIfMatch = (key) => {
    const datePart = String(key || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return '';
    const idFromKey = extractExerciseIdFromWorkoutKey(key);
    return idSet.has(idFromKey) ? datePart : '';
  };

  const weights = currentData?.exerciseWeights;
  if (weights && typeof weights === 'object') {
    for (const [key, raw] of Object.entries(weights)) {
      const datePart = dateIfMatch(key);
      if (datePart) considerLatestWeight(datePart, raw, state);
    }
  }

  const setW = currentData?.exerciseSetWeights;
  if (setW && typeof setW === 'object') {
    for (const [key, row] of Object.entries(setW)) {
      const datePart = dateIfMatch(key);
      if (!datePart || !Array.isArray(row)) continue;
      for (let i = row.length - 1; i >= 0; i -= 1) {
        if (row[i] != null && String(row[i]).trim() !== '') {
          considerLatestWeight(datePart, row[i], state);
          break;
        }
      }
    }
  }

  const logs = currentData?.exerciseSetLogs;
  if (logs && typeof logs === 'object') {
    for (const [key, log] of Object.entries(logs)) {
      const datePart = dateIfMatch(key);
      if (!datePart) continue;
      const sets = Array.isArray(log?.sets) ? log.sets : [];
      for (let i = sets.length - 1; i >= 0; i -= 1) {
        const w = sets[i]?.weight;
        if (w != null && Number(w) > 0) {
          considerLatestWeight(datePart, w, state);
          break;
        }
      }
    }
  }

  return state.bestVal;
};

const WEIGHT_SCAN_BUDGET_MS = 8;

/**
 * Même résultat que `findLatestExerciseWeightValue`, mais en tranches courtes
 * pour ne pas bloquer la saisie pendant le préremplissage du poids.
 * @param {object} currentData
 * @param {Array<string|number>} exerciseIds
 * @returns {Promise<string>}
 */
export function findLatestExerciseWeightValueYielding(currentData, exerciseIds) {
  const ids = [...new Set((exerciseIds || []).filter((x) => x != null).map(String))];
  if (!ids.length) return Promise.resolve('');
  const idSet = new Set(ids);
  const state = { bestDate: '', bestVal: '' };

  const dateIfMatch = (key) => {
    const datePart = String(key || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return '';
    const idFromKey = extractExerciseIdFromWorkoutKey(key);
    return idSet.has(idFromKey) ? datePart : '';
  };

  const maps = [
    currentData?.exerciseWeights,
    currentData?.exerciseSetWeights,
    currentData?.exerciseSetLogs,
  ];
  let mapIndex = 0;
  let keys = [];
  let keyIndex = 0;
  let mode = 'weights';

  return new Promise((resolve) => {
    const step = () => {
      const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
      while ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started < WEIGHT_SCAN_BUDGET_MS) {
        if (keyIndex >= keys.length) {
          if (mapIndex >= maps.length) {
            resolve(state.bestVal);
            return;
          }
          const obj = maps[mapIndex];
          mode = mapIndex === 0 ? 'weights' : mapIndex === 1 ? 'sets' : 'logs';
          mapIndex += 1;
          keys = obj && typeof obj === 'object' ? Object.keys(obj) : [];
          keyIndex = 0;
          continue;
        }
        const key = keys[keyIndex];
        keyIndex += 1;
        const datePart = dateIfMatch(key);
        if (!datePart) continue;
        const raw = maps[mapIndex - 1]?.[key];
        if (mode === 'weights') {
          considerLatestWeight(datePart, raw, state);
        } else if (mode === 'sets' && Array.isArray(raw)) {
          for (let i = raw.length - 1; i >= 0; i -= 1) {
            if (raw[i] != null && String(raw[i]).trim() !== '') {
              considerLatestWeight(datePart, raw[i], state);
              break;
            }
          }
        } else if (mode === 'logs') {
          const sets = Array.isArray(raw?.sets) ? raw.sets : [];
          for (let i = sets.length - 1; i >= 0; i -= 1) {
            const w = sets[i]?.weight;
            if (w != null && Number(w) > 0) {
              considerLatestWeight(datePart, w, state);
              break;
            }
          }
        }
      }
      setTimeout(step, 0);
    };
    step();
  });
}

/**
 * Index id → dernière charge, construit au ralenti quand la séance n’est pas en cours
 * d’édition. La coche lit cet index en O(1) au lieu de parcourir tout l’historique.
 */
const lastWeightByExerciseId = new Map();
let weightIndexPaused = true;
let weightIndexScheduled = false;
let weightIndexGetData = null;
let weightIndexSource = null;
let weightIndexMapIndex = 0;
let weightIndexKeys = null;
let weightIndexKeyIndex = 0;
let weightIndexDone = false;

function weightIndexMaps(data) {
  return [data?.exerciseWeights, data?.exerciseSetWeights, data?.exerciseSetLogs];
}

function ingestIndexedWeight(exerciseId, datePart, raw) {
  if (!exerciseId || !datePart) return;
  const state = { bestDate: '', bestVal: '' };
  const prev = lastWeightByExerciseId.get(exerciseId);
  if (prev) {
    state.bestDate = prev.date;
    state.bestVal = prev.val;
  }
  considerLatestWeight(datePart, raw, state);
  if (state.bestVal) {
    lastWeightByExerciseId.set(exerciseId, { date: state.bestDate, val: state.bestVal });
  }
}

function ingestIndexedEntry(mode, key, raw) {
  const datePart = String(key || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return;
  const exerciseId = extractExerciseIdFromWorkoutKey(key);
  if (!exerciseId) return;
  if (mode === 'weights') {
    ingestIndexedWeight(exerciseId, datePart, raw);
    return;
  }
  if (mode === 'sets' && Array.isArray(raw)) {
    for (let i = raw.length - 1; i >= 0; i -= 1) {
      if (raw[i] != null && String(raw[i]).trim() !== '') {
        ingestIndexedWeight(exerciseId, datePart, raw[i]);
        return;
      }
    }
    return;
  }
  const sets = Array.isArray(raw?.sets) ? raw.sets : [];
  for (let i = sets.length - 1; i >= 0; i -= 1) {
    const w = sets[i]?.weight;
    if (w != null && Number(w) > 0) {
      ingestIndexedWeight(exerciseId, datePart, w);
      return;
    }
  }
}

function resetWeightIndexCursor() {
  weightIndexMapIndex = 0;
  weightIndexKeys = null;
  weightIndexKeyIndex = 0;
  weightIndexDone = false;
}

export function pauseLastExerciseWeightIndex() {
  weightIndexPaused = true;
}

export function noteLastExerciseWeightFromKey(storageKey, raw) {
  const datePart = extractDateStrFromWorkoutKey(storageKey);
  const exerciseId = extractExerciseIdFromWorkoutKey(storageKey);
  ingestIndexedWeight(exerciseId, datePart, raw);
}

export function isLastExerciseWeightIndexReady() {
  return weightIndexDone && weightIndexSource != null;
}

export function peekLastExerciseWeightValue(exerciseIds) {
  const ids = [...new Set((exerciseIds || []).filter((x) => x != null).map(String))];
  let bestDate = '';
  let bestVal = '';
  for (let i = 0; i < ids.length; i += 1) {
    const hit = lastWeightByExerciseId.get(ids[i]);
    if (hit && hit.date >= bestDate && hit.val) {
      bestDate = hit.date;
      bestVal = hit.val;
    }
  }
  return bestVal;
}

function scheduleWeightIndexSlice() {
  if (weightIndexScheduled || weightIndexPaused || weightIndexDone) return;
  weightIndexScheduled = true;
  const run = (deadline) => {
    weightIndexScheduled = false;
    if (weightIndexPaused || weightIndexDone) return;
    const data = typeof weightIndexGetData === 'function' ? weightIndexGetData() : null;
    if (!data || data !== weightIndexSource) {
      weightIndexSource = data;
      lastWeightByExerciseId.clear();
      resetWeightIndexCursor();
      if (!data) return;
    }
    const maps = weightIndexMaps(data);
    const remaining = typeof deadline?.timeRemaining === 'function' ? deadline.timeRemaining() : 6;
    if (remaining < 2) {
      setTimeout(scheduleWeightIndexSlice, 32);
      return;
    }
    const budgetMs = Math.min(6, remaining);
    const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
    while ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started < budgetMs) {
      if (weightIndexMapIndex >= maps.length) {
        weightIndexDone = true;
        return;
      }
      const obj = maps[weightIndexMapIndex];
      if (!weightIndexKeys) {
        weightIndexKeys = obj && typeof obj === 'object' ? Object.keys(obj) : [];
        weightIndexKeyIndex = 0;
      }
      if (weightIndexKeyIndex >= weightIndexKeys.length) {
        weightIndexMapIndex += 1;
        weightIndexKeys = null;
        weightIndexKeyIndex = 0;
        continue;
      }
      const key = weightIndexKeys[weightIndexKeyIndex];
      weightIndexKeyIndex += 1;
      const mode = weightIndexMapIndex === 0 ? 'weights' : weightIndexMapIndex === 1 ? 'sets' : 'logs';
      ingestIndexedEntry(mode, key, obj?.[key]);
    }
    scheduleWeightIndexSlice();
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 800 });
  } else {
    setTimeout(() => run(null), 48);
  }
}

/** Reprend le remplissage seulement hors édition. Même objet de données = on continue. */
export function resumeLastExerciseWeightIndex(getCurrentData) {
  weightIndexGetData = getCurrentData;
  weightIndexPaused = false;
  const data = typeof getCurrentData === 'function' ? getCurrentData() : null;
  if (data !== weightIndexSource) {
    weightIndexSource = data;
    lastWeightByExerciseId.clear();
    resetWeightIndexCursor();
  }
  if (!weightIndexDone) scheduleWeightIndexSlice();
}

/** Pour les tests : même résultat que findLatest, sans attendre le ralenti. */
export function rebuildLastExerciseWeightIndexSync(data) {
  pauseLastExerciseWeightIndex();
  weightIndexSource = data || null;
  lastWeightByExerciseId.clear();
  resetWeightIndexCursor();
  weightIndexDone = true;
  if (!data) return;
  const maps = weightIndexMaps(data);
  const modes = ['weights', 'sets', 'logs'];
  for (let m = 0; m < maps.length; m += 1) {
    const obj = maps[m];
    if (!obj || typeof obj !== 'object') continue;
    for (const key of Object.keys(obj)) {
      ingestIndexedEntry(modes[m], key, obj[key]);
    }
  }
}

/**
 * Génère une clé pour un étirement (legacy : granularité par moment)
 * 
 * Format : "YYYY-MM-DD_moment" (matin, midi, soir)
 * 
 * ⚠️ Conservé pour rétro-compat lecture seule. Pour les nouvelles fonctionnalités,
 * utiliser `generateStretchItemKey` qui descend à l'item individuel.
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
 * Génère une clé pour un étirement INDIVIDUEL (nouvelle granularité par item).
 * 
 * Format : "YYYY-MM-DD_stretch_moment_stretchId"
 *   ex: "2026-05-09_stretch_matin_9111"
 * 
 * Le segment "stretch" évite toute collision avec les clés d'exercices
 * (qui utilisent "YYYY-MM-DD_<numericExerciseId>") et avec les clés d'étirements
 * legacy ("YYYY-MM-DD_matin").
 * 
 * @param {Date|string} date - Date de l'étirement
 * @param {string} moment - Moment ('matin', 'midi', 'soir')
 * @param {string|number} stretchId - ID stable de l'item d'étirement (range 9000-9999 pour le programme par défaut)
 * @returns {string} Clé générée
 * 
 * @example
 * generateStretchItemKey('2026-05-09', 'matin', 9111) // "2026-05-09_stretch_matin_9111"
 */
export const generateStretchItemKey = (date, moment, stretchId) => {
  const dateStr = getDateStr(date);
  return `${dateStr}_stretch_${moment}_${stretchId}`;
};

/**
 * Parse une clé d'étirement individuel.
 * 
 * @param {string} key - Clé à parser
 * @returns {{dateStr: string, moment: string, stretchId: string}|null}
 * 
 * @example
 * parseStretchItemKey("2026-05-09_stretch_matin_9111")
 *   // { dateStr: "2026-05-09", moment: "matin", stretchId: "9111" }
 */
export const parseStretchItemKey = (key) => {
  if (!key || typeof key !== 'string') return null;
  const match = key.match(/^(\d{4}-\d{2}-\d{2})_stretch_(matin|midi|soir)_(.+)$/);
  if (!match) return null;
  return { dateStr: match[1], moment: match[2], stretchId: match[3] };
};

/**
 * Vérifie si une clé est une clé d'étirement individuel (nouveau format).
 */
export const isStretchItemKey = (key) => {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}_stretch_(matin|midi|soir)_/.test(key);
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










