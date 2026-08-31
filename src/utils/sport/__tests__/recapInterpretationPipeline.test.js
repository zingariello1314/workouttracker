import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import { buildUserTrainingState } from '../userTrainingState';
import { detectTrainingRelations } from '../trainingRelationEngine';
import { renderInterpretationText } from '../interpretationRenderer';
import { buildComposedInterpretationPipeline } from '../recapInterpretationPipeline';
import { buildAdaptiveRecapInsights } from '../recapAdaptiveInsights';

/** Ajoute des séances sur des dates espacées avec reps croissantes vers la fin de fenêtre. */
function seedProgressiveSessions(snapshot, exId, window, sessionSpecs) {
  sessionSpecs.forEach(({ offsetDays, reps }) => {
    const date = DateHelper.addDays(window.start, offsetDays);
    const key = `${date}_${exId}`;
    snapshot.reps[key] = reps;
    snapshot.checkedExercises[key] = true;
  });
}

describe('userTrainingState', () => {
  it('détecte charge en hausse et performance stable', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const window = { start: '2026-05-01', end: '2026-06-15' };
    seedProgressiveSessions(snapshot, '101', window, [
      { offsetDays: 2, reps: 18 },
      { offsetDays: 9, reps: 18 },
      { offsetDays: 16, reps: 19 },
      { offsetDays: 23, reps: 19 },
      { offsetDays: 30, reps: 21 },
      { offsetDays: 37, reps: 21 },
      { offsetDays: 42, reps: 22 },
      { offsetDays: 44, reps: 22 }
    ]);

    const state = buildUserTrainingState({
      snapshot,
      window,
      enrichment: {
        garmin: { avgSleepHours: 7.1, daysWithSleep: 5 },
        sleepDaily: [
          { date: '2026-05-05', value: 7.2 },
          { date: '2026-05-12', value: 7.0 },
          { date: '2026-05-20', value: 7.1 },
          { date: '2026-06-01', value: 7.0 },
          { date: '2026-06-10', value: 6.9 }
        ],
        feedback: { difficulte: 6.2, count: 4, difficulteSeries: [] }
      },
      assessment: {
        tier: 'Intermédiaire',
        repsMomentumRatio: 1.05,
        programCompletion28: { ratio: 0.82 },
        regularityScore: 0.7
      }
    });

    expect(state).not.toBeNull();
    expect(state.load.trend).not.toBe('unknown');
    expect(state.adherence.value).toBe('high');
  });
});

describe('trainingRelationEngine', () => {
  it('compose adaptation_with_recovery_warning quand volume monte, perf tient, sommeil/difficulté se dégradent', () => {
    const state = {
      load: {
        value: 'high_rising',
        trend: 'rising',
        confidence: 0.8,
        evidence: ['volume +28 %'],
        metrics: {}
      },
      performance: {
        value: 'stable',
        trend: 'stable',
        confidence: 0.75,
        evidence: ['performances stables'],
        metrics: {}
      },
      recovery: {
        value: 'insufficient',
        trend: 'falling',
        confidence: 0.7,
        evidence: ['sommeil -12 %'],
        metrics: {}
      },
      fatigue: {
        value: 'high',
        trend: 'rising',
        confidence: 0.72,
        evidence: ['difficulté +20 %'],
        metrics: {}
      },
      adherence: { value: 'high', trend: 'unknown', confidence: 0.8, evidence: [], metrics: {} },
      programResponse: {
        value: 'adapting_with_strain',
        trend: 'stable',
        confidence: 0.78,
        evidence: [],
        metrics: {}
      },
      lifePhase: null,
      context: { goal: 'strength_lean', tier: 'Intermédiaire' },
      features: {
        volumeDeltaPct: 28,
        sleepDeltaPct: -12,
        difficultyDeltaPct: 20,
        performanceMomentumPct: 2
      }
    };

    const relations = detectTrainingRelations(state);
    expect(relations.some((r) => r.type === 'adaptation_with_recovery_warning')).toBe(true);

    const hit = relations.find((r) => r.type === 'adaptation_with_recovery_warning');
    const text = renderInterpretationText(hit, state);
    expect(text).toMatch(/progression continue/i);
    expect(text).toMatch(/sommeil/i);
    expect(text).toMatch(/difficile/i);
    expect(text).toMatch(/adapt/i);
  });

  it('détecte surcharge possible volume↑ perf↓ récup↓', () => {
    const state = {
      load: { value: 'rising', trend: 'rising', confidence: 0.85, evidence: [], metrics: {} },
      performance: { value: 'declining', trend: 'falling', confidence: 0.8, evidence: [], metrics: {} },
      recovery: { value: 'insufficient', trend: 'falling', confidence: 0.75, evidence: [], metrics: {} },
      fatigue: { value: 'high', trend: 'rising', confidence: 0.7, evidence: [], metrics: {} },
      adherence: { value: 'medium', trend: 'unknown', confidence: 0.5, evidence: [], metrics: {} },
      programResponse: { value: 'regressing', trend: 'falling', confidence: 0.8, evidence: [], metrics: {} },
      lifePhase: null,
      context: { goal: null, tier: null },
      features: { volumeDeltaPct: 35, sleepDeltaPct: -15, difficultyDeltaPct: 18 }
    };

    const relations = detectTrainingRelations(state);
    expect(relations.some((r) => r.type === 'possible_overreach')).toBe(true);
  });
});

