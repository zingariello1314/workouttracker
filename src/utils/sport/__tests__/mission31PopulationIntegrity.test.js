/**
 * Mission 31 — population liée vs fallback arc ; faux échecs vs vraies contradictions.
 */
import { describe, expect, it } from 'vitest';
import {
  resolvePrimaryWindowSessionPopulation,
  validateSumMeanSampleConsistency
} from '../recapMetricContract';
import { validateCardClaimConsistency } from '../evaluation/claimAssertionIdentity';
import { validateAnalyticalAudit } from '../evaluation/buildAnalyticalAudit';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';

describe('Mission 31 — édition', () => {
  it('conserve population / claim (éditions ≥ v30)', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/p6-sovereign-v3[0-3]/);
    expect(ANALYSIS_EDITION_PARTS.composition).toBe('metric-population-v2');
    expect(ANALYSIS_EDITION_PARTS.claim).toBe('assertion-population-v2');
  });
});

describe('Mission 31 — non-comparabilité vs contradiction réelle', () => {
  it('fallback dates(arc) ne fournit plus un effectif inventé', () => {
    const pop = resolvePrimaryWindowSessionPopulation({
      dates: [
        '2026-09-18',
        '2026-09-25',
        '2026-10-02',
        '2026-10-16',
        '2026-10-30',
        '2026-11-06',
        '2026-11-13',
        '2026-11-20'
      ],
      recentReps: 718,
      windowMeanPerSession: 39.9
    });
    expect(pop.source).toBe('dates.fallback_possibly_arc');
    expect(pop.sessionCount).toBeNull();
    expect(pop.arcDateCount).toBe(8);
    expect(pop.comparableForSumMean).toBe(false);
  });

  it('ne crée pas de faux FAIL sum_mean quand l’effectif n’est pas lié (cas Pompes)', () => {
    const card = {
      id: 'pompes',
      title: 'Pompes déclinées',
      body: '718 répétitions sur 18 séances (≈39,9 / séance)',
      metrics: {
        recentReps: 718,
        windowMeanPerSession: 39.9,
        dates: [
          '2026-09-18',
          '2026-09-25',
          '2026-10-02',
          '2026-10-16',
          '2026-10-30',
          '2026-11-06',
          '2026-11-13',
          '2026-11-20'
        ]
      }
    };
    const claim = {
      statement: card.body,
      proof: {
        observedValues: [
          { id: 'recentReps', value: 718 },
          { id: 'windowMeanPerSession', value: 39.9 }
        ]
      }
    };
    const check = validateCardClaimConsistency(card, claim);
    expect(check.ok).toBe(true);
    expect(check.conflicts.some((c) => c.metric === 'sum_mean_sample_consistency')).toBe(false);
    expect(check.notes?.some((n) => n.metric === 'sum_mean_sample_noncomparable')).toBe(true);
  });

  it('refuse une vraie contradiction sur population liée (cas artificiellement faux)', () => {
    const card = {
      id: 'fake',
      title: 'Curl',
      body: '480 répétitions sur 8 séances',
      metrics: {
        recentReps: 480,
        windowMeanPerSession: 48,
        sessionCount: 8,
        sessions: Array.from({ length: 8 }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          inSelectedWindow: true
        }))
      }
    };
    // 48×8=384 ≠ 480 → contradiction réelle
    const claim = {
      statement: card.body,
      proof: {
        observedValues: [
          { id: 'recentReps', value: 480 },
          { id: 'windowMeanPerSession', value: 48 },
          { id: 'sessionCount', value: 8 }
        ]
      }
    };
    const check = validateCardClaimConsistency(card, claim);
    expect(check.ok).toBe(false);
    expect(check.conflicts.some((c) => c.metric === 'sum_mean_sample_consistency')).toBe(true);
  });

  it('accepte total/mean/n cohérents quand sessionCount est dans observedValues', () => {
    const card = {
      id: 'ok',
      title: 'Dips',
      body: '480 répétitions sur 10 séances',
      metrics: {
        recentReps: 480,
        windowMeanPerSession: 48,
        dates: ['2026-09-01', '2026-09-08'], // arc court ≠ 10
        observedValues: [
          { id: 'recentReps', value: 480 },
          { id: 'windowMeanPerSession', value: 48 },
          { id: 'sessionCount', value: 10 }
        ]
      }
    };
    const claim = {
      statement: card.body,
      proof: { observedValues: card.metrics.observedValues }
    };
    const check = validateCardClaimConsistency(card, claim);
    expect(check.ok).toBe(true);
    expect(validateSumMeanSampleConsistency({ total: 480, mean: 48, sampleSize: 10 }).ok).toBe(
      true
    );
  });

  it('validateAnalyticalAudit ne marque plus integrity ko pour seul fallback arc', () => {
    const cardId = 'disc_emergence|ex:104|fact:emergence|104|stable_format';
    const claimId = 'c:104';
    const doc = {
      schema: 'momentum.analyticalAudit.v2',
      manifest: { edition: 'p6-sovereign-v30' },
      cardRegistry: {
        [`3m|${cardId}`]: {
          id: cardId,
          period: '3m',
          role: 'reserve',
          claimId,
          title: 'Test',
          body: '718 reps',
          metrics: {
            recentReps: 718,
            windowMeanPerSession: 39.9,
            dates: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(
              (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`
            )
          }
        }
      },
      claimRegistry: {
        [claimId]: {
          id: claimId,
          period: '3m',
          proof: {
            observedValues: [
              { id: 'recentReps', value: 718 },
              { id: 'windowMeanPerSession', value: 39.9 }
            ]
          },
          assertions: []
        }
      },
      factRegistry: {}
    };
    const v = validateAnalyticalAudit(doc);
    expect(v.integrityValidation.errors.filter((e) => e.startsWith('card_claim_divergence'))).toEqual(
      []
    );
  });
});
