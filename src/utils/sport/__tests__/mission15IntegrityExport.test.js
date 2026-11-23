import { describe, expect, it } from 'vitest';
import { analysisEditionKey } from '../analysisEdition';
import { buildAnalyticalAudit, validateAnalyticalAudit } from '../evaluation/buildAnalyticalAudit';
import {
  assertionClaimKey,
  validateCardClaimConsistency
} from '../evaluation/claimAssertionIdentity';

describe('Mission 15 — intégrité claims et export', () => {
  it('édition ≥ v14 assertion-window + audit normalisé', () => {
    const key = analysisEditionKey();
    expect(key).toMatch(/editorial=p6-sovereign-v\d+/);
    expect(key).toMatch(/claim=assertion-window-v\d+/);
    expect(key).toMatch(/audit=normalized-export-v\d+/);
  });

  it('deux horizons même legacyClaimId → deux assertions distinctes', () => {
    const mkCard = (period, mean, winEnd) => ({
      id: `occ:decline-push|${period}`,
      kind: 'disc_exercise_trajectory',
      title: 'Pompes déclinées: recul confirmé sur plusieurs séances',
      body: `Moyenne ${mean}.`,
      metrics: {
        windowMeanPerSession: mean,
        arcEarlyMean: 50,
        arcLateMean: mean,
        windowStart: '2025-10-20',
        windowEnd: winEnd
      },
      claim: {
        id: 'claim:decline-pushups',
        subject: { key: 'ex:decline' },
        scope: { start: '2025-10-20', end: winEnd },
        proof: {
          observedValues: [
            { id: 'windowMeanPerSession', value: mean },
            { id: 'arcLateMean', value: mean }
          ]
        }
      }
    });

    const doc = buildAnalyticalAudit({
      eightPeriodExport: {
        schema: 'momentum.analysisEightPeriodExport.v1',
        periods: {
          '7d': {
            userAccessible: {
              priority: [mkCard('7d', 36, '2026-11-21')],
              reserve: [],
              counts: { accessible: 1, priority: 1, reserve: 0 }
            },
            registry: {}
          },
          '1y': {
            userAccessible: {
              priority: [mkCard('1y', 45.5, '2026-11-21')],
              reserve: [],
              counts: { accessible: 1, priority: 1, reserve: 0 }
            },
            registry: {}
          }
        }
      },
      insights: null,
      snapshot: { activeProgram: { schedule: { monday: { name: 'A', exercises: [] } } } }
    });

    expect(doc.schema).toBe('momentum.analyticalAudit.v2');
    expect(Object.keys(doc.claimRegistry).length).toBe(2);
    const claims = Object.values(doc.claimRegistry);
    expect(claims.every((c) => c.legacyClaimId === 'claim:decline-pushups')).toBe(true);
    expect(new Set(claims.map((c) => c.id)).size).toBe(2);

    const card7 = doc.cardRegistry['7d|occ:decline-push|7d'];
    const claim7 = doc.claimRegistry[card7.claimId];
    expect(claim7.proof.observedValues.find((v) => v.id === 'windowMeanPerSession').value).toBe(36);

    const card1y = doc.cardRegistry['1y|occ:decline-push|1y'];
    const claim1y = doc.claimRegistry[card1y.claimId];
    expect(claim1y.proof.observedValues.find((v) => v.id === 'windowMeanPerSession').value).toBe(45.5);

    expect(doc.programRegistry.available).toBe(true);
    expect(doc.manifest.includeLiveMirror).toBe(false);

    const v = validateAnalyticalAudit(doc);
    expect(v.ok).toBe(true);
    expect(doc.diagnostics.cardClaimDivergenceCount).toBe(0);
  });

  it('détecte divergence carte↔claim si valeurs écrasées', () => {
    const card = {
      id: 'c1',
      title: 'X',
      metrics: { windowMeanPerSession: 36 },
      observedValues: [{ id: 'windowMeanPerSession', value: 36 }]
    };
    const claim = {
      id: 'cl',
      proof: { observedValues: [{ id: 'windowMeanPerSession', value: 45.5 }] },
      scope: { end: '2026-11-21' }
    };
    const check = validateCardClaimConsistency(card, claim);
    expect(check.ok).toBe(false);
  });

  it('assertionClaimKey distingue les fenêtres', () => {
    const claim = { id: 'c', scope: { start: '2026-11-14', end: '2026-11-21' } };
    const a = assertionClaimKey(claim, null, '7d');
    const b = assertionClaimKey(
      { id: 'c', scope: { start: '2025-11-21', end: '2026-11-21' } },
      null,
      '1y'
    );
    expect(a).not.toBe(b);
  });

  it('ordre long→court et court→long : mêmes clés de claims', () => {
    const card = (period, mean) => ({
      id: `occ:x`,
      title: 'T',
      body: 'B',
      claim: {
        id: 'claim:x',
        scope: { start: '2026-01-01', end: period === '7d' ? '2026-11-21' : '2026-11-21' },
        population: period,
        proof: { observedValues: [{ id: 'm', value: mean }] }
      },
      metrics: { windowEnd: '2026-11-21' }
    });
    const mk = (order) => {
      const periods = {};
      order.forEach((p, i) => {
        periods[p] = {
          userAccessible: {
            priority: [card(p, p === '7d' ? 10 : 20)],
            reserve: [],
            counts: { accessible: 1 }
          },
          registry: {}
        };
      });
      return buildAnalyticalAudit({ eightPeriodExport: { periods } });
    };
    const shortFirst = mk(['7d', '1y']);
    const longFirst = mk(['1y', '7d']);
    expect(Object.keys(shortFirst.claimRegistry).sort()).toEqual(
      Object.keys(longFirst.claimRegistry).sort()
    );
  });
});
