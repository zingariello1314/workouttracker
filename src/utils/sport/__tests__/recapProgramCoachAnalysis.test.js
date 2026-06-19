import { describe, expect, it } from 'vitest';
import { buildRecapProgramCoachAnalysis } from '../recapProgramCoachAnalysis';

describe('recapProgramCoachAnalysis', () => {
  it('détecte un déséquilibre push/pull dans le plan', () => {
    const program = {
      name: 'Test Push',
      schedule: {
        lundi: {
          active: true,
          exercises: [
            { id: '104', name: 'Pompes', series: '4×15' },
            { id: '103', name: 'Dips', series: '4×12' }
          ]
        },
        mercredi: {
          active: true,
          exercises: [{ id: '105', name: 'Pompes inclinées', series: '4×12' }]
        },
        vendredi: {
          active: true,
          exercises: [{ id: '101', name: 'Tractions pronation', series: '4×4' }]
        }
      }
    };

    const result = buildRecapProgramCoachAnalysis({
      activeProgram: program,
      snapshot: { reps: {}, checkedExercises: {} },
      window: { start: '2026-05-01', end: '2026-06-05' },
      profileQuestionnaireRaw: {
        answers: { streetSkillGoal: 'pullups_10', strengthBaselineMaxes: { pullupsMax: 5 } }
      }
    });

    expect(result.hasProgram).toBe(true);
    expect(result.levels.structural.some((s) => /poussée|tirage|push/i.test(s.text))).toBe(true);
    expect(result.coachVision.length).toBeGreaterThan(50);
  });

  it('retourne un message sans programme actif', () => {
    const result = buildRecapProgramCoachAnalysis({
      activeProgram: null,
      snapshot: {},
      window: { start: '2026-05-01', end: '2026-06-05' }
    });
    expect(result.hasProgram).toBe(false);
    expect(result.coachVision).toMatch(/programme/i);
  });

  it('tendances défis sans tractions suffisantes', () => {
    const result = buildRecapProgramCoachAnalysis({
      activeProgram: { name: 'P', schedule: { lundi: { active: true, exercises: [] } } },
      snapshot: { reps: {}, checkedExercises: {} },
      window: { start: '2026-05-01', end: '2026-06-05' },
      enrichment: {
        digest: {
          challenges: [{ id: 'c1', status: 'completed', title: 'Test' }]
        }
      }
    });
    expect(result.levels.trends.some((t) => t.id === 'trend.challenge.done')).toBe(true);
  });

  it('utilise les coches réelles pour la fréquence tractions (pas 0 si entraînement)', () => {
    const reps = {};
    const checked = {};
    for (let i = 1; i <= 12; i += 1) {
      const d = `2026-05-${String(i).padStart(2, '0')}`;
      const key = `${d}_101`;
      reps[key] = '12';
      checked[key] = true;
    }
    const program = {
      name: 'Quiz sans tractions au plan',
      schedule: {
        lundi: { active: true, exercises: [{ id: 104, name: 'Pompes', series: '4×15' }] },
        mercredi: { active: true, exercises: [{ id: 105, name: 'Pompes inclinées', series: '4×12' }] }
      }
    };
    const result = buildRecapProgramCoachAnalysis({
      activeProgram: program,
      snapshot: { reps, checkedExercises: checked },
      window: { start: '2026-05-01', end: '2026-06-05' },
      getExerciseNameById: (id) => (id === 101 ? 'Tractions pronation' : 'Pompes'),
      profileQuestionnaireRaw: {
        answers: { streetSkillGoal: 'pullups_10', strengthBaselineMaxes: { pullupsMax: 5 } }
      }
    });
    expect(result.levels.structural.some((s) => s.id === 'freq.pullups.low')).toBe(false);
    expect(
      result.levels.structural.some(
        (s) => s.id === 'freq.pullups.ok' || s.id === 'freq.pullups.actual.vs.plan'
      )
    ).toBe(true);
  });

  it('remplit progression réelle avec historique de reps varié', () => {
    const reps = {};
    const checked = {};
    const dates = ['2026-05-05', '2026-05-08', '2026-05-12', '2026-05-18', '2026-05-22', '2026-05-28'];
    const vals = [8, 9, 9, 10, 10, 11];
    dates.forEach((d, i) => {
      const key = `${d}_101`;
      reps[key] = String(vals[i]);
      checked[key] = true;
    });
    const result = buildRecapProgramCoachAnalysis({
      activeProgram: {
        name: 'P',
        schedule: { lundi: { active: true, exercises: [{ id: 101, name: 'Tractions', series: '4×5' }] } }
      },
      snapshot: { reps, checkedExercises: checked },
      window: { start: '2026-05-01', end: '2026-06-05' },
      getExerciseNameById: (id) => (id === 101 ? 'Tractions pronation' : `Ex ${id}`),
      assessment: { totalReps28: 500, repsMomentumRatio: 1.05 }
    });
    expect(result.levels.progression.length).toBeGreaterThan(0);
    expect(result.levels.progression.some((p) => /Tractions|101|record|reps/i.test(p.text))).toBe(true);
  });

  it('tendance complétion exos alignée sur KPI Récap (exoPct, pas globalPct)', () => {
    const program = {
      name: 'Complétion',
      schedule: {
        lundi: {
          active: true,
          exercises: [
            { id: 104, name: 'Pompes', series: '4×15' },
            { id: 101, name: 'Tractions', series: '4×5' },
            { id: 103, name: 'Dips', series: '4×8' },
            { id: 105, name: 'Pompes incl', series: '4×12' }
          ]
        },
        mercredi: {
          active: true,
          exercises: [
            { id: 104, name: 'Pompes', series: '4×15' },
            { id: 101, name: 'Tractions', series: '4×5' },
            { id: 103, name: 'Dips', series: '4×8' },
            { id: 105, name: 'Pompes incl', series: '4×12' }
          ]
        },
        vendredi: {
          active: true,
          exercises: [
            { id: 104, name: 'Pompes', series: '4×15' },
            { id: 101, name: 'Tractions', series: '4×5' },
            { id: 103, name: 'Dips', series: '4×8' },
            { id: 105, name: 'Pompes incl', series: '4×12' }
          ]
        }
      }
    };
    const reps = {};
    const checked = {};
    const seed = (d, ids) => {
      ids.forEach((id) => {
        const key = `${d}_${id}`;
        reps[key] = '10';
        checked[key] = true;
      });
    };
    ['2026-06-01', '2026-06-03', '2026-06-05'].forEach((d) => seed(d, [104, 101, 103, 105]));
    ['2026-05-25', '2026-05-27', '2026-05-29'].forEach((d) => seed(d, [104, 101]));

    const result = buildRecapProgramCoachAnalysis({
      activeProgram: program,
      snapshot: { reps, checkedExercises: checked },
      window: { start: '2026-05-01', end: '2026-06-05' },
      programs: [program]
    });

    const trend = result.levels.trends.find((t) => t.id === 'trend.completion.up');
    expect(trend).toBeTruthy();
    expect(trend.text).toMatch(/Complétion exos/i);
    const nums = trend.text.match(/~(\d+) %/g) || [];
    nums.forEach((n) => {
      const v = parseInt(n.replace(/\D/g, ''), 10);
      expect(v).toBeGreaterThanOrEqual(50);
    });
  });
});
