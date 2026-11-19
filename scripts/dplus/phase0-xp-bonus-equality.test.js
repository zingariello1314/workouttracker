import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPlannedExerciseListForDateStr,
  computeProgramCompletionBonusXp,
  computeProgramCompletionCheckedRatio
} from '../../src/utils/programCompletionBonus.js';
import { buildPlannedStretchListForDateStr } from '../../src/utils/programCompletionBonus.js';
import { generateStretchItemKey } from '../../src/utils/exerciseKeyGenerator.js';

function bonusFromDaySlices(data) {
  const checkedByDate = new Map();
  const repsByDate = new Map();
  const stretchByDate = new Map();
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
  for (const [key, value] of Object.entries(data.checkedStretches || {})) {
    const match = key.match(/^(\d{4}-\d{2}-\d{2})_/);
    if (!match) continue;
    if (!stretchByDate.has(match[1])) stretchByDate.set(match[1], {});
    stretchByDate.get(match[1])[key] = value;
  }
  const dates = new Set([...checkedByDate.keys(), ...stretchByDate.keys()]);
  let bonus = 0;
  for (const date of dates) {
    const slice = {
      checkedExercises: checkedByDate.get(date) || {},
      reps: repsByDate.get(date) || {},
      checkedStretches: stretchByDate.get(date) || {},
      enduranceData: data.enduranceData,
      dailyVariations: data.dailyVariations
    };
    const { total, ratio } = computeProgramCompletionCheckedRatio(date, slice, {});
    if (total === 0) continue;
    if (ratio >= 1) bonus += 300;
    else if (ratio >= 0.8) bonus += 100;
  }
  return bonus;
}

function dataForPlannedDay(date) {
  const empty = { checkedExercises: {}, reps: {}, checkedStretches: {} };
  const planned = buildPlannedExerciseListForDateStr(date, empty, {});
  const stretches = buildPlannedStretchListForDateStr(date, {});
  const checkedExercises = {};
  const reps = {};
  const checkedStretches = {};
  for (const exercise of planned) {
    const key = `${date}_${exercise.id}`;
    checkedExercises[key] = true;
    reps[key] = '10';
  }
  for (const item of stretches) {
    checkedStretches[generateStretchItemKey(date, item.moment, item.id)] = true;
  }
  return {
    plannedCount: planned.length,
    stretchCount: stretches.length,
    data: {
      checkedExercises,
      reps,
      checkedStretches,
      enduranceData: { sessions: {}, challenges: [] }
    }
  };
}

describe('égalité du bonus de complétion sur un jour réellement planifié', () => {
  it('donne le même bonus non nul qu’une passe par jour', () => {
    const monday = dataForPlannedDay('2020-06-01');
    const thursday = dataForPlannedDay('2020-06-04');
    const data = {
      checkedExercises: { ...monday.data.checkedExercises, ...thursday.data.checkedExercises },
      reps: { ...monday.data.reps, ...thursday.data.reps },
      checkedStretches: { ...monday.data.checkedStretches, ...thursday.data.checkedStretches },
      enduranceData: { sessions: {}, challenges: [] }
    };
    const official = computeProgramCompletionBonusXp(data, {});
    const sliced = bonusFromDaySlices(data);
    expect(monday.plannedCount + monday.stretchCount).toBeGreaterThan(0);
    expect(official).toBeGreaterThan(0);
    expect(sliced).toBe(official);
    writeFileSync(
      path.join(process.cwd(), 'scripts', 'dplus', 'phase0-xp-bonus-equality.json'),
      JSON.stringify({
        mondayPlanned: monday.plannedCount,
        mondayStretches: monday.stretchCount,
        thursdayPlanned: thursday.plannedCount,
        thursdayStretches: thursday.stretchCount,
        official,
        sliced
      }, null, 2)
    );
  });
});
