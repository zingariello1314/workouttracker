/**
 * Arcs de volume multi-mois : détection + rédaction.
 * Jours = jours entraînés calendrier (DAY_CONTRACT.CALENDAR_TRAINING) lorsque
 * snapshot fourni — même périmètre que les tuiles Calendrier.
 * Reps = somme des répétitions journalières (intensité / repsByDate).
 */

import DateHelper from '../dateHelper';
import { getCalendarSportStatsCache } from '../calendarMonthSportStats';
import { dayCountsAsCalendarTrainingDay } from './recapTrainingDayTruth';

function ymOf(ymd) {
  return String(ymd || '').slice(0, 7);
}

function monthLabelFr(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  if (!y || !m) return String(ym);
  try {
    return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } catch {
    return String(ym);
  }
}

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

function pct(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

function fmtSignedPct(p) {
  if (p == null || !Number.isFinite(p)) return 'n/d';
  const r = Math.round(p);
  return `${r > 0 ? '+' : ''}${r} %`;
}

function daysInMonth(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function monthEndYmd(ym) {
  return `${ym}-${String(daysInMonth(ym)).padStart(2, '0')}`;
}

/**
 * Agrège repsByDate en mois chronologiques.
 * Si `isTrainingDay` (ou snapshot) est fourni :
 * - `days` = jours calendrier entraînés
 * - `reps` = somme des reps **uniquement sur ces jours** (périmètre cohérent,
 *   Approche A — pas de numérateur élargi aux journées GTG sync hors crédit)
 *
 * @param {Record<string, number>|Map} repsByDate
 * @param {{ isTrainingDay?: (ymd: string) => boolean, snapshot?: object, garminData?: object|null }} [opts]
 * @returns {{ ym: string, reps: number, days: number, repsPerDay: number|null, dayBasis: string, excludedPositiveRepDays?: number }[]}
 */
export function buildChronologicalMonths(repsByDate, opts = {}) {
  const repsLookup = (ymd) => {
    if (repsByDate instanceof Map) return Number(repsByDate.get(ymd)) || 0;
    return Number(repsByDate?.[ymd]) || 0;
  };
  const entries =
    repsByDate instanceof Map
      ? [...repsByDate.entries()]
      : Object.entries(repsByDate || {});
  const monthsTouched = new Set();
  for (const [ymd, reps] of entries) {
    if ((Number(reps) || 0) <= 0) continue;
    const ym = ymOf(ymd);
    if (/^\d{4}-\d{2}$/.test(ym)) monthsTouched.add(ym);
  }

  let isTrainingDay = typeof opts.isTrainingDay === 'function' ? opts.isTrainingDay : null;
  if (!isTrainingDay && opts.snapshot) {
    const sportCache = getCalendarSportStatsCache(opts.snapshot, opts.garminData || null);
    isTrainingDay = (ymd) =>
      sportCache?.isTrainingDay
        ? sportCache.isTrainingDay(ymd)
        : dayCountsAsCalendarTrainingDay(opts.snapshot, ymd, opts.garminData || null);
  }

  const months = [...monthsTouched].sort().map((ym) => {
    if (isTrainingDay) {
      const start = `${ym}-01`;
      const end = monthEndYmd(ym);
      let days = 0;
      let reps = 0;
      let positiveOnly = 0;
      for (const d of DateHelper.getDateRange(start, end)) {
        const r = repsLookup(d);
        if (r > 0) positiveOnly += 1;
        if (!isTrainingDay(d)) continue;
        days += 1;
        reps += r;
      }
      return {
        ym,
        reps,
        days,
        dayBasis: 'calendar_training',
        excludedPositiveRepDays: Math.max(0, positiveOnly - days),
        repsPerDay: days > 0 ? reps / days : null
      };
    }
    let reps = 0;
    let days = 0;
    for (const [ymd, r0] of entries) {
      if (ymOf(ymd) !== ym) continue;
      const r = Number(r0) || 0;
      if (r <= 0) continue;
      reps += r;
      days += 1;
    }
    return {
      ym,
      reps,
      days,
      dayBasis: 'positive_reps',
      repsPerDay: days > 0 ? reps / days : null
    };
  });
  return months;
}

/**
 * Un mois est « incomplet » s’il est le mois de fin de fenêtre et
 * qu’il couvre trop peu de jours calendaires pour une comparaison loyale.
 */
export function isIncompleteRecentMonth(month, windowEndYmd, { minCoveredDays = 20 } = {}) {
  if (!month?.ym || !windowEndYmd) return false;
  if (ymOf(windowEndYmd) !== month.ym) return false;
  const dim = daysInMonth(month.ym);
  const dayOfEnd = Number(String(windowEndYmd).slice(8, 10)) || 0;
  const covered = Math.min(dayOfEnd, dim);
  return covered < minCoveredDays;
}

/**
 * Décompose une baisse : deltas séparés (jours, densité), sans % de contribution
 * additive inventé (freqShare/densityShare restent à titre de signal interne
 * approximatif — ne pas publier comme précision).
 */
function decomposeDrop(from, to) {
  if (!from || !to || from.reps <= 0) {
    return {
      freqShare: null,
      densityShare: null,
      repsPct: null,
      daysPct: null,
      rpdPct: null,
      freqLed: false,
      densityLed: false,
      mixed: false
    };
  }
  const repsPct = pct(to.reps, from.reps);
  const daysPct = pct(to.days, from.days);
  const rpdPct =
    from.repsPerDay != null && to.repsPerDay != null ? pct(to.repsPerDay, from.repsPerDay) : null;
  const absDays = Math.abs(daysPct || 0);
  const absRpd = Math.abs(rpdPct || 0);
  const denom = absDays + absRpd;
  const freqShare = denom > 0 ? absDays / denom : null;
  const densityShare = denom > 0 ? absRpd / denom : null;
  const freqLed = freqShare != null && freqShare >= 0.55 && (repsPct || 0) < -15;
  const densityLed = densityShare != null && densityShare >= 0.55 && (repsPct || 0) < -15;
  return {
    freqShare,
    densityShare,
    repsPct,
    daysPct,
    rpdPct,
    freqLed,
    densityLed,
    mixed: !freqLed && !densityLed && (repsPct || 0) < -15
  };
}

/**
 * @returns {{ arcKind: string, peak: object, trough: object, recent: object, mechanism: object }|null}
 */
export function detectMonthlyVolumeArcShape(months, { windowEndYmd = null } = {}) {
  const usable = (months || []).filter((m) => m.reps >= 80 && m.days >= 4);
  if (usable.length < 3) return null;

  let recent = usable[usable.length - 1];
  let series = usable;
  if (isIncompleteRecentMonth(recent, windowEndYmd)) {
    series = usable.slice(0, -1);
    recent = series[series.length - 1];
  }
  if (series.length < 3) return null;

  let peakIdx = 0;
  for (let i = 1; i < series.length; i += 1) {
    if (series[i].reps > series[peakIdx].reps) peakIdx = i;
  }
  const peak = series[peakIdx];

  let troughIdx = peakIdx;
  for (let i = peakIdx + 1; i < series.length; i += 1) {
    if (series[i].reps < series[troughIdx].reps) troughIdx = i;
  }
  const trough = series[troughIdx];
  const dropFromPeak = pct(trough.reps, peak.reps);
  if (dropFromPeak == null || dropFromPeak > -20 || troughIdx <= peakIdx) {
    const a = series[series.length - 3];
    const b = series[series.length - 2];
    const c = series[series.length - 1];
    const ab = pct(b.reps, a.reps);
    const bc = pct(c.reps, b.reps);
    if (ab != null && bc != null && ab > 12 && Math.abs(bc) < 10) {
      return {
        arcKind: 'stabilization_after_rise',
        peak: b,
        trough: a,
        recent: c,
        mechanism: decomposeDrop(a, b)
      };
    }
    return null;
  }

  const riseFromTrough = pct(recent.reps, trough.reps);
  const stillBelowPeak = pct(recent.reps, peak.reps);
  let arcKind = 'prolonged_decline';
  if (troughIdx < series.length - 1 && riseFromTrough != null && riseFromTrough >= 10) {
    if (stillBelowPeak != null && stillBelowPeak > -12) arcKind = 'full_recovery';
    else arcKind = 'partial_recovery';
  } else if (troughIdx === series.length - 1 && peakIdx <= series.length - 3) {
    arcKind = 'prolonged_decline';
  }

  const mechFrom = peak;
  const mechTo = trough;
  const mechanism = decomposeDrop(mechFrom, mechTo);

  if (arcKind === 'partial_recovery' || arcKind === 'full_recovery') {
    mechanism.recovery = decomposeDrop(trough, recent);
  }

  return { arcKind, peak, trough, recent, mechanism, months: series };
}

function titleForArc(shape) {
  const { arcKind, peak, trough, recent, mechanism } = shape;

  if (arcKind === 'partial_recovery') {
    return `${monthLabelFr(recent.ym)} interrompt la baisse depuis ${monthLabelFr(peak.ym)}`;
  }
  if (arcKind === 'full_recovery') {
    return `${monthLabelFr(recent.ym)} revient près du niveau de ${monthLabelFr(peak.ym)}`;
  }
  if (arcKind === 'stabilization_after_rise') {
    return `Stabilisation après la hausse de ${monthLabelFr(peak.ym)}`;
  }
  if (mechanism.freqLed) {
    return 'La fréquence explique l’essentiel du recul';
  }
  return `Recul prolongé de ${monthLabelFr(peak.ym)} à ${monthLabelFr(trough.ym)}`;
}

function mechanismSentence(mechanism) {
  if (!mechanism) return '';
  if (mechanism.freqLed) {
    return ' La baisse vient surtout d’une diminution des jours entraînés, plus que d’un effondrement du volume par journée active.';
  }
  if (mechanism.densityLed) {
    return ' La baisse vient surtout du volume par journée active ; la fréquence joue un rôle moindre.';
  }
  if (mechanism.mixed) {
    return ' Fréquence et volume par jour actif contribuent tous les deux au recul.';
  }
  return '';
}

function bodyForArc(shape) {
  const { arcKind, peak, trough, recent, mechanism } = shape;
  const peakL = monthLabelFr(peak.ym);
  const troughL = monthLabelFr(trough.ym);
  const recentL = monthLabelFr(recent.ym);
  const dropBits = `${peakL} : ${fmtInt(peak.reps)} reps en ${peak.days} jours entraînés (≈${fmtInt(peak.repsPerDay)} / jour actif) → ${troughL} : ${fmtInt(trough.reps)} reps en ${trough.days} jours (≈${fmtInt(trough.repsPerDay)} / jour actif), soit ${fmtSignedPct(mechanism.repsPct)} de volume, ${fmtSignedPct(mechanism.daysPct)} de jours, ${fmtSignedPct(mechanism.rpdPct)} de volume par jour actif.`;
  const mech = mechanismSentence(mechanism);

  if (arcKind === 'partial_recovery') {
    const rec = mechanism.recovery || {};
    return `${dropBits}${mech} ${recentL} remonte à ${fmtInt(recent.reps)} reps en ${recent.days} jours (≈${fmtInt(recent.repsPerDay)} / jour actif, ${fmtSignedPct(rec.repsPct)} vs ${troughL}), sans retrouver le sommet de ${peakL} (${fmtInt(peak.reps)} reps).`;
  }
  if (arcKind === 'full_recovery') {
    return `${dropBits}${mech} ${recentL} revient à ${fmtInt(recent.reps)} reps (${recent.days} j.), proche du niveau de ${peakL}.`;
  }
  if (arcKind === 'stabilization_after_rise') {
    return `Après la hausse vers ${peakL} (${fmtInt(peak.reps)} reps, ${peak.days} j.), ${recentL} se maintient à ${fmtInt(recent.reps)} reps en ${recent.days} jours — une stabilisation, pas une nouvelle accélération.`;
  }
  return `${dropBits}${mech} Aucune reprise nette n’est encore visible sur le dernier mois comparable (${recentL}).`;
}

/**
 * Producteur de découvertes d’arcs mensuels.
 * @returns {object[]} partials compatibles avec discovery()
 */
export function buildMonthlyVolumeArcDiscoveries(repsByDate, opts = {}) {
  const months = buildChronologicalMonths(repsByDate, {
    snapshot: opts.snapshot || null,
    garminData: opts.garminData || null,
    isTrainingDay: opts.isTrainingDay || null
  });
  const shape = detectMonthlyVolumeArcShape(months, {
    windowEndYmd: opts.windowEndYmd || null
  });
  if (!shape) return [];

  const title = titleForArc(shape);
  const body = bodyForArc(shape);
  const { peak, trough, recent, mechanism, arcKind } = shape;

  return [
    {
      kind: 'disc_monthly_volume_arc',
      nature: 'journey',
      family: 'monthly_volume_arc',
      title,
      body,
      evidence: `${monthLabelFr(peak.ym)} ${fmtInt(peak.reps)} → ${monthLabelFr(trough.ym)} ${fmtInt(trough.reps)} → ${monthLabelFr(recent.ym)} ${fmtInt(recent.reps)}`,
      weights: { importance: 0.97, reliability: 0.92, novelty: 0.94, fit: 0.98 },
      metrics: {
        arcKind,
        peakYm: peak.ym,
        troughYm: trough.ym,
        recentYm: recent.ym,
        peakReps: peak.reps,
        troughReps: trough.reps,
        recentReps: recent.reps,
        peakDays: peak.days,
        troughDays: trough.days,
        recentDays: recent.days,
        peakRepsPerDay: peak.repsPerDay,
        troughRepsPerDay: trough.repsPerDay,
        recentRepsPerDay: recent.repsPerDay,
        dayBasis: peak.dayBasis || months[0]?.dayBasis || 'positive_reps',
        freqShareOfDrop: mechanism.freqShare,
        densityShareOfDrop: mechanism.densityShare,
        repsPct: mechanism.repsPct,
        daysPct: mechanism.daysPct,
        rpdPct: mechanism.rpdPct,
        incompleteRecentExcluded: Boolean(
          opts.windowEndYmd && isIncompleteRecentMonth(months[months.length - 1], opts.windowEndYmd)
        ),
        trajectoryOk: true,
        trajectoryRichness: 9,
        trajectoryPrimaryStory:
          arcKind === 'partial_recovery'
            ? 'partial_recovery'
            : arcKind === 'full_recovery'
              ? 'recovered'
              : arcKind === 'prolonged_decline'
                ? 'net_decline'
                : 'net_rise',
        temporalScope: { interpretingWithHistory: true }
      }
    }
  ];
}

/**
 * Trajectoire mensuelle de course (km + sorties) puis interruption éventuelle.
 * Préfère une narration chiffrée mois par mois à un simple constat d’absence.
 * @param {{ date: string, km?: number }[]} runDays
 */
export function buildRunningGapDiscoveries(runDays, opts = {}) {
  const windowStart = opts.windowStartYmd;
  const windowEnd = opts.windowEndYmd;
  const rows = (runDays || [])
    .map((d) => ({ date: String(d.date || d.ymd || ''), km: Number(d.km) || 0 }))
    .filter((d) => d.date && (!windowStart || d.date >= windowStart) && (!windowEnd || d.date <= windowEnd))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length < 2) return [];

  const byMonth = {};
  rows.forEach((r) => {
    const ym = ymOf(r.date);
    if (!byMonth[ym]) byMonth[ym] = { ym, sessions: 0, km: 0 };
    byMonth[ym].sessions += 1;
    byMonth[ym].km += r.km;
  });

  const activeMonths = Object.values(byMonth).sort((a, b) => a.ym.localeCompare(b.ym));
  if (activeMonths.length < 1) return [];

  const lastActive = activeMonths[activeMonths.length - 1];
  if (!windowEnd) return [];
  const endYm = ymOf(windowEnd);
  const gapMonths = [];
  let [y, m] = lastActive.ym.split('-').map(Number);
  for (let guard = 0; guard < 36; guard += 1) {
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    if (ym > endYm) break;
    if (ym === endYm && isIncompleteRecentMonth({ ym }, windowEnd)) break;
    if (!byMonth[ym]) gapMonths.push(ym);
  }

  const first = activeMonths[0];
  const peak = activeMonths.reduce((a, b) => (b.km > a.km ? b : a), activeMonths[0]);
  const totalSessions = activeMonths.reduce((s, x) => s + x.sessions, 0);
  const totalKm = activeMonths.reduce((s, x) => s + x.km, 0);
  const monthLines = activeMonths
    .slice(-6)
    .map(
      (x) =>
        `${monthLabelFr(x.ym)} : ${Math.round(x.km * 10) / 10} km sur ${x.sessions} sortie${x.sessions > 1 ? 's' : ''}`
    );
  const gapBit =
    gapMonths.length >= 2
      ? ` Puis ${gapMonths.length} mois calendaires comparables sans sortie enregistrée (${monthLabelFr(gapMonths[0])} → ${monthLabelFr(gapMonths[gapMonths.length - 1])}).`
      : gapMonths.length === 1
        ? ` Aucune sortie enregistrée en ${monthLabelFr(gapMonths[0])} (mois complet sans course).`
        : '';

  if (gapMonths.length < 1 && activeMonths.length < 3) return [];

  const title =
    gapMonths.length >= 2
      ? `La course a monté puis disparu des enregistrements après ${monthLabelFr(lastActive.ym)}`
      : `La course se lit en mois : pic en ${monthLabelFr(peak.ym)}`;
  const body = `${monthLines.join('. ')}. Ensemble sur la phase active : ${Math.round(totalKm * 10) / 10} km en ${totalSessions} sorties (pic ${Math.round(peak.km * 10) / 10} km en ${monthLabelFr(peak.ym)}).${gapBit} Absence de données de course — pas une affirmation sur l’activité physique globale.`;

  return [
    {
      kind: 'disc_running_gap',
      nature: 'journey',
      family: 'running_gap',
      title,
      body,
      evidence:
        gapMonths.length >= 1
          ? `dernière ${monthLabelFr(lastActive.ym)} · trou ${gapMonths.length} mois · pic ${Math.round(peak.km * 10) / 10} km`
          : `pic ${monthLabelFr(peak.ym)} · ${Math.round(totalKm * 10) / 10} km`,
      weights: { importance: 0.95, reliability: 0.92, novelty: 0.94, fit: 0.97 },
      metrics: {
        lastActiveYm: lastActive.ym,
        gapMonths,
        sessionCount: totalSessions,
        totalKm: Math.round(totalKm * 10) / 10,
        peakYm: peak.ym,
        peakSessions: peak.sessions,
        peakKm: Math.round(peak.km * 10) / 10,
        months: activeMonths.map((x) => ({
          ym: x.ym,
          sessions: x.sessions,
          km: Math.round(x.km * 10) / 10
        })),
        trajectoryOk: true,
        trajectoryRichness: 9,
        trajectoryPrimaryStory: gapMonths.length >= 2 ? 'net_decline' : 'net_rise',
        temporalScope: { interpretingWithHistory: true }
      }
    }
  ];
}
