import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculateSportXP } from '../../src/services/xp/xpCalculations.js';
import {
  computeProgramCompletionBonusXp,
  computeProgramCompletionCheckedRatio
} from '../../src/utils/programCompletionBonus.js';
import { computeLifetimeExerciseAndChallengeMinutes } from '../../src/utils/calendarPhysicalSessionStripes.js';
import { aggregateCheckedRepsByDateAndExerciseId } from '../../src/utils/trainingLoadUtils.js';

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

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  return {
    runs: samples.length,
    medianMs: Math.round(mid * 100) / 100,
    minMs: Math.round(sorted[0] * 100) / 100,
    maxMs: Math.round(sorted[sorted.length - 1] * 100) / 100,
    samplesMs: sorted.map((n) => Math.round(n * 100) / 100)
  };
}

function timeCalls(fn, maxRuns, stopIfOverMs) {
  const samples = [];
  let value = null;
  for (let i = 0; i < maxRuns; i += 1) {
    const t0 = performance.now();
    value = fn();
    const dt = performance.now() - t0;
    samples.push(dt);
    if (dt > stopIfOverMs) break;
  }
  return { ...stats(samples), stoppedEarly: samples.length < maxRuns, value };
}

/** Même barème que computeProgramCompletionBonusXp, données déjà rangées par jour. */
function bonusFromDaySlices(data) {
  const checkedByDate = new Map();
  const repsByDate = new Map();
  for (const [key, value] of Object.entries(data.checkedExercises || {})) {
    if (!/^\d{4}-\d{2}-\d{2}_/.test(key)) continue;
    const date = key.slice(0, 10);
    if (!checkedByDate.has(date)) checkedByDate.set(date, {});
    checkedByDate.get(date)[key] = value;
  }
  for (const [key, value] of Object.entries(data.reps || {})) {
    if (!/^\d{4}-\d{2}-\d{2}_/.test(key)) continue;
    const date = key.slice(0, 10);
    if (!repsByDate.has(date)) repsByDate.set(date, {});
    repsByDate.get(date)[key] = value;
  }
  let bonus = 0;
  for (const date of checkedByDate.keys()) {
    const slice = {
      checkedExercises: checkedByDate.get(date) || {},
      reps: repsByDate.get(date) || {},
      checkedStretches: data.checkedStretches || {},
      enduranceData: data.enduranceData
    };
    const { total, ratio } = computeProgramCompletionCheckedRatio(date, slice, {});
    if (total === 0) continue;
    if (ratio >= 1) bonus += 300;
    else if (ratio >= 0.8) bonus += 100;
  }
  return bonus;
}

describe('profil du moteur XP sur jeux synthétiques', () => {
  it('isole le bonus de complétion et compare une passe par jour', () => {
    const sizes = [
      { name: 'S', days: 30, perDay: 12, engineRuns: 3, stopMs: 5000 },
      { name: 'D100', days: 100, perDay: 12, engineRuns: 3, stopMs: 8000 },
      { name: 'D200', days: 200, perDay: 12, engineRuns: 2, stopMs: 12000 },
      { name: 'M', days: 400, perDay: 12, engineRuns: 2, stopMs: 20000 },
      { name: 'D800', days: 800, perDay: 12, engineRuns: 2, stopMs: 25000 },
      { name: 'L', days: 2000, perDay: 12, engineRuns: 2, stopMs: 40000 }
    ];

    const report = {
      node: process.version,
      environment: 'vitest jsdom',
      shape: '12 exercices cochés par jour, clés date_index, endurance vide, pas un historique personnel',
      sizes: {}
    };

    for (const size of sizes) {
      const data = workout(size.days, size.perDay);
      const checkedKeys = Object.keys(data.checkedExercises).length;
      const inspections = size.days * checkedKeys * 2;
      const heapBefore = process.memoryUsage().heapUsed;
      const engine = timeCalls(
        () => calculateSportXP(data, null, data.enduranceData, {}),
        size.engineRuns,
        size.stopMs
      );
      const heapAfter = process.memoryUsage().heapUsed;
      const bonus = timeCalls(() => computeProgramCompletionBonusXp(data, {}), 1, size.stopMs);
      const minutes = timeCalls(
        () => computeLifetimeExerciseAndChallengeMinutes(data, null),
        1,
        5000
      );
      const dedup = timeCalls(
        () => aggregateCheckedRepsByDateAndExerciseId(data.reps, data.checkedExercises),
        1,
        5000
      );
      const sliced = timeCalls(() => bonusFromDaySlices(data), 1, 15000);
      const engineBonus = engine.value?.breakdown?.programCompletionBonusXp;
      report.sizes[size.name] = {
        days: size.days,
        perDay: size.perDay,
        checkedKeys,
        keyInspectionsIfFullScanPerDay: inspections,
        engineMs: (({ value, ...rest }) => rest)(engine),
        engineBonusXp: engineBonus,
        engineTotalXp: engine.value?.totalXP ?? null,
        bonusMs: (({ value, ...rest }) => rest)(bonus),
        bonusXp: bonus.value,
        minutesMs: (({ value, ...rest }) => rest)(minutes),
        dedupMs: (({ value, ...rest }) => rest)(dedup),
        dedupGroups: dedup.value?.size ?? null,
        slicedBonusMs: (({ value, ...rest }) => rest)(sliced),
        slicedBonusXp: sliced.value,
        bonusEqualsSliced: bonus.value === sliced.value,
        engineBonusEqualsOfficial: engineBonus === bonus.value,
        heapDeltaBytes: heapAfter - heapBefore
      };
    }

    const withStretch = workout(30, 8);
    withStretch.checkedStretches = { '2020-01-15_matin': true };
    const officialStretch = computeProgramCompletionBonusXp(withStretch, {});
    const slicedStretch = bonusFromDaySlices(withStretch);
    report.stretchFixture = {
      officialBonusXp: officialStretch,
      slicedBonusXp: slicedStretch,
      equal: officialStretch === slicedStretch
    };

    writeFileSync(
      path.join(process.cwd(), 'scripts', 'dplus', 'phase0-xp-profile.json'),
      JSON.stringify(report, null, 2)
    );

    expect(report.sizes.S.bonusEqualsSliced).toBe(true);
    expect(report.sizes.M.bonusEqualsSliced).toBe(true);
    expect(report.sizes.L.bonusEqualsSliced).toBe(true);
    expect(report.sizes.L.engineBonusEqualsOfficial).toBe(true);
    expect(report.stretchFixture.equal).toBe(true);
    expect(report.sizes.M.engineMs.medianMs).toBeGreaterThan(report.sizes.S.engineMs.medianMs);
  }, 180000);
});
