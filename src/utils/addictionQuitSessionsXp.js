/**
 * Sessions d'arrêt (entre deux craquages), craquages enregistrés, XP dérivé.
 */

import { getDateStr } from './dateUtils';
import {
  CIGARETTE_TIMELINE_FR,
  THC_TIMELINE_FR,
} from './addictionQuitConstants';
import { normalizeCravingsByDay } from './addictionQuitHelpers';

const TRACK_IDS = ['cigarette', 'thc'];

export function newSessionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newRelapseId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** XP unique par jalon franchi dans une session (index 0 = premier palier) */
export function xpMilestoneOnce(milestoneIndex) {
  return 6 + Math.min(24, Math.floor(milestoneIndex / 2));
}

/** XP par jour calendaire local passé en abstinence (partiel ou entier) */
export function xpDailyForMilestonesCount(nMilestonesPassed) {
  const base = 4;
  const bonus = Math.min(50, Math.floor((nMilestonesPassed || 0) / 2));
  return base + bonus;
}

export function getMilestonesForTrack(trackId) {
  return trackId === 'thc' ? THC_TIMELINE_FR : CIGARETTE_TIMELINE_FR;
}

function localDayBoundsMs(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  return { start, end };
}

/** Jours calendaires locaux qui intersectent [startIso, endMs] */
export function enumerateLocalDaysOverlapping(startIso, endMs) {
  const s0 = new Date(startIso).getTime();
  if (Number.isNaN(s0)) return [];
  const e1 = Math.max(s0, endMs);
  const out = [];
  const cur = new Date(startIso);
  cur.setHours(0, 0, 0, 0);
  const limit = new Date(e1);
  limit.setHours(23, 59, 59, 999);
  const guard = new Date(cur);
  guard.setFullYear(guard.getFullYear() + 25);
  while (cur.getTime() <= limit.getTime() && cur <= guard) {
    out.push(getDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function countMilestonesPassed(elapsedMsVal, milestones) {
  if (!Array.isArray(milestones) || elapsedMsVal <= 0) return 0;
  let n = 0;
  for (const m of milestones) {
    if (elapsedMsVal >= m.ms) n += 1;
    else break;
  }
  return n;
}

function sessionElapsedAt(session, atMs) {
  const s0 = new Date(session.startedAtIso).getTime();
  if (Number.isNaN(s0)) return 0;
  const s1 = session.endedAtIso ? new Date(session.endedAtIso).getTime() : atMs;
  return Math.max(0, Math.min(atMs, s1) - s0);
}

/** XP bonus : saisies réfléchies (déclencheur + issue), phrases du jour, revues hebdo — plafonné. */
export function computeReflectiveXpBonus(aq) {
  let quality = 0;
  Object.values(aq?.cravingsByDay || {}).forEach((arr) => {
    if (!Array.isArray(arr)) return;
    for (const c of arr) {
      if (c.triggerId && c.outcomeId) quality += 1;
    }
  });
  const refDays = Object.values(aq?.reflectionByDay || {}).filter((v) => String(v || '').trim()).length;
  const weekMarks = Object.values(aq?.weeklyReviewWeeks || {}).filter(Boolean).length;
  const partQ = Math.min(180, quality * 3);
  const partR = Math.min(120, refDays * 8);
  const partW = Math.min(90, Math.min(weekMarks, 6) * 15);
  const total = Math.round(partQ + partR + partW);
  return {
    total,
    quality: Math.round(partQ),
    reflection: Math.round(partR),
    weekly: Math.round(partW),
  };
}

/**
 * XP total arrêt addiction (toutes sessions, deux sujets).
 * @param {object} aq — données mergées v3+
 * @param {number} nowMs
 */
export function calculateAddictionQuitXP(aq, nowMs = Date.now()) {
  let milestonesXp = 0;
  let dailyXp = 0;
  if (!aq || !aq.sessions) {
    return {
      totalXP: 0,
      breakdown: {
        milestones: 0,
        daily: 0,
        sessions: 0,
        relapses: 0,
        reflective: 0,
        reflectiveDetail: { quality: 0, reflection: 0, weekly: 0 },
      },
    };
  }

  for (const tid of TRACK_IDS) {
    const milestones = getMilestonesForTrack(tid);
    const sessions = aq.sessions[tid] || [];
    for (const session of sessions) {
      const end = session.endedAtIso ? new Date(session.endedAtIso).getTime() : nowMs;
      const elapsedEnd = sessionElapsedAt(session, nowMs);
      milestones.forEach((m, idx) => {
        if (elapsedEnd >= m.ms) milestonesXp += xpMilestoneOnce(idx);
      });
      const days = enumerateLocalDaysOverlapping(session.startedAtIso, end);
      for (const dayStr of days) {
        const bounds = localDayBoundsMs(dayStr);
        if (!bounds) continue;
        const s0 = new Date(session.startedAtIso).getTime();
        const s1 = Math.min(end, nowMs);
        if (s1 <= bounds.start || s0 > bounds.end) continue;
        const clipEnd = Math.min(s1, bounds.end);
        const elapsed = Math.max(0, clipEnd - s0);
        const n = countMilestonesPassed(elapsed, milestones);
        if (elapsed > 0) dailyXp += xpDailyForMilestonesCount(n);
      }
    }
  }

  const relapses = Array.isArray(aq.relapses) ? aq.relapses.length : 0;
  const sessionsCount = TRACK_IDS.reduce((acc, tid) => acc + (aq.sessions[tid]?.length || 0), 0);
  const reflective = computeReflectiveXpBonus(aq);

  return {
    totalXP: Math.round(milestonesXp + dailyXp + reflective.total),
    breakdown: {
      milestones: Math.round(milestonesXp),
      daily: Math.round(dailyXp),
      sessions: sessionsCount,
      relapses,
      reflective: reflective.total,
      reflectiveDetail: {
        quality: reflective.quality,
        reflection: reflective.reflection,
        weekly: reflective.weekly,
      },
    },
  };
}

export function getActiveSession(aq, trackId) {
  const list = aq?.sessions?.[trackId];
  if (!Array.isArray(list)) return null;
  return list.find((s) => s && !s.endedAtIso) || null;
}

export function getActiveSessionId(aq, trackId) {
  return getActiveSession(aq, trackId)?.id || null;
}

/** Sessions passées (terminées), plus ancienne en premier */
export function getPastSessions(aq, trackId) {
  const list = aq?.sessions?.[trackId];
  if (!Array.isArray(list)) return [];
  return list.filter((s) => s && s.endedAtIso);
}

/**
 * Dernière session terminée par craquage où elapsed >= milestoneMs
 * @returns {{ session: object, startedAtIso: string } | null}
 */
export function findPastSessionReachedMilestone(aq, trackId, milestoneMs) {
  const past = getPastSessions(aq, trackId);
  for (let i = past.length - 1; i >= 0; i -= 1) {
    const s = past[i];
    const start = new Date(s.startedAtIso).getTime();
    const end = new Date(s.endedAtIso).getTime();
    const elapsed = Math.max(0, end - start);
    if (elapsed >= milestoneMs && s.endedReason === 'relapse') return { session: s, startedAtIso: s.startedAtIso };
  }
  for (let i = past.length - 1; i >= 0; i -= 1) {
    const s = past[i];
    const start = new Date(s.startedAtIso).getTime();
    const end = new Date(s.endedAtIso).getTime();
    const elapsed = Math.max(0, end - start);
    if (elapsed >= milestoneMs) return { session: s, startedAtIso: s.startedAtIso };
  }
  return null;
}

function ensureSessionsShape(aq) {
  const next = { ...aq };
  next.sessions = {
    cigarette: Array.isArray(aq.sessions?.cigarette) ? [...aq.sessions.cigarette] : [],
    thc: Array.isArray(aq.sessions?.thc) ? [...aq.sessions.thc] : [],
  };
  next.relapses = Array.isArray(aq.relapses) ? [...aq.relapses] : [];
  return next;
}

/** Si quitAtIso sans session ouverte → crée session ; si session ouverte sans quit → ferme */
export function ensureSessionConsistency(aq, nowMs = Date.now()) {
  let next = ensureSessionsShape(aq);
  let changed = false;

  for (const tid of TRACK_IDS) {
    const quit = next.tracks?.[tid]?.quitAtIso;
    const active = getActiveSession(next, tid);
    if (quit && !active) {
      next.sessions[tid].push({
        id: newSessionId(),
        startedAtIso: quit,
        endedAtIso: null,
        endedReason: null,
        userTitle: '',
        reflection: '',
      });
      changed = true;
    }
    if (!quit && active) {
      const list = next.sessions[tid].map((s) =>
        s.id === active.id
          ? { ...s, endedAtIso: new Date(nowMs).toISOString(), endedReason: s.endedReason || 'cleared' }
          : s
      );
      next.sessions[tid] = list;
      changed = true;
    }
  }
  return changed ? next : aq;
}

export function migrateAddictionQuitToV3(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw.version === '3' || (raw.sessions && raw.relapses !== undefined);
  if (v && raw.sessions?.cigarette && raw.sessions?.thc) return raw;

  const next = ensureSessionsShape({ ...raw, version: '3', sessions: raw.sessions || {} });
  for (const tid of TRACK_IDS) {
    if (next.sessions[tid].length > 0) continue;
    const quit = raw.tracks?.[tid]?.quitAtIso;
    if (quit) {
      next.sessions[tid].push({
        id: newSessionId(),
        startedAtIso: quit,
        endedAtIso: null,
        endedReason: null,
        userTitle: '',
        reflection: '',
      });
    }
  }
  return next;
}

/**
 * Fusion + migration v2→v3 + cohérence sessions / quitAtIso
 */
export function mergeAddictionQuitData(raw) {
  const base = {
    version: '3',
    tracks: {
      cigarette: { quitAtIso: null, displayName: 'Tabac' },
      thc: { quitAtIso: null, displayName: 'THC / cannabis' },
    },
    cravingsByDay: {},
    estimates: {
      packsPerDay: null,
      packPriceEur: null,
      jointsPerWeek: null,
    },
    sessions: { cigarette: [], thc: [] },
    relapses: [],
    copilot: { customActions: [] },
    trackFocus: {
      cigarette: { routine: true, sleep: false, mood: false },
      thc: { routine: false, sleep: true, mood: true },
    },
    reflectionByDay: {},
    weeklyReviewWeeks: {},
    privacy: { highlightWeekendRisk: false },
  };

  if (!raw || typeof raw !== 'object') {
    return ensureSessionConsistency(base);
  }

  let merged = {
    ...base,
    ...raw,
    version: '3',
    tracks: { ...base.tracks, ...(raw.tracks || {}) },
    estimates: { ...base.estimates, ...(raw.estimates || {}) },
    cravingsByDay: raw.cravingsByDay && typeof raw.cravingsByDay === 'object' ? { ...raw.cravingsByDay } : {},
    sessions: {
      cigarette: Array.isArray(raw.sessions?.cigarette) ? [...raw.sessions.cigarette] : [],
      thc: Array.isArray(raw.sessions?.thc) ? [...raw.sessions.thc] : [],
    },
    relapses: Array.isArray(raw.relapses) ? [...raw.relapses] : [],
    copilot: { ...base.copilot, ...(raw.copilot || {}) },
    trackFocus: {
      cigarette: { ...base.trackFocus.cigarette, ...(raw.trackFocus?.cigarette || {}) },
      thc: { ...base.trackFocus.thc, ...(raw.trackFocus?.thc || {}) },
    },
    reflectionByDay:
      raw.reflectionByDay && typeof raw.reflectionByDay === 'object' ? { ...raw.reflectionByDay } : {},
    weeklyReviewWeeks:
      raw.weeklyReviewWeeks && typeof raw.weeklyReviewWeeks === 'object'
        ? { ...raw.weeklyReviewWeeks }
        : {},
    privacy: { ...base.privacy, ...(raw.privacy || {}) },
  };

  merged = migrateAddictionQuitToV3(merged) || merged;
  merged.cravingsByDay = normalizeCravingsByDay(merged.cravingsByDay);
  merged = ensureSessionConsistency(merged);
  return merged;
}

/**
 * Définir / modifier l’heure d’arrêt : met à jour la session ouverte ou en crée une.
 */
export function applyQuitAtChange(prevAq, trackId, quitAtIso, nowMs = Date.now()) {
  const aq = ensureSessionConsistency(mergeAddictionQuitData(prevAq));
  const tr = aq.tracks[trackId] || {};
  const active = getActiveSession(aq, trackId);

  if (!quitAtIso) {
    const next = {
      ...aq,
      tracks: { ...aq.tracks, [trackId]: { ...tr, quitAtIso: null } },
    };
    if (active) {
      next.sessions = {
        ...next.sessions,
        [trackId]: next.sessions[trackId].map((s) =>
          s.id === active.id
            ? { ...s, endedAtIso: new Date(nowMs).toISOString(), endedReason: 'cleared' }
            : s
        ),
      };
    }
    return ensureSessionConsistency(next);
  }

  if (active) {
    const next = {
      ...aq,
      tracks: { ...aq.tracks, [trackId]: { ...tr, quitAtIso } },
      sessions: {
        ...aq.sessions,
        [trackId]: aq.sessions[trackId].map((s) =>
          s.id === active.id ? { ...s, startedAtIso: quitAtIso } : s
        ),
      },
    };
    return ensureSessionConsistency(next);
  }

  const next = {
    ...aq,
    tracks: { ...aq.tracks, [trackId]: { ...tr, quitAtIso } },
    sessions: {
      ...aq.sessions,
      [trackId]: [
        ...aq.sessions[trackId],
        {
          id: newSessionId(),
          startedAtIso: quitAtIso,
          endedAtIso: null,
          endedReason: null,
          userTitle: '',
          reflection: '',
        },
      ],
    },
  };
  return ensureSessionConsistency(next);
}

/**
 * Enregistrer un craquage : ferme la session, vide quitAtIso, ajoute à relapses.
 * @param {object} [sessionMeta] — titre / leçon pour la session qui se ferme (récit)
 */
export function applyRelapse(prevAq, trackId, atIso, note = '', sessionMeta = {}) {
  const aq = ensureSessionConsistency(mergeAddictionQuitData(prevAq));
  const tr = aq.tracks[trackId] || {};
  const active = getActiveSession(aq, trackId);
  if (!tr.quitAtIso && !active) return aq;

  const endedAt = atIso || new Date().toISOString();
  const title = sessionMeta.userTitle !== undefined ? String(sessionMeta.userTitle).trim() : '';
  const reflection =
    sessionMeta.reflection !== undefined ? String(sessionMeta.reflection).trim() : '';

  let sessionsList = [...(aq.sessions[trackId] || [])];
  if (active) {
    sessionsList = sessionsList.map((s) =>
      s.id === active.id
        ? {
            ...s,
            endedAtIso: endedAt,
            endedReason: 'relapse',
            userTitle: title || s.userTitle || '',
            reflection: reflection || s.reflection || '',
          }
        : s
    );
  } else if (tr.quitAtIso) {
    sessionsList.push({
      id: newSessionId(),
      startedAtIso: tr.quitAtIso,
      endedAtIso: endedAt,
      endedReason: 'relapse',
      userTitle: title,
      reflection,
    });
  }

  const relapse = {
    id: newRelapseId(),
    trackId,
    atIso: endedAt,
    note: (note || '').trim(),
    sessionTitle: title,
    sessionReflection: reflection,
  };

  return ensureSessionConsistency({
    ...aq,
    tracks: { ...aq.tracks, [trackId]: { ...tr, quitAtIso: null } },
    sessions: { ...aq.sessions, [trackId]: sessionsList },
    relapses: [...(aq.relapses || []), relapse],
  });
}

export function applyRelapseBoth(prevAq, atIso, note = '', sessionMeta = {}) {
  const at = atIso || new Date().toISOString();
  let next = mergeAddictionQuitData(prevAq);
  if (next.tracks.cigarette?.quitAtIso || getActiveSession(next, 'cigarette')) {
    next = applyRelapse(next, 'cigarette', at, note, sessionMeta);
  }
  next = ensureSessionConsistency(mergeAddictionQuitData(next));
  if (next.tracks.thc?.quitAtIso || getActiveSession(next, 'thc')) {
    next = applyRelapse(next, 'thc', at, note, sessionMeta);
  }
  return ensureSessionConsistency(next);
}

/** Statistiques récap (toutes sessions) */
export function buildAddictionRecapStats(aq, nowMs = Date.now()) {
  const merged = mergeAddictionQuitData(aq);
  const xp = calculateAddictionQuitXP(merged, nowMs);
  const relapsesFiltered = (tid) => (merged.relapses || []).filter((r) => r.trackId === tid);

  const longestMsForTrack = (tid) => {
    let best = 0;
    for (const s of merged.sessions[tid] || []) {
      if (!s.endedAtIso) continue;
      const a = new Date(s.startedAtIso).getTime();
      const b = new Date(s.endedAtIso).getTime();
      const d = Math.max(0, b - a);
      if (d > best) best = d;
    }
    const active = getActiveSession(merged, tid);
    if (active && merged.tracks[tid]?.quitAtIso) {
      const d = Math.max(0, nowMs - new Date(active.startedAtIso).getTime());
      if (d > best) best = d;
    }
    return best;
  };

  const relapseCount = merged.relapses?.length || 0;

  const abstinentLocalDays = (tid) => {
    const set = new Set();
    for (const s of merged.sessions[tid] || []) {
      const end = s.endedAtIso ? new Date(s.endedAtIso).getTime() : nowMs;
      for (const d of enumerateLocalDaysOverlapping(s.startedAtIso, end)) set.add(d);
    }
    return set.size;
  };

  let cravingsTotal = 0;
  let held = 0;
  let slipped = 0;
  Object.values(merged.cravingsByDay || {}).forEach((arr) => {
    if (!Array.isArray(arr)) return;
    for (const c of arr) {
      cravingsTotal += 1;
      if (c.outcomeId === 'held') held += 1;
      if (c.outcomeId === 'slipped') slipped += 1;
    }
  });

  return {
    xpTotal: xp.totalXP,
    xpBreakdown: xp.breakdown,
    relapseCount,
    relapsesCig: relapsesFiltered('cigarette').length,
    relapsesThc: relapsesFiltered('thc').length,
    longestMsCig: longestMsForTrack('cigarette'),
    longestMsThc: longestMsForTrack('thc'),
    abstinentDaysCig: abstinentLocalDays('cigarette'),
    abstinentDaysThc: abstinentLocalDays('thc'),
    cravingsTotal,
    held,
    slipped,
    sessionsCig: merged.sessions.cigarette?.length || 0,
    sessionsThc: merged.sessions.thc?.length || 0,
  };
}
