/**
 * Compression intra-semaine : adapte la séance du jour selon charge récente (48–72 h).
 */

import { parseSetsCount } from './quizSessionLimits';

function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ymdAdd(ymd, delta) {
  const d = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10))
  );
  d.setDate(d.getDate() + delta);
  return ymdFromDate(d);
}

/**
 * Score de charge récente 0–1 (1 = très chargé).
 */
export function assessRecentLoadScore(snapshot, sessionYmd, lookbackDays = 3) {
  if (!snapshot?.checkedExercises) return 0;
  const start = ymdAdd(sessionYmd, -(lookbackDays - 1));
  let activeDays = 0;
  let totalReps = 0;

  Object.keys(snapshot.checkedExercises).forEach((key) => {
    if (!snapshot.checkedExercises[key]) return;
    const ymd = key.slice(0, 10);
    if (ymd < start || ymd >= sessionYmd) return;
    activeDays += 1;
    totalReps += Number(snapshot.reps?.[key]) || 0;
  });

  if (activeDays === 0) return 0;
  const repsPerDay = totalReps / activeDays;
  const dayFactor = Math.min(1, activeDays / lookbackDays);
  const repFactor = Math.min(1, repsPerDay / 120);
  return Math.round((dayFactor * 0.55 + repFactor * 0.45) * 100) / 100;
}

/**
 * @param {object[]} exercises
 * @param {number} compressionFactor 0.7–1
 */
export function compressExercisesForDay(exercises, compressionFactor) {
  if (!Array.isArray(exercises) || compressionFactor >= 0.98) return exercises;
  const f = Math.max(0.7, Math.min(0.95, compressionFactor));

  return exercises.map((ex) => {
    const s = String(ex.series || '');
    if (!s || /min|sec|course/i.test(s)) return ex;
    const m = s.match(/^(\d+)×(\d+)(?:-(\d+))?$/);
    if (!m) return ex;
    let sets = parseSetsCount(s);
    const lo = parseInt(m[2], 10);
    const hi = m[3] ? parseInt(m[3], 10) : lo;
    sets = Math.max(1, Math.round(sets * f));
    const newLo = Math.max(1, Math.round(lo * f));
    const newHi = Math.max(newLo, Math.round(hi * f));
    const series = m[3] ? `${sets}×${newLo}-${newHi}` : `${sets}×${newLo}`;
    return {
      ...ex,
      series,
      notes: [ex.notes, 'Séance allégée (récupération récente).'].filter(Boolean).join(' ')
    };
  });
}

/**
 * @returns {{ factor: number, reason: string|null }}
 */
export function resolveDailyCompression(snapshot, sessionYmd, trainingEvidence = null) {
  const load = assessRecentLoadScore(snapshot, sessionYmd, 3);
  let factor = 1;
  let reason = null;

  if (load >= 0.75) {
    factor = 0.82;
    reason = 'Charge élevée sur les derniers jours : séance du jour légèrement compressée.';
  } else if (load >= 0.5) {
    factor = 0.92;
    reason = 'Activité récente soutenue : volume du jour ajusté à la baisse.';
  }

  if (trainingEvidence?.restGap14 >= 8) {
    factor = Math.min(factor, 0.88);
    reason = reason || 'Reprise après pause : séance prudentielle.';
  }

  let upliftFactor = 1;
  if (load < 0.22 && factor >= 0.99) {
    upliftFactor = 1.05;
  }

  return { factor, upliftFactor, reason, loadScore: load };
}
