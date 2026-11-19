import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculateSportXP } from '../../src/services/xp/xpCalculations.js';
import { computeProgramCompletionBonusXp } from '../../src/utils/programCompletionBonus.js';
import { computeProgramCompletionBonusXpIndexed } from './experimentalCompletionBonus.mjs';

function days(n) {
  const out = [];
  const start = Date.UTC(2020, 0, 1);
  for (let i = 0; i < n; i += 1) {
    const d = new Date(start + i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function workout(dayCount) {
  const checkedExercises = {};
  const reps = {};
  for (const date of days(dayCount)) {
    for (let e = 1; e <= 12; e += 1) {
      const key = `${date}_${e}`;
      checkedExercises[key] = true;
      reps[key] = '10';
    }
  }
  return { checkedExercises, reps, checkedStretches: {}, enduranceData: { sessions: {}, challenges: [] } };
}

function time(fn, runs, ceilingMs) {
  const samples = [];
  let value;
  for (let i = 0; i < runs; i += 1) {
    const heapBefore = process.memoryUsage().heapUsed;
    const t0 = performance.now();
    value = fn();
    const dt = performance.now() - t0;
    samples.push({
      ms: Math.round(dt * 100) / 100,
      heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore
    });
    if (dt > ceilingMs) break;
  }
  const ms = samples.map((s) => s.ms).sort((a, b) => a - b);
  const mid = ms[Math.floor(ms.length / 2)];
  return {
    runs: ms.length,
    stoppedEarly: ms.length < runs,
    medianMs: ms.length > 1 ? Math.round(mid * 100) / 100 : null,
    samplesMs: ms,
    lastHeapDeltaBytes: samples[samples.length - 1].heapDeltaBytes,
    value
  };
}

describe('bonus officiel contre bonus indexé, mêmes objets', () => {
  it('mesure S à L et vérifie l’égalité du bonus sur chaque jeu', () => {
    const sizes = [
      { name: 'S', days: 30, runs: 3, ceilingMs: 8000 },
      { name: 'D100', days: 100, runs: 3, ceilingMs: 8000 },
      { name: 'D200', days: 200, runs: 2, ceilingMs: 15000 },
      { name: 'M', days: 400, runs: 2, ceilingMs: 20000 },
      { name: 'D800', days: 800, runs: 2, ceilingMs: 25000 },
      { name: 'L', days: 2000, runs: 2, ceilingMs: 45000 }
    ];
    const report = { node: process.version, environment: 'vitest jsdom', sizes: {} };
    for (const size of sizes) {
      const data = workout(size.days);
      const official = time(() => computeProgramCompletionBonusXp(data, {}), size.runs, size.ceilingMs);
      const indexed = time(() => computeProgramCompletionBonusXpIndexed(data, {}), size.runs, size.ceilingMs);
      const engineRuns = size.days >= 800 ? 1 : 2;
      const engine = time(
        () => calculateSportXP(data, null, data.enduranceData, {}),
        engineRuns,
        size.ceilingMs
      );
      expect(indexed.value, size.name).toBe(official.value);
      expect(engine.value.breakdown.programCompletionBonusXp, size.name).toBe(official.value);
      report.sizes[size.name] = {
        days: size.days,
        keys: size.days * 12,
        officialBonus: { ...official, value: official.value },
        indexedBonus: { ...indexed, value: indexed.value },
        officialEngine: {
          runs: engine.runs,
          stoppedEarly: engine.stoppedEarly,
          medianMs: engine.medianMs,
          samplesMs: engine.samplesMs,
          totalXP: engine.value.totalXP,
          bonusXp: engine.value.breakdown.programCompletionBonusXp
        }
      };
    }
    writeFileSync(
      path.join(process.cwd(), 'scripts', 'dplus', 'e1-xp-benchmark.json'),
      JSON.stringify(report, null, 2)
    );
    expect(report.sizes.S.indexedBonus.samplesMs.length).toBeGreaterThan(1);
    expect(report.sizes.L.indexedBonus.samplesMs.length).toBeGreaterThan(1);
    expect(report.sizes.L.officialBonus.samplesMs.length).toBeGreaterThan(1);
  }, 180000);
});
