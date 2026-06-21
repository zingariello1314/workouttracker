/**
 * Analyses temporelles denses pour Vision Coach : YoY, mois vs mois, meilleur mois.
 * Déduplication intégrée pour éviter de répéter les mêmes chiffres.
 */

import DateHelper from '../dateHelper';
import { JUSTIFICATION_REASONS } from '../dayJustificationUtils';
import { countTrainingDaysInRange } from './recapTrainingDayTruth';
import { getCompletionForWindow, averageExoCompletionPct } from './recapCompletionTruth';
import { collectCheckedExerciseRepHistory } from './recapAdaptiveInsights';
import { pctChange, magnitudeWord } from './recapInsightHelpers';
import {
  buildGarminCardioById,
  mergeRunningSessionsWithGarmin,
  sumRunningKmFromRows,
  computeRunningVolumeTotals
} from './runningVolumeTruth';

const MONTH_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
];

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function clampYmd(ymd, minYmd, maxYmd) {
  if (!ymd) return ymd;
  let out = ymd;
  if (minYmd && out < minYmd) out = minYmd;
  if (maxYmd && out > maxYmd) out = maxYmd;
  return out;
}

export function monthLabelFr(mk) {
  const m = parseInt(String(mk).slice(5, 7), 10);
  if (!Number.isFinite(m) || m < 1 || m > 12) return mk;
  return MONTH_FR[m - 1];
}

/** Mois / insights pertinents : année courante et N-1 uniquement. */
export function relevantMonthCutoff(endYmd, lookbackYears = 1) {
  const y = parseInt(String(endYmd).slice(0, 4), 10);
  if (!Number.isFinite(y)) return '2025-01';
  return `${y - lookbackYears}-01`;
}

function monthKeyFromYmd(ymd) {
  return ymd?.slice(0, 7) || '';
}

function lastDayOfMonthKey(mk) {
  const y = parseInt(mk.slice(0, 4), 10);
  const m = parseInt(mk.slice(5, 7), 10);
  const last = new Date(y, m, 0);
  return `${mk}-${String(last.getDate()).padStart(2, '0')}`;
}

function nextMonthKey(mk) {
  const y = parseInt(mk.slice(0, 4), 10);
  const m = parseInt(mk.slice(5, 7), 10);
  if (m >= 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function priorMonthKey(mk) {
  const y = parseInt(mk.slice(0, 4), 10);
  const m = parseInt(mk.slice(5, 7), 10);
  if (m <= 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function listMonthKeys(startMk, endMk) {
  if (!startMk || !endMk || startMk > endMk) return [];
  const out = [];
  let cur = startMk;
  while (cur <= endMk) {
    out.push(cur);
    cur = nextMonthKey(cur);
  }
  return out;
}

function isInjuryNote(note) {
  const n = String(note || '').toLowerCase();
  return /bless|injur|fract|entorse|élong|elong|genou|épaule|cass|chirurg|rehab|reprise/.test(n);
}

function countMaladieDays(snapshot, startYmd, endYmd) {
  const just = snapshot?.dayJustifications || {};
  let n = 0;
  Object.entries(just).forEach(([d, j]) => {
    if (d < startYmd || d > endYmd) return;
    if (j?.reason === JUSTIFICATION_REASONS.MALADIE || isInjuryNote(j?.note)) n += 1;
  });
  return n;
}

function sumRepsInRange(snapshot, startYmd, endYmd) {
  const byEx = collectCheckedExerciseRepHistory(snapshot, { start: startYmd, end: endYmd });
  let total = 0;
  Object.values(byEx).forEach((sessions) => {
    sessions.forEach((s) => {
      if (s.date >= startYmd && s.date <= endYmd) total += s.reps || 0;
    });
  });
  return total;
}

function sumRunningKmInRange(snapshot, garminData, startYmd, endYmd) {
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = snapshot?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  const rows = computeRunningVolumeTotals(merged, garminById, { period: 'all', preFiltered: false }).rows || [];
  return sumRunningKmFromRows(
    rows.filter((r) => {
      const d = (r?.date || r?.dateYmd || '').slice(0, 10);
      return d >= startYmd && d <= endYmd;
    })
  );
}

/** Première / dernière date d'activité dans le snapshot. */
export function discoverSnapshotDateBounds(snapshot) {
  const dates = new Set();
  const addKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      const d = k.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d);
    });
  };
  addKeys(snapshot?.checkedExercises);
  addKeys(snapshot?.reps);
  addKeys(snapshot?.dayJustifications);
  addKeys(snapshot?.sessionFeedbacks);
  const sessions = snapshot?.enduranceData?.sessions || {};
  Object.values(sessions).forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((s) => {
      const d = String(s?.date || '').slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d);
    });
  });
  if (dates.size === 0) return null;
  const sorted = [...dates].sort();
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

