/**
 * Circuits — utilitaires de manipulation des définitions et de la progression.
 *
 * Modèle :
 *  - Une définition de circuit (`CircuitDef`) est stockée dans
 *    `currentData.circuitDefinitions[circuitId]` et référencée par les programmes
 *    via `program.schedule[day].circuitIds = [...]`.
 *  - La progression journalière est stockée dans
 *    `currentData.circuitProgress[YYYY-MM-DD][circuitId] = { roundsCompleted, finishedAt? }`.
 *
 * Cette structure permet :
 *  - de partager la même définition entre plusieurs programmes / jours,
 *  - d'historiser proprement les tours effectués par jour,
 *  - de calculer un XP cohérent depuis `xpCalculations`.
 *
 * @module utils/circuits/circuitDefinitionUtils
 */

import { getDateStr } from '../dateUtils';

const ALLOWED_MODES = ['reps', 'duration'];

/**
 * Génère un identifiant unique pour un nouveau circuit (préfixé `c_`).
 * @returns {string}
 */
export const generateCircuitId = () => {
  const rand = Math.random().toString(36).slice(2, 8);
  return `c_${Date.now().toString(36)}_${rand}`;
};

/**
 * Génère un identifiant unique pour un slot d'exercice dans un circuit.
 * @returns {string}
 */
export const generateCircuitSlotId = () => {
  const rand = Math.random().toString(36).slice(2, 6);
  return `s_${Date.now().toString(36)}_${rand}`;
};

/**
 * Normalise une définition de circuit (clamp + valeurs par défaut).
 * @param {object} input - Définition partielle (issue de l'éditeur).
 * @returns {object} Définition propre prête à être persistée.
 */
