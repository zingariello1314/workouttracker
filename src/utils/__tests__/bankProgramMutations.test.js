import { describe, expect, it } from 'vitest';
import {
  appendExerciseBankKeyToProgramDay,
  createEmptyBankProgramSchedule
} from '../bankProgramMutations';

describe('appendExerciseBankKeyToProgramDay', () => {
  const program = () => ({
    id: 'p1',
    name: 'Test',
    schedule: createEmptyBankProgramSchedule()
  });

  it('infère 3×1 min pour un wall sit (pas 3×10 reps)', () => {
    const r = appendExerciseBankKeyToProgramDay(program(), 'lundi', 'wall sit');
    expect(r.ok).toBe(true);
    const ex = r.program.schedule.lundi.exercises[0];
    expect(ex.series).toBe('3×1 min');
    expect(ex.meta.volumeMode).toBe('minutes');
    expect(ex.meta.setCount).toBe(3);
    expect(ex.meta.repsMin).toBe(1);
  });

  it('conserve 3×10 pour un exercice à reps', () => {
    const r = appendExerciseBankKeyToProgramDay(program(), 'lundi', 'pompes');
    expect(r.ok).toBe(true);
    expect(r.program.schedule.lundi.exercises[0].series).toBe('3×10');
  });
});
