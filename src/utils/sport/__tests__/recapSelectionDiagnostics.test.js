import { describe, expect, it } from 'vitest';
import {
  analysisFamilyOfKind,
  buildSelectionDiagnostics,
  familiesStarvedDespiteProduction
} from '../recapSelectionDiagnostics';

describe('recapSelectionDiagnostics (R4)', () => {
  it('classe les kinds en familles', () => {
    expect(analysisFamilyOfKind('disc_sleep_assoc')).toBe('sleep');
    expect(analysisFamilyOfKind('disc_gtg_unplanned_role')).toBe('gtg');
    expect(analysisFamilyOfKind('volume_traj')).toBe('volume');
    expect(analysisFamilyOfKind('disc_ms_return')).toBe('exercise');
    expect(analysisFamilyOfKind('adherence_dow')).toBe('adherence');
    expect(analysisFamilyOfKind('body_weight_parallel')).toBe('body');
    expect(analysisFamilyOfKind('gtg_repere_coevo')).toBe('gtg');
    expect(analysisFamilyOfKind('stretch_gap')).toBe('mobility');
    expect(analysisFamilyOfKind('span_session_cost')).toBe('rhythm');
    expect(analysisFamilyOfKind('disc_best_month')).toBe('volume');
    expect(analysisFamilyOfKind('disc_anchor')).toBe('volume');
    expect(analysisFamilyOfKind('level_established')).toBe('exercise');
  });

  it('compte produced / deduped / ranked_out / shown', () => {
    const diag = buildSelectionDiagnostics({
      produced: [
        { kind: 'volume_traj', id: 'a' },
        { kind: 'volume_traj', id: 'b' },
        { kind: 'disc_sleep_assoc', id: 'c' }
      ],
      deduped: [{ kind: 'volume_traj', id: 'b' }],
      rankedOut: [{ kind: 'disc_sleep_assoc', id: 'c' }],
      shown: [{ kind: 'volume_traj', id: 'a' }]
    });
    expect(diag.byFamily.volume.produced).toBe(2);
    expect(diag.byFamily.volume.deduped).toBe(1);
    expect(diag.byFamily.volume.shown).toBe(1);
    expect(diag.byFamily.sleep.ranked_out).toBe(1);
    expect(diag.byFamily.sleep.shown).toBe(0);
    expect(familiesStarvedDespiteProduction(diag).some((r) => r.family === 'sleep')).toBe(true);
  });
});
