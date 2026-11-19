import { describe, expect, it } from 'vitest';
import { computeRecapPeriodWorkerBundle } from '../recapPeriodWorkerCompute';
import {
  RECAP_ADAPTIVE_WORKER_CONTRACT,
  WORKER_MSG,
  matchesWorkerPublicationGate
} from '../recapAdaptiveWorkerContract';
import { analysisEditionKey, cacheReuseDecision } from '../analysisEdition';
import { publicationPackState } from '../analysisEnvironmentDossier';
import {
  analysisRunKey,
  isRecapInsightsReady,
  withInsightsPublication
} from '../../../hooks/useRecapTabMetrics';

/**
 * Preuve technique Worker → filtre → publication.
 * Ce fichier ne lit pas le DOM et ne remplace pas une observation navigateur.
 */
describe('chaîne technique Worker → ready', () => {
  it('un résultat du calcul réel passe le filtre, le cache et le statut ready', async () => {
    const request = {
      requestId: 'req-1',
      accountScope: 'acct',
      period: '7d',
      windowStart: '2026-11-12',
      windowEnd: '2026-11-18',
      dataRevision: 'rev-1',
      contractVersion: RECAP_ADAPTIVE_WORKER_CONTRACT
    };
    const bundle = await computeRecapPeriodWorkerBundle({
      ...request,
      snapshot: {
        reps: { '2026-11-17_101': '12', '2026-11-18_101': '12' },
        checkedExercises: { '2026-11-17_101': true, '2026-11-18_101': true }
      },
      nameMap: { 101: 'Pompes' },
      garminData: null,
      activeProgram: null,
      programs: []
    });
    const response = {
      type: WORKER_MSG.RESULT,
      ...request,
      status: 'ok',
      result: {
        adaptive: bundle.adaptive,
        assessment: bundle.assessment
      }
    };

    expect(matchesWorkerPublicationGate(request, response)).toBe(true);
    expect(matchesWorkerPublicationGate(request, { ...response, requestId: 'req-0' })).toBe(false);
    expect(matchesWorkerPublicationGate(request, { ...response, windowEnd: '2026-11-17' })).toBe(false);
    expect(matchesWorkerPublicationGate(request, { ...response, contractVersion: 'autre' })).toBe(false);
    expect(matchesWorkerPublicationGate(request, { ...response, result: null })).toBe(false);

    const published = withInsightsPublication(response.result.assessment, {
      status: 'ready',
      period: request.period,
      windowStart: request.windowStart,
      windowEnd: request.windowEnd,
      insights: response.result.adaptive?.insights
    });
    const pack = { analysisStatus: 'ready', recapAssessment: published };
    expect(published.insightsPublication.status).toBe('ready');
    expect(published.insightsPublication.complete).toBe(true);
    expect(isRecapInsightsReady(pack)).toBe(true);
    expect(
      publicationPackState({
        analysisStatus: 'ready',
        publication: published.insightsPublication
      }).definitive
    ).toBe(true);

    const edition = analysisEditionKey();
    const cache = cacheReuseDecision({
      storedEdition: edition,
      currentEdition: edition,
      storedPeriod: '7d',
      requestedPeriod: '7d',
      storedFingerprint: 'rev-1',
      requestedFingerprint: 'rev-1'
    });
    expect(cache.reuse).toBe(true);

    const clockOnly = analysisRunKey({
      period: '7d',
      windowStart: request.windowStart,
      windowEnd: request.windowEnd,
      dataRevision: 'rev-1',
      endAt: '2026-11-18T10:00:00'
    });
    const laterClock = analysisRunKey({
      period: '7d',
      windowStart: request.windowStart,
      windowEnd: request.windowEnd,
      dataRevision: 'rev-1',
      endAt: '2026-11-18T18:00:00'
    });
    expect(laterClock).toBe(clockOnly);
  }, 60000);
});
