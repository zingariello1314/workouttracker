/**
 * Moteur de corrélation sommeil ↔ entraînement.
 *
 * Produit des candidats internes, jamais un texte « pas assez de données ».
 * Si n est trop petit, l'effet trop faible ou la dispersion trop grande : [].
 *
 * Convention : nuit de D = récupération avant la séance de D.
 * J-2 = nuit qui se termine le matin D-1 (calendaire, pas la séance précédente).
 */

import { familyOfExercise } from './recapStimulusCatalog';
import { extractSleepNight } from './recapSleepNight';
import { normalizeSessionPerceivedStored } from '../exerciseSessionPerceivedModel';

function mean(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function median(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function sum(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n));
  if (!v.length) return 0;
  return v.reduce((a, b) => a + b, 0);
}

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

function familyReps(session) {
  let push = 0;
  let pull = 0;
  (session?.exercises || []).forEach((e) => {
    const fam = familyOfExercise(e.id, e.name);
    const reps = Number(e.reps) || 0;
    if (fam === 'poussée') push += reps;
    if (fam === 'tirage') pull += reps;
  });
  return { push, pull };
}

export function formatSleepHoursFr(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return '';
  const min = Math.round(h * 60);
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  if (hh >= 1 && mm > 0) return `${hh} h ${String(mm).padStart(2, '0')}`;
  if (hh >= 1) return `${hh} h`;
  return `${mm} min`;
}

