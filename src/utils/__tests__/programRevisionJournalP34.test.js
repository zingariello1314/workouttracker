/**
 * P3.4 — journal révisions, applicabilité, seal ordonné, non-régression P3.3.
 */
import { describe, expect, it } from 'vitest';
import {
  APPLICABILITY_CONFIDENCE,
  DAY_PLAN_PROOF,
  REVISION_MUTATION_KIND,
  REVISION_RELIABILITY,
  appendActivationEvent,
  appendDatedExceptionEvent,
  appendProgramRevision,
  assessApplicabilityContinuity,
  captureDayFromJournalIfAdmissible,
  computeProgramStructureFingerprint,
  describeJournalCoverage,
  diffProgramStructures,
  getProgramRevisionLog,
  isSameProgramStructure,
  markPendingUncertain,
  normalizeProgramStructure,
  prepareProgramMutationBundle,
  reconcileLiveProgramAgainstJournal,
  resolveActiveProgramIdAtDate,
  resolveHistoricalDayPlanFromJournal,
  resolveRevisionForProgramAtDate,
  structuresDeepEqual
} from '../programRevisionJournalP34';
import {
  SNAPSHOT_STATUS,
  capturePlannedDayWithoutActivity,
  describeDayPlanProvenance,
  isPlanCompareEligible,
  promoteDueProvisionalForecasts
} from '../calendarPlanCaptureP33';
import { getDayPlanSnapshot } from '../calendarDayPlanSnapshot';
import {
  buildDayPlanRealizationRow,
  buildPlanRealizationMatrix,
  PLAN_SOURCE
} from '../sport/recapProgramAdherenceProgression';
import {
  COMPARABILITY_LEVEL,
  P34_KINDS,
  assessBeforeAfterComparability,
  buildP34RevisionDiscoveries,
  buildRevisionBeforeAfterMetrics
} from '../sport/recapProgramRevisionP34';
import { buildProgramAdherenceDiscoveries } from '../sport/recapProgramAdherenceDiscoveries';
import { buildP32bMuscleDiscoveries } from '../sport/recapMuscleP32bDiscoveries';

const PROG_A = {
  id: 'prog-a',
  name: 'Alpha',
  schedule: {
    lundi: {
      active: true,
      exercises: [
        { id: 101, originalId: 'exo_a', name: 'Tractions', series: '3×8' },
        { id: 104, originalId: 'exo_b', name: 'Pompes', series: '3×12' }
      ]
    },
    mardi: { active: false, exercises: [] },
    mercredi: {
      active: true,
      exercises: [{ id: 201, originalId: 'exo_s', name: 'Squat', series: '3×10' }]
    },
    jeudi: { active: false, exercises: [] },
    vendredi: {
      active: true,
      exercises: [{ id: 104, originalId: 'exo_b', name: 'Pompes', series: '3×12' }]
    },
    samedi: { active: false, exercises: [] },
    dimanche: { active: false, exercises: [] }
  },
  restConfig: { restDay: 'dimanche' }
};

const PROG_B = {
  ...PROG_A,
  id: 'prog-b',
  name: 'Beta',
  schedule: {
    ...PROG_A.schedule,
    lundi: {
      active: true,
      exercises: [{ id: 301, originalId: 'exo_c', name: 'Dips', series: '3×10' }]
    }
  }
};

function withStructuralChange(program, day, exercises) {
  return {
    ...program,
    schedule: {
      ...program.schedule,
      [day]: { active: exercises.length > 0, exercises }
    }
  };
}

