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

export function mergeExerciseGradeMilestoneAliases(canonicalKey, aliasKeys) {
  if (!canonicalKey || !aliasKeys?.length) return;
  const store = readStore();
  const canonical = store.byCatalog[canonicalKey] || { maxSortIndex: -1, events: [] };
  let maxSortIndex = canonical.maxSortIndex ?? -1;
  const eventsById = new Map((canonical.events || []).map((e) => [e.id, e]));

  aliasKeys.forEach((alias) => {
    const row = store.byCatalog[alias];
    if (!row) return;
    maxSortIndex = Math.max(maxSortIndex, row.maxSortIndex ?? -1);
    (row.events || []).forEach((ev) => {
      const id = `${canonicalKey}:${ev.gradeId}`;
      if (eventsById.has(id)) return;
      eventsById.set(id, {
        ...ev,
        id,
        catalogKey: canonicalKey,
        at: ev.at
      });
    });
  });

  store.byCatalog[canonicalKey] = {
    maxSortIndex,
    events: [...eventsById.values()].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
  };
  writeStore(store);
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

export function clearExerciseGradeMilestones(catalogKey) {
  if (!catalogKey) return;
  const store = readStore();
  if (!store.byCatalog[catalogKey]) return;
  delete store.byCatalog[catalogKey];
  writeStore(store);
}

/** Réaligne l’historique local après suppression de coches (grade peut baisser ou disparaître). */
export function reconcileExerciseGradeMilestones(catalogKey, sortIndex, hasActivity) {
  if (!catalogKey) return [];
  if (!hasActivity || sortIndex == null || sortIndex < 0) {
    clearExerciseGradeMilestones(catalogKey);
    return [];
  }
  const L = Math.max(0, Math.floor(Number(sortIndex) || 0));
  const store = readStore();
  const prev = store.byCatalog[catalogKey] || { maxSortIndex: -1, events: [] };
  const events = (prev.events || []).filter((e) => (e.sortIndex ?? 0) <= L);
  store.byCatalog[catalogKey] = { maxSortIndex: L, events };
  writeStore(store);
  if (L > prev.maxSortIndex) {
    return syncExerciseGradeMilestones(catalogKey, L);
  }
  return getExerciseGradeMilestones(catalogKey);
}

/** Backfill paliers déjà atteints sans date. */
export function backfillExerciseGradeMilestones(catalogKey, sortIndex) {
  syncExerciseGradeMilestones(catalogKey, sortIndex);
}