function trainedDaysInRange(snapshot, startYmd, endYmd, garminData = null) {
  return countTrainingDaysInRange(snapshot, startYmd, endYmd, garminData);
}

/** Stats d'un mois calendaire (partiel si endCap avant fin de mois). */
export function computeMonthCoachSnapshot(snapshot, monthKey, endCapYmd, ctx, garminData = null) {
  const start = `${monthKey}-01`;
  let end = lastDayOfMonthKey(monthKey);
  if (endCapYmd && end > endCapYmd) end = endCapYmd;
  if (start > end) return null;

  const comp = getCompletionForWindow(snapshot, { start, end }, ctx);
  const trainedDays = trainedDaysInRange(snapshot, start, end, garminData);
  if (trainedDays === 0 && (comp?.activeTrainingDays || 0) === 0) return null;

  return {
    monthKey,
    label: monthLabelFr(monthKey),
    year: parseInt(monthKey.slice(0, 4), 10),
    start,
    end,
    calendarDays: (DateHelper.daysBetween(start, end) ?? 0) + 1,
    isPartial: end < lastDayOfMonthKey(monthKey),
    trainedDays,
    exoPct: comp?.exoPct,
    exoChecked: comp?.exoChecked,
    exoTotal: comp?.exoTotal,
    maladieDays: countMaladieDays(snapshot, start, end),
    totalReps: sumRepsInRange(snapshot, start, end),
    runningKm: sumRunningKmInRange(snapshot, garminData, start, end)
  };
}

function monthQualityScore(m) {
  if (!m || m.trainedDays < 3) return null;
  const exo = m.exoPct ?? 55;
  const repsBonus = Math.min(12, (m.totalReps || 0) / 120);
  const kmBonus = Math.min(8, (m.runningKm || 0) / 15);
  return round1(m.trainedDays * 9 + exo * 0.55 + repsBonus + kmBonus);
}

/** Tous les mois avec activité, bornés par la fenêtre Récap. */
export function buildMonthlyCoachStats(snapshot, endYmd, ctx, opts = {}) {
  const { windowStart = null, garminData = null, minTrainedDays = 1, minMonthKey = null } = opts;
  const bounds = discoverSnapshotDateBounds(snapshot);
  if (!bounds) return [];

  let startMk = monthKeyFromYmd(bounds.start);
  const endMk = monthKeyFromYmd(endYmd);
  if (minMonthKey && minMonthKey > startMk) startMk = minMonthKey;
  if (windowStart) {
    const wMk = monthKeyFromYmd(windowStart);
    if (wMk > startMk) startMk = wMk;
  }

  return listMonthKeys(startMk, endMk)
    .map((mk) => computeMonthCoachSnapshot(snapshot, mk, endYmd, ctx, garminData))
    .filter((m) => m && m.trainedDays >= minTrainedDays);
}

function findBestMonth(months) {
  let best = null;
  let bestScore = null;
  months.forEach((m) => {
    const sc = monthQualityScore(m);
    if (sc == null) return;
    if (bestScore == null || sc > bestScore) {
      bestScore = sc;
      best = m;
    }
  });
  return best;
}

export function findBestMonthFromMonths(months) {
  return findBestMonth((months || []).filter((m) => monthQualityScore(m) != null));
}

function buildPeriodBlockLabel(startYmd, endYmd) {
  const y1 = startYmd.slice(0, 4);
  const y2 = endYmd.slice(0, 4);
  if (startYmd.slice(5) === '01-01' && endYmd.slice(5) === '12-31' && y1 === y2) return y1;
  if (startYmd.slice(0, 4) === endYmd.slice(0, 4)) {
    return `${startYmd.slice(8, 10)}/${startYmd.slice(5, 7)} – ${endYmd.slice(8, 10)}/${endYmd.slice(5, 7)} ${y1}`;
  }
  return `${startYmd.slice(8, 10)}/${startYmd.slice(5, 7)}/${y1} – ${endYmd.slice(8, 10)}/${endYmd.slice(5, 7)}/${y2}`;
}

