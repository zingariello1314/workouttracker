import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../xpCalcRegistry', () => ({
  snapshotXpCalcRegistry: () => ({}),
  resetXpCalcRegistry: () => {},
  setXpCalcRegistryListener: () => {}
}));

vi.mock('../stackSampler', () => ({
  resetStackSampler: () => {},
  snapshotStackSampler: () => ({}),
  summarizeStacksForLongTasks: () => []
}));

import {
  analyzeTodayDiag,
  resetTodayDiag,
  snapshotTodayDiagLite,
  startTodayDiagCapture,
  CODE_REVISION
} from '../todayDiag';
import { analyzeInteractions } from '../flightAnalysis';

describe('P0.5 — isolation analyse panneau', () => {
  beforeEach(() => {
    resetTodayDiag();
  });

  it('expose codeRevision et compteurs lite O(1)', () => {
    const lite = snapshotTodayDiagLite();
    expect(lite.codeRevision).toBe(CODE_REVISION);
    expect(lite.eventCount).toBe(0);
    expect(lite.counters.longTaskCapture).toBe(0);
    expect(lite.runtimeBootId).toBeTruthy();
  });

  it('mesure panelAnalyzeMs seulement pour forPanel', () => {
    startTodayDiagCapture();
    const a = analyzeTodayDiag({ forPanel: true, cloneEvents: false });
    expect(a.analysisDurationMs).toBeGreaterThanOrEqual(0);
    expect(a.snapshot.panelAnalyzeCount).toBe(1);
    const b = analyzeTodayDiag({ forPanel: false, cloneEvents: false });
    expect(b.snapshot.panelAnalyzeCount).toBe(1);
  });

  it('analyzeInteractions indexé reste correct sur un jeu minimal', () => {
    const events = [
      { type: 'interaction', phase: 'start', id: 1, kind: 'check', label: 'Coche', t: 100, inputAt: 90 },
      { type: 'interaction', phase: 'end', id: 1, status: 'done', t: 105 },
      { type: 'mark', id: 1, name: 'Rappel de frame', t: 110 },
      { type: 'longtask', taskId: 'lt-1', t: 95, dur: 20, scope: 'capture' }
    ];
    const rows = analyzeInteractions(events, { now: 200 });
    expect(rows).toHaveLength(1);
    expect(rows[0].processingMs).toBe(5);
    expect(rows[0].longTaskIds).toContain('lt-1');
  });
});