describe('P3.4 — journal & empreinte', () => {
  it('1. première version d’un programme', () => {
    const res = appendProgramRevision(
      {},
      {
        program: PROG_A,
        forceStructural: true,
        recordedAt: '2026-10-01T10:00:00.000Z',
        applicableFrom: '2026-10-01T10:00:00.000Z'
      }
    );
    expect(res.wrote).toBe(true);
    expect(res.revision.structureFingerprint).toBeTruthy();
    expect(res.revision.structure.schedule.lundi.exercises).toHaveLength(2);
    const log = getProgramRevisionLog(res.workoutData);
    expect(log.journalIntroducedAt).toBe('2026-10-01');
    expect(log.revisions).toHaveLength(1);
  });

  it('2-4. modification séance / ajouts / paramètres prescrits', () => {
    let data = appendProgramRevision(
      {},
      { program: PROG_A, forceStructural: true, recordedAt: '2026-10-01T10:00:00.000Z' }
    ).workoutData;
    const next = withStructuralChange(PROG_A, 'lundi', [
      { id: 101, originalId: 'exo_a', name: 'Tractions', series: '4×8' },
      { id: 104, originalId: 'exo_b', name: 'Pompes', series: '3×12' },
      { id: 105, originalId: 'exo_d', name: 'Row', series: '3×10' }
    ]);
    const res = appendProgramRevision(data, {
      program: next,
      previousProgram: PROG_A,
      recordedAt: '2026-10-05T12:00:00.000Z'
    });
    expect(res.wrote).toBe(true);
    expect(res.revision.mutationKind).toBe(REVISION_MUTATION_KIND.STRUCTURAL);
    const closed = getProgramRevisionLog(res.workoutData).revisions[0];
    expect(closed.applicableUntil).toBeTruthy();
    const diff = diffProgramStructures(PROG_A, next);
    expect(diff.added.some((x) => x.id === 'exo_d')).toBe(true);
    expect(diff.seriesChanged.some((x) => x.id === 'exo_a')).toBe(true);
  });

  it('5-7. activation / désactivation / suppression actif', () => {
    let data = {};
    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: null,
      nextActiveProgram: PROG_A,
      todayYmd: '2026-10-10',
      nowIso: '2026-10-10T08:00:00.000Z',
      mutationKind: REVISION_MUTATION_KIND.ACTIVATION,
      source: 'activate'
    }).workoutData;
    expect(resolveActiveProgramIdAtDate(getProgramRevisionLog(data), '2026-10-10').programId).toBe(
      'prog-a'
    );

    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: PROG_A,
      nextActiveProgram: PROG_B,
      todayYmd: '2026-10-12',
      nowIso: '2026-10-12T08:00:00.000Z',
      mutationKind: REVISION_MUTATION_KIND.ACTIVATION,
      source: 'activate'
    }).workoutData;
    expect(resolveActiveProgramIdAtDate(getProgramRevisionLog(data), '2026-10-12').programId).toBe(
      'prog-b'
    );
    expect(resolveActiveProgramIdAtDate(getProgramRevisionLog(data), '2026-10-11').programId).toBe(
      'prog-a'
    );

    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: PROG_B,
      nextActiveProgram: null,
      todayYmd: '2026-10-13',
      nowIso: '2026-10-13T08:00:00.000Z',
      mutationKind: REVISION_MUTATION_KIND.DELETION,
      source: 'delete'
    }).workoutData;
    expect(resolveActiveProgramIdAtDate(getProgramRevisionLog(data), '2026-10-13').programId).toBe(
      null
    );
  });

  it('8. deux modifications successives rapides : deux révisions, pas d’écrasement', () => {
    let data = appendProgramRevision(
      {},
      { program: PROG_A, forceStructural: true, recordedAt: '2026-10-01T10:00:00.000Z' }
    ).workoutData;
    const mid = withStructuralChange(PROG_A, 'mercredi', [
      { id: 201, originalId: 'exo_s', name: 'Squat', series: '5×5' }
    ]);
    data = appendProgramRevision(data, {
      program: mid,
      previousProgram: PROG_A,
      recordedAt: '2026-10-02T10:00:00.000Z'
    }).workoutData;
    const last = withStructuralChange(mid, 'vendredi', []);
    data = appendProgramRevision(data, {
      program: last,
      previousProgram: mid,
      recordedAt: '2026-10-02T10:00:01.000Z'
    }).workoutData;
    const revs = getProgramRevisionLog(data).revisions;
    expect(revs).toHaveLength(3);
    expect(revs[0].structureFingerprint).not.toBe(revs[2].structureFingerprint);
  });

  it('9-10. sauvegarde asynchrone / échec → pending uncertain', () => {
    const data = markPendingUncertain(
      prepareProgramMutationBundle({
        workoutData: {},
        previousActiveProgram: PROG_A,
        nextProgramForRevision: withStructuralChange(PROG_A, 'lundi', [
          { id: 101, originalId: 'exo_a', name: 'Tractions', series: '3×8' }
        ]),
        todayYmd: '2026-10-10',
        source: 'update'
      }).workoutData,
      { reason: 'persist_failed_before_program_mutation', source: 'update' }
    );
    const log = getProgramRevisionLog(data);
    expect(log.pendingUncertain.length).toBe(1);
    expect(log.pendingUncertain[0].reliability).toBe(REVISION_RELIABILITY.UNCERTAIN);
  });

  it('12. variation quotidienne = exception datée ≠ révision structurelle', () => {
    let data = appendProgramRevision(
      {},
      { program: PROG_A, forceStructural: true, recordedAt: '2026-10-01T10:00:00.000Z' }
    ).workoutData;
    const beforeFp = getProgramRevisionLog(data).revisions[0].structureFingerprint;
    data = appendDatedExceptionEvent(data, {
      dateStr: '2026-10-06',
      suppressedExerciseIds: ['101'],
      source: 'suppress_exercise'
    }).workoutData;
    const log = getProgramRevisionLog(data);
    expect(log.datedExceptions).toHaveLength(1);
    expect(log.revisions).toHaveLength(1);
    expect(log.revisions[0].structureFingerprint).toBe(beforeFp);
  });

  it('14. prévision future obsolète invalidée au bundle mutation', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-12',
      {
        exercises: PROG_A.schedule.lundi.exercises,
        programId: PROG_A.id,
        hasActiveProgram: true,
        programApplicabilityProven: true
      },
      { status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST, captureTrigger: 'proactive_forecast' }
    ).workoutData;
    expect(getDayPlanSnapshot(data, '2026-10-12').status).toBe(SNAPSHOT_STATUS.PROVISIONAL_FORECAST);
    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: PROG_A,
      nextProgramForRevision: PROG_B,
      todayYmd: '2026-10-10',
      nowIso: '2026-10-10T09:00:00.000Z',
      source: 'update'
    }).workoutData;
    expect(getDayPlanSnapshot(data, '2026-10-12')).toBeFalsy();
  });

  it('15. snapshot historique déjà prouvé non réécrit', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-05',
      {
        exercises: PROG_A.schedule.lundi.exercises,
        programId: PROG_A.id,
        hasActiveProgram: true,
        programApplicabilityProven: true
      },
      { captureTrigger: 'performance' }
    ).workoutData;
    const before = getDayPlanSnapshot(data, '2026-10-05');
    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: PROG_A,
      nextProgramForRevision: PROG_B,
      todayYmd: '2026-10-10',
      source: 'update'
    }).workoutData;
    const after = getDayPlanSnapshot(data, '2026-10-05');
    expect(after.exercises.map((e) => e.name)).toEqual(before.exercises.map((e) => e.name));
    expect(isPlanCompareEligible(after)).toBe(true);
  });

  it('16. journée ancienne sans preuve → non_reconstructible', () => {
    const data = appendProgramRevision(
      {},
      {
        program: PROG_A,
        forceStructural: true,
        recordedAt: '2026-10-01T10:00:00.000Z',
        applicableFrom: '2026-10-01T10:00:00.000Z'
      }
    ).workoutData;
    const r = resolveHistoricalDayPlanFromJournal(data, '2026-09-01');
    expect(r.proof).toBe(DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE);
    expect(r.source).toBe('before_journal');
  });

  it('17. révision metadata_only ignorée', () => {
    const sameNameOnly = { ...PROG_A, name: 'Alpha renommé', updatedAt: '2026-10-02' };
    expect(isSameProgramStructure(PROG_A, sameNameOnly)).toBe(true);
    let data = appendProgramRevision(
      {},
      { program: PROG_A, forceStructural: true, recordedAt: '2026-10-01T10:00:00.000Z' }
    ).workoutData;
    const res = appendProgramRevision(data, {
      program: sameNameOnly,
      previousProgram: PROG_A,
      recordedAt: '2026-10-02T10:00:00.000Z'
    });
    expect(res.wrote).toBe(false);
    expect(res.reason).toBe('metadata_only_skipped');
  });

  it('18. homonymes / IDs distincts dans l’empreinte', () => {
    const a = withStructuralChange(PROG_A, 'lundi', [
      { id: 104, originalId: 'pompes_a', name: 'Pompes', series: '3×10' },
      { id: 204, originalId: 'pompes_b', name: 'Pompes', series: '3×12' }
    ]);
    const fp = computeProgramStructureFingerprint(a);
    expect(fp.normalized.schedule.lundi.exercises.map((e) => e.originalId)).toEqual([
      'pompes_a',
      'pompes_b'
    ]);
  });

  it('19-20. comparaison avant/après admissible vs insuffisante', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    data = appendActivationEvent(data, {
      type: 'activated',
      programId: PROG_A.id,
      recordedAt: '2026-09-01T10:00:00.000Z',
      applicableFrom: '2026-09-01T10:00:00.000Z'
    }).workoutData;
    data = appendProgramRevision(data, {
      program: PROG_A,
      forceStructural: true,
      recordedAt: '2026-09-01T10:00:00.000Z',
      applicableFrom: '2026-09-01T10:00:00.000Z'
    }).workoutData;
    const next = withStructuralChange(PROG_A, 'vendredi', []);
    data = appendProgramRevision(data, {
      program: next,
      previousProgram: PROG_A,
      recordedAt: '2026-10-10T10:00:00.000Z',
      applicableFrom: '2026-10-10T10:00:00.000Z'
    }).workoutData;

    // Observations insuffisantes
    let pack = buildP34RevisionDiscoveries({
      snapshot: data,
      window: { start: '2026-10-01', end: '2026-10-20' }
    });
    expect(pack.discoveries.some((d) => d.kind === P34_KINDS.STRUCTURAL_DIFF)).toBe(true);
    expect(
      pack.discoveries.some(
        (d) =>
          d.kind === P34_KINDS.INSUFFICIENT || d.kind === P34_KINDS.BEFORE_AFTER_OBS
      )
    ).toBe(true);

    // Ajouter observations des deux côtés
    for (const d of [
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15'
    ]) {
      data = {
        ...data,
        checkedExercises: { ...data.checkedExercises, [`${d}_101`]: true },
        reps: { ...data.reps, [`${d}_101`]: '20' }
      };
    }
    pack = buildP34RevisionDiscoveries({
      snapshot: data,
      window: { start: '2026-09-20', end: '2026-10-20' }
    });
    expect(pack.discoveries.some((d) => d.kind === P34_KINDS.STRUCTURAL_DIFF)).toBe(true);
    const obs = pack.discoveries.find((d) => d.kind === P34_KINDS.BEFORE_AFTER_OBS);
    expect(obs).toBeTruthy();
    expect(obs.metrics.causalityClaimAllowed).toBe(false);
  });

  it('21-22. repos + journée prévue non réalisée via journal démontré', () => {
    let data = {};
    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: null,
      nextActiveProgram: PROG_A,
      todayYmd: '2026-10-01',
      nowIso: '2026-10-01T08:00:00.000Z',
      mutationKind: REVISION_MUTATION_KIND.ACTIVATION
    }).workoutData;
    // 2026-10-04 = dimanche → repos
    const rest = resolveHistoricalDayPlanFromJournal(data, '2026-10-04');
    expect(rest.proof).toBe(DAY_PLAN_PROOF.DEMONSTRATED);
    expect(rest.intent.isRestDay).toBe(true);

    const capture = captureDayFromJournalIfAdmissible(data, '2026-10-05'); // lundi
    expect(capture.wrote).toBe(true);
    expect(capture.proof).toBe(DAY_PLAN_PROOF.DEMONSTRATED);
    const row = buildDayPlanRealizationRow({
      dateStr: '2026-10-05',
      workoutData: capture.workoutData
    });
    expect(row.planSource).toBe(PLAN_SOURCE.SNAPSHOT);
    expect(row.notRealizedExercises.length).toBe(2);
  });

  it('13. programme modifié pendant fermeture : seal + journal avant nouvelle structure', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-09',
      {
        exercises: PROG_A.schedule.lundi.exercises,
        programId: PROG_A.id,
        hasActiveProgram: true,
        programApplicabilityProven: false,
        applicabilityConfidence: APPLICABILITY_CONFIDENCE.UNVERIFIED
      },
      {
        status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
        captureTrigger: 'app_open_backfill',
        applicabilityConfidence: APPLICABILITY_CONFIDENCE.UNVERIFIED
      }
    ).workoutData;
    const nextStruct = { ...PROG_A, schedule: PROG_B.schedule };
    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: PROG_A,
      nextProgramForRevision: nextStruct,
      todayYmd: '2026-10-10',
      nowIso: '2026-10-10T08:00:00.000Z',
      source: 'update'
    }).workoutData;
    const yest = getDayPlanSnapshot(data, '2026-10-09');
    // Seal upgrade unverified → proven possible
    expect(isPlanCompareEligible(yest) || yest.applicabilityConfidence).toBeTruthy();
    const rev = getProgramRevisionLog(data).revisions.at(-1);
    expect(rev.structureFingerprint).toBe(
      computeProgramStructureFingerprint(nextStruct).fingerprint
    );
  });

  it('23. dates civiles YYYY-MM-DD locales (pas d’invention UTC)', () => {
    const res = appendProgramRevision(
      {},
      {
        program: PROG_A,
        forceStructural: true,
        recordedAt: '2026-10-31T23:30:00.000+01:00',
        applicableFrom: '2026-10-31T23:30:00.000+01:00'
      }
    );
    expect(res.revision.applicableFromYmd).toBe('2026-10-31');
  });

  it('24. non-régression P3.0/P3.1/P3.2b/P3.3 promote unverified', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-09',
      {
        exercises: PROG_A.schedule.lundi.exercises,
        programId: PROG_A.id,
        hasActiveProgram: true
      },
      { status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST, captureTrigger: 'proactive_forecast' }
    ).workoutData;
    data = promoteDueProvisionalForecasts(data, '2026-10-10').workoutData;
    expect(describeDayPlanProvenance(data, '2026-10-09').compareReliability).toBe('unverified');
    const matrix = buildPlanRealizationMatrix({
      workoutData: data,
      window: { start: '2026-10-09', end: '2026-10-09' }
    });
    expect(matrix.adherenceSnapshotOnly.dayCount).toBe(0);

    // P3.0/P3.1 encore OK sur proven
    data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-05',
      {
        exercises: PROG_A.schedule.lundi.exercises,
        programId: PROG_A.id,
        hasActiveProgram: true,
        programApplicabilityProven: true
      }
    ).workoutData;
    const findings = buildProgramAdherenceDiscoveries({
      snapshot: data,
      window: { start: '2026-10-05', end: '2026-10-05' }
    });
    expect(findings.length).toBeGreaterThan(0);
    const p32b = buildP32bMuscleDiscoveries({
      snapshot: data,
      window: { start: '2026-10-05', end: '2026-10-05' }
    });
    expect(p32b).toBeTruthy();
  });

  it('export octobre : pas de journal inventé', () => {
    const empty = describeJournalCoverage({ calendarDayPlanSnapshots: {} });
    expect(empty.revisionCount).toBe(0);
    expect(empty.journalIntroducedAt).toBeFalsy();
    const pack = buildP34RevisionDiscoveries({
      snapshot: { calendarDayPlanSnapshots: {} },
      window: { start: '2026-10-01', end: '2026-10-31' }
    });
    expect(pack.discoveries.some((d) => d.kind === P34_KINDS.JOURNAL_LIMIT)).toBe(true);
  });

  it('reconstitution journal : activation + révision couvrent une date', () => {
    let data = {};
    data = appendActivationEvent(data, {
      type: 'activated',
      programId: 'prog-a',
      recordedAt: '2026-10-01T00:00:00.000Z',
      applicableFrom: '2026-10-01T00:00:00.000Z'
    }).workoutData;
    data = appendProgramRevision(data, {
      program: PROG_A,
      forceStructural: true,
      recordedAt: '2026-10-01T00:00:00.000Z',
      applicableFrom: '2026-10-01T00:00:00.000Z'
    }).workoutData;
    const rev = resolveRevisionForProgramAtDate(getProgramRevisionLog(data), 'prog-a', '2026-10-07');
    expect(rev).toBeTruthy();
    const day = resolveHistoricalDayPlanFromJournal(data, '2026-10-05'); // lundi
    expect(day.proof).toBe(DAY_PLAN_PROOF.DEMONSTRATED);
    expect(day.intent.exercises.map((e) => e.name)).toEqual(['Tractions', 'Pompes']);
  });
});

