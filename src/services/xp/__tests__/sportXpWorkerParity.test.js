import { describe, it, expect } from 'vitest';
import { calculateSportXP, SPORT_XP_FORMULA_REVISION } from '../xpCalculations';
import { buildSportXpNameMap } from '../sportXpWorkerClient';

describe('sportXp worker parity (préparation + même moteur)', () => {
  const workoutData = {
    reps: {
      '2025-12-01_101': 10,
      '2025-12-02_102': 12
    },
    checkedExercises: {
      '2025-12-01_101': true,
      '2025-12-02_102': true
    },
    exerciseIntensityCoeffs: {},
    enduranceData: { sessions: {}, challenges: [] }
  };

  const getExerciseNameById = (id) => {
    if (String(id) === '101') return 'Développé couché';
    if (String(id) === '102') return 'Squat';
    return `Exo ${id}`;
  };

  it('buildSportXpNameMap couvre les ids des clés reps', () => {
    const map = buildSportXpNameMap(workoutData, getExerciseNameById);
    expect(map['101']).toBe('Développé couché');
    expect(map['102']).toBe('Squat');
  });

  it('calculateSportXP avec nameMap produit le même totalXP', () => {
    const direct = calculateSportXP(workoutData, null, workoutData.enduranceData, {
      getExerciseNameById
    });
    const nameMap = buildSportXpNameMap(workoutData, getExerciseNameById);
    const viaMap = calculateSportXP(workoutData, null, workoutData.enduranceData, {
      getExerciseNameById: (id) => nameMap[String(id)] || ''
    });
    expect(viaMap.totalXP).toBe(direct.totalXP);
    expect(viaMap.breakdown.exercisesXp).toBe(direct.breakdown.exercisesXp);
    expect(SPORT_XP_FORMULA_REVISION).toBeTruthy();
  });
});
