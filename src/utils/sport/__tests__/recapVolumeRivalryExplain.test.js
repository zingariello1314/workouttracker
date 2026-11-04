import { describe, expect, it } from 'vitest';
import { explainVolumeRivalry, classifyVolumeCardRole } from '../recapVolumeRivalryExplain';
import { buildSelectionDiagnostics } from '../recapSelectionDiagnostics';

describe('explication rivalité volume', () => {
  it('span bat shape sur le même phénomène global', () => {
    const expl = explainVolumeRivalry(
      {
        kind: 'span_volume_vs_frequency',
        weight: 88,
        findings: ['volume_change:from_density']
      },
      { kind: 'disc_volume_shape', weight: 90 }
    );
    expect(expl.complementary).toBe(false);
    expect(expl.winnerKind).toBe('span_volume_vs_frequency');
    expect(expl.reason).toBe('attribution_outranks_portrait');
  });

  it('trajectoire exercice n’est pas rivale du span global', () => {
    const expl = explainVolumeRivalry(
      { kind: 'span_volume_vs_frequency', findings: ['volume_change:from_frequency'] },
      {
        kind: 'disc_exercise_progress',
        metrics: { exerciseId: '103' },
        interpretation: { context: { kind: 'disc_exercise_progress', exerciseId: '103' } }
      }
    );
    expect(expl.complementary).toBe(true);
    expect(classifyVolumeCardRole({ metrics: { exerciseId: '103' }, kind: 'disc_exercise_progress' }).rivalsGlobal).toBe(
      false
    );
  });

  it('diagnostics exposent decisionSummary', () => {
    const diag = buildSelectionDiagnostics({
      produced: [
        { kind: 'span_volume_vs_frequency', findings: ['volume_change:from_density'], weight: 95 },
        { kind: 'disc_volume_shape', weight: 80 }
      ],
      deduped: [{ kind: 'disc_volume_shape', weight: 80 }],
      shown: [{ kind: 'span_volume_vs_frequency', findings: ['volume_change:from_density'], weight: 95 }],
      rankedOut: [],
      insufficient: []
    });
    expect(diag.volumeRivalry?.winnerKind).toBe('span_volume_vs_frequency');
    expect(diag.volumeRivalry?.decisionSummary).toMatch(/span_volume_vs_frequency/);
  });
});
