import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
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
    enduranceData: { sessions: {}, challenges: [] }
  };
}

function sample(data, runs) {
  const samples = [];
  let last = null;
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();
    last = calculateSportXP(data, null, data.enduranceData, {});
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const mid = samples[Math.floor(samples.length / 2)];
  return {
    runs,
    medianMs: Math.round(mid * 100) / 100,
    minMs: Math.round(samples[0] * 100) / 100,
    maxMs: Math.round(samples[samples.length - 1] * 100) / 100,
    totalXP: last?.totalXP ?? null,
    checkedKeys: Object.keys(data.checkedExercises).length
  };
}

describe('phase 0 — moteur XP réel sur jeux synthétiques', () => {
  it('chronomètre S, M et L sans écrire de donnée utilisateur', () => {
    const report = {
      engine: 'calculateSportXP',
      note: 'Clés synthétiques date_index, pas un historique personnel. Le totalXP n’est pas une valeur utilisateur.',
      S: sample(workout(30, 8), 5),
      M: sample(workout(400, 12), 3),
      L: sample(workout(2000, 12), 1)
    };
    const json = JSON.stringify(report, null, 2);
    console.log(json);
    writeFileSync(path.join(process.cwd(), 'scripts', 'dplus', 'phase0-xp-results.json'), json);
    expect(typeof report.S.totalXP).toBe('number');
    expect(report.S.medianMs).toBeGreaterThanOrEqual(0);
  }, 180000);
});