export function formatSleepMinutesFr(min) {
  const m = Math.round(Number(min) || 0);
  if (m < 1) return '';
  if (m < 60) return `${m} min`;
  const hh = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${hh} h`;
  return `${hh} h ${String(r).padStart(2, '0')}`;
}

export function pairSessionsWithNights(catalog) {
  return (catalog || [])
    .filter((s) => (s.totalReps || 0) >= 20)
    .map((s) => {
      const fam = familyReps(s);
      return {
        date: s.date,
        totalReps: s.totalReps || 0,
        minutes: s.minutes || 0,
        night: s.night || null,
        hours: s.night?.hours ?? s.sleepHours ?? null,
        hoursJ2: s.nightJ2?.hours ?? s.hoursJ2 ?? null,
        efficiency: s.night?.efficiency ?? s.efficiency ?? null,
        pushReps: fam.push,
        pullReps: fam.pull,
        prevDayReps: Number(s.prevDayReps) || 0,
        exerciseCount: (s.exercises || []).length,
        leadReps: Math.max(0, ...((s.exercises || []).map((e) => Number(e.reps) || 0))),
        muscles: s.muscles || []
      };
    })
    .filter((s) => s.hours != null && s.hours >= 1.5)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function weekMonday(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dow);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function publishable(aN, bN, delta, base, { minEach = 4, minPct = 12, minAbs = 35 } = {}) {
  if (aN < minEach || bN < minEach) return false;
  if (!Number.isFinite(delta) || !Number.isFinite(base) || base <= 0) return false;
  const pct = (delta / base) * 100;
  return Math.abs(pct) >= minPct || Math.abs(delta) >= minAbs;
}

export function sleepVolumeByThreshold(pairs, threshold = 7.5, opts = {}) {
  const high = (pairs || []).filter((p) => p.hours >= threshold);
  const low = (pairs || []).filter((p) => p.hours < threshold);
  const highVol = mean(high.map((p) => p.totalReps));
  const lowVol = mean(low.map((p) => p.totalReps));
  if (highVol == null || lowVol == null) return null;
  if (!publishable(high.length, low.length, highVol - lowVol, lowVol, opts)) {
    return null;
  }
  const highMin = mean(high.map((p) => p.minutes).filter((n) => n >= 15));
  const lowMin = mean(low.map((p) => p.minutes).filter((n) => n >= 15));
  return {
    type: 'sleep_volume_threshold',
    sample: opts.sample || 'all',
    threshold,
    highN: high.length,
    lowN: low.length,
    highVol: round1(highVol),
    lowVol: round1(lowVol),
    delta: round1(highVol - lowVol),
    deltaPct: round1(((highVol - lowVol) / lowVol) * 100),
    highMin: highMin != null ? Math.round(highMin) : null,
    lowMin: lowMin != null ? Math.round(lowMin) : null,
    confidence: high.length + low.length >= 12 ? 'high' : 'medium'
  };
}

export function sleepDurationZones(pairs, opts = {}) {
  const z8 = (pairs || []).filter((p) => p.hours >= 8);
  const z75 = (pairs || []).filter((p) => p.hours >= 7.5 && p.hours < 8);
  const zLow = (pairs || []).filter((p) => p.hours < 7.5);
  const a = mean(z8.map((p) => p.totalReps));
  const c = mean(zLow.map((p) => p.totalReps));
  if (a == null || c == null) return null;
  if (!publishable(z8.length, zLow.length, a - c, c, { ...opts, minEach: opts.minEach ?? 3 })) {
    return null;
  }
  return {
    type: 'sleep_zones',
    z8: { n: z8.length, vol: round1(a) },
    z75: z75.length >= 2 && mean(z75.map((p) => p.totalReps)) != null
      ? { n: z75.length, vol: round1(mean(z75.map((p) => p.totalReps))) }
      : null,
    zLow: { n: zLow.length, vol: round1(c) },
    delta: round1(a - c),
    deltaPct: round1(((a - c) / c) * 100),
    confidence: z8.length + zLow.length >= 10 ? 'high' : 'medium'
  };
}

export function sleepHighLowSeparation(pairs, { highReps = 300, lowReps = 250, cut = 7.5 } = {}) {
  const high = (pairs || []).filter((p) => p.totalReps >= highReps);
  const low = (pairs || []).filter((p) => p.totalReps < lowReps);
  if (high.length < 4 || low.length < 3) return null;
  const highOk = high.filter((p) => p.hours >= cut).length;
  const lowShort = low.filter((p) => p.hours < cut).length;
  if (highOk / high.length < 0.7 && lowShort / low.length < 0.55) return null;
  return {
    type: 'sleep_separation',
    highN: high.length,
    highOk,
    lowN: low.length,
    lowShort,
    cut,
    confidence: high.length + low.length >= 10 ? 'high' : 'medium'
  };
}

export function sleepArchitectureByVolume(pairs, { highReps = 300, lowReps = 250 } = {}) {
  const high = (pairs || []).filter((p) => p.totalReps >= highReps && p.night);
  const low = (pairs || []).filter((p) => p.totalReps < lowReps && p.night);
  if (high.length < 3 || low.length < 3) return null;
  const awakeH = mean(high.map((p) => p.night.awakeMin).filter((n) => n != null));
  const awakeL = mean(low.map((p) => p.night.awakeMin).filter((n) => n != null));
  const remH = mean(high.map((p) => p.night.remMin).filter((n) => n != null));
  const remL = mean(low.map((p) => p.night.remMin).filter((n) => n != null));
  const deepH = mean(high.map((p) => p.night.deepMin).filter((n) => n != null));
  const deepL = mean(low.map((p) => p.night.deepMin).filter((n) => n != null));
  const bbH = mean(high.map((p) => p.night.bodyBatteryCharged).filter((n) => n != null));
  const bbL = mean(low.map((p) => p.night.bodyBatteryCharged).filter((n) => n != null));
  const hoursH = mean(high.map((p) => p.hours));
  const hoursL = mean(low.map((p) => p.hours));
  if (awakeH == null && remH == null && bbH == null && deepH == null) return null;
  const deepDelta = deepH != null && deepL != null ? Math.abs(deepH - deepL) : null;
  return {
    type: 'sleep_architecture',
    highN: high.length,
    lowN: low.length,
    hoursHigh: hoursH != null ? round1(hoursH) : null,
    hoursLow: hoursL != null ? round1(hoursL) : null,
    awakeHigh: awakeH != null ? Math.round(awakeH) : null,
    awakeLow: awakeL != null ? Math.round(awakeL) : null,
    remHigh: remH != null ? Math.round(remH) : null,
    remLow: remL != null ? Math.round(remL) : null,
    deepHigh: deepH != null ? Math.round(deepH) : null,
    deepLow: deepL != null ? Math.round(deepL) : null,
    deepStable: deepDelta != null && deepDelta <= 12,
    bbHigh: bbH != null ? round1(bbH) : null,
    bbLow: bbL != null ? round1(bbL) : null,
    confidence: high.length + low.length >= 8 ? 'high' : 'medium'
  };
}

export function sleepDelayedDeficit(pairs, { shortCut = 7, longCut = 7.5 } = {}) {
  const rows = pairs || [];
  const afterTwoShort = [];
  const afterTwoLong = [];
  rows.forEach((p) => {
    if (p.hours == null || p.hoursJ2 == null) return;
    if (p.hours < shortCut && p.hoursJ2 < shortCut) afterTwoShort.push(p.totalReps);
    if (p.hours >= longCut && p.hoursJ2 >= longCut) afterTwoLong.push(p.totalReps);
  });
  const s = mean(afterTwoShort);
  const l = mean(afterTwoLong);
  if (!publishable(afterTwoShort.length, afterTwoLong.length, l - s, s, { minEach: 3 })) {
    return null;
  }
  return {
    type: 'sleep_delayed',
    shortN: afterTwoShort.length,
    longN: afterTwoLong.length,
    shortVol: round1(s),
    longVol: round1(l),
    delta: round1(l - s),
    confidence: afterTwoShort.length + afterTwoLong.length >= 8 ? 'high' : 'medium'
  };
}

/**
 * Efficacité ≥ 90 % à durée de sommeil comparable (bande autour de la médiane).
 */
export function sleepEfficiencyControlled(pairs, { cut = 90, bandH = 0.75 } = {}) {
  const withEff = (pairs || []).filter(
    (p) => p.efficiency != null && p.hours != null && p.hours >= 6 && p.hours <= 9.5
  );
  if (withEff.length < 8) return null;
  const mid = median(withEff.map((p) => p.hours));
  if (mid == null) return null;
  const comparable = withEff.filter((p) => Math.abs(p.hours - mid) <= bandH);
  const high = comparable.filter((p) => p.efficiency >= cut);
  const low = comparable.filter((p) => p.efficiency < cut);
  const highVol = mean(high.map((p) => p.totalReps));
  const lowVol = mean(low.map((p) => p.totalReps));
  if (!publishable(high.length, low.length, highVol - lowVol, lowVol, { minEach: 3, minPct: 8, minAbs: 25 })) {
    return null;
  }
  return {
    type: 'sleep_efficiency',
    cut,
    bandH,
    medianHours: round1(mid),
    highN: high.length,
    lowN: low.length,
    highVol: round1(highVol),
    lowVol: round1(lowVol),
    delta: round1(highVol - lowVol),
    deltaPct: round1(((highVol - lowVol) / lowVol) * 100),
    confidence: comparable.length >= 10 ? 'high' : 'medium'
  };
}

/**
 * Après une nuit < 7 h, poussée vs tirage par rapport au régime ≥ 7 h 30.
 */
export function sleepFamilySensitivity(pairs, { shortCut = 7, longCut = 7.5 } = {}) {
  const short = (pairs || []).filter(
    (p) => p.hours < shortCut && (p.pushReps >= 20 || p.pullReps >= 20)
  );
  const long = (pairs || []).filter(
    (p) => p.hours >= longCut && (p.pushReps >= 20 || p.pullReps >= 20)
  );
  if (short.length < 4 || long.length < 4) return null;
  const pushHabit = mean(long.map((p) => p.pushReps));
  const pullHabit = mean(long.map((p) => p.pullReps));
  const pushShort = mean(short.map((p) => p.pushReps));
  const pullShort = mean(short.map((p) => p.pullReps));
  if (!(pushHabit > 20) || !(pullHabit > 20) || pushShort == null || pullShort == null) return null;
  const pushRetain = (pushShort / pushHabit) * 100;
  const pullRetain = (pullShort / pullHabit) * 100;
  if (Math.abs(pushRetain - pullRetain) < 8) return null;
  const sensitive = pullRetain < pushRetain ? 'tirage' : 'poussée';
  return {
    type: 'sleep_family',
    shortN: short.length,
    longN: long.length,
    pushRetain: round1(pushRetain),
    pullRetain: round1(pullRetain),
    pushShort: round1(pushShort),
    pullShort: round1(pullShort),
    pushHabit: round1(pushHabit),
    pullHabit: round1(pullHabit),
    sensitive,
    confidence: short.length + long.length >= 10 ? 'high' : 'medium'
  };
}

/**
 * J-2 isolé : nuit D-1 courte, nuit D (J-1) correcte.
 */
export function sleepLagJ2(pairs, { shortCut = 7, longCut = 7.5 } = {}) {
  const isolated = [];
  const bothOk = [];
  (pairs || []).forEach((p) => {
    if (p.hours == null || p.hoursJ2 == null) return;
    if (p.hours >= longCut && p.hoursJ2 < shortCut) isolated.push(p.totalReps);
    if (p.hours >= longCut && p.hoursJ2 >= longCut) bothOk.push(p.totalReps);
  });
  const iso = mean(isolated);
  const ok = mean(bothOk);
  if (!publishable(isolated.length, bothOk.length, ok - iso, iso, { minEach: 3, minPct: 10, minAbs: 30 })) {
    return null;
  }
  return {
    type: 'sleep_j2',
    isolatedN: isolated.length,
    okN: bothOk.length,
    isolatedVol: round1(iso),
    okVol: round1(ok),
    delta: round1(ok - iso),
    deltaPct: iso > 0 ? round1(((ok - iso) / iso) * 100) : null,
    confidence: isolated.length + bothOk.length >= 8 ? 'high' : 'medium'
  };
}

/**
 * Trois conditions : ≥ 7 h 45 + efficacité ≥ 90 % + les deux nuits sans déficit.
 */
export function sleepTripleCondition(pairs, { hoursCut = 7.75, effCut = 90, j2Cut = 7.5 } = {}) {
  const ok = [];
  const rest = [];
  (pairs || []).forEach((p) => {
    if (p.efficiency == null || p.hoursJ2 == null) return;
    const triple = p.hours >= hoursCut && p.efficiency >= effCut && p.hoursJ2 >= j2Cut;
    if (triple) ok.push(p.totalReps);
    else rest.push(p.totalReps);
  });
  const a = mean(ok);
  const b = mean(rest);
  if (!publishable(ok.length, rest.length, a - b, b, { minEach: 3, minPct: 10, minAbs: 30 })) {
    return null;
  }
  return {
    type: 'sleep_combo',
    okN: ok.length,
    restN: rest.length,
    okVol: round1(a),
    restVol: round1(b),
    delta: round1(a - b),
    deltaPct: b > 0 ? round1(((a - b) / b) * 100) : null,
    confidence: ok.length + rest.length >= 10 ? 'high' : 'medium'
  };
}

/**
 * Concentration du volume de la fenêtre derrière les nuits ≥ seuil.
 * `vs: 'nights'` = part des nuits observées (semaine) ; `sessions` = part des séances (mois).
 */
export function sleepWindowConcentration({
  trainedPairs,
  allNights = null,
  cut = 7.5,
  vs = 'sessions'
} = {}) {
  const trained = (trainedPairs || []).filter((p) => p.hours != null);
  if (trained.length < 2) return null;
  const highTrained = trained.filter((p) => p.hours >= cut);
  if (highTrained.length < 1 || highTrained.length === trained.length) return null;
  const totalReps = sum(trained.map((p) => p.totalReps));
  const highReps = sum(highTrained.map((p) => p.totalReps));
  if (totalReps < 80) return null;
  const useNights = vs === 'nights' && (allNights || []).length >= 5;
  const denomN = useNights ? allNights.length : trained.length;
  const highDenom = useNights
    ? allNights.filter((n) => n && n.hours >= cut).length
    : highTrained.length;
  const nightShare = denomN > 0 ? (highDenom / denomN) * 100 : null;
  const volShare = (highReps / totalReps) * 100;
  if (nightShare == null || Math.abs(volShare - nightShare) < 15) return null;
  return {
    type: 'sleep_concentration',
    vs: useNights ? 'nights' : 'sessions',
    cut,
    trainedN: trained.length,
    highTrainedN: highTrained.length,
    totalReps: Math.round(totalReps),
    highReps: Math.round(highReps),
    volShare: round1(volShare),
    nightShare: round1(nightShare),
    denomN,
    highDenom,
    highPer: round1(highReps / highTrained.length),
    lowPer: trained.length - highTrained.length > 0
      ? round1((totalReps - highReps) / (trained.length - highTrained.length))
      : null,
    confidence: trained.length >= 4 ? 'high' : 'medium'
  };
}

/**
 * Le profond reste stable alors que la durée totale bouge.
 */
export function sleepDeepStability(nights) {
  const list = (nights || []).filter((n) => n && n.hours != null && n.deepMin != null);
  if (list.length < 4) return null;
  const deeps = list.map((n) => n.deepMin);
  const totals = list.map((n) => n.hours * 60);
  const rems = list.map((n) => n.remMin).filter((n) => n != null);
  const deepMin = Math.min(...deeps);
  const deepMax = Math.max(...deeps);
  const totMin = Math.min(...totals);
  const totMax = Math.max(...totals);
  const deepRange = deepMax - deepMin;
  const totRange = totMax - totMin;
  if (totRange < 60 || deepRange >= totRange * 0.55) return null;
  const remMin = rems.length >= 4 ? Math.min(...rems) : null;
  const remMax = rems.length >= 4 ? Math.max(...rems) : null;
  return {
    type: 'sleep_deep_stable',
    n: list.length,
    deepMin: Math.round(deepMin),
    deepMax: Math.round(deepMax),
    totMinHours: round1(totMin / 60),
    totMaxHours: round1(totMax / 60),
    remMin: remMin != null ? Math.round(remMin) : null,
    remMax: remMax != null ? Math.round(remMax) : null,
    confidence: list.length >= 6 ? 'high' : 'medium'
  };
}

/**
 * Densité de séance (reps/h) après nuit longue vs courte — proxy d'intensité.
 */
export function sleepIntensityByDensity(pairs, { longCut = 7.5, shortCut = 7 } = {}) {
  const high = (pairs || []).filter((p) => p.hours >= longCut && p.minutes >= 20);
  const low = (pairs || []).filter((p) => p.hours < shortCut && p.minutes >= 20);
  const dens = (p) => (p.totalReps / p.minutes) * 60;
  const highD = mean(high.map(dens));
  const lowD = mean(low.map(dens));
  if (!publishable(high.length, low.length, highD - lowD, lowD, { minEach: 3, minPct: 8, minAbs: 18 })) {
    return null;
  }
  return {
    type: 'sleep_intensity',
    highN: high.length,
    lowN: low.length,
    highDens: Math.round(highD),
    lowDens: Math.round(lowD),
    delta: Math.round(highD - lowD),
    deltaPct: lowD > 0 ? round1(((highD - lowD) / lowD) * 100) : null,
    confidence: high.length + low.length >= 10 ? 'high' : 'medium'
  };
}

function activityYmd(act) {
  const raw = act?.date || act?.startTime || act?.beginTimestamp;
  if (!raw) return null;
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function activityKm(act) {
  let d = act?.distance ?? act?.distanceKm ?? act?.km;
  if (d != null && typeof d === 'object') d = d.total ?? d.value ?? d.km ?? 0;
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n > 80 ? n / 1000 : n;
}

function activityMinutes(act) {
  const sec = Number(act?.duration ?? act?.durationInSeconds ?? act?.elapsedDuration);
  if (Number.isFinite(sec) && sec >= 60) return sec / 60;
  const min = Number(act?.durationMin ?? act?.minutes);
  return Number.isFinite(min) && min > 0 ? min : 0;
}

function isRunActivity(act) {
  const t = `${act?.activityType || ''} ${act?.activityName || ''} ${act?.type || ''}`.toLowerCase();
  if (/walk|marche|hike|strength|street|muscu/.test(t)) return false;
  return /run|course|trail|jogging/.test(t);
}

export function collectRunDays(garminData) {
  const byDate = new Map();
  (garminData?.activities?.cardio || []).forEach((act) => {
    if (!isRunActivity(act)) return;
    const date = activityYmd(act);
    const km = activityKm(act);
    if (!date || km < 0.8) return;
    const row = byDate.get(date) || { date, km: 0, minutes: 0, hours: null };
    row.km += km;
    row.minutes += activityMinutes(act);
    byDate.set(date, row);
  });
  const out = [];
  byDate.forEach((row) => {
    const night = extractSleepNight(garminData, row.date);
    if (!night || night.hours == null || night.hours < 1.5) return;
    out.push({
      ...row,
      km: round1(row.km),
      hours: night.hours,
      pace: row.minutes >= 8 && row.km >= 1 ? round1(row.minutes / row.km) : null
    });
  });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Distance de course après nuit ≥ 7 h 30 vs < 7 h.
 */
export function sleepCardioByThreshold(runDays, { longCut = 7.5, shortCut = 7 } = {}) {
  const high = (runDays || []).filter((r) => r.hours >= longCut && r.km >= 1);
  const low = (runDays || []).filter((r) => r.hours < shortCut && r.km >= 1);
  const highKm = mean(high.map((r) => r.km));
  const lowKm = mean(low.map((r) => r.km));
  if (!publishable(high.length, low.length, highKm - lowKm, lowKm, { minEach: 3, minPct: 10, minAbs: 0.8 })) {
    return null;
  }
  const highPace = mean(high.map((r) => r.pace).filter((n) => n > 0));
  const lowPace = mean(low.map((r) => r.pace).filter((n) => n > 0));
  return {
    type: 'sleep_cardio',
    highN: high.length,
    lowN: low.length,
    highKm: round1(highKm),
    lowKm: round1(lowKm),
    delta: round1(highKm - lowKm),
    deltaPct: lowKm > 0 ? round1(((highKm - lowKm) / lowKm) * 100) : null,
    highPace: highPace != null ? round1(highPace) : null,
    lowPace: lowPace != null ? round1(lowPace) : null,
    confidence: high.length + low.length >= 8 ? 'high' : 'medium'
  };
}

/**
 * Nuit courte après une séance lourde la veille vs après un jour léger / repos.
 */
export function sleepPrevLoadInteraction(pairs, { shortCut = 7, heavyCut = 280, lightCut = 80 } = {}) {
  const shortHeavy = [];
  const shortLight = [];
  (pairs || []).forEach((p) => {
    if (p.hours == null || p.hours >= shortCut) return;
    const prev = Number(p.prevDayReps) || 0;
    if (prev >= heavyCut) shortHeavy.push(p.totalReps);
    else if (prev <= lightCut) shortLight.push(p.totalReps);
  });
  const heavy = mean(shortHeavy);
  const light = mean(shortLight);
  if (!publishable(shortHeavy.length, shortLight.length, light - heavy, heavy, { minEach: 3, minPct: 12, minAbs: 30 })) {
    return null;
  }
  return {
    type: 'sleep_prev_load',
    shortHeavyN: shortHeavy.length,
    shortLightN: shortLight.length,
    shortHeavyVol: round1(heavy),
    shortLightVol: round1(light),
    delta: round1(light - heavy),
    deltaPct: heavy > 0 ? round1(((light - heavy) / heavy) * 100) : null,
    confidence: shortHeavy.length + shortLight.length >= 8 ? 'high' : 'medium'
  };
}

/**
 * Les nuits ≥ 7 h 30 sont surreprésentées devant les journées ≥ 300 reps.
 */
export function sleepHighDayShare(pairs, allNights = null, { highReps = 300, lowReps = 200, cut = 7.5 } = {}) {
  const trained = pairs || [];
  const highDays = trained.filter((p) => p.totalReps >= highReps);
  if (highDays.length < 6) return null;
  const highOk = highDays.filter((p) => p.hours >= cut).length;
  const highShare = (highOk / highDays.length) * 100;
  const nights = (allNights || []).filter((n) => n && n.hours != null);
  const nightShare =
    nights.length >= 12
      ? (nights.filter((n) => n.hours >= cut).length / nights.length) * 100
      : (trained.filter((p) => p.hours >= cut).length / Math.max(1, trained.length)) * 100;
  if (highShare - nightShare < 12) return null;
  const lowDays = trained.filter((p) => p.totalReps < lowReps);
  const lowShort =
    lowDays.length >= 4 ? (lowDays.filter((p) => p.hours < cut).length / lowDays.length) * 100 : null;
  return {
    type: 'sleep_high_day_share',
    highN: highDays.length,
    highOk,
    highShare: round1(highShare),
    nightShare: round1(nightShare),
    lowN: lowDays.length,
    lowShortShare: lowShort != null ? round1(lowShort) : null,
    confidence: highDays.length >= 10 && nights.length >= 20 ? 'high' : 'medium'
  };
}

/**
 * Semaines à ≥ 4 nuits ≥ 7 h 30 vs semaines à ≤ 2 : jours actifs.
 */
export function sleepWeekFrequency(trainedPairs, allNights, { cut = 7.5, highNights = 4, lowNights = 2 } = {}) {
  const weeks = {};
  const bump = (key) => {
    if (!key) return null;
    if (!weeks[key]) weeks[key] = { nights: 0, highNights: 0, trained: 0, reps: 0 };
    return weeks[key];
  };
  (allNights || []).forEach((n) => {
    const ymd = n.ymd || n.date;
    const row = bump(weekMonday(ymd));
    if (!row) return;
    row.nights += 1;
    if (n.hours >= cut) row.highNights += 1;
  });
  (trainedPairs || []).forEach((p) => {
    const row = bump(weekMonday(p.date));
    if (!row) return;
    row.trained += 1;
    row.reps += p.totalReps || 0;
  });
  const list = Object.values(weeks).filter((w) => w.nights >= 5 || w.trained >= 2);
  const high = list.filter((w) => w.highNights >= highNights);
  const low = list.filter((w) => w.highNights <= lowNights);
  const highDays = mean(high.map((w) => w.trained));
  const lowDays = mean(low.map((w) => w.trained));
  if (!publishable(high.length, low.length, highDays - lowDays, lowDays, { minEach: 2, minPct: 15, minAbs: 0.6 })) {
    return null;
  }
  return {
    type: 'sleep_week_freq',
    highWeeks: high.length,
    lowWeeks: low.length,
    highDays: round1(highDays),
    lowDays: round1(lowDays),
    delta: round1(highDays - lowDays),
    confidence: high.length + low.length >= 6 ? 'high' : 'medium'
  };
}

export function publishWindowSleepFacts({ trainedPairs, allNights, vs = 'sessions' } = {}) {
  return [
    sleepWindowConcentration({ trainedPairs, allNights, vs }),
    vs === 'nights' || vs === 'sessions' ? sleepDeepStability(allNights) : null,
    sleepHighDayShare(trainedPairs, allNights),
    sleepWeekFrequency(trainedPairs, allNights)
  ].filter(Boolean);
}

/**
 * Performance du mouvement le plus chargé, distincte du volume total de séance.
 */
export function sleepPerformanceLead(pairs, { longCut = 7.5, shortCut = 7 } = {}) {
  const high = (pairs || []).filter((p) => p.hours >= longCut && p.leadReps >= 8);
  const low = (pairs || []).filter((p) => p.hours < shortCut && p.leadReps >= 8);
  const highLead = mean(high.map((p) => p.leadReps));
  const lowLead = mean(low.map((p) => p.leadReps));
  if (highLead == null || lowLead == null) return null;
  const vol = sleepVolumeByThreshold(pairs, longCut, { minEach: 3 });
  const leadPct = lowLead > 0 ? ((highLead - lowLead) / lowLead) * 100 : null;
  const volumeDominates =
    vol && leadPct != null && vol.deltaPct != null && Math.abs(leadPct) + 8 < Math.abs(vol.deltaPct);
  if (!volumeDominates && !publishable(high.length, low.length, highLead - lowLead, lowLead, { minEach: 3, minPct: 10, minAbs: 6 })) {
    return null;
  }
  if (!volumeDominates && (high.length < 3 || low.length < 3)) return null;
  return {
    type: 'sleep_performance',
    highN: high.length,
    lowN: low.length,
    highLead: round1(highLead),
    lowLead: round1(lowLead),
    delta: round1(highLead - lowLead),
    deltaPct: leadPct != null ? round1(leadPct) : null,
    volumeDominates: Boolean(volumeDominates),
    volDeltaPct: vol?.deltaPct ?? null,
    confidence: high.length + low.length >= 10 ? 'high' : 'medium'
  };
}

export function meanDifficultyByDate(snapshot) {
  const map = snapshot?.exerciseSessionPerceived || {};
  const byDate = {};
  Object.entries(map).forEach(([key, row]) => {
    const date = String(key).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const d = normalizeSessionPerceivedStored(row).difficulty;
    if (d < 1) return;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(d);
  });
  const stars = snapshot?.exerciseSessionEffortStars || {};
  Object.entries(stars).forEach(([key, v]) => {
    const date = String(key).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (byDate[date]?.length) return;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1 || n > 5) return;
    byDate[date] = [n];
  });
  return Object.entries(byDate).map(([date, arr]) => ({
    date,
    difficulty: arr.reduce((a, b) => a + b, 0) / arr.length
  }));
}

/**
 * Effort perçu (difficulté 1–5) après nuit longue vs courte. Silence s'il n'y a pas de notes.
 */
export function sleepPerceivedEffort(pairs, difficulties, { longCut = 7.5, shortCut = 7 } = {}) {
  const byDate = new Map((difficulties || []).map((r) => [r.date, r.difficulty]));
  const rows = (pairs || [])
    .map((p) => ({ hours: p.hours, difficulty: byDate.get(p.date) }))
    .filter((r) => r.hours != null && r.difficulty >= 1);
  const high = rows.filter((r) => r.hours >= longCut);
  const low = rows.filter((r) => r.hours < shortCut);
  const highD = mean(high.map((r) => r.difficulty));
  const lowD = mean(low.map((r) => r.difficulty));
  if (!publishable(high.length, low.length, lowD - highD, highD, { minEach: 3, minPct: 8, minAbs: 0.35 })) {
    return null;
  }
  return {
    type: 'sleep_rpe',
    highN: high.length,
    lowN: low.length,
    highDiff: round1(highD),
    lowDiff: round1(lowD),
    delta: round1(lowD - highD),
    confidence: high.length + low.length >= 8 ? 'high' : 'medium'
  };
}

/**
 * @returns {object[]} candidats publiables uniquement
 */
export function publishSleepCandidates(catalog, opts = {}) {
  const pairs = pairSessionsWithNights(catalog);
  if (pairs.length < 8) return [];
  const recent14 = pairs.length > 14 ? pairs.slice(-14) : null;
  return [
    sleepVolumeByThreshold(pairs, 7.5, { ...opts, sample: 'all' }),
    recent14 ? sleepVolumeByThreshold(recent14, 7.5, { ...opts, minEach: 3, sample: 'recent14' }) : null,
    sleepVolumeByThreshold(pairs, 8, { ...opts, minEach: 3, sample: 'all' }),
    sleepDurationZones(pairs, opts),
    sleepHighLowSeparation(pairs),
    sleepArchitectureByVolume(pairs),
    sleepDelayedDeficit(pairs),
    sleepEfficiencyControlled(pairs),
    sleepFamilySensitivity(pairs),
    sleepLagJ2(pairs),
    sleepTripleCondition(pairs),
    sleepPrevLoadInteraction(pairs),
    sleepIntensityByDensity(pairs),
    sleepPerformanceLead(pairs),
    sleepPerceivedEffort(pairs, meanDifficultyByDate(opts.snapshot)),
    sleepCardioByThreshold(opts.runDays || [])
  ].filter(Boolean);
}

export function summarizeRecentNights(nights) {
  const list = (nights || []).filter((n) => n && n.hours != null);
  if (list.length < 2) return null;
  const hours = mean(list.map((n) => n.hours));
  const deep = mean(list.map((n) => n.deepMin).filter((n) => n != null));
  const rem = mean(list.map((n) => n.remMin).filter((n) => n != null));
  const light = mean(list.map((n) => n.lightMin).filter((n) => n != null));
  const awake = mean(list.map((n) => n.awakeMin).filter((n) => n != null));
  const sleepHr = mean(list.map((n) => n.sleepHr).filter((n) => n != null));
  const bb = mean(list.map((n) => n.bodyBatteryCharged).filter((n) => n != null));
  const efficiency = mean(list.map((n) => n.efficiency).filter((n) => n != null));
  const minH = Math.min(...list.map((n) => n.hours));
  const maxH = Math.max(...list.map((n) => n.hours));
  return {
    n: list.length,
    hours: round1(hours),
    deepMin: deep != null ? Math.round(deep) : null,
    remMin: rem != null ? Math.round(rem) : null,
    lightMin: light != null ? Math.round(light) : null,
    awakeMin: awake != null ? Math.round(awake) : null,
    sleepHr: sleepHr != null ? Math.round(sleepHr) : null,
    bbCharged: bb != null ? round1(bb) : null,
    efficiency: efficiency != null ? round1(efficiency) : null,
    minHours: round1(minH),
    maxHours: round1(maxH)
  };
}
