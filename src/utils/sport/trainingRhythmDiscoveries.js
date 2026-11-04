/**
 * Analyses transversales de rythme (jours actifs, streaks, répartition hebdo).
 * Pas de causalité inventée — constats mesurables uniquement.
 */

import { addCalendarDays } from './garminRunningPeriodStats.js';

const DOW_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function ymdDow(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

/**
 * @param {Record<string, number>|Map<string,number>} repsByDate
 * @param {{ start?: string, end?: string }} window
 * @param {{ minActiveDays?: number }} [opts]
 */
export function buildTrainingRhythmDiscoveries(repsByDate, window, opts = {}) {
  const minActive = opts.minActiveDays ?? 4;
  const map =
    repsByDate instanceof Map
      ? repsByDate
      : new Map(Object.entries(repsByDate || {}).map(([k, v]) => [k, Number(v) || 0]));
  const start = window?.start;
  const end = window?.end;
  if (!end) return [];

  const active = [...map.entries()]
    .filter(([d, r]) => r >= 20 && (!start || d >= start) && d <= end)
    .map(([d, r]) => ({ date: d, reps: r }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (active.length < minActive) return [];

  const out = [];

  // Streak max de jours calendaires consécutifs avec renforcement
  let bestStreak = 1;
  let cur = 1;
  for (let i = 1; i < active.length; i += 1) {
    const expect = addCalendarDays(active[i - 1].date, 1);
    if (active[i].date === expect) {
      cur += 1;
      if (cur > bestStreak) bestStreak = cur;
    } else cur = 1;
  }

  // Plus longue interruption entre deux jours actifs (dans la fenêtre)
  let maxGap = 0;
  let gapFrom = null;
  let gapTo = null;
  for (let i = 1; i < active.length; i += 1) {
    const gap = Math.max(
      0,
      Math.round(
        (Date.parse(`${active[i].date}T12:00:00Z`) - Date.parse(`${active[i - 1].date}T12:00:00Z`)) /
          86400000
      ) - 1
    );
    if (gap > maxGap) {
      maxGap = gap;
      gapFrom = active[i - 1].date;
      gapTo = active[i].date;
    }
  }

  // Répartition par jour de semaine
  const byDow = Array.from({ length: 7 }, () => ({ days: 0, reps: 0 }));
  active.forEach((row) => {
    const dow = ymdDow(row.date);
    if (dow == null) return;
    byDow[dow].days += 1;
    byDow[dow].reps += row.reps;
  });
  const ranked = byDow
    .map((row, dow) => ({ ...row, dow, label: DOW_FR[dow] }))
    .filter((r) => r.days > 0)
    .sort((a, b) => b.days - a.days || b.reps - a.reps);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  const spanDays =
    start != null
      ? Math.max(
          1,
          Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) +
            1
        )
      : null;
  const perWeek = spanDays ? Math.round((active.length / spanDays) * 7 * 10) / 10 : null;

  if (bestStreak >= 3) {
    out.push({
      kind: 'disc_rhythm_streak',
      nature: 'trajectory',
      family: 'training_rhythm',
      title:
        bestStreak >= 5
          ? `Une série de ${bestStreak} jours de renforcement d’affilée`
          : `${bestStreak} jours de renforcement consécutifs`,
      body: `Sur la période, la plus longue série de journées avec répétitions de renforcement atteint ${bestStreak} jours calendaires d’affilée (${active.length} jours actifs au total${
        perWeek != null ? `, soit ≈${perWeek} / semaine` : ''
      }). Ce n’est pas le rythme moyen : c’est le pic de continuité observé.`,
      evidence: `streak ${bestStreak} · ${active.length} jours actifs`,
      weights: { importance: 0.78, reliability: 0.92, novelty: 0.8, fit: 0.9 },
      metrics: {
        streakDays: bestStreak,
        activeDays: active.length,
        perWeek,
        factId: `rhythm|streak|${bestStreak}`
      }
    });
  }

  if (maxGap >= 5 && gapFrom && gapTo) {
    out.push({
      kind: 'disc_rhythm_gap',
      nature: 'trajectory',
      family: 'training_rhythm',
      title: `Une interruption de ${maxGap} jours entre deux séances de renforcement`,
      body: `Entre le ${gapFrom} et le ${gapTo}, ${maxGap} jours calendaires sans répétitions de renforcement cochées séparent deux journées actives. C’est la plus longue coupure interne de la fenêtre — distincte d’un arrêt d’exercice isolé.`,
      evidence: `gap ${maxGap} j · ${gapFrom} → ${gapTo}`,
      weights: { importance: 0.8, reliability: 0.9, novelty: 0.84, fit: 0.88 },
      metrics: {
        maxGapDays: maxGap,
        gapFrom,
        gapTo,
        activeDays: active.length,
        factId: `rhythm|gap|${gapFrom}|${gapTo}`
      }
    });
  }

  if (top && bottom && ranked.length >= 3 && top.days >= bottom.days + 2) {
    out.push({
      kind: 'disc_rhythm_weekday',
      nature: 'trajectory',
      family: 'training_rhythm',
      title: `Le ${top.label} concentre plus souvent les séances de renforcement`,
      body: `Sur ${active.length} jours actifs, le ${top.label} revient ${top.days} fois (${fmtInt(
        top.reps
      )} reps), contre ${bottom.days} pour le ${bottom.label} (${fmtInt(
        bottom.reps
      )} reps). La répartition hebdomadaire n’est pas uniforme : certains jours portent davantage la pratique.`,
      evidence: `${top.label} ${top.days} · ${bottom.label} ${bottom.days}`,
      weights: { importance: 0.74, reliability: 0.88, novelty: 0.78, fit: 0.86 },
      metrics: {
        topDow: top.dow,
        topDays: top.days,
        bottomDow: bottom.dow,
        bottomDays: bottom.days,
        activeDays: active.length,
        factId: `rhythm|weekday|${top.dow}`
      }
    });
  }

  return out;
}
