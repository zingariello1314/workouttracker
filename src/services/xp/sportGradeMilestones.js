/**
 * Historique local des passages de grade / palier (dates enregistrées côté client).
 */

import { SPORT_GRADE_TIER_ROWS } from './sportGradeCatalog';

const LS_KEY = 'sport.gradeMilestones.v1';

function readStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { version: 1, events: [], maxLevelRecorded: 0 };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.events)) {
      return { version: 1, events: [], maxLevelRecorded: 0 };
    }
    return {
      version: 1,
      events: parsed.events,
      maxLevelRecorded: Number(parsed.maxLevelRecorded) || 0
    };
  } catch {
    return { version: 1, events: [], maxLevelRecorded: 0 };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function eventId(kind, payload) {
  if (kind === 'gate') return `gate:${payload.gradeId}`;
  if (kind === 'tier') return `tier:${payload.gradeId}:${payload.tier}`;
  return `${kind}:${JSON.stringify(payload)}`;
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const ta = a.at ? Date.parse(a.at) : 0;
    const tb = b.at ? Date.parse(b.at) : 0;
    if (tb !== ta) return tb - ta;
    return (b.levelMin || 0) - (a.levelMin || 0);
  });
}

/**
 * Enregistre les nouveaux passages détectés (idempotent par id d’événement).
 */
export function syncSportGradeMilestones({ level, grades }) {
  const store = readStore();
  const known = new Set(store.events.map((e) => e.id));
  const now = new Date().toISOString();
  const L = Math.max(1, Math.floor(Number(level) || 1));
  const prevMax = store.maxLevelRecorded || 0;
  const isFirstSync = prevMax === 0;

  const gateHistory = grades?.gateHistory || [];
  for (const h of gateHistory) {
    if (!h.passed || !h.toGradeId) continue;
    const id = eventId('gate', { gradeId: h.toGradeId });
    if (known.has(id)) continue;
    store.events.push({
      id,
      kind: 'gate',
      gradeId: h.toGradeId,
      path: h.path || null,
      at: isFirstSync ? null : now
    });
    known.add(id);
  }

  if (isFirstSync) {
    for (const row of SPORT_GRADE_TIER_ROWS) {
      if (L < row.levelMin) continue;
      const id = eventId('tier', { gradeId: row.gradeId, tier: row.tier });
      if (known.has(id)) continue;
      store.events.push({
        id,
        kind: 'tier',
        gradeId: row.gradeId,
        tier: row.tier,
        levelMin: row.levelMin,
        at: null
      });
      known.add(id);
    }
    store.maxLevelRecorded = L;
  } else if (L > prevMax) {
    for (const row of SPORT_GRADE_TIER_ROWS) {
      if (row.levelMin <= prevMax || row.levelMin > L) continue;
      const id = eventId('tier', { gradeId: row.gradeId, tier: row.tier });
      if (known.has(id)) continue;
      store.events.push({
        id,
        kind: 'tier',
        gradeId: row.gradeId,
        tier: row.tier,
        levelMin: row.levelMin,
        at: now
      });
      known.add(id);
    }
    store.maxLevelRecorded = L;
  }

  store.events = sortEvents(store.events);
  writeStore(store);
  return store.events;
}

export function getSportGradeMilestones() {
  return sortEvents(readStore().events);
}
