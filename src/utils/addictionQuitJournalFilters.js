/**
 * Filtres de période pour le journal / graphiques (sessions, mois, année, tout).
 */

import { getDateStr } from './dateUtils';
import { getActiveSession } from './addictionQuitSessionsXp';
import { sortCravingsForDay } from './addictionQuitHelpers';

/** Retrouve la session d’un enregistrement d’envie (sessionId explicite ou inféré par date). */
export function inferCravingSession(aq, craving, dayStr, trackId) {
  const list = [...(aq.sessions?.[trackId] || [])].sort(
    (a, b) => new Date(b.startedAtIso).getTime() - new Date(a.startedAtIso).getTime()
  );
  const tRaw = craving.createdAt
    ? new Date(craving.createdAt).getTime()
    : new Date(`${dayStr}T12:00:00`).getTime();
  const t = Number.isNaN(tRaw) ? new Date(`${dayStr}T12:00:00`).getTime() : tRaw;
  for (const s of list) {
    const s0 = new Date(s.startedAtIso).getTime();
    const s1 = s.endedAtIso ? new Date(s.endedAtIso).getTime() : Date.now();
    if (t >= s0 && t <= s1) return s;
  }
  return list[0] || null;
}

/**
 * Ligne ou séparateur pour affichage chronologique (sessions séparées).
 * @returns {Array<{type:'divider',key:string,labelKey?:string,atIso?:string}|{type:'row',key:string,day:string,c:object}>}
 */
export function buildCravingTimelineItems(aq, filterTrack, scope = 'all', nowMs = Date.now()) {
  const partial = filterCravingsByScope(aq, scope, filterTrack, nowMs);
  const rows = [];
  for (const [day, arr] of Object.entries(partial || {})) {
    if (!Array.isArray(arr)) continue;
    for (const c of sortCravingsForDay(arr)) {
      if (filterTrack !== 'all' && c.trackId !== filterTrack) continue;
      const tid = c.trackId || 'cigarette';
      const session = c.sessionId
        ? (aq.sessions?.[tid] || []).find((s) => s.id === c.sessionId)
        : inferCravingSession(aq, c, day, tid);
      const sessionId = session?.id || c.sessionId || 'legacy';
      const timeKey = c.timeHHMM || '99:99';
      rows.push({
        type: 'row',
        key: `${day}_${c.id}`,
        day,
        c,
        sessionId,
        trackId: tid,
        sortKey: `${day}T${timeKey.padStart(5, '0')}_${c.createdAt || ''}`,
      });
    }
  }
  rows.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const out = [];
  let prevSessionKey = null;
  for (const r of rows) {
    const sk = `${r.trackId}:${r.sessionId}`;
    if (prevSessionKey != null && sk !== prevSessionKey) {
      const s = (aq.sessions?.[r.trackId] || []).find((x) => x.id === r.sessionId);
      out.push({
        type: 'divider',
        key: `div_${r.key}_${sk}`,
        session: s || null,
        trackId: r.trackId,
      });
    }
    out.push(r);
    prevSessionKey = sk;
  }
  return out;
}

const TRACK_IDS = ['cigarette', 'thc'];

/** @typedef {'all'|'year'|'month'|'current_session'} JournalScope */

/**
 * @param {JournalScope} scope
 * @param {object} aq
 * @param {number} nowMs
 * @returns {{ from: string | null, to: string | null }}
 */
export function getJournalScopeBounds(scope, aq, nowMs = Date.now()) {
  const today = getDateStr(new Date(nowMs));
  if (scope === 'all') return { from: null, to: null };
  if (scope === 'year') {
    const y = today.slice(0, 4);
    return { from: `${y}-01-01`, to: today };
  }
  if (scope === 'month') {
    const [y, m] = today.split('-');
    return { from: `${y}-${m}-01`, to: today };
  }
  if (scope === 'current_session') {
    let from = null;
    for (const tid of TRACK_IDS) {
      const act = getActiveSession(aq, tid);
      const q = aq.tracks?.[tid]?.quitAtIso;
      const startIso = act?.startedAtIso || q;
      if (startIso) {
        const d = getDateStr(new Date(startIso));
        if (!from || d < from) from = d;
      }
    }
    return { from: from || today, to: today };
  }
  return { from: null, to: null };
}

function dayInRange(dayStr, from, to) {
  if (!from && !to) return true;
  if (from && dayStr < from) return false;
  if (to && dayStr > to) return false;
  return true;
}

/**
 * Retourne un objet cravingsByDay filtré (copie).
 */
export function filterCravingsByScope(aq, scope, filterTrack, nowMs = Date.now()) {
  const { from, to } = getJournalScopeBounds(scope, aq, nowMs);
  const out = {};
  for (const [day, arr] of Object.entries(aq.cravingsByDay || {})) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    if (!dayInRange(day, from, to)) continue;
    const filtered = sortCravingsForDay(arr).filter(
      (c) => filterTrack === 'all' || c.trackId === filterTrack
    );
    if (filtered.length) out[day] = filtered;
  }
  return out;
}
