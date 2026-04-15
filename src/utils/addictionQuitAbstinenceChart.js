/**
 * Séries temporelles pour le graphique d’abstinence (progression type « 20 ans »),
 * jalons, et chute à 0 les jours avec envies notées (+ notes).
 */

import { TWENTY_YEARS_MS } from './addictionQuitConstants';
import {
  enumerateCalendarDaysAscending,
  getJournalScopeDayRange,
} from './addictionQuitJournalFilters';
import { getMilestonesForTrack } from './addictionQuitSessionsXp';
import { getPeriodMilestoneDefinitions, periodMilestonesCrossedBetween } from './addictionQuitPeriodMilestones';

const TRACK_IDS = ['cigarette', 'thc'];

function localDayBoundsMs(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  return { start, end };
}

function findSessionAtMoment(aq, trackId, atMs) {
  const list = [...(aq?.sessions?.[trackId] || [])].filter(Boolean);
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const s = list[i];
    const s0 = new Date(s.startedAtIso).getTime();
    if (Number.isNaN(s0)) continue;
    const s1 = s.endedAtIso ? new Date(s.endedAtIso).getTime() : Infinity;
    if (s0 <= atMs && atMs <= s1) return s;
  }
  return null;
}

function dayElapsedBoundsInSession(session, dayStr, nowMs) {
  const b = localDayBoundsMs(dayStr);
  if (!b || !session) return null;
  const s0 = new Date(session.startedAtIso).getTime();
  if (Number.isNaN(s0)) return null;
  const s1 = session.endedAtIso ? new Date(session.endedAtIso).getTime() : nowMs;
  const clipStart = Math.max(b.start, s0);
  const clipEnd = Math.min(b.end, s1, nowMs);
  if (clipEnd < clipStart) return null;
  return {
    elapsedStart: Math.max(0, clipStart - s0),
    elapsedEnd: Math.max(0, clipEnd - s0),
  };
}

function milestonesCrossedBetween(startE, endE, milestones) {
  if (!Array.isArray(milestones) || endE <= 0) return [];
  const labels = [];
  for (const m of milestones) {
    if (m.ms > startE && m.ms <= endE) labels.push(m.label);
  }
  return labels;
}

function hasCravingOnDayForTrack(aq, dayStr, trackId) {
  const arr = aq?.cravingsByDay?.[dayStr];
  if (!Array.isArray(arr)) return false;
  return arr.some((c) => (c.trackId || 'cigarette') === trackId);
}

function cravingNotesForDayTrack(aq, dayStr, trackId) {
  const arr = aq?.cravingsByDay?.[dayStr];
  if (!Array.isArray(arr)) return '';
  const parts = [];
  for (const c of arr) {
    if ((c.trackId || 'cigarette') !== trackId) continue;
    const n = String(c.notes || '').trim();
    if (n) parts.push(n);
  }
  return parts.join(' · ');
}

function cravingNotesForDayAll(aq, dayStr) {
  const arr = aq?.cravingsByDay?.[dayStr];
  if (!Array.isArray(arr)) return '';
  const parts = [];
  for (const c of arr) {
    const n = String(c.notes || '').trim();
    if (n) parts.push(n);
  }
  return parts.join(' · ');
}

/**
 * @param {object} opts
 * @param {object} opts.aq
 * @param {'current_session'|'month'|'year'|'all'} opts.journalScope
 * @param {number} [opts.nowMs]
 * @returns {Array<{
 *   dateKey: string,
 *   pctCig: number|null, pctThc: number|null, pctMix: number|null,
 *   pctCigShow: number|null, pctThcShow: number|null, pctMixShow: number|null,
 *   cravingCig: boolean, cravingThc: boolean,
 *   notesCig: string, notesThc: string, notesMix: string,
 *   milestonesCig: string[], milestonesThc: string[],
 *   periodMetaCig: Array<{ labelKey: string, params?: object }>,
 *   periodMetaThc: Array<{ labelKey: string, params?: object }>,
 * }>}
 */
export function buildAbstinenceCurveSeries({ aq, journalScope, nowMs = Date.now() }) {
  const { from, to } = getJournalScopeDayRange(journalScope, aq, nowMs);
  const days = enumerateCalendarDaysAscending(from, to);
  const milestonesCigDef = getMilestonesForTrack('cigarette');
  const milestonesThcDef = getMilestonesForTrack('thc');
  const periodDefs = getPeriodMilestoneDefinitions();

  return days.map((dateKey) => {
    const b = localDayBoundsMs(dateKey);
    const atEnd = b ? Math.min(b.end, nowMs) : nowMs;

    const row = {
      dateKey,
      pctCig: null,
      pctThc: null,
      pctMix: null,
      pctCigShow: null,
      pctThcShow: null,
      pctMixShow: null,
      cravingCig: hasCravingOnDayForTrack(aq, dateKey, 'cigarette'),
      cravingThc: hasCravingOnDayForTrack(aq, dateKey, 'thc'),
      notesCig: cravingNotesForDayTrack(aq, dateKey, 'cigarette'),
      notesThc: cravingNotesForDayTrack(aq, dateKey, 'thc'),
      notesMix: cravingNotesForDayAll(aq, dateKey),
      milestonesCig: [],
      milestonesThc: [],
      periodMetaCig: [],
      periodMetaThc: [],
    };

    for (const tid of TRACK_IDS) {
      const session = findSessionAtMoment(aq, tid, atEnd);
      const bounds = session ? dayElapsedBoundsInSession(session, dateKey, nowMs) : null;
      const milestonesDef = tid === 'thc' ? milestonesThcDef : milestonesCigDef;
      if (!bounds) {
        if (tid === 'thc') {
          row.pctThc = null;
        } else {
          row.pctCig = null;
        }
        continue;
      }
      const pct = Math.min(100, (bounds.elapsedEnd / TWENTY_YEARS_MS) * 100);
      const crossed = milestonesCrossedBetween(bounds.elapsedStart, bounds.elapsedEnd, milestonesDef);
      const periodCrossed = periodMilestonesCrossedBetween(bounds.elapsedStart, bounds.elapsedEnd, periodDefs);
      const periodMeta = periodCrossed.map((d) =>
        d.params ? { labelKey: d.labelKey, params: d.params } : { labelKey: d.labelKey }
      );
      if (tid === 'thc') {
        row.pctThc = pct;
        row.milestonesThc = crossed;
        row.periodMetaThc = periodMeta;
      } else {
        row.pctCig = pct;
        row.milestonesCig = crossed;
        row.periodMetaCig = periodMeta;
      }
    }

    const parts = [];
    if (row.pctCig != null) parts.push(row.pctCig);
    if (row.pctThc != null) parts.push(row.pctThc);
    row.pctMix = parts.length ? parts.reduce((a, x) => a + x, 0) / parts.length : null;

    row.pctCigShow = row.pctCig == null ? null : row.cravingCig ? 0 : row.pctCig;
    row.pctThcShow = row.pctThc == null ? null : row.cravingThc ? 0 : row.pctThc;
    const mixCraving = row.cravingCig || row.cravingThc;
    row.pctMixShow = row.pctMix == null ? null : mixCraving ? 0 : row.pctMix;

    return row;
  });
}
