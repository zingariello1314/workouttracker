/** Mesure isolée du moteur XP réel. N'écrit rien. */
import { performance } from 'node:perf_hooks';
import { calculateSportXP } from '../../src/services/xp/xpCalculations.js';

function days(n) {
  const out = [];
  const start = Date.UTC(2020, 0, 1);
  for (let i = 0; i < n; i += 1) {
    const d = new Date(start + i * 86400000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function workout(dayCount, perDay) {
  const checkedExercises = {};
  const reps = {};
  for (const date of days(dayCount)) {
    for (let e = 0; e < perDay; e += 1) {
      const key = `${date}_${e + 1}`;
      checkedExercises[key] = true;
      reps[key] = '10';
    }
  }
  return {
    checkedExercises,
    reps,
    checkedStretches: {},
    exerciseWeights: {},
    enduranceData: { sessions: {}, challenges: [] }
  };
}

function time(data) {
  const samples = [];
  let last = null;
  for (let i = 0; i < 5; i += 1) {
    const t0 = performance.now();
    last = calculateSportXP(data, null, data.enduranceData, {});
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  return {
    medianMs: Math.round(samples[2] * 100) / 100,
    minMs: Math.round(samples[0] * 100) / 100,
    maxMs: Math.round(samples[4] * 100) / 100,
    totalXP: last?.totalXP ?? null
  };
}

const report = {
  S: time(workout(30, 8)),
  M: time(workout(400, 12)),
  L: time(workout(2000, 12))
};
console.log(JSON.stringify(report, null, 2));
