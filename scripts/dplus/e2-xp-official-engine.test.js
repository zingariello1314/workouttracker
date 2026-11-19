import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { completeProgramWorkout, syntheticWorkout } from './e2XpFixtures.mjs';

vi.mock('../../src/utils/programCompletionBonus.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    computeProgramCompletionBonusXpIndexed(data, ctx) {
      return actual.computeProgramCompletionBonusXp(data, ctx);
    }
  };
});

const { computeProgramCompletionBonusXp } = await import('../../src/utils/programCompletionBonus.js');
const { calculateSportXP } = await import('../../src/services/xp/xpCalculations.js');

function time(fn, runs) {
  const samples = [];
  let value;
  for (let i = 0; i < runs; i += 1) {
    const heapBefore = process.memoryUsage().heapUsed;
    const t0 = performance.now();
    value = fn();
    const ms = Math.round((performance.now() - t0) * 100) / 100;
    samples.push({ ms, heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore });
  }
  const sorted = samples.map((s) => s.ms).sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  return {
    runs: sorted.length,
    medianMs: sorted.length > 1 ? Math.round(mid * 100) / 100 : sorted[0],
    samplesMs: sorted,
    heapDeltaBytes: samples.map((s) => s.heapDeltaBytes),
    value
  };
}

describe('moteur XP officiel, jeux S M L', () => {
  it('mesure le moteur complet et le bonus, et enregistre les résultats', () => {
    const complete = completeProgramWorkout();
    const completeResult = calculateSportXP(complete, null, complete.enduranceData, {});
    const sizes = [
      { name: 'S', days: 30, runs: 2 },
      { name: 'M', days: 400, runs: 2 },
      { name: 'L', days: 2000, runs: 2 }
    ];
    const report = {
      node: process.version,
      environment: 'vitest jsdom',
      engine: 'official-oracle-forced',
      fixture: {
        totalXP: completeResult.totalXP,
        bonusXp: completeResult.breakdown.programCompletionBonusXp,
        breakdown: completeResult.breakdown
      },
      sizes: {}
    };
    expect(report.fixture.bonusXp).toBe(600);
    for (const size of sizes) {
      const data = syntheticWorkout(size.days);
      const bonus = time(() => computeProgramCompletionBonusXp(data, {}), size.runs);
      const engine = time(() => calculateSportXP(data, null, data.enduranceData, {}), size.runs);
      expect(engine.value.breakdown.programCompletionBonusXp).toBe(bonus.value);
      report.sizes[size.name] = {
        days: size.days,
        keys: size.days * 12,
        bonus: { medianMs: bonus.medianMs, samplesMs: bonus.samplesMs, heapDeltaBytes: bonus.heapDeltaBytes, value: bonus.value },
        engine: {
          medianMs: engine.medianMs,
          samplesMs: engine.samplesMs,
          heapDeltaBytes: engine.heapDeltaBytes,
          totalXP: engine.value.totalXP,
          bonusXp: engine.value.breakdown.programCompletionBonusXp,
          breakdown: engine.value.breakdown
        }
      };
    }
    writeFileSync(path.join(process.cwd(), 'scripts', 'dplus', 'e2-xp-official.json'), JSON.stringify(report));
    expect(report.sizes.L.engine.samplesMs).toHaveLength(2);
  }, 300000);
});
