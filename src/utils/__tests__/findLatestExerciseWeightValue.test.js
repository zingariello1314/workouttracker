import { describe, expect, it } from 'vitest';
import { findLatestExerciseWeightValue } from '../exerciseKeyGenerator';

describe('findLatestExerciseWeightValue', () => {
  it('reprend la dernière charge du même exo même si les reps du jour ont changé', () => {
    const data = {
      exerciseWeights: {
        '2026-09-01_42': '20',
        '2026-09-20_42': '22.5'
      },
      reps: {
        '2026-09-01_42': '40',
        '2026-09-20_42': '32'
      }
    };
    expect(findLatestExerciseWeightValue(data, [42, '42'])).toBe('22.5');
  });

  it('lit aussi exerciseSetLogs si exerciseWeights du jour est vide', () => {
    const data = {
      exerciseWeights: {
        '2026-09-26_42': ''
      },
      exerciseSetLogs: {
        '2026-09-18_42': {
          sets: [
            { reps: 10, weight: 18 },
            { reps: 8, weight: 20 }
          ]
        }
      }
    };
    expect(findLatestExerciseWeightValue(data, ['42'])).toBe('20');
  });

  it('ne confond pas l’id 42 avec 420', () => {
    const data = {
      exerciseWeights: {
        '2026-09-20_420': '99',
        '2026-09-10_42': '12'
      }
    };
    expect(findLatestExerciseWeightValue(data, ['42'])).toBe('12');
  });
});