function buildYearBlockStats(snapshot, year, endYmd, ctx, garminData, windowStart) {
  const ytdStart = `${year}-01-01`;
  let ytdEnd =
    parseInt(endYmd.slice(0, 4), 10) > year
      ? `${year}-12-31`
      : endYmd.slice(0, 4) === String(year)
        ? endYmd
        : `${year}-12-31`;

  ytdEnd = clampYmd(ytdEnd, null, endYmd);
  const start = clampYmd(ytdStart, windowStart, ytdEnd);
  if (start > ytdEnd) return null;

  const comp = getCompletionForWindow(snapshot, { start, end: ytdEnd }, ctx);
  const trainedDays = trainedDaysInRange(snapshot, start, ytdEnd, garminData);
  if (trainedDays < 2) return null;

  return {
    year,
    start,
    end: ytdEnd,
    label: buildPeriodBlockLabel(start, ytdEnd),
    trainedDays,
    exoPct: comp?.exoPct,
    totalReps: sumRepsInRange(snapshot, start, ytdEnd),
    runningKm: sumRunningKmInRange(snapshot, garminData, start, ytdEnd),
    maladieDays: countMaladieDays(snapshot, start, ytdEnd)
  };
}

/** Composant anti-doublons pour la prose Vision Coach. */
export class VisionComposer {
  constructor() {
    this.paragraphs = [];
    this.claims = new Set();
  }

  /** @returns {boolean} true si ajouté */
  add(text, tags = []) {
    const t = String(text || '').trim();
    if (!t) return false;
    if (tags.some((tag) => this.claims.has(tag))) return false;
    tags.forEach((tag) => this.claims.add(tag));
    this.paragraphs.push(t);
    return true;
  }

  has(tag) {
    return this.claims.has(tag);
  }

  join() {
    return this.paragraphs.join('\n\n');
  }
}

function formatMonthLine(m, withYear = false) {
  const name = withYear || m.isPartial ? `${m.label} ${m.year}` : m.label;
  const partial = m.isPartial ? ` (${m.calendarDays} j. écoulés)` : '';
  const parts = [`${name}${partial} : ${m.trainedDays} j. entraîné${m.trainedDays > 1 ? 's' : ''}`];
  if (m.exoPct != null) parts.push(`~${m.exoPct} % complétion exos`);
  if (m.totalReps >= 200) parts.push(`~${Math.round(m.totalReps)} reps street`);
  if (m.runningKm >= 5) parts.push(`~${round1(m.runningKm)} km course`);
  return parts.join(', ');
}

/**
 * Sections temporelles denses — ordre : YoY → mois vs mois → meilleur mois → arc multi-mois.
 * @returns {VisionComposer}
 */
