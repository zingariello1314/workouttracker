/**
 * Migration des circuits « inline » (type circuit_abdos dans la liste d'exercices)
 * vers le modèle circuitDefinitions + schedule[day].circuitIds.
 *
 * @module utils/circuits/legacyCircuitProgramSync
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import {
  generateCircuitSlotId,
  getCircuitIdsForDay,
  normalizeCircuitDefinition
} from './circuitDefinitionUtils';

export const LEGACY_CIRCUIT_ID_PREFIX = 'legacy_circuit_abdos_';

export function isLegacyCircuitSlotExercise(ex) {
  const type = String(ex?.type || '').toLowerCase();
  return type.includes('circuit_abdos');
}

export function isLegacyCircuitHeaderExercise(ex) {
  const type = String(ex?.type || '').toLowerCase();
  if (type === 'circuit') return true;
  const series = String(ex?.series || '');
  if (type.includes('circuit') && /tour/i.test(series)) return true;
  return false;
}

export function hasLegacyInlineCircuits(program) {
  const sched = program?.schedule;
  if (!sched || typeof sched !== 'object') return false;
  for (const day of Object.values(sched)) {
    if (!day) continue;
    if ((day.exercises || []).some((ex) => isLegacyCircuitSlotExercise(ex) || isLegacyCircuitHeaderExercise(ex))) {
      return true;
    }
    for (const vk of ['semaineA', 'semaineB']) {
      const list = day.salleVariants?.[vk]?.exercises;
      if (Array.isArray(list) && list.some((ex) => isLegacyCircuitSlotExercise(ex) || isLegacyCircuitHeaderExercise(ex))) {
        return true;
      }
    }
  }
  return false;
}

function parseToursFromSeries(series) {
  const m = String(series || '').match(/(\d+)\s*tour/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function findExerciseBankKey(name) {
  const raw = String(name || '').trim().toLowerCase();
  if (!raw) return 'unknown';
  if (exerciseDatabase[raw]) return raw;
  for (const [key, row] of Object.entries(exerciseDatabase)) {
    if (String(row?.name || '').trim().toLowerCase() === raw) return key;
  }
  return raw.replace(/\s+/g, ' ').slice(0, 80);
}

function legacySlotFromExercise(ex) {
  const series = String(ex.series || '');
  const lower = series.toLowerCase();
  let mode = 'reps';
  let targetReps = 10;
  let targetDurationSec = 30;

  if (/sec|min|cycle/i.test(lower)) {
    mode = 'duration';
    const secM = lower.match(/(\d+)\s*sec/);
    const minM = lower.match(/(\d+)\s*min/);
    const cycleM = lower.match(/(\d+)\s*cycle/);
    if (minM) targetDurationSec = Math.max(5, parseInt(minM[1], 10) * 60);
    else if (secM) targetDurationSec = Math.max(5, parseInt(secM[1], 10));
    else if (cycleM) targetDurationSec = Math.max(5, parseInt(cycleM[1], 10) * 5);
    else targetDurationSec = 30;
  } else {
    const repM = series.match(/(\d+)\s*×/i) || series.match(/(\d+)x/i);
    if (repM) targetReps = Math.max(1, parseInt(repM[1], 10));
  }

  const exerciseKey = findExerciseBankKey(ex.name);
  return {
    slotId: generateCircuitSlotId(),
    exerciseKey,
    exerciseName: ex.name || exerciseKey,
    mode,
    targetReps: mode === 'reps' ? targetReps : null,
    targetDurationSec: mode === 'duration' ? targetDurationSec : null,
    notes: typeof ex.notes === 'string' ? ex.notes.slice(0, 280) : ''
  };
}

function splitLegacyCircuitBlocks(exercises) {
  const remaining = [];
  const blocks = [];
  let i = 0;
  const list = Array.isArray(exercises) ? exercises : [];

  while (i < list.length) {
    const ex = list[i];
    if (!isLegacyCircuitHeaderExercise(ex) && !isLegacyCircuitSlotExercise(ex)) {
      remaining.push(ex);
      i += 1;
      continue;
    }

    let targetRounds = 3;
    let blockName = 'Circuit abdos';
    const slots = [];

    if (isLegacyCircuitHeaderExercise(ex)) {
      targetRounds = parseToursFromSeries(ex.series) || targetRounds;
      blockName = ex.name || blockName;
      i += 1;
    }

    while (i < list.length && isLegacyCircuitSlotExercise(list[i])) {
      slots.push(legacySlotFromExercise(list[i]));
      i += 1;
    }

    if (slots.length > 0) {
      blocks.push({ targetRounds, blockName, slots });
    }
  }

  return { remaining, blocks };
}

function migrateExerciseList(exercises, dayKey, suffix, circuitDefinitions, circuitIds) {
  const { remaining, blocks } = splitLegacyCircuitBlocks(exercises);
  let defsChanged = false;

  blocks.forEach((block, blockIndex) => {
    const circuitId = `${LEGACY_CIRCUIT_ID_PREFIX}${dayKey}${suffix ? `_${suffix}` : ''}${blocks.length > 1 ? `_${blockIndex}` : ''}`;
    if (!circuitDefinitions[circuitId]) {
      circuitDefinitions[circuitId] = normalizeCircuitDefinition({
        id: circuitId,
        name: block.blockName,
        targetRounds: block.targetRounds,
        restBetweenRoundsSec: 45,
        primaryMuscles: ['abdominaux', 'core'],
        items: block.slots
      });
      defsChanged = true;
    }
    circuitIds.add(circuitId);
  });

  return { exercises: remaining, defsChanged };
}

function migrateDay(day, dayKey, circuitDefinitions) {
  if (!day || typeof day !== 'object') return { day, changed: false, defsChanged: false };

  let changed = false;
  let defsChanged = false;
  const circuitIds = new Set(Array.isArray(day.circuitIds) ? day.circuitIds : []);
  const next = { ...day };

  if (Array.isArray(day.exercises) && day.exercises.length > 0) {
    const res = migrateExerciseList(day.exercises, dayKey, '', circuitDefinitions, circuitIds);
    if (res.exercises.length !== day.exercises.length) changed = true;
    if (res.defsChanged) defsChanged = true;
    next.exercises = res.exercises;
  }

  if (day.salleVariants && typeof day.salleVariants === 'object') {
    const sv = { ...day.salleVariants };
    for (const vk of ['semaineA', 'semaineB']) {
      const variant = sv[vk];
      if (!variant?.exercises?.length) continue;
      const res = migrateExerciseList(variant.exercises, dayKey, vk, circuitDefinitions, circuitIds);
      if (res.exercises.length !== variant.exercises.length) {
        changed = true;
        sv[vk] = { ...variant, exercises: res.exercises };
      }
      if (res.defsChanged) defsChanged = true;
    }
    next.salleVariants = sv;
  }

  const nextIds = Array.from(circuitIds);
  if (nextIds.length !== (day.circuitIds || []).length || nextIds.some((id, i) => id !== (day.circuitIds || [])[i])) {
    changed = true;
    next.circuitIds = nextIds;
  }

  return { day: next, changed, defsChanged };
}

/**
 * @param {object} program
 * @param {object} circuitDefinitions
 * @returns {{ program: object, circuitDefinitions: object, changed: boolean, defsChanged: boolean, newDefinitionIds: string[] }}
 */
