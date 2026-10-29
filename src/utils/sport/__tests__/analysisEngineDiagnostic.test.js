import { describe, expect, it } from 'vitest';
import {
  buildAnalysisEngineDiagnosticReport,
  compareDiagnosticOverviews
} from '../analysisEngineDiagnostic';
import { buildAdaptiveRecapInsights } from '../recapAdaptiveInsights';

function tinySnapshot() {
  return {
    reps: {
      '2026-10-01_101': '20',
      '2026-10-03_101': '22',
      '2026-10-05_101': '18',
      '2026-10-08_501': '10',
      '2026-10-10_501': '12'
    },
    checkedExercises: {
      '2026-10-01_101': true,
      '2026-10-03_101': true,
      '2026-10-05_101': true,
      '2026-10-08_501': true,
      '2026-10-10_501': true
    },
    progressEntries: [],
    enduranceData: { gtg: { days: {}, config: {} } }
  };
}

describe('analysisEngineDiagnostic', () => {
  it('produit un rapport avec étapes et inventaire sans side-effect history', () => {
    const snapshot = tinySnapshot();
    const window = { start: '2026-09-15', end: '2026-10-15' };
    const report = buildAnalysisEngineDiagnosticReport({
      snapshot,
      period: '30d',
      window,
      getExerciseNameById: (id) => (String(id) === '101' ? 'Pompes' : `Exo ${id}`),
      programs: [],
      activeProgram: null
    });
    expect(report.meta.samePipeline).toBe(true);
    expect(report.meta.sideEffectsSuppressed).toBe(true);
    expect(report.overview.period).toBe('30d');
    expect(report.stages.length).toBeGreaterThan(2);
    expect(report.stages.every((s) => s.executed === false || s.label)).toBe(true);
    expect(report.dataInventory.some((d) => d.id === 'reps' && d.status === 'ok')).toBe(true);
    expect(Array.isArray(report.candidates.shown)).toBe(true);
    expect(Array.isArray(report.rejections)).toBe(true);
    expect(report.registry?.counts?.total).toBeGreaterThanOrEqual(0);
    // shown_now = uniques du pack final (dédup registre) ≤ shown bruts
    expect(report.registry?.counts?.shown_now).toBeLessThanOrEqual(report.candidates.shown.length);
    expect(report.registry.rows.filter((r) => r.diagStatus === 'shown_now').length).toBe(
      report.registry.counts.shown_now
    );
    expect(Array.isArray(report.correlations)).toBe(true);
    expect(Array.isArray(report.families)).toBe(true);
    expect(Array.isArray(report.opportunities)).toBe(true);
    expect(Array.isArray(report.limits)).toBe(true);
    expect(report.meta.displayScopeNote).toMatch(/CE run/i);
    // Vert = pack de ce run uniquement
    report.registry.rows
      .filter((r) => r.diagStatus === 'shown_now')
      .forEach((r) => {
        expect(r.displayScope).toBe('current_run');
      });
  });

  it('collectDiagnostic n’altère pas les insights métier vs appel normal', () => {
    const snapshot = tinySnapshot();
    const window = { start: '2026-09-15', end: '2026-10-15' };
    const base = {
      snapshot,
      window,
      period: '30d',
      enrichment: { window, streak: { current: 0, longest: 0 }, completion: null, dayOfWeek: [] },
      assessment: { insights: {}, totalReps28: 100 },
      getExerciseNameById: () => 'Exo',
      programs: []
    };
    const a = buildAdaptiveRecapInsights({ ...base, collectDiagnostic: true });
    const b = buildAdaptiveRecapInsights({ ...base, collectDiagnostic: false });
    expect(a.insights.shortTerm.map((c) => c.title || c.body).join('|')).toBe(
      b.insights.shortTerm.map((c) => c.title || c.body).join('|')
    );
    expect(a.diagnostic).toBeTruthy();
    expect(b.diagnostic).toBeUndefined();
  });

  it('compare deux overviews', () => {
    const a = { meta: { period: '7d' }, overview: { candidatesShown: 2, candidatesRejected: 1, signalsDetected: 3 } };
    const b = { meta: { period: '30d' }, overview: { candidatesShown: 5, candidatesRejected: 4, signalsDetected: 8 } };
    const c = compareDiagnosticOverviews(a, b);
    expect(c.shownDelta).toBe(3);
    expect(c.rejectedDelta).toBe(3);
  });
});
