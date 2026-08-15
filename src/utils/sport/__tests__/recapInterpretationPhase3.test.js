import { describe, expect, it } from 'vitest';
import { computeRepsWeeklyVelocity, priorWindowForComparison } from '../trainingProgressionVelocity';
import {
  classifyExercisePerformanceLevel,
  analyzePerformanceRobustness
} from '../performanceRobustness';
import { detectStateTransitions } from '../trainingStateTransitions';
import { semanticGroupFromCandidateId, semanticGroupRecentPenalty } from '../insightSemanticThemes';
import { emptyInsightHistory, recordShownInsights } from '../insightNoveltyStore';
import { buildComposedInterpretationPipeline } from '../recapInterpretationPipeline';

describe('trainingProgressionVelocity', () => {
  it('calcule une pente reps/semaine positive', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const window = { start: '2026-05-01', end: '2026-05-28' };
    for (let w = 0; w < 4; w += 1) {
      const date = `2026-05-${String(4 + w * 7).padStart(2, '0')}`;
      const key = `${date}_101`;
      snapshot.reps[key] = 50 + w * 20;
      snapshot.checkedExercises[key] = true;
    }
    const v = computeRepsWeeklyVelocity(snapshot, window);
    expect(v.velocityPerWeek).toBeGreaterThan(0);
  });

  it('produit une fenêtre précédente comparable', () => {
    const prior = priorWindowForComparison({ start: '2026-05-15', end: '2026-06-15' });
    expect(prior?.start).toBeTruthy();
    expect(prior?.end).toBe('2026-05-14');
  });
});

describe('performanceRobustness', () => {
  it('distingue PR isolé vs niveau établi', () => {
    const outlier = classifyExercisePerformanceLevel([
      { date: '2026-05-01', reps: 12 },
      { date: '2026-05-08', reps: 13 },
      { date: '2026-05-15', reps: 12 },
      { date: '2026-05-22', reps: 18 }
    ]);
    expect(outlier.kind).toBe('OUTLIER');

    const established = classifyExercisePerformanceLevel([
      { date: '2026-05-01', reps: 14 },
      { date: '2026-05-08', reps: 15 },
      { date: '2026-05-15', reps: 15 },
      { date: '2026-05-22', reps: 14 }
    ]);
    expect(established.kind).toBe('LEVEL_ESTABLISHED');
  });

  it('analyse les exercices du snapshot', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    ['2026-05-05', '2026-05-12', '2026-05-19'].forEach((date, i) => {
      const key = `${date}_101`;
      snapshot.reps[key] = 10 + i * 2;
      snapshot.checkedExercises[key] = true;
    });
    const rows = analyzePerformanceRobustness({
      snapshot,
      window: { start: '2026-05-01', end: '2026-05-31' }
    });
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('trainingStateTransitions', () => {
  it('détecte une transition charge rising', () => {
    const prior = {
      load: { value: 'stable', trend: 'stable', confidence: 0.7, evidence: [] },
      performance: { value: 'stable', trend: 'stable', confidence: 0.6, evidence: [] },
      recovery: { value: 'sufficient', trend: 'stable', confidence: 0.7, evidence: [] },
      fatigue: { value: 'low', trend: 'stable', confidence: 0.6, evidence: [] },
      adherence: { value: 'high', trend: 'unknown', confidence: 0.7, evidence: [] },
      programResponse: { value: 'adapting', trend: 'stable', confidence: 0.6, evidence: [] },
      lifePhase: null
    };
    const current = {
      ...prior,
      load: { value: 'rising', trend: 'rising', confidence: 0.8, evidence: ['volume +20 %'] }
    };
    const transitions = detectStateTransitions(prior, current);
    expect(transitions.some((t) => t.axis === 'load')).toBe(true);
  });
});

describe('insightSemanticThemes', () => {
  it('regroupe les thèmes proches', () => {
    expect(semanticGroupFromCandidateId('relation.adaptation_success')).toBe('adaptation');
    expect(semanticGroupFromCandidateId('relation.possible_overreach')).toBe('overreach');
  });

  it('pénalise un groupe sémantique déjà montré', () => {
    const now = Date.now();
    let history = emptyInsightHistory();
    history = recordShownInsights(
      history,
      [{ id: 'relation.adaptation_success', theme: 'adaptation_success' }],
      now
    );
    const penalty = semanticGroupRecentPenalty(history, 'relation.adaptation_under_load', now);
    expect(penalty).toBeGreaterThan(0);
  });
});

describe('pipeline phase 3', () => {
  it('expose transitions et robustesse', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const window = { start: '2026-05-01', end: '2026-06-15' };
    for (let i = 0; i < 8; i += 1) {
      const date = `2026-05-${String(3 + i * 4).padStart(2, '0')}`;
      const key = `${date}_101`;
      snapshot.reps[key] = 14 + i;
      snapshot.checkedExercises[key] = true;
    }
    const pipeline = buildComposedInterpretationPipeline({
      snapshot,
      window,
      enrichment: { feedback: { difficulte: 6, count: 2, difficulteSeries: [] } },
      assessment: { tier: 'Intermédiaire', programCompletion28: { ratio: 0.7 } }
    });
    expect(pipeline.trainingState).not.toBeNull();
    expect(Array.isArray(pipeline.stateTransitions)).toBe(true);
    expect(Array.isArray(pipeline.performanceRobustness)).toBe(true);
  });
});
