import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  buildRecapTrainingFeatures,
  countRecentRepDrops,
  sumCheckedRepsInWindow
} from '../recapTrainingFeatures';
import { buildUserTrainingState } from '../userTrainingState';
import { detectTrainingRelations } from '../trainingRelationEngine';
import { renderInterpretationText } from '../interpretationRenderer';
import { buildAdaptiveRecapInsights } from '../recapAdaptiveInsights';
import { isColumnInterpretation } from '../recapInterpretationPipeline';

function axis(value, trend, confidence = 0.8, evidence = [], metrics = {}) {
  return { value, trend, confidence, evidence, metrics };
}

describe('recapTrainingFeatures', () => {
  it('compare le volume 28 j. au 28 j. précédents, pas à une moitié de fenêtre', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const end = '2026-06-28';
    const seed = (startOffset, days, reps) => {
      for (let i = 0; i < days; i += 3) {
        const date = DateHelper.addDays(end, startOffset + i);
        const key = `${date}_101`;
        snapshot.reps[key] = reps;
        snapshot.checkedExercises[key] = true;
      }
    };
    seed(-55, 28, 40);
    seed(-27, 28, 10);

    const features = buildRecapTrainingFeatures({
      snapshot,
      window: { start: '2026-04-01', end }
    });

    expect(features.volume.current28d).toBeLessThan(features.volume.previous28d);
    expect(features.volume.delta28Pct).toBeLessThan(-30);
    expect(features.volume.trend).toBe('falling');
    expect(sumCheckedRepsInWindow(snapshot, { start: '2026-06-01', end })).toBeGreaterThan(0);
  });

  it('prend le crash de volume sur la période affichée même si 28 j. vs 28 j. est calme', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const window = { start: '2026-05-01', end: '2026-06-24' };
    for (let i = 0; i < 20; i += 1) {
      const date = DateHelper.addDays(window.start, i);
      snapshot.reps[`${date}_101`] = 30;
      snapshot.checkedExercises[`${date}_101`] = true;
    }
    const state = buildUserTrainingState({
      snapshot,
      window,
      assessment: { programCompletion28: { ratio: 0.4 }, regularityScore: 0.35 }
    });
    expect(state.load.trend).toBe('falling');
    expect(state.features.volumeDeltaPct).toBeLessThan(-20);
    if (state.features.periodHalfDeltaPct != null && state.features.volumeDelta28Pct != null) {
      expect(state.features.volumeDeltaPct).toBe(state.features.volumeDelta28Pct);
    }
    const relations = detectTrainingRelations(state);
    expect(relations.some((r) => r.type === 'training_discontinuity')).toBe(true);
  });

  it('compte les baisses d’exos vs séance précédente', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    snapshot.reps['2026-06-01_101'] = 20;
    snapshot.checkedExercises['2026-06-01_101'] = true;
    snapshot.reps['2026-06-08_101'] = 10;
    snapshot.checkedExercises['2026-06-08_101'] = true;
    snapshot.reps['2026-06-01_201'] = 18;
    snapshot.checkedExercises['2026-06-01_201'] = true;
    snapshot.reps['2026-06-08_201'] = 8;
    snapshot.checkedExercises['2026-06-08_201'] = true;
    expect(
      countRecentRepDrops(snapshot, { start: '2026-05-01', end: '2026-06-10' }, 6)
    ).toBe(2);
  });
});

