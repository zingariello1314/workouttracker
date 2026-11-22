/**
 * Mission 10 — sommeil : corps rédigé, pas le code de limitation.
 */
import { describe, expect, it } from 'vitest';
import { claimFromDiscovery } from '../analyticalClaim';
import { draftFromClaim } from '../draftFromClaim';
import { analysisEditionKey } from '../analysisEdition';

describe('Mission 10 — sommeil et rédaction', () => {
  it('édition ≥ v9 (sommeil prose)', () => {
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v(?:9|10|11|12)/);
    expect(analysisEditionKey()).toMatch(/sleep=association-prose-v[1234]/);
  });

  it('ne publie jamais association_not_causation comme corps seul', () => {
    const discovery = {
      kind: 'disc_sleep_volume',
      title: 'Tes journées à fort volume s’alignent sur un seuil de sommeil personnel',
      body: 'Sur 21 séances appariées, celles précédées d’au moins 7 h 30 totalisent en moyenne 299 reps, contre 233 sous 7 h 30. Ce n’est pas une cause : c’est une séparation reproductible (17 et 4 séances).',
      evidence: '≥ 7 h 30 299 · < 7 h 30 233 · n=21',
      metrics: {
        associationOnly: true,
        threshold: 7.5,
        highN: 17,
        lowN: 4,
        highVol: 299.4,
        lowVol: 233,
        delta: 66.4,
        deltaPct: 28.5,
        sample: 'all',
        observedValues: [
          { id: 'threshold', value: 7.5, unit: 'hours' },
          { id: 'highN', value: 17, unit: 'sessions' },
          { id: 'lowN', value: 4, unit: 'sessions' },
          { id: 'highVol', value: 299.4, unit: 'reps' },
          { id: 'lowVol', value: 233, unit: 'reps' }
        ]
      }
    };
    const claim = claimFromDiscovery(discovery, { start: '2026-11-01', end: '2026-11-21' });
    expect(claim.limitations).toContain('association_not_causation');
    expect(claim.proof.observedValues.length).toBeGreaterThanOrEqual(5);
    const drafted = draftFromClaim(discovery, claim);
    expect(drafted.body.trim()).not.toBe('association_not_causation');
    expect(drafted.body).toMatch(/299|233|7 h 30|séparation|moyenne/i);
    expect(drafted.body).not.toMatch(/^association_not_causation/);
  });

  it('conserve le corps analytique si la limitation est déjà exprimée naturellement', () => {
    const discovery = {
      kind: 'disc_sleep_assoc',
      title: 'Autour de 7 h 30, les journées fortes et les journées courtes ne se répartissent pas pareil',
      body: 'Les séances après une nuit ≥ 7 h 30 sont plus souvent dans le tiers haut du volume. Ce n’est pas une preuve de causalité.',
      evidence: 'n=21',
      metrics: { associationOnly: true, highN: 12, lowN: 9 }
    };
    const claim = claimFromDiscovery(discovery);
    const drafted = draftFromClaim(discovery, claim);
    expect(drafted.body).toMatch(/tiers haut|volume/i);
    expect(drafted.body).not.toBe('association_not_causation');
  });
});
