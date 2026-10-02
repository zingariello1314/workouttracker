/**
 * Jalons de grades gardés dans localStorage.
 * Ils ne se recalculent pas à l’identique : l’export doit les emporter.
 */

export const SPORT_MILESTONE_LS_KEYS = [
  'sport.gradeMilestones.v1',
  'sport.exerciseGradeMilestones.v1'
];

function readJson(key) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @returns {Record<string, unknown>} */
export function collectSportLocalSnapshot() {
  const entries = {};
  for (const key of SPORT_MILESTONE_LS_KEYS) {
    const value = readJson(key);
    if (value != null) entries[key] = value;
  }
  return {
    schemaVersion: 1,
    entries
  };
}

function mergeGradeMilestoneStore(existing, imported) {
  const base = existing && typeof existing === 'object' ? existing : { version: 1, events: [], maxLevelRecorded: 0 };
  const inc = imported && typeof imported === 'object' ? imported : {};
  const eventsById = new Map();
  for (const event of base.events || []) {
    if (event?.id != null) eventsById.set(event.id, event);
  }
  for (const event of inc.events || []) {
    if (event?.id != null) eventsById.set(event.id, event);
  }
  return {
    version: 1,
    events: [...eventsById.values()],
    maxLevelRecorded: Math.max(Number(base.maxLevelRecorded) || 0, Number(inc.maxLevelRecorded) || 0)
  };
}

function mergeExerciseGradeStore(existing, imported) {
  const base = existing && typeof existing === 'object' ? existing : { version: 1, byCatalog: {} };
  const inc = imported && typeof imported === 'object' ? imported : {};
  const byCatalog = { ...(base.byCatalog || {}) };
  for (const [catalogKey, row] of Object.entries(inc.byCatalog || {})) {
    const prev = byCatalog[catalogKey] || { maxSortIndex: -1, events: [] };
    const eventsById = new Map();
    for (const event of prev.events || []) {
      if (event?.id != null) eventsById.set(event.id, event);
    }
    for (const event of row?.events || []) {
      if (event?.id != null) eventsById.set(event.id, event);
    }
    byCatalog[catalogKey] = {
      maxSortIndex: Math.max(Number(prev.maxSortIndex) || -1, Number(row?.maxSortIndex) || -1),
      events: [...eventsById.values()]
    };
  }
  return { version: 1, byCatalog };
}

/**
 * Réécrit les jalons importés en les fusionnant avec ceux déjà présents.
 * @param {{ entries?: Record<string, unknown> }|null} snapshot
 */
export function restoreSportLocalSnapshot(snapshot) {
  if (typeof localStorage === 'undefined') return { restored: [] };
  const entries = snapshot?.entries;
  if (!entries || typeof entries !== 'object') return { restored: [] };
  const restored = [];
  for (const key of SPORT_MILESTONE_LS_KEYS) {
    if (entries[key] == null) continue;
    const existing = readJson(key);
    const merged =
      key === 'sport.exerciseGradeMilestones.v1'
        ? mergeExerciseGradeStore(existing, entries[key])
        : mergeGradeMilestoneStore(existing, entries[key]);
    localStorage.setItem(key, JSON.stringify(merged));
    restored.push(key);
  }
  return { restored };
}
