/**
 * Une performance a une provenance. Le programme prescrit n'est jamais
 * une série observée. Le total du jour n'est jamais un record.
 * Ne réécrit pas exerciseMaxRecords.
 */

import { lookupProgramExerciseStub, parseSeriesSetCount } from '../exerciseLoadVolume';

const stubCache = new Map();

function exerciseIdFromKey(storageKey) {
  return String(storageKey || '')
    .slice(11)
    .replace(/_semaineA$|_semaineB$/, '');
}

function programPrescription(exerciseId) {
  const id = String(exerciseId || '');
  if (!id) return null;
  if (stubCache.has(id)) return stubCache.get(id);
  let stub = null;
  try {
    stub = lookupProgramExerciseStub(id);
  } catch {
    stub = null;
  }
  const series = String(stub?.series || '').trim();
  const setCount = series ? Number(parseSeriesSetCount(series)) || 0 : 0;
  const value = series
    ? { series, setCount: setCount > 0 ? setCount : null, provenance: 'program' }
    : null;
  stubCache.set(id, value);
  return value;
}

function officialRecord(snapshot, exerciseId) {
  const records = Array.isArray(snapshot?.exerciseMaxRecords) ? snapshot.exerciseMaxRecords : [];
  const hits = records.filter((r) => String(r?.exerciseId) === String(exerciseId));
  if (!hits.length) return null;
  const repsHits = hits.filter((r) => !r.performanceType || r.performanceType === 'reps');
  const pool = repsHits.length ? repsHits : hits;
  const best = pool.reduce((a, b) => {
    const score = (row) => {
      if (row.performanceType === 'weight_reps') return (Number(row.weightKg) || 0) * 1000 + (Number(row.reps) || 0);
      if (row.performanceType === 'duration') return Number(row.durationSec) || 0;
      return Number(row.reps) || 0;
    };
    return score(b) > score(a) ? b : a;
  });
  return {
    reps: Number(best.reps) || 0,
    weightKg: Number(best.weightKg) || 0,
    durationSec: Number(best.durationSec) || 0,
    performanceType: best.performanceType || 'reps',
    recordDate: best.recordDate || null
  };
}

function parseSet(raw) {
  const reps = Math.max(0, Math.floor(Number(raw?.reps) || 0));
  const weightKg = Math.max(0, Number(raw?.weightKg ?? raw?.weight) || 0);
  const durationSec = Math.max(0, Math.floor(Number(raw?.durationSec ?? raw?.maxHoldSeconds) || 0));
  return { reps, weightKg, durationSec };
}

function unitOf(sets) {
  if (sets.some((s) => s.durationSec > 0 && s.reps <= 0 && s.weightKg <= 0)) return 'duration';
  if (sets.some((s) => s.weightKg > 0)) return 'weight_reps';
  if (sets.some((s) => s.reps > 0)) return 'reps';
  return 'volume_only';
}

function bestOf(sets, unit) {
  if (unit === 'duration') {
    return sets.reduce((a, b) => (b.durationSec > a.durationSec ? b : a), sets[0]);
  }
  if (unit === 'weight_reps') {
    return sets.reduce((a, b) => {
      if (b.weightKg !== a.weightKg) return b.weightKg > a.weightKg ? b : a;
      return b.reps > a.reps ? b : a;
    }, sets[0]);
  }
  return sets.reduce((a, b) => (b.reps > a.reps ? b : a), sets[0]);
}

/**
 * Un seul set égal au total du jour, alors que le programme prévoit plusieurs
 * séries, est le total versé dans un set — pas une série observée.
 */
function isInferredDayTotal(sets, sessionTotal, programSetCount) {
  if (sets.length !== 1) return false;
  if (!(programSetCount > 1)) return false;
  const only = sets[0];
  if (only.weightKg > 0 || only.durationSec > 0) return false;
  return sessionTotal > 0 && only.reps === sessionTotal;
}

/**
 * @returns {{
 *   exerciseId: string,
 *   official: object|null,
 *   observed: object|null,
 *   sessionTotal: number,
 *   unit: 'reps'|'weight_reps'|'duration'|'volume_only',
 *   provenance: 'official'|'structured'|'total_only'|'program',
 *   program: object|null
 * }}
 */
export function resolveExercisePerformance(snapshot, storageKey) {
  const exerciseId = exerciseIdFromKey(storageKey);
  const sessionTotal = Math.max(0, parseInt(String(snapshot?.reps?.[storageKey] ?? ''), 10) || 0);
  const official = officialRecord(snapshot, exerciseId);
  const program = programPrescription(exerciseId);
  const rawSets = snapshot?.exerciseSetLogs?.[storageKey]?.sets;
  const sets = (Array.isArray(rawSets) ? rawSets : []).map(parseSet).filter(
    (s) => s.reps > 0 || s.weightKg > 0 || s.durationSec > 0
  );

  const emptyObserved = {
    exerciseId,
    official,
    observed: null,
    sessionTotal,
    program
  };

  if (!sets.length || isInferredDayTotal(sets, sessionTotal, program?.setCount || 0)) {
    let provenance = 'total_only';
    if (sessionTotal <= 0 && official) provenance = 'official';
    else if (sessionTotal <= 0 && program) provenance = 'program';
    return {
      ...emptyObserved,
      unit: sessionTotal > 0 ? 'volume_only' : official?.performanceType || 'volume_only',
      provenance
    };
  }

  const unit = unitOf(sets);
  const best = bestOf(sets, unit);
  const summed = sets.reduce((acc, s) => acc + s.reps, 0);
  const bestSet =
    unit === 'duration'
      ? best.durationSec
      : unit === 'weight_reps'
        ? { reps: best.reps, weightKg: best.weightKg }
        : best.reps;

  return {
    exerciseId,
    official,
    observed: {
      bestSet,
      setCount: sets.length,
      sessionTotal: sessionTotal || summed,
      source: 'structured'
    },
    sessionTotal: sessionTotal || summed,
    unit,
    provenance: 'structured',
    program
  };
}

/** Meilleure série reps réellement saisie. null si total, programme ou autre unité. */
export function structuredBestSetReps(snapshot, date, exerciseId) {
  const row = resolveExercisePerformance(snapshot, `${date}_${exerciseId}`);
  if (row.provenance !== 'structured' || row.unit !== 'reps') return null;
  const n = Number(row.observed?.bestSet);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function sessionsAsStructuredSets(snapshot, sessions, exerciseId) {
  return (sessions || [])
    .map((s) => {
      const best = structuredBestSetReps(snapshot, s.date, exerciseId);
      if (best == null) return null;
      return { date: s.date, reps: best };
    })
    .filter(Boolean);
}
