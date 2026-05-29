import { describe, it, expect } from 'vitest';
import {
  classifyProgramEmphasis,
  computeProgramCalendarAdherence,
  analyzeProgramForCoach
} from './quizProgramAnalyzer';

describe('quizProgramAnalyzer', () => {
  it('classifie un programme force', () => {
    const program = {
      schedule: {
        lundi: {
          active: true,
          exercises: [{ series: '4×5' }, { series: '3×5' }]
        }
      }
    };
    expect(classifyProgramEmphasis(program)).toBe('force');
  });

  it('adhérence compte repos sans activité', () => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const program = {
      startDate: start.toISOString(),
      schedule: {
        lundi: { active: true, exercises: [{ id: 1 }] },
        mardi: { active: false },
        mercredi: { active: true, exercises: [{ id: 2 }] },
        jeudi: { active: false },
        vendredi: { active: false },
        samedi: { active: false },
        dimanche: { active: false }
      }
    };
    const snap = {
      checkedExercises: {},
      reps: {}
    };
    const ymd = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    snap.checkedExercises[`${ymd}_1`] = true;
    const r = computeProgramCalendarAdherence(program, snap);
    expect(r.calendarDays).toBeGreaterThan(0);
    expect(r.restDaysOk).toBeGreaterThan(0);
  });

  it('analyzeProgramForCoach retourne hints', () => {
    const program = {
      id: 'p1',
      name: 'Test',
      startDate: new Date().toISOString(),
      schedule: {
        lundi: { active: true, exercises: [{ series: '4×5' }] }
      }
    };
    const a = analyzeProgramForCoach(program, {}, null, { goalPhysique: 'muscular_defined' });
    expect(a?.coachHints?.length).toBeGreaterThan(0);
  });
});