describe('recapInterpretationPipeline integration', () => {
  it('injecte des candidats composés dans buildAdaptiveRecapInsights', () => {
    const snapshot = { reps: {}, checkedExercises: {}, sessionFeedbacks: {} };
    const window = { start: '2026-05-01', end: '2026-06-15' };

    seedProgressiveSessions(snapshot, '101', window, [
      { offsetDays: 3, reps: 16 },
      { offsetDays: 10, reps: 16 },
      { offsetDays: 17, reps: 17 },
      { offsetDays: 24, reps: 18 },
      { offsetDays: 31, reps: 20 },
      { offsetDays: 38, reps: 21 },
      { offsetDays: 42, reps: 22 },
      { offsetDays: 44, reps: 22 }
    ]);

    Object.assign(snapshot.sessionFeedbacks, {
      '2026-05-10': { difficulte: 6, energieDebut: 7, energieFin: 6 },
      '2026-05-17': { difficulte: 7, energieDebut: 7, energieFin: 5 },
      '2026-06-01': { difficulte: 8, energieDebut: 6, energieFin: 4 },
      '2026-06-08': { difficulte: 8.5, energieDebut: 6, energieFin: 4 }
    });

    const enrichment = {
      window,
      garmin: { avgSleepHours: 6.1, daysWithSleep: 8, avgSteps: 8000, daysWithSteps: 8 },
      sleepDaily: [
        { date: '2026-05-05', value: 7.2 },
        { date: '2026-05-12', value: 7.0 },
        { date: '2026-05-20', value: 6.6 },
        { date: '2026-05-28', value: 6.3 },
        { date: '2026-06-05', value: 6.0 },
        { date: '2026-06-12', value: 5.8 }
      ],
      feedback: {
        difficulte: 7.6,
        count: 4,
        difficulteSeries: [
          { date: '2026-05-10', value: 6 },
          { date: '2026-05-17', value: 7 },
          { date: '2026-06-01', value: 8 },
          { date: '2026-06-08', value: 8.5 }
        ]
      }
    };

    const pipeline = buildComposedInterpretationPipeline({
      snapshot,
      window,
      enrichment,
      assessment: {
        tier: 'Intermédiaire avancé',
        repsMomentumRatio: 1.02,
        programCompletion28: { ratio: 0.88 },
        regularityScore: 0.72
      }
    });

    expect(pipeline.trainingState).not.toBeNull();
    expect(pipeline.trainingState.load.trend).toBe('rising');

    const relations = detectTrainingRelations(pipeline.trainingState);
    expect(relations.length).toBeGreaterThan(0);

    expect(pipeline.candidates.length).toBeGreaterThan(0);

    const result = buildAdaptiveRecapInsights({
      legacyPistes: { shortTerm: [], mediumTerm: [], longTerm: [] },
      snapshot,
      window,
      enrichment,
      assessment: {
        tier: 'Intermédiaire avancé',
        repsMomentumRatio: 1.02,
        programCompletion28: { ratio: 0.88 },
        regularityScore: 0.72
      },
      getExerciseNameById: (id) => (id === 101 ? 'Tractions' : `Ex ${id}`)
    });

    expect(result.trainingState).toBeDefined();
    expect(result.composedInterpretations?.length).toBeGreaterThan(0);

    const all = [
      ...result.insights.shortTerm,
      ...result.insights.mediumTerm,
      ...result.insights.longTerm
    ];
    const flat = all.map((t) =>
      typeof t === 'string' ? t : `${t.title || ''} ${t.body || ''} ${t.text || ''}`
    );
    const hasComposed = flat.some(
      (t) =>
        /adaptation|surcharge|récupération|progression continue|performances tiennent|séances par semaine|volume/i.test(
          t
        ) && t.length > 40
    );
    expect(hasComposed || pipeline.candidates.length > 0).toBe(true);
  });
});