export function buildTemporalVisionSections(opts = {}) {
  const {
    snapshot = {},
    endYmd,
    windowStart = null,
    windowDays = null,
    ctx = {},
    garminData = null,
    composer = new VisionComposer()
  } = opts;

  const mode =
    windowStart == null ? 'all' : windowDays != null && windowDays <= 10 ? 'micro' : windowDays <= 35 ? 'short' : windowDays <= 95 ? 'medium' : 'long';

  const months = buildMonthlyCoachStats(snapshot, endYmd, ctx, {
    windowStart,
    garminData,
    minMonthKey: relevantMonthCutoff(endYmd, 1)
  });
  const currentMk = monthKeyFromYmd(endYmd);
  const currentMonth = months.find((m) => m.monthKey === currentMk) || computeMonthCoachSnapshot(snapshot, currentMk, endYmd, ctx, garminData);
  const priorMk = priorMonthKey(currentMk);
  const priorMonth =
    months.find((m) => m.monthKey === priorMk) ||
    computeMonthCoachSnapshot(snapshot, priorMk, lastDayOfMonthKey(priorMk), ctx, garminData);

  const bestMonth = findBestMonth(months.filter((m) => monthQualityScore(m) != null));
  const bestIsCurrent = bestMonth?.monthKey === currentMk;

  const currentYear = parseInt(endYmd.slice(0, 4), 10);
  const priorYear = currentYear - 1;

  const canYoY =
    (mode === 'all' || mode === 'long' || (mode === 'medium' && windowStart && windowStart.slice(0, 4) <= String(priorYear))) &&
    !composer.has('yoy');

  if (canYoY) {
    const sameDayPrior = `${priorYear}${endYmd.slice(4)}`;
    let priorEnd = sameDayPrior;
    try {
      if (new Date(`${priorEnd}T12:00:00`).getMonth() !== new Date(`${endYmd}T12:00:00`).getMonth()) {
        priorEnd = lastDayOfMonthKey(`${priorYear}${endYmd.slice(4, 7)}`);
      }
    } catch {
      /* ignore */
    }

    const curBlock = buildYearBlockStats(snapshot, currentYear, endYmd, ctx, garminData, windowStart);
    const prevBlock = buildYearBlockStats(snapshot, priorYear, priorEnd, ctx, garminData, windowStart);

    if (curBlock && prevBlock && prevBlock.trainedDays >= 2) {
      const parts = [];
      parts.push(
        `À date equivalente (${curBlock.label}), ${currentYear} totalise ${curBlock.trainedDays} j. d'entraînement` +
          (curBlock.exoPct != null ? ` avec ~${curBlock.exoPct} % de complétion exos` : '') +
          ` contre ${prevBlock.trainedDays} j.` +
          (prevBlock.exoPct != null ? ` et ~${prevBlock.exoPct} % en ${priorYear}` : ` en ${priorYear}`)
      );

      const trainedChg = pctChange(curBlock.trainedDays, prevBlock.trainedDays);
      if (trainedChg != null && Math.abs(trainedChg) >= 12) {
        parts.push(
          trainedChg > 0
            ? `soit ${magnitudeWord(trainedChg)} plus de séances enregistrées (+${Math.round(trainedChg)} %)`
            : `soit ${magnitudeWord(Math.abs(trainedChg))} moins de séances (−${Math.round(Math.abs(trainedChg))} %)`
        );
      }

      if (curBlock.exoPct != null && prevBlock.exoPct != null && Math.abs(curBlock.exoPct - prevBlock.exoPct) >= 4) {
        parts.push(
          curBlock.exoPct > prevBlock.exoPct
            ? `l'adhérence aux exos progresse de ~${Math.round(curBlock.exoPct - prevBlock.exoPct)} pts`
            : `la complétion exos recule de ~${Math.round(prevBlock.exoPct - curBlock.exoPct)} pts — à surveiller`
        );
      }

      if (curBlock.totalReps >= 300 && prevBlock.totalReps >= 100) {
        const repChg = pctChange(curBlock.totalReps, prevBlock.totalReps);
        if (repChg != null && Math.abs(repChg) >= 15) {
          parts.push(
            repChg > 0
              ? `volume street +${Math.round(repChg)} % (${Math.round(curBlock.totalReps)} vs ${Math.round(prevBlock.totalReps)} reps)`
              : `volume street en retrait (~${Math.round(Math.abs(repChg))} % vs ${priorYear})`
          );
        }
      }

      if (curBlock.runningKm >= 10 && prevBlock.runningKm >= 5) {
        const kmChg = pctChange(curBlock.runningKm, prevBlock.runningKm);
        if (kmChg != null && Math.abs(kmChg) >= 20) {
          parts.push(
            kmChg > 0
              ? `kilométrage course +${Math.round(kmChg)} %`
              : `course moins présente qu'en ${priorYear} (−${Math.round(Math.abs(kmChg))} % km)`
          );
        }
      }

      composer.add(`${parts.join(' ; ')}.`, ['yoy', `yoy:${currentYear}`, `yoy:${priorYear}`]);
    } else if (curBlock && curBlock.trainedDays >= 5 && !prevBlock) {
      const prevFull = buildYearBlockStats(
        snapshot,
        priorYear,
        `${priorYear}-12-31`,
        ctx,
        garminData,
        windowStart
      );
      if (prevFull && prevFull.trainedDays >= 3) {
        const parts = [
          `${currentYear} à date : ${curBlock.trainedDays} j.` +
            (curBlock.exoPct != null ? ` (~${curBlock.exoPct} % exos)` : '') +
            ` · ${priorYear} complet : ${prevFull.trainedDays} j.` +
            (prevFull.exoPct != null ? ` (~${prevFull.exoPct} % exos)` : '')
        ];
        const trainedChg = pctChange(curBlock.trainedDays, prevFull.trainedDays);
        if (trainedChg != null && Math.abs(trainedChg) >= 10) {
          parts.push(
            trainedChg > 0
              ? `tu es ${magnitudeWord(trainedChg)} plus actif qu'en ${priorYear} sur l'année pleine`
              : `rythme inférieur à ton ${priorYear} complet`
          );
        }
        composer.add(`${parts.join(' ; ')}.`, ['yoy', `yoy:${currentYear}`, `yoy:${priorYear}`]);
      } else {
        composer.add(
          `${currentYear} cumule ${curBlock.trainedDays} j. d'entraînement` +
            (curBlock.exoPct != null ? ` (~${curBlock.exoPct} % complétion exos)` : '') +
            `. Historique ${priorYear} encore limité dans Momentum.`,
          ['yoy', `yoy:${currentYear}`]
        );
      }
    }
  }

  const canMonthCmp =
    (mode === 'all' || mode === 'long' || mode === 'medium' || (mode === 'short' && months.length >= 2)) &&
    currentMonth &&
    priorMonth &&
    priorMonth.trainedDays >= 2 &&
    !composer.has(`month_cmp:${currentMk}`);

  if (canMonthCmp) {
    const lines = [];
    if (bestIsCurrent && bestMonth) {
      lines.push(
        `${formatMonthLine(currentMonth, true)} — c'est ton meilleur mois sur la période analysée` +
          (priorMonth ? `, en progression nette vs ${formatMonthLine(priorMonth)}` : '')
      );
      composer.add(`${lines.join('. ')}.`, [`month_cmp:${currentMk}`, `best_month:${currentMk}`, 'best_month']);
    } else {
      lines.push(`${formatMonthLine(currentMonth, true)} vs ${formatMonthLine(priorMonth, true)}`);
      const exoDelta =
        currentMonth.exoPct != null && priorMonth.exoPct != null
          ? currentMonth.exoPct - priorMonth.exoPct
          : null;
      const trainedDelta = currentMonth.trainedDays - priorMonth.trainedDays;

      const interp = [];
      if (!currentMonth.isPartial && trainedDelta > 2) interp.push(`+${trainedDelta} j. vs le mois précédent`);
      else if (currentMonth.isPartial && priorMonth.trainedDays > 0) {
        const pace = currentMonth.trainedDays / Math.max(1, currentMonth.calendarDays);
        const priorPace =
          priorMonth.trainedDays /
          Math.max(1, (DateHelper.daysBetween(priorMonth.start, priorMonth.end) ?? 0) + 1);
        if (pace > priorPace * 1.15) interp.push(`rythme quotidien supérieur à celui de ${priorMonth.label}`);
        else if (pace < priorPace * 0.85) interp.push(`rythme plus lent qu'en ${priorMonth.label} à jours équivalents`);
      }
      if (exoDelta != null && Math.abs(exoDelta) >= 4) {
        interp.push(
          exoDelta > 0
            ? `complétion exos +${Math.round(exoDelta)} pts`
            : `complétion exos −${Math.round(Math.abs(exoDelta))} pts`
        );
      }
      if (interp.length) lines.push(interp.join(' · '));
      composer.add(`${lines.join(' — ')}.`, [`month_cmp:${currentMk}`, `month_cmp:${priorMk}`]);
    }
  } else if (currentMonth && currentMonth.trainedDays >= 2 && !composer.has(`month_cmp:${currentMk}`)) {
    composer.add(`${formatMonthLine(currentMonth, true)}.`, [`month_cmp:${currentMk}`]);
  }

  if (
    bestMonth &&
    !bestIsCurrent &&
    !composer.has('best_month') &&
    (mode === 'all' || mode === 'long' || mode === 'medium')
  ) {
    const gap = currentMonth ? bestMonth.trainedDays - currentMonth.trainedDays : null;
    let text = `Meilleur mois de la période : ${formatMonthLine(bestMonth, true)}`;
    if (currentMonth && gap != null && gap > 0) {
      text += `. ${monthLabelFr(currentMk)} ${currentMonth.year} est encore partiel — il manque ~${gap} j. pour égaler ce record de régularité`;
      if (currentMonth.exoPct != null && bestMonth.exoPct != null && currentMonth.exoPct >= bestMonth.exoPct - 2) {
        text += ', mais la complétion exos est déjà au même niveau';
      }
    } else if (currentMonth && bestMonth.monthKey === priorMk) {
      text += ` — tu viens de le vivre ; l'enjeu est de le reproduire`;
    }
    composer.add(`${text}.`, ['best_month', `best_month:${bestMonth.monthKey}`]);
  }

  if ((mode === 'all' || mode === 'long') && months.length >= 3 && !composer.has('season_arc')) {
    const minMk = relevantMonthCutoff(endYmd, 1);
    const recentMonths = months.filter((m) => m.monthKey >= minMk);
    const ranked = [...recentMonths]
      .filter((m) => m.trainedDays >= 3)
      .sort((a, b) => b.trainedDays - a.trainedDays);
    const top3 = ranked.slice(0, 3);
    const hard = recentMonths.filter(
      (m) =>
        (m.maladieDays >= 2 || (m.trainedDays <= 3 && m.maladieDays >= 1)) &&
        m.monthKey !== bestMonth?.monthKey &&
        m.monthKey !== currentMk
    );

    const arcParts = [];
    if (top3.length >= 2 && !(bestIsCurrent && top3[0]?.monthKey === currentMk)) {
      arcParts.push(
        `pics récents : ${top3.map((m) => `${m.label} ${m.year} (${m.trainedDays} j.)`).join(', ')}`
      );
    }
    if (hard.length >= 1) {
      arcParts.push(
        `périodes difficiles (12 derniers mois) : ${hard.map((m) => `${m.label} ${m.year}${m.maladieDays ? ` (${m.maladieDays} j. maladie)` : ''}`).join(', ')}`
      );
    }
    if (arcParts.length) {
      composer.add(`${arcParts.join(' · ')}.`, ['season_arc']);
    }
  }

  if (mode === 'all' || mode === 'long') {
    const fullYearMonths = months.filter((m) => m.year === currentYear && !m.isPartial && m.trainedDays >= 3);
    if (fullYearMonths.length >= 2 && !composer.has('year_spread')) {
      const avgTrained = round1(fullYearMonths.reduce((s, m) => s + m.trainedDays, 0) / fullYearMonths.length);
      const avgExo = round1(
        fullYearMonths.filter((m) => m.exoPct != null).reduce((s, m) => s + m.exoPct, 0) /
          Math.max(1, fullYearMonths.filter((m) => m.exoPct != null).length)
      );
      composer.add(
        `Sur ${currentYear}, tes mois complets tournent autour de ${avgTrained} j. d'entraînement / mois` +
          (avgExo ? ` et ~${avgExo} % de complétion exos en moyenne` : '') +
          ` (${fullYearMonths.length} mois analysés).`,
        ['year_spread']
      );
    }
  }

  return composer;
}