export const normalizeCircuitDefinition = (input = {}) => {
  const id = typeof input.id === 'string' && input.id ? input.id : generateCircuitId();
  const targetRaw = Number(input.targetRounds);
  const targetRounds = Number.isFinite(targetRaw) ? Math.min(50, Math.max(1, Math.round(targetRaw))) : 3;
  const restBetweenRoundsSec = Number.isFinite(Number(input.restBetweenRoundsSec))
    ? Math.max(0, Number(input.restBetweenRoundsSec))
    : 60;

  const items = Array.isArray(input.items)
    ? input.items
        .filter((it) => it && typeof it === 'object' && it.exerciseKey)
        .map((it) => {
          const mode = ALLOWED_MODES.includes(it.mode) ? it.mode : 'reps';
          return {
            slotId: typeof it.slotId === 'string' && it.slotId ? it.slotId : generateCircuitSlotId(),
            exerciseKey: String(it.exerciseKey),
            exerciseName: typeof it.exerciseName === 'string' && it.exerciseName ? it.exerciseName : String(it.exerciseKey),
            mode,
            targetReps: mode === 'reps' ? Math.max(1, Math.round(Number(it.targetReps) || 10)) : null,
            targetDurationSec:
              mode === 'duration' ? Math.max(5, Math.round(Number(it.targetDurationSec) || 30)) : null,
            notes: typeof it.notes === 'string' ? it.notes.slice(0, 280) : ''
          };
        })
    : [];

  const primaryMuscles = Array.isArray(input.primaryMuscles)
    ? Array.from(new Set(input.primaryMuscles.filter((m) => typeof m === 'string' && m.trim()).map((m) => m.trim())))
    : [];

  return {
    id,
    name: (typeof input.name === 'string' ? input.name : '').trim().slice(0, 80) || 'Circuit',
    targetRounds,
    restBetweenRoundsSec,
    notes: typeof input.notes === 'string' ? input.notes.slice(0, 500) : '',
    primaryMuscles,
    items,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Insère ou met à jour une définition dans le map `circuitDefinitions`.
 * @param {object} definitions - Map existant.
 * @param {object} definition - Définition normalisée.
 * @returns {object} Nouveau map.
 */
export const upsertCircuitDefinition = (definitions, definition) => {
  return {
    ...(definitions || {}),
    [definition.id]: definition
  };
};

/**
 * Supprime une définition par id et nettoie sa progression.
 * @param {object} state - { circuitDefinitions, circuitProgress }
 * @param {string} circuitId
 * @returns {{ circuitDefinitions: object, circuitProgress: object }}
 */
export const removeCircuitDefinition = (state, circuitId) => {
  const defs = { ...(state.circuitDefinitions || {}) };
  delete defs[circuitId];

  const progress = {};
  Object.entries(state.circuitProgress || {}).forEach(([date, byCircuit]) => {
    const filtered = { ...(byCircuit || {}) };
    delete filtered[circuitId];
    if (Object.keys(filtered).length > 0) progress[date] = filtered;
  });

  return { circuitDefinitions: defs, circuitProgress: progress };
};

/**
 * Renvoie la liste des `circuitIds` actifs pour un jour donné d'un programme.
 * @param {object|null} program - Programme (avec schedule).
 * @param {string} dayName - Nom de jour (ex. "lundi").
 * @returns {string[]}
 */
export const getCircuitIdsForDay = (program, dayName) => {
  if (!program?.schedule || !dayName) return [];
  const day = program.schedule[dayName];
  if (!day) return [];
  return Array.isArray(day.circuitIds) ? day.circuitIds.filter((id) => typeof id === 'string') : [];
};

/**
 * Assigne (ou retire) un circuit à un jour d'un programme. Renvoie une nouvelle copie du programme.
 * @param {object} program - Programme cible.
 * @param {string} dayName
 * @param {string} circuitId
 * @param {boolean} [enabled=true] - true pour assigner, false pour retirer.
 * @returns {object} Nouveau programme.
 */
export const toggleCircuitOnProgramDay = (program, dayName, circuitId, enabled = true) => {
  if (!program || !dayName || !circuitId) return program;
  const schedule = { ...(program.schedule || {}) };
  const existingDay = schedule[dayName] || { name: '', focus: '', exercises: [], duration: '' };
  const ids = new Set(Array.isArray(existingDay.circuitIds) ? existingDay.circuitIds : []);
  if (enabled) ids.add(circuitId);
  else ids.delete(circuitId);

  schedule[dayName] = {
    ...existingDay,
    circuitIds: Array.from(ids)
  };

  return {
    ...program,
    schedule,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Calcule `roundsCompleted` pour un circuit à une date donnée.
 * @param {object} circuitProgress - Map global.
 * @param {string|Date} date
 * @param {string} circuitId
 * @returns {number}
 */
export const getRoundsCompleted = (circuitProgress, date, circuitId) => {
  const dateStr = typeof date === 'string' ? date : getDateStr(date);
  const day = circuitProgress?.[dateStr];
  if (!day) return 0;
  const v = day[circuitId];
  if (!v) return 0;
  return Math.max(0, Math.round(Number(v.roundsCompleted) || 0));
};

/**
 * Renvoie un nouveau `circuitProgress` avec un tour de plus pour `circuitId` à `date`.
 * @param {object} progress
 * @param {string|Date} date
 * @param {string} circuitId
 * @param {{ targetRounds: number }} [definition]
 * @returns {object}
 */
export const incrementRound = (progress, date, circuitId, definition) => {
  const dateStr = typeof date === 'string' ? date : getDateStr(date);
  const safeProgress = progress && typeof progress === 'object' ? progress : {};
  const dayMap = { ...(safeProgress[dateStr] || {}) };
  const current = Math.max(0, Math.round(Number(dayMap[circuitId]?.roundsCompleted) || 0));
  const next = current + 1;
  const target = Math.max(1, Math.round(Number(definition?.targetRounds) || 1));
  const finishedAt = next >= target ? new Date().toISOString() : dayMap[circuitId]?.finishedAt;
  dayMap[circuitId] = {
    roundsCompleted: next,
    ...(finishedAt ? { finishedAt } : {})
  };
  return { ...safeProgress, [dateStr]: dayMap };
};

/**
 * Renvoie un nouveau `circuitProgress` avec un tour de moins (jamais sous zéro).
 * Si retombe à 0, la clé du circuit est supprimée pour ne pas polluer le calendrier.
 */
export const decrementRound = (progress, date, circuitId) => {
  const dateStr = typeof date === 'string' ? date : getDateStr(date);
  const safeProgress = progress && typeof progress === 'object' ? progress : {};
  const dayMap = { ...(safeProgress[dateStr] || {}) };
  const current = Math.max(0, Math.round(Number(dayMap[circuitId]?.roundsCompleted) || 0));
  const next = Math.max(0, current - 1);
  if (next <= 0) {
    delete dayMap[circuitId];
  } else {
    dayMap[circuitId] = { roundsCompleted: next };
  }
  if (Object.keys(dayMap).length === 0) {
    const cleanCopy = { ...safeProgress };
    delete cleanCopy[dateStr];
    return cleanCopy;
  }
  return { ...safeProgress, [dateStr]: dayMap };
};

/**
 * Liste les définitions sous forme de tableau triable, en filtrant éventuellement par muscle.
 * @param {object} circuitDefinitions
 * @param {{ muscle?: string, search?: string }} [opts]
 * @returns {object[]}
 */
export const listCircuits = (circuitDefinitions, opts = {}) => {
  const all = Object.values(circuitDefinitions || {});
  const muscle = (opts.muscle || '').trim().toLowerCase();
  const search = (opts.search || '').trim().toLowerCase();
  return all.filter((c) => {
    if (muscle) {
      const muscles = (c.primaryMuscles || []).map((m) => String(m).toLowerCase());
      if (!muscles.includes(muscle)) return false;
    }
    if (search) {
      const haystack = `${c.name} ${(c.items || []).map((it) => it.exerciseName).join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};

/**
 * Liste toutes les assignations programme/jour d'un circuit donné.
 *
 * Permet d'afficher, depuis le hub Défis > Circuits, la liaison vers le
 * programme (« Assigné à : Mon programme · lundi, mercredi ») et de retirer
 * une assignation depuis le hub.
 *
 * @param {string} circuitId
 * @param {Array<object>} programs - Liste de programmes (ayant `id`, `name`, `schedule`).
 * @returns {Array<{ programId: string, programName: string, dayName: string }>}
 */
export const getCircuitProgramAssignments = (circuitId, programs) => {
  if (!circuitId || !Array.isArray(programs)) return [];
  const out = [];
  programs.forEach((program) => {
    if (!program?.schedule || !program?.id) return;
    Object.entries(program.schedule).forEach(([dayName, day]) => {
      const ids = Array.isArray(day?.circuitIds) ? day.circuitIds : [];
      if (ids.includes(circuitId)) {
        out.push({
          programId: program.id,
          programName: program.name || 'Programme',
          dayName
        });
      }
    });
  });
  return out;
};

/**
 * Récupère, pour une plage de dates, les jours où au moins un circuit a été terminé
 * (>= targetRounds), avec le total de tours effectués.
 *
 * @param {object} circuitProgress
 * @param {object} circuitDefinitions
 * @returns {Array<{ date: string, totalRounds: number, completedCircuits: number }>}
 */
export const getCircuitDailyHistory = (circuitProgress, circuitDefinitions) => {
  const out = [];
  Object.entries(circuitProgress || {}).forEach(([dateStr, byCircuit]) => {
    if (!byCircuit || typeof byCircuit !== 'object') return;
    let totalRounds = 0;
    let completedCircuits = 0;
    Object.entries(byCircuit).forEach(([cid, v]) => {
      const rounds = Math.max(0, Math.round(Number(v?.roundsCompleted) || 0));
      totalRounds += rounds;
      const def = circuitDefinitions?.[cid];
      if (def && rounds >= (def.targetRounds || 1)) completedCircuits += 1;
    });
    if (totalRounds > 0) {
      out.push({ date: dateStr, totalRounds, completedCircuits });
    }
  });
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return out;
};
