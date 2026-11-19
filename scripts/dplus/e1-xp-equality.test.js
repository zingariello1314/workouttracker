import { describe, expect, it } from 'vitest';
import { calculateSportXP } from '../../src/services/xp/xpCalculations.js';
import {
  buildPlannedExerciseListForDateStr,
  buildPlannedStretchListForDateStr,
  computeProgramCompletionBonusXp
} from '../../src/utils/programCompletionBonus.js';
import { generateStretchItemKey } from '../../src/utils/exerciseKeyGenerator.js';
import { computeProgramCompletionBonusXpIndexed } from './experimentalCompletionBonus.mjs';

function assertSameBonus(data, ctx = {}, label = '') {
  const official = computeProgramCompletionBonusXp(data, ctx);
  const indexed = computeProgramCompletionBonusXpIndexed(data, ctx);
  expect(indexed, label).toBe(official);
  return official;
}

function assertEngineBonus(data, garmin, endurance, options, label) {
  const result = calculateSportXP(data, garmin, endurance, options);
  const indexed = computeProgramCompletionBonusXpIndexed(data, {
    programs: options?.programs,
    getExerciseNameById: options?.getExerciseNameById,
    activeProgram: options?.activeProgram
  });
  expect(indexed, label).toBe(result.breakdown.programCompletionBonusXp);
  const substituted = {
    ...result,
    breakdown: { ...result.breakdown, programCompletionBonusXp: indexed },
    totalXP: Math.round(result.totalXP - result.breakdown.programCompletionBonusXp + indexed)
  };
  expect(substituted.totalXP, label).toBe(result.totalXP);
  expect(substituted.breakdown, label).toEqual(result.breakdown);
  return result;
}

