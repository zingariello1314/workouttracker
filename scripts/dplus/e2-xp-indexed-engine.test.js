/**
 * Moteur de production après E2.2 : calculateSportXP appelle le bonus indexé.
 * L'oracle indépendant est computeProgramCompletionBonusXp, non branché.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculateSportXP } from '../../src/services/xp/xpCalculations.js';
import {
  computeProgramCompletionBonusXp,
  computeProgramCompletionBonusXpIndexed
} from '../../src/utils/programCompletionBonus.js';
import { completeProgramWorkout, syntheticWorkout } from './e2XpFixtures.mjs';

function timeEngine(data, runs) {
  const samples = [];
  let value;
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();
    value = calculateSportXP(data, null, data.enduranceData, {});
    samples.push(Math.round((performance.now() - t0) * 100) / 100);
  }
  return { samplesMs: samples, value };
}

describe('moteur de production avec le bonus indexé', () => {
  it('égale l’oracle sur des bonus non nuls, des cas atypiques et les jeux S M L', () => {
    const official = JSON.parse(
      readFileSync(path.join(process.cwd(), 'scripts', 'dplus', 'e2-xp-official.json'), 'utf8')
    );
    const complete = completeProgramWorkout();
    const completeResult = calculateSportXP(complete, null, complete.enduranceData, {});
    const completeOracle = computeProgramCompletionBonusXp(complete, {});
    expect(completeOracle).toBe(600);
    expect(completeResult.breakdown.programCompletionBonusXp).toBe(completeOracle);
    expect(completeResult.totalXP).toBe(official.fixture.totalXP);
    expect(completeResult.breakdown).toEqual(official.fixture.breakdown);

    const atypical = [
      {
        label: 'cles-limites',
        data: {
          checkedExercises: {
            'pas-une-date': true,
            '2020-13-40_1': true,
            '2020-06-1_1': true,
            '2020-06-01': true,
            '2020-06-01_1': true,
            '2020-06-01_1_semaineA': true
          },
          reps: { '2020-13-40_1': 'abc', '2020-06-01_': '10', '2020-06-01_99': '4' },
          checkedStretches: { '2020-06-01_matin': true, legacy: true },
          enduranceData: { sessions: {}, challenges: [] }
        }
      },
      {
        label: 'reps-sans-coche',
        data: {
          checkedExercises: {},
          reps: { '2020-06-01_3': '10' },
          checkedStretches: {},
          enduranceData: { sessions: {}, challenges: [] }
        }
      },
      {
        label: 'maps-null',
        data: {
          checkedExercises: null,
          reps: null,
          checkedStretches: null,
          enduranceData: { sessions: {}, challenges: [] }
        }
      }
    ];
    for (const case_ of atypical) {
      const result = calculateSportXP(case_.data, null, case_.data.enduranceData, {});
      const oracle = computeProgramCompletionBonusXp(case_.data, {});
      const indexed = computeProgramCompletionBonusXpIndexed(case_.data, {});
      expect(indexed, case_.label).toBe(oracle);
      expect(result.breakdown.programCompletionBonusXp, case_.label).toBe(oracle);
    }
    expect(computeProgramCompletionBonusXpIndexed(null, {})).toBe(0);
    expect(computeProgramCompletionBonusXp(null, {})).toBe(0);

    const report = {
      node: process.version,
      environment: 'vitest jsdom',
      engine: 'production-indexed',
      sizes: {}
    };
    for (const name of ['S', 'M', 'L']) {
      const size = official.sizes[name];
      const data = syntheticWorkout(size.days);
      const engine = timeEngine(data, 2);
      const oracle = computeProgramCompletionBonusXp(data, {});
      expect(engine.value.breakdown.programCompletionBonusXp).toBe(oracle);
      expect(engine.value.totalXP).toBe(size.engine.totalXP);
      expect(engine.value.breakdown).toEqual(size.engine.breakdown);
      report.sizes[name] = {
        days: size.days,
        keys: size.keys,
        samplesMs: engine.samplesMs,
        totalXP: engine.value.totalXP,
        bonusXp: engine.value.breakdown.programCompletionBonusXp,
        officialSamplesMs: size.engine.samplesMs
      };
    }
    writeFileSync(
      path.join(process.cwd(), 'scripts', 'dplus', 'e2-xp-indexed.json'),
      JSON.stringify(report, null, 2)
    );
    expect(report.sizes.L.samplesMs[0]).toBeLessThan(official.sizes.L.engine.samplesMs[0]);
  }, 180000);
});
