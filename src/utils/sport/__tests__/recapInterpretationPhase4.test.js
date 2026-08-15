import { describe, expect, it } from 'vitest';
import {
  buildHierarchicalComparisons,
  selectHierarchicalComparisons,
  comparisonsToInterpretationCandidates
} from '../populationComparisonEngine';
import { buildRelationContext, evaluateRelationGraph, RELATION_GRAPH_RULES } from '../trainingRelationGraph';

describe('populationComparisonEngine', () => {
  it('priorise le niveau personnel sur population', () => {
    const rows = selectHierarchicalComparisons([
      {
        id: 'a',
        level: 'population',
        domain: 'volume',
        text: 'pop',
        confidence: 0.9,
        relevance: 0.9
      },
      {
        id: 'b',
        level: 'personal',
        domain: 'volume',
        text: 'perso',
        confidence: 0.7,
        relevance: 0.85
      }
    ]);
    expect(rows[0].level).toBe('personal');
  });

  it('génère comparaisons personnelles avec momentum reps', () => {
    const rows = buildHierarchicalComparisons({
      snapshot: { reps: {}, checkedExercises: {}, progressEntries: {} },
      window: { start: '2026-05-01', end: '2026-06-01' },
      assessment: { repsMomentumRatio: 1.15, tier: 'Intermédiaire' },
      trainingState: { features: {}, context: { tier: 'Intermédiaire' } }
    });
    expect(rows.some((r) => r.level === 'personal')).toBe(true);
  });

  it('convertit en candidats interprétation', () => {
    const cands = comparisonsToInterpretationCandidates([
      {
        id: 'cmp.test',
        level: 'program',
        domain: 'adherence',
        text: 'Test comparaison',
        confidence: 0.8,
        relevance: 0.85
      }
    ]);
    expect(cands[0].text).toBe('Test comparaison');
    expect(cands[0].pillar).toBe('comparison');
  });
});

describe('trainingRelationGraph', () => {
  it('expose des règles déclaratives', () => {
    expect(RELATION_GRAPH_RULES.length).toBeGreaterThanOrEqual(10);
  });

  it('détecte push/pull déséquilibré', () => {
    const state = {
      load: { trend: 'stable', value: 'stable', confidence: 0.7, evidence: [] },
      performance: { trend: 'stable', value: 'stable', confidence: 0.6, evidence: [] },
      recovery: { trend: 'stable', value: 'sufficient', confidence: 0.7, evidence: [] },
      fatigue: { trend: 'stable', value: 'low', confidence: 0.6, evidence: [] },
      adherence: { value: 'high', trend: 'unknown', confidence: 0.7, evidence: [] },
      programResponse: { value: 'adapting', trend: 'stable', confidence: 0.6, evidence: [] },
      lifePhase: null,
      context: { tier: 'Intermédiaire' },
      features: {}
    };
    const ctx = buildRelationContext({
      state,
      enrichment: { pushPull: { ratio: 1.8, pushPct: 64, pullPct: 36 } },
      assessment: {},
      stateTransitions: [],
      events: []
    });
    const hits = evaluateRelationGraph(ctx);
    expect(hits.some((h) => h.id === 'relation.push_pull_imbalance')).toBe(true);
  });
});
