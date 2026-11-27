import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findLastSameWeekdayExercisePerformance } from '../../src/utils/sport/sameWeekdayExerciseMemory.js';

const MAP_KEYS = [
  'checkedExercises',
  'reps',
  'exerciseWeights',
  'exerciseWeightPerArm',
  'exerciseSetWeights',
  'exerciseSetLogs',
  'exerciseSessionPerceived',
  'exerciseSessionEffortStars',
  'exerciseSessionPleasureStars',
  'exerciseDisplayNames',
  'exerciseMarkedWeighted'
];

function copySessionMaps(source) {
  const draft = { ...source };
  MAP_KEYS.forEach((key) => {
    const value = source?.[key];
    draft[key] = value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
  });
  return draft;
}

function medianScan(weights, exerciseCount) {
  for (let exercise = 0; exercise < exerciseCount; exercise += 1) {
    const id = `ex${exercise}`;
    const vals = [];
    for (const [key, raw] of Object.entries(weights)) {
      const rest = key.slice(11);
      if (rest !== id && !rest.startsWith(`${id}_`)) continue;
      const n = parseFloat(raw);
      if (Number.isFinite(n)) vals.push(n);
    }
    vals.sort((a, b) => a - b);
  }
}

function buildHistory(size) {
  const reps = {};
  const checkedExercises = {};
  const exerciseWeights = {};
  for (let i = 0; i < size; i += 1) {
    const key = `2024-06-03_${i}`;
    reps[key] = '30';
    checkedExercises[key] = true;
    exerciseWeights[key] = '20';
  }
  reps['2026-11-13_ex1'] = '12';
  exerciseWeights['2026-11-13_ex1'] = '40';
  checkedExercises['2026-11-13_ex1'] = true;
  return { reps, checkedExercises, exerciseWeights };
}

function sample(fn, count = 7) {
  const values = [];
  for (let i = 0; i < count; i += 1) {
    const t0 = performance.now();
    fn();
    values.push(performance.now() - t0);
  }
  const coldMs = Math.round(values[0] * 10) / 10;
  const sorted = [...values].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return {
    samples: count,
    coldMs,
    medianMs: Math.round(sorted[Math.floor(sorted.length / 2)] * 10) / 10,
    p95Ms: Math.round(sorted[p95Index] * 10) / 10,
    maxMs: Math.round(sorted[sorted.length - 1] * 10) / 10
  };
}

describe('coût synthétique des opérations d’une coche', () => {
  it('mesure recherche, copie et score sur 500, 4000 et 24000 clés', () => {
    const rows = [500, 4000, 24000].map((size) => {
      const data = buildHistory(size);
      const search = sample(() => {
        const hit = findLastSameWeekdayExercisePerformance(data, ['ex1'], '2026-11-20');
        if (hit?.reps !== '12') throw new Error('mémoire introuvable');
      });
      const copy = sample(() => {
        const draft = copySessionMaps(data);
        if (draft.reps['2026-11-13_ex1'] !== '12') throw new Error('copie incomplète');
      });
      const score = sample(() => {
        medianScan(data.exerciseWeights, 8);
      });
      return { size, uniqueRepKeys: Object.keys(data.reps).length, search, copy, scoreFor8Exercises: score };
    });
    writeFileSync('diagnostics/today-interaction-cost.json', JSON.stringify({
      runtime: 'vitest-jsdom',
      note: 'Ce n’est pas une durée de navigateur ni une session réelle.',
      node: process.version,
      rows
    }, null, 2));
    expect(rows).toHaveLength(3);
  });
});
