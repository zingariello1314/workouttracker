import { describe, expect, it } from 'vitest';
import {
  assessPunctualClaimFreshness,
  lifecycleSelectionPenalty,
  buildPublishableReserveEntry,
  ANALYSIS_STATUS
} from '../recapEditorialLifecycle';
import { applyNoveltyWeights } from '../insightNoveltyEngine';

describe('cycle de vie éditorial', () => {
  const day = 86400000;
  const now = Date.UTC(2026, 10, 7, 12); // 2026-11-07

  it('J1 record intéressant ; J3–J6 sans preuve → priorité basse (7j)', () => {
    const j1 = assessPunctualClaimFreshness({
      firstPublishedAt: now - 0 * day,
      lastProofAt: now - 0 * day,
      timesShown: 1,
      voiceKey: 'week',
      hasNewProof: false,
      now
    });
    expect(j1.stillInteresting).toBe(true);

    const j4 = assessPunctualClaimFreshness({
      firstPublishedAt: now - 3 * day,
      lastProofAt: now - 3 * day,
      timesShown: 2,
      voiceKey: 'week',
      hasNewProof: false,
      now
    });
    expect(j4.stillTrue).toBe(true);
    expect(j4.stillInteresting).toBe(false);
    expect(j4.reason).toBe('punctual_no_new_proof');
    expect(lifecycleSelectionPenalty(j4)).toBeGreaterThanOrEqual(32);
  });

  it('nouvelle preuve → priorité haute', () => {
    const f = assessPunctualClaimFreshness({
      firstPublishedAt: now - 5 * day,
      lastProofAt: now - 5 * day,
      timesShown: 3,
      voiceKey: 'week',
      hasNewProof: true,
      now
    });
    expect(f.priority).toBe('high');
    expect(lifecycleSelectionPenalty(f)).toBe(0);
  });

  it('horizon long conserve une lecture structurelle', () => {
    const f = assessPunctualClaimFreshness({
      firstPublishedAt: now - 10 * day,
      lastProofAt: now - 10 * day,
      timesShown: 4,
      voiceKey: 'long',
      phenomenonClass: 'frequency_attribution',
      now
    });
    expect(f.stillInteresting).toBe(true);
    expect(f.statusHint).toBe(ANALYSIS_STATUS.CONSOLIDATED);
  });

  it('novelty démonte une carte ponctuelle déjà vue sans nouvelle preuve', () => {
    const history = {
      entries: [
        {
          id: 'relation.reading.short.punctual_112',
          seenAt: now - 3 * day,
          count: 2,
          theme: 'short.punctual_112'
        }
      ]
    };
    const [fresh] = applyNoveltyWeights(
      [
        {
          id: 'relation.reading.short.punctual_112',
          weight: 90,
          horizon: 'short',
          punctualClaim: true
        }
      ],
      history,
      now
    );
    const [unseen] = applyNoveltyWeights(
      [
        {
          id: 'relation.reading.short.other',
          weight: 70,
          horizon: 'short'
        }
      ],
      history,
      now
    );
    expect(fresh.weight).toBeLessThan(unseen.weight);
  });

  it('réserve publiable conserve les méta sans texte complet', () => {
    const e = buildPublishableReserveEntry({
      phenomenonId: 'ex:103|volume_rise|none',
      proofFingerprint: 'abc',
      conclusionKey: 'per_session_up',
      notSelectedReason: 'outranked_by_span',
      voiceKey: 'week'
    });
    expect(e.status).toBe(ANALYSIS_STATUS.PUBLISHABLE_NOT_SELECTED);
    expect(e.phenomenonId).toBeTruthy();
    expect(e.body).toBeUndefined();
  });
});