function plannedDay(date, { checkRatio = 1, includeStretches = true } = {}) {
  const empty = { checkedExercises: {}, reps: {}, checkedStretches: {} };
  const exercises = buildPlannedExerciseListForDateStr(date, empty, {});
  const stretches = includeStretches ? buildPlannedStretchListForDateStr(date, {}) : [];
  const checkedExercises = {};
  const reps = {};
  const checkedStretches = {};
  exercises.forEach((exercise, index) => {
    if (index / Math.max(1, exercises.length) >= checkRatio) return;
    const key = `${date}_${exercise.id}`;
    checkedExercises[key] = true;
    reps[key] = '8';
  });
  if (includeStretches && checkRatio >= 1) {
    for (const item of stretches) {
      checkedStretches[generateStretchItemKey(date, item.moment, item.id)] = true;
    }
  }
  return { checkedExercises, reps, checkedStretches, enduranceData: { sessions: {}, challenges: [] } };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('bonus indexé contre l’oracle', () => {
  it('B1 journée complète et B14 scénario 600', () => {
    const monday = plannedDay('2020-06-01');
    const thursday = plannedDay('2020-06-04');
    const data = {
      checkedExercises: { ...monday.checkedExercises, ...thursday.checkedExercises },
      reps: { ...monday.reps, ...thursday.reps },
      checkedStretches: { ...monday.checkedStretches, ...thursday.checkedStretches },
      enduranceData: { sessions: {}, challenges: [] }
    };
    expect(assertSameBonus(data, {}, '600')).toBe(600);
    assertEngineBonus(data, null, data.enduranceData, {}, 'engine-600');
  });

  it('B2 journée partielle', () => {
    const data = plannedDay('2020-06-01', { checkRatio: 0.5, includeStretches: false });
    assertSameBonus(data, {}, 'partielle');
    assertEngineBonus(data, null, data.enduranceData, {}, 'engine-partielle');
  });

  it('B3 B5 journée sans exercice planifié et jour de repos', () => {
    const data = plannedDay('2020-06-04', { includeStretches: false });
    expect(buildPlannedExerciseListForDateStr('2020-06-04', data, {})).toHaveLength(0);
    assertSameBonus(data, {}, 'repos');
  });

  it('B4 B6 étirements et jours consécutifs', () => {
    const a = plannedDay('2020-06-01');
    const b = plannedDay('2020-06-02', { checkRatio: 0.25, includeStretches: true });
    const data = {
      checkedExercises: { ...a.checkedExercises, ...b.checkedExercises },
      reps: { ...a.reps, ...b.reps },
      checkedStretches: { ...a.checkedStretches, ...b.checkedStretches }
    };
    assertSameBonus(data, {}, 'deux-jours');
    assertEngineBonus(data, null, null, {}, 'engine-deux-jours');
  });

  it('B7 programme modifié', () => {
    const date = '2026-05-09';
    const programs = [
      {
        id: 'custom',
        schedule: {
          samedi: {
            exercises: [{ id: 'custom-exo', name: 'Custom', series: '3x10' }],
            etirements: { matin: [{ id: 88888, stretchKey: 'auto_grandissement_assis' }], midi: [], soir: [] }
          }
        }
      }
    ];
    const data = {
      checkedExercises: { [`${date}_1`]: true },
      reps: { [`${date}_1`]: '10' },
      checkedStretches: { [generateStretchItemKey(date, 'matin', 88888)]: true }
    };
    assertSameBonus(data, { programs }, 'programme');
    assertEngineBonus(data, null, null, { programs }, 'engine-programme');
  });

  it('B8 B9 B10 B11 plusieurs clés, reps sans coche, coche sans reps, coche retirée', () => {
    const date = '2020-06-01';
    const full = {
      checkedExercises: {
        [`${date}_1`]: true,
        [`${date}_1_semaineA`]: true
      },
      reps: {
        [`${date}_1`]: '10',
        [`${date}_1_semaineA`]: '12',
        [`${date}_99`]: '4'
      },
      checkedStretches: {}
    };
    assertSameBonus(full, {}, 'doublons');
    const repsOnly = { checkedExercises: {}, reps: { [`${date}_3`]: '10' }, checkedStretches: {} };
    expect(assertSameBonus(repsOnly, {}, 'reps-sans-coche')).toBe(0);
    const checkOnly = { checkedExercises: { [`${date}_3`]: true }, reps: {}, checkedStretches: {} };
    assertSameBonus(checkOnly, {}, 'coche-sans-reps');
    const removed = { checkedExercises: {}, reps: { [`${date}_3`]: '10' }, checkedStretches: {} };
    expect(assertSameBonus(removed, {}, 'coche-retiree')).toBe(0);
  });

  it('B12 B13 B18 structures absentes, bonus nul, dates et ids limites', () => {
    expect(assertSameBonus(null, {}, 'null')).toBe(0);
    expect(assertSameBonus({}, {}, 'vide')).toBe(0);
    expect(assertSameBonus({ checkedExercises: null, reps: null }, {}, 'null-maps')).toBe(0);
    const odd = {
      checkedExercises: {
        'pas-une-date': true,
        '2020-13-40_1': true,
        '2020-06-1_1': true,
        '2020-06-01': true
      },
      reps: { '2020-13-40_1': 'abc', '2020-06-01_': '10' },
      checkedStretches: { '2020-06-01_matin': true, 'legacy': true }
    };
    assertSameBonus(odd, {}, 'limites');
    assertEngineBonus(
      { checkedExercises: {}, reps: {}, enduranceData: { sessions: {}, challenges: [] } },
      null,
      { sessions: {}, challenges: [] },
      {},
      'engine-nul'
    );
  });

  it('B16 fixtures qui appellent calculateSportXP dans les tests XP', () => {
    const fixtures = [
      {
        label: 'isometric',
        data: {
          checkedExercises: { '2026-08-13_ex_gainage_test': true },
          reps: { '2026-08-13_ex_gainage_test': 45 }
        },
        options: { getExerciseNameById: (id) => (id === 'ex_gainage_test' ? 'Gainage' : '') }
      },
      {
        label: 'weighted',
        data: {
          checkedExercises: { '2026-08-13_201': true },
          reps: { '2026-08-13_201': 10 },
          exerciseWeights: { '2026-08-01_201': '10', '2026-08-13_201': '15' }
        },
        options: { getExerciseNameById: (id) => (String(id) === '201' ? 'Pompes lestées' : '') }
      },
      {
        label: 'pushups-challenges',
        data: {
          checkedExercises: {},
          reps: {},
          enduranceData: {
            sessions: {
              pushups: [
                { id: 'a', date: '2026-08-27', count: 100, duration: 10.5 },
                { id: 'b', date: '2026-08-12', count: 100, duration: 10 }
              ]
            },
            challenges: []
          }
        },
        endurance: {
          sessions: {
            pushups: [
              { id: 'a', date: '2026-08-27', count: 100, duration: 10.5 },
              { id: 'b', date: '2026-08-12', count: 100, duration: 10 }
            ]
          },
          challenges: []
        }
      },
      {
        label: 'stretch-star',
        data: {
          checkedExercises: {},
          reps: {},
          checkedStretches: { [generateStretchItemKey('2026-05-09', 'matin', 9611)]: true },
          stretchSessionEffortStars: { [generateStretchItemKey('2026-05-09', 'matin', 9611)]: 5 }
        }
      }
    ];
    for (const fixture of fixtures) {
      assertEngineBonus(fixture.data, null, fixture.endurance || null, fixture.options || {}, fixture.label);
    }
  });

  it('B17 graine fixe, comparaison systématique', () => {
    const rand = mulberry32(20261118);
    for (let sample = 0; sample < 40; sample += 1) {
      const checkedExercises = {};
      const reps = {};
      const checkedStretches = {};
      const days = 1 + Math.floor(rand() * 12);
      for (let d = 0; d < days; d += 1) {
        const date = `2021-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`;
        const id = 1 + Math.floor(rand() * 40);
        if (rand() > 0.2) checkedExercises[`${date}_${id}`] = rand() > 0.1;
        if (rand() > 0.3) reps[`${date}_${id}`] = String(Math.floor(rand() * 20));
        if (rand() > 0.7) checkedExercises[`${date}_${id}_semaineA`] = true;
        if (rand() > 0.85) checkedStretches[generateStretchItemKey(date, 'matin', 9611)] = true;
      }
      assertSameBonus({ checkedExercises, reps, checkedStretches }, {}, `seed-${sample}`);
    }
  });
});
