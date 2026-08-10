/**
 * Historique local des grades exercice (dates de passage).
 */

import { EXERCISE_GRADE_LADDER } from './exerciseGradeLadder';

const LS_KEY = 'sport.exerciseGradeMilestones.v1';

function readStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { version: 1, byCatalog: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.byCatalog !== 'object') {
      return { version: 1, byCatalog: {} };
    }
    return { version: 1, byCatalog: parsed.byCatalog };
  } catch {
    return { version: 1, byCatalog: {} };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function syncExerciseGradeMilestones(catalogKey, sortIndex) {
  if (!catalogKey) return [];
  const store = readStore();
  const prev = store.byCatalog[catalogKey] || { maxSortIndex: -1, events: [] };
  const L = Math.max(-1, Math.floor(Number(sortIndex) ?? -1));
  const now = new Date().toISOString();
  let events = [...(prev.events || [])];

  if (L > prev.maxSortIndex) {
    for (let i = Math.max(0, prev.maxSortIndex + 1); i <= L; i += 1) {
      const grade = EXERCISE_GRADE_LADDER[i];
      if (!grade) continue;
      const id = `${catalogKey}:${grade.id}`;
      if (events.some((e) => e.id === id)) continue;
      events.push({
        id,
        catalogKey,
        gradeId: grade.id,
        gradeLabel: grade.label,
        sortIndex: i,
        at: i === L && prev.maxSortIndex < 0 && L === 0 ? null : now
      });
    }
    store.byCatalog[catalogKey] = { maxSortIndex: L, events };
    writeStore(store);
  }

  return getExerciseGradeMilestones(catalogKey);
}

export function getExerciseGradeMilestones(catalogKey) {
  const store = readStore();
  const row = store.byCatalog[catalogKey];
  if (!row || !Array.isArray(row.events)) return [];
  return [...row.events].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
}

/** Backfill paliers déjà atteints sans date. */
export function backfillExerciseGradeMilestones(catalogKey, sortIndex) {
  syncExerciseGradeMilestones(catalogKey, sortIndex);
}
