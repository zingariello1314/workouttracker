import { describe, it, expect } from 'vitest';
import { buildExerciseBankRows, filterExerciseBankRows } from '../exerciseBankSearch';

describe('exerciseBankSearch', () => {
  const mockDb = {
    curl: {
      name: 'Curl biceps',
      category: 'Biceps',
      equipment: 'Haltères',
      primaryMuscles: ['Biceps'],
      variations: ['curl', 'bicep curl']
    },
    pompes: {
      name: 'Pompes',
      category: 'Pectoraux',
      equipment: 'Poids du corps',
      primaryMuscles: ['Pectoraux']
    }
  };

  it('buildExerciseBankRows trie par nom', () => {
    const rows = buildExerciseBankRows(mockDb);
    expect(rows.map((r) => r.name)).toEqual(['Curl biceps', 'Pompes']);
  });

  it('filterExerciseBankRows matche nom et variations', () => {
    const rows = buildExerciseBankRows(mockDb);
    expect(filterExerciseBankRows(rows, 'curl', mockDb).map((r) => r.key)).toEqual(['curl']);
    expect(filterExerciseBankRows(rows, 'bicep', mockDb).map((r) => r.key)).toEqual(['curl']);
  });
});