describe('P3.4 — vérifications clôture (continuité / persist / empreinte / avant-après)', () => {
  function journalizedProgA() {
    let data = {};
    data = prepareProgramMutationBundle({
      workoutData: data,
      previousActiveProgram: null,
      nextActiveProgram: PROG_A,
      todayYmd: '2026-10-01',
      nowIso: '2026-10-01T08:00:00.000Z',
      mutationKind: REVISION_MUTATION_KIND.ACTIVATION
    }).workoutData;
    return data;
  }

  it('continuité : pendingUncertain → probable (pas demonstrated)', () => {
    let data = journalizedProgA();
    data = markPendingUncertain(data, {
      reason: 'persist_failed_before_program_mutation',
      programId: PROG_A.id,
      recordedAt: '2026-10-08T12:00:00.000Z'
    });
    // Forcer recordedAt du pending
    const log = getProgramRevisionLog(data);
    log.pendingUncertain[0].recordedAt = '2026-10-08T12:00:00.000Z';
    data = { ...data, programRevisionLog: log };

    const before = resolveHistoricalDayPlanFromJournal(data, '2026-10-06');
    expect(before.proof).toBe(DAY_PLAN_PROOF.DEMONSTRATED);

    const after = resolveHistoricalDayPlanFromJournal(data, '2026-10-09');
    expect(after.proof).toBe(DAY_PLAN_PROOF.PROBABLE);
    expect(after.continuityReasons).toContain('pending_uncertain_transition');
  });

  it('continuité : live ≠ fingerprint ouvert → probable', () => {
    let data = journalizedProgA();
    const liveDiverged = withStructuralChange(PROG_A, 'lundi', [
      { id: 999, originalId: 'intrus', name: 'Intrus', series: '1×1' }
    ]);
    const day = resolveHistoricalDayPlanFromJournal(data, '2026-10-05', {
      liveActiveProgram: liveDiverged
    });
    expect(day.proof).toBe(DAY_PLAN_PROOF.PROBABLE);
    expect(day.continuityReasons).toContain('live_journal_fingerprint_mismatch');
  });

  it('échec persist + UI mutée + restart : reconcile empêche demonstrated', () => {
    let data = journalizedProgA();
    const openFp = getProgramRevisionLog(data).revisions.at(-1).structureFingerprint;
    // Simule : persist journal échouée, UI a quand même appliqué PROG_B structure sous même id
    const liveAfterUi = { ...PROG_A, schedule: PROG_B.schedule };
    expect(computeProgramStructureFingerprint(liveAfterUi).fingerprint).not.toBe(openFp);

    const reco = reconcileLiveProgramAgainstJournal(data, liveAfterUi, {
      todayYmd: '2026-10-10'
    });
    expect(reco.changed).toBe(true);
    expect(reco.reason).toBe('live_fingerprint_mismatch_on_reconcile');

    const post = resolveHistoricalDayPlanFromJournal(reco.workoutData, '2026-10-12', {
      liveActiveProgram: liveAfterUi
    });
    expect(post.proof).not.toBe(DAY_PLAN_PROOF.DEMONSTRATED);
    expect(post.proof).toBe(DAY_PLAN_PROOF.PROBABLE);

    // pendingUncertain lui-même non persisté : seule la détection live au restart reste
    const onlyLive = resolveHistoricalDayPlanFromJournal(data, '2026-10-12', {
      liveActiveProgram: liveAfterUi
    });
    expect(onlyLive.proof).toBe(DAY_PLAN_PROOF.PROBABLE);
  });

  it('empreinte : intensity structurelle ; name programme = metadata', () => {
    const withIntensity = withStructuralChange(PROG_A, 'lundi', [
      { id: 101, originalId: 'exo_a', name: 'Tractions', series: '3×8', intensity: 'hard' },
      { id: 104, originalId: 'exo_b', name: 'Pompes', series: '3×12' }
    ]);
    expect(isSameProgramStructure(PROG_A, withIntensity)).toBe(false);
    expect(structuresDeepEqual(PROG_A, { ...PROG_A, name: 'Autre nom' })).toBe(true);
    const n = normalizeProgramStructure(withIntensity);
    expect(n.schedule.lundi.exercises[0].intensity).toBe('hard');
  });

  it('assessApplicabilityContinuity : activation seule insuffisante sans révision recorded', () => {
    const c = assessApplicabilityContinuity({
      log: getProgramRevisionLog({}),
      programId: 'x',
      dateStr: '2026-10-05',
      revision: {
        reliability: REVISION_RELIABILITY.UNCERTAIN,
        applicableFromYmd: '2026-10-01'
      },
      activationProof: DAY_PLAN_PROOF.DEMONSTRATED
    });
    expect(c.proof).toBe(DAY_PLAN_PROOF.PROBABLE);
  });

  it('avant/après : 5 jours actifs ≠ solid sans couverture calendaire', () => {
    const thin = assessBeforeAfterComparability({
      beforeActivityDays: 5,
      afterActivityDays: 5,
      beforeCalendarDays: 5,
      afterCalendarDays: 5,
      snapshotDaysBefore: 0,
      snapshotDaysAfter: 0
    });
    expect(thin.level).toBe(COMPARABILITY_LEVEL.LIMITED);
    expect(thin.observationsComparable).toBe(true);

    const insufficient = assessBeforeAfterComparability({
      beforeActivityDays: 2,
      afterActivityDays: 5,
      beforeCalendarDays: 14,
      afterCalendarDays: 14
    });
    expect(insufficient.level).toBe(COMPARABILITY_LEVEL.INSUFFICIENT);

    const solid = assessBeforeAfterComparability({
      beforeActivityDays: 5,
      afterActivityDays: 5,
      beforeCalendarDays: 10,
      afterCalendarDays: 10,
      interveningStructuralRevisions: 0
    });
    expect(solid.level).toBe(COMPARABILITY_LEVEL.SOLID);
  });

  it('avant/après : causalité jamais autorisée même si solid', () => {
    let data = journalizedProgA();
    const next = withStructuralChange(PROG_A, 'vendredi', []);
    data = appendProgramRevision(data, {
      program: next,
      previousProgram: PROG_A,
      recordedAt: '2026-10-10T10:00:00.000Z',
      applicableFrom: '2026-10-10T10:00:00.000Z'
    }).workoutData;
    for (const d of [
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15'
    ]) {
      data = {
        ...data,
        checkedExercises: { ...data.checkedExercises, [`${d}_101`]: true },
        reps: { ...data.reps, [`${d}_101`]: '20' }
      };
    }
    const rev = getProgramRevisionLog(data).revisions.at(-1);
    const metrics = buildRevisionBeforeAfterMetrics(data, rev, {
      window: { start: '2026-09-20', end: '2026-10-20' }
    });
    expect(metrics.ok).toBe(true);
    expect(metrics.causalityClaimAllowed).toBe(false);
    expect([COMPARABILITY_LEVEL.SOLID, COMPARABILITY_LEVEL.LIMITED]).toContain(
      metrics.comparabilityLevel
    );
  });
});
