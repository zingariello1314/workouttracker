import { describe, expect, it } from 'vitest';
import { buildProgramStructureReport } from '../recapProgramStructureReport';
import { buildRecapProgramCoachAnalysis } from '../recapProgramCoachAnalysis';
import { buildTemplateProgramsForFirstLaunch } from '../../programPersistenceUtils';

describe('recapProgramStructureReport', () => {
  it('retourne barres push/pull et KPIs sur la fenêtre', () => {
    const report = buildProgramStructureReport({
      activeProgram: {
        name: 'Cycle 3+1',
        schedule: {
          lundi: { active: true },
          mercredi: { active: true },
          vendredi: { active: true },
          samedi: { active: true }
        }
      },
      programCoachAnalysis: {
        hasProgram: true,
        exposure: { legDaysPlan: 2, legSlotsPlan: 0.3, legDays: 2, pullDays: 2, pushDays: 3 },
        pushPullRatio: 2.1,
        levels: { structural: [{ text: 'Push dominant au plan.' }] }
      },
      enrichment: {
        window: { start: '2026-05-01', end: '2026-06-05' },
        pushPull: { push: 3475, pull: 1595, pushPct: 68.5, pullPct: 31.5, ratio: 2.2 },
        completion: { exoPct: 82, stretchPct: 3.7, globalPct: 42 },
        muscleShareRows: [{ groupId: 'shoulders', reps: 1396 }],
        digest: { perActivity: { running: { totals: { distanceKm: 77, sessions: 20 } } } }
      }
    });

    expect(report.bars.push.reps).toBe(3475);
    expect(report.kpiCards.find((c) => c.id === 'legFreq')?.value).toBe('~0.3/sem');
    expect(report.kpiCards.length).toBeGreaterThan(0);
    expect(report.priority.text).toBeTruthy();
    expect(report.statsRow.runningKm).toBe(77);
  });

  it('lit la fréquence jambes hebdo depuis le plan (pas sessionDays / semaines fenêtre)', () => {
    const { defaultProgram } = buildTemplateProgramsForFirstLaunch();
    const analysis = buildRecapProgramCoachAnalysis({
      activeProgram: defaultProgram,
      snapshot: { reps: {}, checkedExercises: {} },
      window: { start: '2026-05-01', end: '2026-06-05' }
    });
    expect(analysis.exposure.legSlotsPlan).toBeLessThanOrEqual(0.4);

    const report = buildProgramStructureReport({
      activeProgram: defaultProgram,
      programCoachAnalysis: analysis,
      enrichment: {
        window: { start: '2026-05-01', end: '2026-06-05' },
        pushPull: { push: 100, pull: 50, pushPct: 66.7, pullPct: 33.3, ratio: 2 },
        completion: { exoPct: 80, stretchPct: 5, globalPct: 40 }
      }
    });
    const legCard = report.kpiCards.find((c) => c.id === 'legFreq');
    expect(legCard?.value).toMatch(/~0\.[0-9]/);
    expect(legCard?.badge).toBe('Faible');
  });
});