export function migrateLegacyInlineCircuitsForProgram(program, circuitDefinitions = {}) {
  if (!program?.schedule) {
    return {
      program,
      circuitDefinitions,
      changed: false,
      defsChanged: false,
      newDefinitionIds: []
    };
  }

  const defs = { ...(circuitDefinitions || {}) };
  const schedule = { ...program.schedule };
  let changed = false;
  let defsChanged = false;
  const newDefinitionIds = [];
  const beforeIds = new Set(Object.keys(defs));

  for (const [dayKey, day] of Object.entries(schedule)) {
    const res = migrateDay(day, dayKey, defs);
    if (res.changed) {
      schedule[dayKey] = res.day;
      changed = true;
    }
    if (res.defsChanged) defsChanged = true;
  }

  Object.keys(defs).forEach((id) => {
    if (!beforeIds.has(id)) newDefinitionIds.push(id);
  });

  if (!changed && !defsChanged) {
    return {
      program,
      circuitDefinitions: defs,
      changed: false,
      defsChanged: false,
      newDefinitionIds: []
    };
  }

  return {
    program: {
      ...program,
      schedule,
      updatedAt: new Date().toISOString()
    },
    circuitDefinitions: defs,
    changed,
    defsChanged,
    newDefinitionIds
  };
}

/**
 * Recrée une définition « circuit abdos » depuis le template embarqué (workoutProgram).
 * @param {string} dayKey
 * @param {object} templateDay - workoutProgram[dayKey]
 */
export function buildLegacyAbdosCircuitFromTemplate(dayKey, templateDay) {
  const exercices = Array.isArray(templateDay?.exercices) ? templateDay.exercices : [];
  const slots = [];
  let targetRounds = 3;

  for (const ex of exercices) {
    if (isLegacyCircuitHeaderExercise(ex)) {
      targetRounds = parseToursFromSeries(ex.series) || targetRounds;
      continue;
    }
    if (isLegacyCircuitSlotExercise(ex)) {
      slots.push(legacySlotFromExercise(ex));
    }
  }

  if (slots.length === 0) return null;

  const circuitId = `${LEGACY_CIRCUIT_ID_PREFIX}${dayKey}`;
  return normalizeCircuitDefinition({
    id: circuitId,
    name: 'Circuit abdos',
    targetRounds,
    restBetweenRoundsSec: 45,
    primaryMuscles: ['abdominaux', 'core'],
    items: slots
  });
}

/**
 * Répare les circuitIds présents sur le programme mais absents de circuitDefinitions
 * (ex. migration interrompue avant sauvegarde IndexedDB).
 */
export function repairOrphanCircuitReferences(program, circuitDefinitions = {}, workoutProgramTemplate = {}) {
  if (!program?.schedule) {
    return { program, circuitDefinitions, defsChanged: false, repairedIds: [] };
  }

  const defs = { ...(circuitDefinitions || {}) };
  const repairedIds = [];
  let defsChanged = false;

  for (const dayKey of Object.keys(program.schedule)) {
    const ids = getCircuitIdsForDay(program, dayKey);
    for (const cid of ids) {
      if (!cid || defs[cid]) continue;
      if (!String(cid).startsWith(LEGACY_CIRCUIT_ID_PREFIX)) continue;
      const def = buildLegacyAbdosCircuitFromTemplate(dayKey, workoutProgramTemplate[dayKey]);
      if (!def) continue;
      defs[cid] = def;
      repairedIds.push(cid);
      defsChanged = true;
    }
  }

  return {
    program,
    circuitDefinitions: defs,
    defsChanged,
    repairedIds
  };
}

/** IDs de circuit référencés par le programme mais sans définition en bibliothèque. */
export function listOrphanCircuitIds(program, circuitDefinitions = {}) {
  const orphans = [];
  if (!program?.schedule) return orphans;
  const defs = circuitDefinitions || {};
  for (const dayKey of Object.keys(program.schedule)) {
    for (const cid of getCircuitIdsForDay(program, dayKey)) {
      if (cid && !defs[cid]) orphans.push({ dayKey, circuitId: cid });
    }
  }
  return orphans;
}
