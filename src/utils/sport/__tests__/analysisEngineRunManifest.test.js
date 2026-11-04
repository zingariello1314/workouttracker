import { describe, it, expect } from 'vitest';
import {
  buildRunManifest,
  assessRunComparability,
  parseOverviewSignature,
  repsDeltaFromSignatures,
  COMPARABILITY,
  pseudonymizeAccountId
} from '../analysisEngineRunManifest';
import { requiresExerciseIdentity, subjectTypeOf, SUBJECT_TYPE } from '../analysisEngineSubjectContract';
import { detectReturnCoherenceIssues } from '../analysisEngineCoherence';
import { fixKnownGrammarInProse } from '../recapEditorialPolish';

describe('analysisEngineRunManifest', () => {
  it('parses overview signature and 387 delta', () => {
    const a = '30d|2026-10-06|2026-11-04|0|0|0|41.6|4502|34|1817959519';
    const b = '30d|2026-10-06|2026-11-04|0|0|0|42.2|4889|30|1854085972';
    const delta = repsDeltaFromSignatures(a, b);
    expect(delta.delta).toBe(387);
    expect(delta.sameWindow).toBe(true);
    expect(parseOverviewSignature(a).totalReps).toBe(4502);
  });

  it('marks same-period runs with different training signatures as non-regression-comparable', () => {
    const reportA = {
      meta: {
        period: '30d',
        generatedAt: '2026-11-04T02:19:00.000Z',
        insightHistoryEntryCount: 0,
        insightHistoryInjected: true
      },
      overview: {
        period: '30d',
        window: { start: '2026-10-06', end: '2026-11-04' },
        signature: '30d|2026-10-06|2026-11-04|0|0|0|41.6|4502|34|aaa'
      }
    };
    const reportB = {
      meta: {
        period: '30d',
        generatedAt: '2026-11-04T02:11:00.000Z',
        insightHistoryEntryCount: 180,
        insightHistoryInjected: true
      },
      overview: {
        period: '30d',
        window: { start: '2026-10-06', end: '2026-11-04' },
        signature: '30d|2026-10-06|2026-11-04|0|0|0|42.2|4889|30|bbb'
      }
    };
    const mA = buildRunManifest({ report: reportA });
    const mB = buildRunManifest({ report: reportB });
    const cmp = assessRunComparability(mA, mB, { mode: 'execution' });
    expect(cmp.comparableAsRegression).toBe(false);
    expect([COMPARABILITY.DIFF_DATA, COMPARABILITY.DIFF_EDITORIAL_HISTORY]).toContain(cmp.status);
  });

  it('pseudonymizes account ids stably', () => {
    expect(pseudonymizeAccountId('user-1')).toBe(pseudonymizeAccountId('user-1'));
    expect(pseudonymizeAccountId('user-1')).not.toBe(pseudonymizeAccountId('user-2'));
  });
});

describe('subject contract', () => {
  it('does not require exercise identity for transversal kinds', () => {
    expect(requiresExerciseIdentity({ kind: 'disc_repertoire' })).toBe(false);
    expect(requiresExerciseIdentity({ kind: 'disc_exercise_base' })).toBe(false);
    expect(requiresExerciseIdentity({ kind: 'disc_th_concentration_now' })).toBe(false);
    expect(subjectTypeOf({ kind: 'disc_emergence' })).toBe(SUBJECT_TYPE.EXERCISE);
    expect(requiresExerciseIdentity({ kind: 'disc_emergence' })).toBe(true);
  });
});

describe('return coherence', () => {
  it('flags conflicting return gaps on same exercise when both shown', () => {
    const issues = detectReturnCoherenceIssues([
      {
        id: 'a',
        kind: 'disc_emergence',
        diagStatus: 'shown_now',
        title: 'Relevés de genoux aux parallèles reviennent après une interruption',
        body: 'Réapparition après 42 jours.',
        metrics: { exerciseId: '107', name: 'Relevés de genoux aux parallèles', gapDays: 42 }
      },
      {
        id: 'b',
        kind: 'disc_ms_return',
        diagStatus: 'shown_now',
        title: 'Relevés de genoux aux parallèles reviennent après un long silence',
        body: 'Réapparition après 77 jours.',
        metrics: { exerciseId: '107', name: 'Relevés de genoux aux parallèles', gapDays: 77 }
      }
    ]);
    expect(issues.some((i) => i.reason === 'conflicting_return_gaps')).toBe(true);
  });
});

describe('grammar revient', () => {
  it('accords Relevés … revient → reviennent', () => {
    const fixed = fixKnownGrammarInProse(
      'Relevés de genoux aux parallèles revient après un long silence'
    );
    expect(fixed).toMatch(/reviennent/);
    expect(fixed).not.toMatch(/parallèles revient/);
  });
});
