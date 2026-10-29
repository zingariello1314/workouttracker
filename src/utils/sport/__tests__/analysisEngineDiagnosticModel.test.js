import { describe, expect, it } from 'vitest';
import {
  buildAnalysisRegistry,
  buildCorrelationLab,
  enrichDiagnosticReport,
  mapRawStatusToDiag,
  DIAG_STATUS
} from '../analysisEngineDiagnosticModel';

describe('analysisEngineDiagnosticModel', () => {
  it('mappe shown → shown_now (run actuel)', () => {
    expect(mapRawStatusToDiag({ status: 'shown', kind: 'volume_peak' })).toBe(
      DIAG_STATUS.SHOWN_NOW
    );
  });

  it('mappe ranked_out → demoted et insufficient → rejected', () => {
    expect(mapRawStatusToDiag({ status: 'rejected', reason: 'ranked_out_caps' })).toBe(
      DIAG_STATUS.DEMOTED
    );
    expect(mapRawStatusToDiag({ status: 'rejected', reason: 'insufficient_or_invalid' })).toBe(
      DIAG_STATUS.REJECTED
    );
  });

  it('registre déduplique en privilégiant shown_now', () => {
    const report = {
      candidates: {
        shown: [{ id: 'a', kind: 'sleep_volume', title: 'T', body: 'B', status: 'shown' }],
        produced: [{ id: 'a', kind: 'sleep_volume', title: 'T', body: 'B', status: 'produced' }],
        discoveries: []
      },
      rejections: [{ id: 'a', kind: 'sleep_volume', title: 'T', body: 'B', status: 'rejected', reason: 'ranked_out_caps' }]
    };
    // annotate fields expected by map
    report.candidates.shown[0].status = 'shown';
    const reg = buildAnalysisRegistry(report);
    expect(reg.counts.shown_now).toBe(1);
    expect(reg.counts.total).toBe(1);
    expect(reg.rows[0].displayScope).toBe('current_run');
  });

  it('corrélation impossible si données manquantes', () => {
    const report = {
      candidates: { shown: [], produced: [], discoveries: [] },
      signals: { correlations: [], sleepCandidateTypes: [] },
      dataInventory: [
        { id: 'sleep', status: 'missing', label: 'Sommeil' },
        { id: 'reps', status: 'ok', label: 'Reps', n: 10 }
      ]
    };
    const lab = buildCorrelationLab(report);
    const sleepVol = lab.find((r) => r.id === 'sleep_x_volume');
    expect(sleepVol.status).toBe('impossible_with_data');
  });

  it('enrichDiagnosticReport attache limites et légendes', () => {
    const enriched = enrichDiagnosticReport({
      stages: [{ id: 'x', label: 'X', module: 'm', executed: true, ms: 1 }],
      dataInventory: [],
      candidates: { shown: [], produced: [], discoveries: [] },
      rejections: [],
      signals: { correlations: [] },
      overview: {},
      selectionDiagnostics: { byFamily: {} }
    });
    expect(enriched.limits.length).toBeGreaterThan(0);
    expect(enriched.statusLegend).toBeTruthy();
    expect(enriched.stagesDetailed[0].stageStatus).toBeTruthy();
  });
});
