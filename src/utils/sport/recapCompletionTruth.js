/**
 * Source unique pour les % de complétion Récap (alignée sur le KPI « Exos moy/jour »).
 * exoPct = moyenne des ratios exo cochés / exo prévus par jour entraîné.
 * globalPct inclut les étirements → souvent beaucoup plus bas (~40 % si étirements rares).
 */

import DateHelper from '../dateHelper';
import { computeProgramCompletionCheckedRatio } from '../programCompletionBonus';
import { computePeriodCompletionMetrics } from './recapEnrichmentMetrics';

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function clampYmd(ymd, minYmd) {
  if (!minYmd || !ymd) return ymd;
  return ymd < minYmd ? minYmd : ymd;
}

/** Métriques complétion pour une fenêtre — même logique que Récap > Snapshot. */
export function getCompletionForWindow(snapshot, window, ctx = {}) {
  if (!window?.end) return null;
  const m = computePeriodCompletionMetrics(snapshot, window, ctx);
  return {
    exoPct: m.exoPct,
    globalPct: m.globalPct,
    stretchPct: m.stretchPct,
    exoChecked: m.exoChecked,
    exoTotal: m.exoTotal,
    exoCheckedPerDay: m.exoCheckedPerDay,
    exoPlannedPerDay: m.exoPlannedPerDay,
    activeTrainingDays: m.activeTrainingDays,
    daysFullyComplete: m.daysFullyComplete,
    exoDetailLabel: m.exoDetailLabel,
    detailLabel: m.detailLabel
  };
}

/** Moyenne exoPct sur les jours entraînés entre deux dates (inclus). */
export function averageExoCompletionPct(snapshot, startYmd, endYmd, ctx = {}) {
  if (!startYmd || !endYmd || startYmd > endYmd) return null;
  const m = computePeriodCompletionMetrics(snapshot, { start: startYmd, end: endYmd }, ctx);
  return m.exoPct;
}

/**
 * Compare deux blocs de 7 jours se terminant à endYmd, bornés par windowStart.
 * @returns {{ recentPct, priorPct, recentStart, priorStart } | null}
 */
export function compareExoCompletionWeekBlocks(snapshot, endYmd, windowStart, ctx = {}) {
  if (!endYmd) return null;

  let recentEnd = endYmd;
  let recentStart = clampYmd(DateHelper.addDays(endYmd, -6), windowStart);
  let priorEnd = DateHelper.addDays(recentStart, -1);
  let priorStart = clampYmd(DateHelper.addDays(priorEnd, -6), windowStart);

  if (priorStart > priorEnd) return null;

  const recentPct = averageExoCompletionPct(snapshot, recentStart, recentEnd, ctx);
  const priorPct = averageExoCompletionPct(snapshot, priorStart, priorEnd, ctx);

  if (recentPct == null || priorPct == null) return null;

  return { recentPct, priorPct, recentStart, priorEnd, priorStart, priorEnd: priorEnd };
}

/** Libellé durée fenêtre pour la prose coach. */
export function describeRecapWindow(window, endYmd) {
  const end = window?.end || endYmd;
  const start = window?.start;
  if (!start) return 'sur la période affichée';
  const days = DateHelper.daysBetween(start, end);
  if (days == null) return 'sur la période affichée';
  const span = days + 1;
  if (span <= 1) return 'aujourd’hui';
  if (span <= 8) return `sur ${span} jours`;
  if (span <= 35) return `sur ${span} jours (environ ${Math.round(span / 7)} sem.)`;
  if (span <= 95) return `sur ${Math.round(span / 7)} semaines`;
  if (span <= 380) return `sur ${Math.round(span / 30)} mois`;
  return 'sur l’historique complet';
}

/** Série journalière % exos uniquement (alignée KPI). */
export function buildDailyExoCompletionSeries(snapshot, window, ctx = {}) {
  const m = window?.end ? window : null;
  if (!m?.end) return [];
  const start = window.start ?? window.end;
  const dates = DateHelper.getDateRange(start, window.end);
  return dates.map((dateStr) => {
    const r = computeProgramCompletionCheckedRatio(dateStr, snapshot, ctx);
    let value = 0;
    if (r.exoTotal > 0 && r.exoChecked > 0) {
      value = round1((r.exoChecked / r.exoTotal) * 100);
    }
    return {
      date: dateStr,
      value,
      trained: r.exoChecked > 0,
      exoChecked: r.exoChecked,
      exoTotal: r.exoTotal
    };
  });
}