describe('relations screenshot', () => {
  it('détecte TRAINING_DISCONTINUITY (charge ↓ + adhérence ↓ + plusieurs exos ↓)', () => {
    const state = {
      load: axis('falling', 'falling', 0.82, ['volume -40 % vs 28 j. précédents']),
      performance: axis('stable', 'stable', 0.7, ['performances stables']),
      recovery: axis('sufficient', 'stable', 0.6, []),
      fatigue: axis('low', 'stable', 0.55, []),
      adherence: axis('low', 'falling', 0.78, ['complétion programme ~40 %']),
      programResponse: axis('deloading', 'falling', 0.7, []),
      lifePhase: 'RETURNING',
      context: { goal: 'street_skills', tier: 'Intermédiaire' },
      features: {
        volumeDeltaPct: -40,
        frequencyDeltaPct: -35,
        programCompletionPct: 40,
        decliningExerciseCount: 3,
        performanceMomentumPct: 1
      }
    };
    const relations = detectTrainingRelations(state);
    expect(relations.some((r) => r.type === 'training_discontinuity')).toBe(true);
    const hit = relations.find((r) => r.type === 'training_discontinuity');
    const text = renderInterpretationText(hit, state);
    expect(text).toMatch(/exposition|continuité/i);
    expect(text.length).toBeGreaterThan(80);
    expect(isColumnInterpretation({ ...hit, text })).toBe(true);
  });

  it('distingue écart programme par séances manquées vs incomplètes', () => {
    const missed = detectTrainingRelations({
      load: axis('falling', 'falling', 0.7, ['volume -20 %']),
      performance: axis('stable', 'stable', 0.65, []),
      recovery: axis('sufficient', 'stable', 0.6, []),
      fatigue: axis('low', 'stable', 0.5, []),
      adherence: axis('low', 'unknown', 0.7, ['complétion ~50 %']),
      programResponse: axis('unknown', 'unknown', 0.5, []),
      lifePhase: null,
      context: {},
      features: {
        volumeDeltaPct: -20,
        programCompletionPct: 50,
        sessionAlignment: 80,
        frequencyDeltaPct: -30,
        sessions28d: 4,
        prevSessions28d: 8,
        justifiedDays: 2
      }
    });
    expect(missed.some((r) => r.type === 'program_gap_adherence')).toBe(true);

    const incomplete = detectTrainingRelations({
      load: axis('stable', 'stable', 0.7, []),
      performance: axis('stable', 'stable', 0.65, []),
      recovery: axis('sufficient', 'stable', 0.6, []),
      fatigue: axis('low', 'stable', 0.5, []),
      adherence: axis('medium', 'unknown', 0.7, []),
      programResponse: axis('unknown', 'unknown', 0.5, []),
      lifePhase: null,
      context: {},
      features: {
        volumeDeltaPct: -5,
        programCompletionPct: 55,
        sessionAlignment: 42,
        sessions28d: 8,
        prevSessions28d: 8,
        frequencyDeltaPct: 0
      }
    });
    expect(incomplete.some((r) => r.type === 'program_gap_completion')).toBe(true);
  });

  it('émet un écart programme même sans alignement séance', () => {
    const rows = detectTrainingRelations({
      load: axis('falling', 'falling', 0.7, []),
      performance: axis('stable', 'stable', 0.6, []),
      recovery: axis('sufficient', 'stable', 0.5, []),
      fatigue: axis('low', 'stable', 0.5, []),
      adherence: axis('low', 'unknown', 0.7, []),
      programResponse: axis('unknown', 'unknown', 0.5, []),
      lifePhase: null,
      context: {},
      features: { volumeDeltaPct: -20, programCompletionPct: 40 }
    });
    expect(rows.some((r) => r.type === 'program_gap_mixed')).toBe(true);
  });
});

describe('colonnes Analyse', () => {
  it('n’injecte plus de faits isolés Garmin / quiz / quota 8', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const window = { start: '2026-05-01', end: '2026-06-15' };
    const result = buildAdaptiveRecapInsights({
      legacyPistes: {
        shortTerm: ['Garmin : ~9648 pas/j — NEAT élevé'],
        mediumTerm: ['~14492 kcal actives'],
        longTerm: []
      },
      snapshot,
      window,
      enrichment: {
        garmin: { avgSteps: 9648, daysWithSteps: 27, avgSleepHours: 7, daysWithSleep: 10 },
        leastCheckedExercises: [{ name: 'Circuit abdos', pct: 0 }],
        justifications: { total: 4, restDays: 4 },
        streak: { current: 0, longest: 20 },
        pushPull: { ratio: 2.6, pushPct: 72.3, pullPct: 27.7 }
      },
      assessment: {
        programCompletion28: { ratio: 0.4 },
        sessionLoadAlignment28: { avgScore0to100: 32, sessionDaysScored: 6 }
      }
    });

    const all = [
      ...result.insights.shortTerm,
      ...result.insights.mediumTerm,
      ...result.insights.longTerm
    ];
    expect(all.length).toBeLessThanOrEqual(12);
    expect(result.insights.shortTerm.length).toBeLessThanOrEqual(5);
    const flat = all.map((t) => (typeof t === 'string' ? t : `${t.title || ''} ${t.body || ''} ${t.text || ''}`)).join('\n');
    expect(/NEAT|9648 pas|kcal actives|à croiser avec/i.test(flat)).toBe(false);
    expect(/référence personnelle directe/i.test(flat)).toBe(false);
  });
});
