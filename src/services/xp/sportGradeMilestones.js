/**
 * Historique local des passages de grade / palier (dates enregistrées côté client).
 */

import { SPORT_GRADE_GATES, SPORT_GRADE_TIER_ROWS } from './sportGradeCatalog';

const LS_KEY = 'sport.gradeMilestones.v1';

function gateLevelMin(gradeId) {
  return SPORT_GRADE_GATES.find((g) => g.toGradeId === gradeId)?.levelMin ?? 0;
}

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

function sortEventsNewestFirst(events) {
  return [...events].sort((a, b) => {
    const ta = a.at ? Date.parse(a.at) : 0;
    const tb = b.at ? Date.parse(b.at) : 0;
    if (tb !== ta) return tb - ta;
    return (b.levelMin || 0) - (a.levelMin || 0);
  });
}

/** Parcours naturel : du premier palier → niveau actuel (lecture haut → bas). */
export function sortMilestonesChronological(events) {
  return [...events].sort((a, b) => {
    const la = a.levelMin ?? gateLevelMin(a.gradeId) ?? 0;
    const lb = b.levelMin ?? gateLevelMin(b.gradeId) ?? 0;
    if (la !== lb) return la - lb;
    if (a.kind === 'gate' && b.kind === 'tier') return -1;
    if (a.kind === 'tier' && b.kind === 'gate') return 1;
    return String(a.id).localeCompare(String(b.id));
  });
}

function milestoneSortLevel(ev, maxLevel) {
  const lm = ev.levelMin ?? (ev.kind === 'gate' ? gateLevelMin(ev.gradeId) : 0);
  return lm <= maxLevel;
}

export function filterMilestonesUpToLevel(events, level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  return events.filter((ev) => milestoneSortLevel(ev, L));
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
      levelMin: gateLevelMin(h.toGradeId),
      at: isFirstSync ? null : now
    });
    known.add(id);
  }

  for (const row of SPORT_GRADE_TIER_ROWS) {
    if (L < row.levelMin) continue;
    const id = eventId('tier', { gradeId: row.gradeId, tier: row.tier });
    if (known.has(id)) continue;
    let at = null;
    if (!isFirstSync && prevMax > 0 && row.levelMin > prevMax && row.levelMin <= L) {
      at = now;
    }
    store.events.push({
      id,
      kind: 'tier',
      gradeId: row.gradeId,
      tier: row.tier,
      levelMin: row.levelMin,
      at
    });
    known.add(id);
  }

  if (isFirstSync || L > prevMax) {
    store.maxLevelRecorded = Math.max(store.maxLevelRecorded || 0, L);
  }

  store.events = sortEventsNewestFirst(store.events);
  writeStore(store);
  return store.events;
}

export function getSportGradeMilestones(level) {
  const raw = sortEventsNewestFirst(readStore().events).map((ev) =>
    ev.kind === 'gate' && ev.levelMin == null
      ? { ...ev, levelMin: gateLevelMin(ev.gradeId) }
      : ev
  );
  if (level == null) return raw;
  return sortMilestonesChronological(filterMilestonesUpToLevel(raw, level));
}
