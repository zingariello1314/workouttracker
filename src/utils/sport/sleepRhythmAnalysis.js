/**
 * Rythme de sommeil : placement, dispersion, week-end, dérive, association.
 * Trois couches séparées : ce que la personne fait, un repère général,
 * une tolérance personnelle. « Tardif » n'est pas un jugement.
 * Ne modifie pas les seuils de durée ni le plancher publishable existant.
 */

import { formatClockFr, normalizeSleepClock, sleepClockBand } from './sleepRhythmClock';

const LATE_BED = 60;
const VERY_LATE_BED = 150;
const LATE_MID = 4 * 60 + 30;
const VERY_LATE_MID = 6 * 60;
const NORMAL_WAKE_START = 6 * 60;
const NORMAL_WAKE_END = 8 * 60 + 30;
const STABLE_IQR = 45;
const IRREGULAR_IQR = 90;
const DRIFT_MIN = 45;
const WEEKEND_GAP = 60;
const ATYPICAL_MIN = 90;
const DURATION_HELD = 30;
const MIN_EACH = 4;
const MIN_PCT = 12;
const MIN_ABS = 35;

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function median(values) {
  const v = (values || []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function iqr(values) {
  const v = (values || []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (v.length < 4) return null;
  const q1 = percentile(v, 0.25);
  const q3 = percentile(v, 0.75);
  if (q1 == null || q3 == null) return null;
  return q3 - q1;
}

function spanDays(a, b) {
  const ms = Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`);
  if (!Number.isFinite(ms)) return 0;
  return Math.round(ms / 86400000);
}

function formatYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return String(ymd || '');
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function axisStats(rows, key) {
  const values = rows.map((r) => r[key]);
  return { median: median(values), iqr: iqr(values) };
}

function confidenceLevel(n, span) {
  if (n >= 14 && span >= 28) return 4;
  if (n >= 8 && span >= 14) return 3;
  if (n >= 4 && span >= 7) return 2;
  return 1;
}

function thirds(rows) {
  const n = rows.length;
  const a = Math.floor(n / 3);
  const b = Math.floor((2 * n) / 3);
  return [rows.slice(0, a), rows.slice(a, b), rows.slice(b)];
}

function axisDrift(rows, key) {
  const [firstRows, midRows, lastRows] = thirds(rows);
  if (!firstRows.length || !midRows.length || !lastRows.length) return null;
  const first = median(firstRows.map((r) => r[key]));
  const mid = median(midRows.map((r) => r[key]));
  const last = median(lastRows.map((r) => r[key]));
  if (first == null || mid == null || last == null) return null;
  const net = last - first;
  const out = mid - first;
  const back = last - mid;
  const returned =
    Math.abs(out) >= DRIFT_MIN &&
    Math.abs(back) >= DRIFT_MIN &&
    Math.sign(out) !== 0 &&
    Math.sign(out) !== Math.sign(back) &&
    Math.abs(net) + 1 < Math.abs(out);
  return { first, mid, last, net, returned };
}

function weekendOf(rows) {
  const week = [];
  const end = [];
  rows.forEach((row) => {
    const day = new Date(`${row.ymd}T12:00:00`).getDay();
    if (day === 0 || day === 6) end.push(row);
    else week.push(row);
  });
  if (week.length < 4 || end.length < 4) return null;
  const bedGap = median(end.map((r) => r.bedMin)) - median(week.map((r) => r.bedMin));
  const wakeGap = median(end.map((r) => r.wakeMin)) - median(week.map((r) => r.wakeMin));
  const durationGap = median(end.map((r) => r.durationMin)) - median(week.map((r) => r.durationMin));
  const axes = [];
  if (Math.abs(bedGap) >= WEEKEND_GAP) axes.push('bed');
  if (Math.abs(wakeGap) >= WEEKEND_GAP) axes.push('wake');
  if (Math.abs(durationGap) >= WEEKEND_GAP) axes.push('duration');
  if (!axes.length) return null;
  return { axes, bedGap, wakeGap, durationGap };
}

function staticPatterns(bed, wake, duration) {
  const patterns = [];
  const lateBed = bed.median != null && bed.median > LATE_BED;
  const veryLateWake = wake.median != null && wake.median > NORMAL_WAKE_END;
  const normalWake =
    wake.median != null && wake.median >= NORMAL_WAKE_START && wake.median <= NORMAL_WAKE_END;
  const durationHeld =
    duration.median != null && duration.median >= 6 * 60 && duration.median <= 9 * 60;
  const shorter = duration.median != null && duration.median < 7 * 60;
  if (lateBed && veryLateWake && durationHeld) patterns.push('late_bed_late_wake_duration_held');
  if (lateBed && normalWake && shorter) patterns.push('late_bed_normal_wake_shorter');
  if (bed.iqr != null && wake.iqr != null && bed.iqr <= STABLE_IQR && wake.iqr >= IRREGULAR_IQR) {
    patterns.push('stable_bed_variable_wake');
  }
  if (bed.iqr != null && wake.iqr != null && wake.iqr <= STABLE_IQR && bed.iqr >= IRREGULAR_IQR) {
    patterns.push('stable_wake_variable_bed');
  }
  return patterns;
}

function driftPatterns(bedDrift, wakeDrift, durationDrift) {
  const patterns = [];
  const bedMoves = bedDrift && Math.abs(bedDrift.net) >= DRIFT_MIN;
  const wakeMoves = wakeDrift && Math.abs(wakeDrift.net) >= DRIFT_MIN;
  const durationMoves = durationDrift && Math.abs(durationDrift.net) >= DURATION_HELD;
  if (bedMoves && wakeMoves && Math.sign(bedDrift.net) === Math.sign(wakeDrift.net)) {
    patterns.push('clocks_drift_together');
  }
  if ((bedMoves || wakeMoves) && !durationMoves) patterns.push('duration_stable_clock_shift');
  if ((bedMoves || wakeMoves) && durationMoves) patterns.push('duration_changes_with_clock');
  return patterns;
}

function publishable(aN, bN, pct, delta) {
  if (aN < MIN_EACH || bN < MIN_EACH) return false;
  return Math.abs(pct) >= MIN_PCT || Math.abs(delta) >= MIN_ABS;
}

/**
 * @param {Array<{ ymd: string, bedTime?: string, wakeTime?: string, hours?: number, durationHours?: number }>} nights
 */
export function analyzeSleepRhythm(nights) {
  const byDay = new Map();
  (nights || []).forEach((night) => {
    const clock = normalizeSleepClock({
      ymd: night?.ymd,
      bedTime: night?.bedTime,
      wakeTime: night?.wakeTime,
      durationHours: night?.hours ?? night?.durationHours
    });
    if (!clock?.ymd) return;
    byDay.set(clock.ymd, clock);
  });
  const clocks = [...byDay.values()].sort((a, b) => String(a.ymd).localeCompare(String(b.ymd)));
  const n = clocks.length;
  const span = n >= 2 ? spanDays(clocks[0].ymd, clocks[n - 1].ymd) : 0;
  const level = n === 0 ? 0 : confidenceLevel(n, span);
  const bed = axisStats(clocks, 'bedMin');
  const wake = axisStats(clocks, 'wakeMin');
  const duration = axisStats(clocks, 'durationMin');
  const midpoint = axisStats(clocks, 'midpointMin');
  const bedDrift = level >= 4 ? axisDrift(clocks, 'bedMin') : null;
  const wakeDrift = level >= 4 ? axisDrift(clocks, 'wakeMin') : null;
  const durationDrift = level >= 4 ? axisDrift(clocks, 'durationMin') : null;
  const patterns = [
    ...staticPatterns(bed, wake, duration),
    ...driftPatterns(bedDrift, wakeDrift, durationDrift)
  ];
  let atypical = null;
  if (level >= 3 && bed.median != null) {
    atypical =
      clocks.find((row) => Math.abs(row.bedMin - bed.median) >= ATYPICAL_MIN) || null;
  }
  const reference =
    level >= 2 && bed.median != null
      ? bed.median > VERY_LATE_BED || (midpoint.median != null && midpoint.median > VERY_LATE_MID)
        ? 'tres_tardif'
        : bed.median > LATE_BED || (midpoint.median != null && midpoint.median > LATE_MID)
          ? 'plus_tardif'
          : null
      : null;

  return {
    clocks,
    n,
    spanDays: span,
    level,
    bed,
    wake,
    duration,
    midpoint,
    patterns,
    weekend: level >= 2 ? weekendOf(clocks) : null,
    drift: {
      bed: bedDrift,
      wake: wakeDrift,
      duration: durationDrift
    },
    atypical,
    reference,
    sleepClockBand: bed.median != null ? sleepClockBand(bed.median) : null
  };
}

function card(kind, nature, family, body, evidence, metrics, score) {
  return {
    id: kind,
    kind,
    nature,
    family,
    score,
    title: body,
    body,
    evidence,
    relevance: 0.9,
    metrics
  };
}

function patternSentence(patterns) {
  const bits = [];
  if (patterns.includes('late_bed_late_wake_duration_held')) {
    bits.push('Le coucher et le lever sont tous les deux tardifs, et la durée de sommeil tient.');
  }
  if (patterns.includes('late_bed_normal_wake_shorter')) {
    bits.push('Le coucher est tardif avec un lever dans une plage matinale, et la durée est plus courte.');
  }
  if (patterns.includes('stable_bed_variable_wake')) {
    bits.push('Le coucher reste groupé, le lever varie.');
  }
  if (patterns.includes('stable_wake_variable_bed')) {
    bits.push('Le lever reste groupé, le coucher varie.');
  }
  return bits.join(' ');
}

function rhythmFact(profile) {
  const { level, n, bed, wake, midpoint, clocks, atypical, patterns } = profile;
  if (!n || bed.median == null || wake.median == null) return null;
  const band = { sleepClockBand: profile.sleepClockBand, n, level, pattern: patterns[0] || null };
  const placement = `coucher autour de ${formatClockFr(bed.median)}, lever autour de ${formatClockFr(wake.median)}`;
  const mid =
    midpoint.median != null ? `, milieu de nuit vers ${formatClockFr(midpoint.median)}` : '';
  const extra = patternSentence(patterns);
  const atypicalBit =
    atypical != null
      ? ` La nuit du ${formatYmd(atypical.ymd)} s'écarte d'au moins 1 h 30 de ce placement.`
      : '';

  if (level >= 3) {
    return card(
      'disc_sleep_rhythm_habit',
      'now',
      'sleep_rhythm',
      `Rythme habituel récent : ${placement}${mid}. ${extra}${atypicalBit}`.replace(/\s+/g, ' ').trim(),
      `${n} nuits · ${profile.spanDays} j`,
      band,
      78
    );
  }
  if (level === 2) {
    const spread =
      bed.iqr != null && bed.iqr > 20 && bed.iqr < IRREGULAR_IQR
        ? ` L'écart typique des couchers est d'environ ${Math.round(bed.iqr)} min.`
        : '';
    return card(
      'disc_sleep_rhythm_obs',
      'now',
      'sleep_rhythm',
      `Actuellement, tes nuits se placent ainsi : ${placement}${mid}.${spread} ${extra}`.replace(/\s+/g, ' ').trim(),
      `${n} nuits · ${profile.spanDays} j`,
      band,
      74
    );
  }
  const one = clocks[0];
  return card(
    'disc_sleep_rhythm_obs',
    'now',
    'sleep_rhythm',
    `Observation : le ${formatYmd(one.ymd)}, coucher à ${formatClockFr(one.bedMin)}, lever à ${formatClockFr(one.wakeMin)}.`,
    '1 nuit',
    { ...band, n: 1 },
    60
  );
}

function regularityCard(profile) {
  if (profile.level < 2 || profile.bed.iqr == null) return null;
  const iqrMin = profile.bed.iqr;
  if (iqrMin <= STABLE_IQR) {
    return card(
      'disc_sleep_regularity',
      'now',
      'sleep_regularity',
      `Régularité : tes couchers restent groupés, avec un écart typique d'environ ${Math.round(iqrMin)} min.`,
      `IQR coucher ${Math.round(iqrMin)} min`,
      { sleepClockBand: profile.sleepClockBand, axis: 'bed' },
      72
    );
  }
  if (iqrMin >= IRREGULAR_IQR) {
    return card(
      'disc_sleep_regularity',
      'now',
      'sleep_regularity',
      `Régularité : tes couchers se dispersent, avec un écart typique d'environ ${Math.round(iqrMin)} min.`,
      `IQR coucher ${Math.round(iqrMin)} min`,
      { sleepClockBand: profile.sleepClockBand, axis: 'bed' },
      72
    );
  }
  return null;
}

function referenceCard(profile) {
  if (!profile.reference) return null;
  const very = profile.reference === 'tres_tardif';
  return card(
    'disc_sleep_reference',
    'trajectory',
    'sleep_reference',
    very
      ? 'Repère général : ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou de milieu de nuit (2 h 00–4 h 00). Ce repère ne dit pas que c’est un problème.'
      : 'Repère général : ce placement est plus tardif qu’une plage classique de coucher (22 h 30–0 h 30) ou de milieu de nuit (2 h 00–4 h 00). Ce repère ne dit pas que c’est un problème.',
    profile.reference,
    { sleepClockBand: profile.sleepClockBand, level: profile.reference },
    66
  );
}

function weekendCard(profile) {
  const weekend = profile.weekend;
  if (!weekend) return null;
  const names = [];
  if (weekend.axes.includes('bed')) names.push('le coucher');
  if (weekend.axes.includes('wake')) names.push('le lever');
  if (weekend.axes.includes('duration')) names.push('la durée');
  const gap = Math.round(
    Math.max(Math.abs(weekend.bedGap), Math.abs(weekend.wakeGap), Math.abs(weekend.durationGap))
  );
  return card(
    'disc_sleep_weekend',
    'trajectory',
    'sleep_weekend',
    `Le week-end, c’est ${names.join(' et ')} qui se décale, d’environ ${gap} min par rapport aux nuits de semaine.`,
    weekend.axes.join('+'),
    {
      sleepClockBand: profile.sleepClockBand,
      axis: weekend.axes.join('+'),
      weekendGapMin: gap
    },
    76
  );
}

function driftCard(profile) {
  if (profile.level < 4) return null;
  const bed = profile.drift.bed;
  const wake = profile.drift.wake;
  const duration = profile.drift.duration;
  const bedMoves = bed && (Math.abs(bed.net) >= DRIFT_MIN || bed.returned);
  const wakeMoves = wake && (Math.abs(wake.net) >= DRIFT_MIN || wake.returned);
  if (!bedMoves && !wakeMoves) return null;

  const together =
    bedMoves &&
    wakeMoves &&
    !bed.returned &&
    !wake.returned &&
    Math.sign(bed.net) === Math.sign(wake.net);
  const subject = together ? 'le coucher et le lever' : bedMoves ? 'le coucher' : 'le lever';
  const lead = together ? bed : bedMoves ? bed : wake;
  const minutes = Math.round(Math.abs(lead.returned ? lead.mid - lead.first : lead.net));
  const durationBit = profile.patterns.includes('duration_stable_clock_shift')
    ? ' La durée reste du même ordre pendant ce décalage.'
    : profile.patterns.includes('duration_changes_with_clock')
      ? ` La durée change aussi, d’environ ${Math.round(Math.abs(duration?.net || 0))} min.`
      : '';
  const body = lead.returned
    ? `Le décalage de ${subject} s’est ensuite résorbé d’environ ${minutes} min.${durationBit}`
    : `Sur la période, ${subject} se décale d’environ ${minutes} min dans le même sens.${durationBit}`;

  return card(
    'disc_sleep_drift',
    'journey',
    'sleep_drift',
    body.replace(/\s+/g, ' ').trim(),
    `${minutes} min`,
    { sleepClockBand: profile.sleepClockBand, driftMin: Math.round(lead.net), axis: together ? 'rhythm' : bedMoves ? 'bed' : 'wake' },
    80
  );
}

function toleranceCard(profile, sessions) {
  if (profile.level < 2 || profile.bed.median == null) return null;
  const byNight = new Map(profile.clocks.map((row) => [row.ymd, row]));
  const late = [];
  const early = [];
  (sessions || []).forEach((session) => {
    const reps = Number(session?.totalReps);
    if (!Number.isFinite(reps) || reps < 20) return;
    const night = byNight.get(session.date);
    if (!night) return;
    if (night.bedMin > profile.bed.median + 60) late.push(reps);
    else early.push(reps);
  });
  if (!late.length || !early.length) return null;
  const lateMean = late.reduce((a, b) => a + b, 0) / late.length;
  const earlyMean = early.reduce((a, b) => a + b, 0) / early.length;
  const delta = lateMean - earlyMean;
  const pct = earlyMean > 0 ? (delta / earlyMean) * 100 : 0;
  if (!publishable(late.length, early.length, pct, delta)) return null;
  const direction = delta < 0 ? 'plus bas' : 'plus haut';
  return card(
    'disc_sleep_tolerance',
    'trajectory',
    'sleep_tolerance',
    `Les séances observées après un coucher plus tardif que ton placement récent sont associées à un volume ${direction}. Association observée, pas une cause.`,
    `${late.length} nuits tardives · ${early.length} autres`,
    { sleepClockBand: profile.sleepClockBand, volumeDelta: Math.round(delta) },
    84
  );
}

export function buildSleepRhythmDiscoveries({ nights = [], sessions = [] } = {}) {
  const profile = analyzeSleepRhythm(nights);
  if (!profile.n) return [];
  return [
    rhythmFact(profile),
    regularityCard(profile),
    referenceCard(profile),
    weekendCard(profile),
    driftCard(profile),
    toleranceCard(profile, sessions)
  ].filter(Boolean);
}