/** Bloc dynamique récent — évite doublon si déjà couvert par month_cmp récent. */
export function buildMomentumSection(opts = {}) {
  const {
    composer,
    snapshot,
    endYmd,
    windowStart,
    windowDays,
    ctx,
    enrichment,
    skipIfMonthCmp = true
  } = opts;

  if (skipIfMonthCmp && composer.has(`month_cmp:${monthKeyFromYmd(endYmd)}`)) {
    const recentBlockDays = windowDays != null && windowDays <= 10 ? Math.max(3, Math.floor(windowDays / 2)) : 14;
    const recentStart = clampYmd(DateHelper.addDays(endYmd, -(recentBlockDays - 1)), windowStart, endYmd);
    const compRecent = averageExoCompletionPct(snapshot, recentStart, endYmd, ctx);
    const streak = enrichment?.streak || {};
    const parts = [];
    if (compRecent != null && Math.abs(compRecent - 85) >= 8) {
      parts.push(`derniers ${recentBlockDays} j. : ~${compRecent} % complétion exos`);
    }
    if ((streak.current ?? 0) >= 5) {
      parts.push(`série ${streak.current} j.${streak.longest ? ` (record ${streak.longest} j.)` : ''}`);
    }
    if (parts.length) composer.add(`Micro-dynamique : ${parts.join(' · ')}.`, ['momentum_short']);
    return composer;
  }

  return composer;
}
