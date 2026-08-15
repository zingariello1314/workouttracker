import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildProgramExerciseRegistry,
  configureProgramExerciseLookup,
  lookupProgramExerciseFromRegistry
} from '../programExerciseRegistry';

describe('programExerciseRegistry', () => {
  beforeEach(() => {
    configureProgramExerciseLookup({ userPrograms: [], activeProgramId: null });
  });

  it('résout un exercice du programme embarqué', () => {
    const stub = lookupProgramExerciseFromRegistry(101);
    expect(stub.name).toBe('Tractions pronation');
    expect(stub.series).toContain('4');
  });

  it('priorise le programme actif pour un id custom', () => {
    const customPrograms = [
      {
        id: 'prog-a',
        schedule: {
          lundi: {
            exercises: [{ id: 99001, name: 'Presse A', series: '3×10' }]
          }
        }
      },
      {
        id: 'prog-b',
        schedule: {
          mardi: {
            exercises: [{ id: 99001, name: 'Presse B', series: '4×8' }]
          }
        }
      }
    ];

    configureProgramExerciseLookup({
      userPrograms: customPrograms,
      activeProgramId: 'prog-b'
    });

    const stub = lookupProgramExerciseFromRegistry(99001);
    expect(stub.name).toBe('Presse B');
    expect(stub.series).toBe('4×8');
  });

  it('buildProgramExerciseRegistry fusionne embarqué + utilisateur', () => {
    const registry = buildProgramExerciseRegistry({
      userPrograms: [
        {
          id: 'custom',
          schedule: {
            lundi: {
              exercises: [{ id: 88001, name: 'Custom curl', series: '3×12' }]
            }
          }
        }
      ],
      activeProgramId: 'custom'
    });
    expect(registry.has('101')).toBe(true);
    expect(registry.get('88001')?.name).toBe('Custom curl');
  });
});
