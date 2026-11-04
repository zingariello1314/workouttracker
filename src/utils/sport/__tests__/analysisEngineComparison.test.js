import { describe, it, expect } from 'vitest';
import {
  buildDiagnosticComparison,
  buildDiagnosticExportPayload,
  buildComparisonMarkdown,
  detectReportIssues,
  compareDomToPack
} from '../analysisEngineComparison';
import { DIAG_STATUS } from '../analysisEngineDiagnosticModel';

function row(partial) {
  return {
    id: partial.id || partial.kind,
    registryKey: partial.registryKey || partial.kind,
    kind: 'disc_emergence',
    family: 'emergence',
    title: 'Titre',
    body: 'Corps',
    diagStatus: DIAG_STATUS.SHOWN_NOW,
    evidenceCount: 1,
    informativeValue: 60,
    metrics: { exerciseId: 'ex1', gapDays: 40 },
    ...partial
  };
}

function report(period, rows) {
  return {
    meta: { period, generatedAt: '2026-01-01T00:00:00.000Z' },
    overview: { period, totalMs: 100, window: { start: '2026-01-01', end: '2026-01-31' } },
    registry: {
      rows,
      counts: {
        total: rows.length,
        shown_now: rows.filter((r) => r.diagStatus === DIAG_STATUS.SHOWN_NOW).length,
        intermediate: 0,
        demoted: rows.filter((r) => r.diagStatus === DIAG_STATUS.DEMOTED).length,
        rejected: 0,
        unknown: 0
      }
    },
    families: [],
    stagesDetailed: [],
    dataCatalog: { items: [] }
  };
}

describe('analysisEngineComparison', () => {
  it('builds dual comparison with matched and only-in', () => {
    const a = report('30d', [
      row({ kind: 'disc_emergence', title: 'Dips reviennent', diagStatus: DIAG_STATUS.SHOWN_NOW }),
      row({
        kind: 'disc_volume',
        title: 'Volume up',
        id: 'v1',
        metrics: { exerciseId: 'ex2', trajectoryPrimaryStory: 'net_rise' }
      })
    ]);
    const b = report('7d', [
      row({
        kind: 'disc_ms_return_42',
        title: 'Dips après pause',
        diagStatus: DIAG_STATUS.DEMOTED,
        decisionReason: 'cap'
      })
    ]);
    const cmp = buildDiagnosticComparison(a, b);
    expect(cmp.mode).toBe('comparison');
    expect(cmp.overview.periodA).toBe('30d');
    expect(cmp.overview.periodB).toBe('7d');
    expect(cmp.stats.onlyA + cmp.stats.onlyB + cmp.stats.matched).toBeGreaterThan(0);
  });

  it('inverts A/B without mutating source rows', () => {
    const a = report('30d', [row({ kind: 'k1', title: 'A only' })]);
    const b = report('7d', [row({ kind: 'k2', title: 'B only', metrics: { exerciseId: 'z' } })]);
    const ab = buildDiagnosticComparison(a, b);
    const ba = buildDiagnosticComparison(b, a);
    expect(ab.stats.onlyA).toBe(ba.stats.onlyB);
    expect(ab.stats.onlyB).toBe(ba.stats.onlyA);
    expect(a.registry.rows[0].title).toBe('A only');
  });

  it('export payload comparison embeds both reports', () => {
    const a = report('30d', [row({})]);
    const b = report('7d', [row({ kind: 'other', metrics: { exerciseId: 'x2' } })]);
    const payload = buildDiagnosticExportPayload({
      mode: 'comparison',
      reportA: a,
      reportB: b
    });
    expect(payload.mode).toBe('comparison');
    expect(payload.periodA.report.meta.period).toBe('30d');
    expect(payload.periodB.report.meta.period).toBe('7d');
    expect(payload.comparison.overview).toBeTruthy();
    const md = buildComparisonMarkdown(payload);
    expect(md).toContain('30d');
    expect(md).toContain('7d');
  });

  it('detectReportIssues flags unresolved identity', () => {
    const r = report('30d', [
      row({
        diagStatus: DIAG_STATUS.DEMOTED,
        decisionReason: 'unresolved_exercise_name',
        evidenceCount: 0
      })
    ]);
    const issues = detectReportIssues(r, 'A');
    expect(issues.some((i) => i.reason === 'unresolved_exercise_name')).toBe(true);
  });

  it('compareDomToPack distinguishes pack vs DOM', () => {
    const r = report('30d', [row({ kind: 'disc_emergence', title: 'Alpha' })]);
    r.meta.dataSignature = 'sig-a';
    const diff = compareDomToPack(r, {
      period: '30d',
      cards: [{ kind: 'disc_emergence', title: 'Beta' }],
      dataSignature: 'sig-a',
      source: 'dom_scrape'
    });
    expect(diff.comparability).toBe('comparable');
    expect(diff.sameSignature).toBe(true);
    expect(diff.levels.selectedInDiagnosticPack).toBe(1);
    expect(diff.levels.renderedInAnalyseDom).toBe(1);
    expect(diff.inPackNotDom.length).toBe(1);
    expect(diff.inDomNotPack.length).toBe(1);
  });

  it('compareDomToPack refuses sameSignature when signatures are null', () => {
    const r = report('30d', [row({ kind: 'disc_emergence', title: 'Alpha' })]);
    const diff = compareDomToPack(r, {
      period: '30d',
      cards: [],
      dataSignature: null,
      source: 'dom_scrape_empty'
    });
    expect(diff.sameSignature).toBe(false);
    expect(diff.comparable).toBe(false);
    expect(diff.comparability).toBe('indeterminate');
    expect(diff.emptyReason).toBe('selector_or_tab_not_ready');
  });

  it('does not flag transversal kinds as high unresolved identity without exercise', () => {
    const r = report('30d', [
      row({
        kind: 'disc_repertoire',
        diagStatus: DIAG_STATUS.DEMOTED,
        decisionReason: 'unresolved_exercise_name',
        metrics: { exerciseId: null },
        evidenceCount: 0
      })
    ]);
    const issues = detectReportIssues(r, 'A');
    const mis = issues.find((i) => i.reason === 'transversal_misclassified_as_unresolved_identity');
    expect(mis).toBeTruthy();
    expect(mis.severity).toBe('low');
    expect(mis.userImpact).toBe(false);
  });

  it('handles missing B', () => {
    const a = report('30d', [row({})]);
    const cmp = buildDiagnosticComparison(a, null);
    expect(cmp.incomplete).toBe(true);
    expect(cmp.reason).toBe('missing_B');
  });
});
