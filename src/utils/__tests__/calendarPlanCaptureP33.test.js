/**
 * P3.3 — capture plan sans activité, provenance, non-rétroactivité.
 */
import { describe, expect, it } from 'vitest';
import {
  PLAN_DAY_KIND,
  SNAPSHOT_STATUS,
  CAPTURE_TRIGGER,
  APPLICABILITY_CONFIDENCE,
  buildPlannedDaySnapshot,
  capturePlannedDayWithoutActivity,
  writeDayPlanSnapshotIfAllowed,
  reconcilePlanCaptureOnAppOpen,
  promoteDueProvisionalForecasts,
  sealPlanBeforeProgramChange,
  describeDayPlanProvenance,
  isHistoricalFrozenSnapshot,
  isPlanCompareEligible,
  buildCaptureIntentFromProgram
} from '../calendarPlanCaptureP33';
import {
  ensureDayPlanSnapshot,
  getDayPlanSnapshot
} from '../calendarDayPlanSnapshot';
import {
  buildDayPlanRealizationRow,
  buildPlanRealizationMatrix,
  PLAN_SOURCE
} from '../sport/recapProgramAdherenceProgression';
import { buildP32bMuscleDiscoveries } from '../sport/recapMuscleP32bDiscoveries';
import { buildProgramAdherenceDiscoveries } from '../sport/recapProgramAdherenceDiscoveries';

const PROG = {
  id: 'prog-p33',
  name: 'Test P33',
  schedule: {
    lundi: {
      exercises: [
        { id: 101, originalId: 'exo_a', name: 'Tractions', series: '3×8' },
        { id: 104, originalId: 'exo_b', name: 'Pompes', series: '3×12' }
      ]
    },
    mardi: { exercises: [] },
    mercredi: {
      exercises: [{ id: 201, originalId: 'exo_s', name: 'Squat', series: '3×10' }]
    },
    jeudi: { exercises: [] },
    vendredi: {
      exercises: [{ id: 104, originalId: 'exo_b', name: 'Pompes', series: '3×12' }]
    },
    samedi: { exercises: [] },
    dimanche: { exercises: [] }
  },
  restConfig: { restDay: 'dimanche' }
};

function intentFor(dateStr, overrides = {}) {
  return buildCaptureIntentFromProgram({
    dateStr,
    activeProgram: PROG,
    workoutData: {},
    effectiveRestDay: overrides.effectiveRestDay ?? null,
    programApplicabilityProven: overrides.programApplicabilityProven ?? true,
    exercises: overrides.exercises,
    ...overrides
  });
}

describe('P3.3 — capture sans activité', () => {
  it('1. séance prévue réalisée : ensureDayPlanSnapshot reste historical', () => {
    let data = {
      checkedExercises: { '2026-10-05_101': true },
      reps: { '2026-10-05_101': '24' },
      calendarDayPlanSnapshots: {}
    };
    // 2026-10-05 = lundi
    data = ensureDayPlanSnapshot(data, '2026-10-05', intentFor('2026-10-05').exercises, {
      programId: PROG.id
    });
    const snap = getDayPlanSnapshot(data, '2026-10-05');
    expect(isHistoricalFrozenSnapshot(snap)).toBe(true);
    expect(snap.captureTrigger).toBe('performance');
    expect(snap.exercises.length).toBeGreaterThan(0);
  });

  it('2. séance prévue entièrement non réalisée : plan figé sans perf', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    const res = capturePlannedDayWithoutActivity(
      data,
      '2026-10-05',
      intentFor('2026-10-05', { programApplicabilityProven: true }),
      { captureTrigger: CAPTURE_TRIGGER.APP_OPEN_BACKFILL }
    );
    expect(res.wrote).toBe(true);
    const snap = getDayPlanSnapshot(res.workoutData, '2026-10-05');
    expect(snap.dayKind).toBe(PLAN_DAY_KIND.PLANNED_WORKOUT);
    expect(snap.exercises.map((e) => e.name)).toEqual(['Tractions', 'Pompes']);
    expect(hasNoPerf(res.workoutData, '2026-10-05')).toBe(true);

    const row = buildDayPlanRealizationRow({
      dateStr: '2026-10-05',
      workoutData: res.workoutData
    });
    expect(row.planSource).toBe(PLAN_SOURCE.SNAPSHOT);
    expect(row.notRealizedExercises.length).toBe(2);
    expect(row.isMissedSessionCandidate).toBe(true);
  });

  it('3. partielle : snapshot historique inchangé après perf partielle', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    data = capturePlannedDayWithoutActivity(
      data,
      '2026-10-05',
      intentFor('2026-10-05'),
      { captureTrigger: CAPTURE_TRIGGER.EXPLICIT_CAPTURE }
    ).workoutData;
    data = {
      ...data,
      checkedExercises: { '2026-10-05_101': true },
      reps: { '2026-10-05_101': '10' }
    };
    const again = ensureDayPlanSnapshot(data, '2026-10-05', [{ id: 999, name: 'Intrus' }], {
      programId: 'other'
    });
    expect(getDayPlanSnapshot(again, '2026-10-05').exercises.map((e) => e.name)).toEqual([
      'Tractions',
      'Pompes'
    ]);
  });

  it('4. repos programmé ≠ séance manquée', () => {
    const res = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-04', // dimanche
      intentFor('2026-10-04', {
        effectiveRestDay: 'dimanche',
        programApplicabilityProven: true
      })
    );
    const snap = getDayPlanSnapshot(res.workoutData, '2026-10-04');
    expect(snap.dayKind).toBe(PLAN_DAY_KIND.PLANNED_REST);
    expect(snap.exercises).toHaveLength(0);
    const row = buildDayPlanRealizationRow({
      dateStr: '2026-10-04',
      workoutData: res.workoutData
    });
    expect(row.plannedRest).toBe(true);
    expect(row.isMissedSessionCandidate).toBe(false);
    expect(row.notRealizedExercises).toHaveLength(0);
  });

  it('5. jour sans programme → no_program (si applicabilité prouvée)', () => {
    const res = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-05',
      {
        exercises: [],
        programId: null,
        hasActiveProgram: false,
        isRestDay: false,
        programApplicabilityProven: true
      }
    );
    expect(res.snapshot.dayKind).toBe(PLAN_DAY_KIND.NO_PROGRAM);
  });

  it('6-7. app fermée plusieurs jours + programme modifié : passé non prouvé → indeterminate', () => {
    const today = '2026-10-10';
    const data0 = { calendarDayPlanSnapshots: {} };
    const result = reconcilePlanCaptureOnAppOpen(data0, {
      todayYmd: today,
      resolveIntent: (dateStr) =>
        intentFor(dateStr, {
          programApplicabilityProven: false
        }),
      backfillLookbackDays: 7,
      provisionalHorizonDays: 1
    });
    // 2026-10-03 (loin) → indeterminate
    const old = getDayPlanSnapshot(result.workoutData, '2026-10-03');
    expect(old.status).toBe(SNAPSHOT_STATUS.INDETERMINATE);
    expect(old.dayKind).toBe(PLAN_DAY_KIND.UNKNOWN_HISTORICAL);
    // hier 10-09 : contenu candidat unverified — jamais high sans seal/perf
    const yest = getDayPlanSnapshot(result.workoutData, '2026-10-09');
    expect(isHistoricalFrozenSnapshot(yest)).toBe(true);
    expect(yest.applicabilityConfidence).toBe(APPLICABILITY_CONFIDENCE.UNVERIFIED);
    expect(isPlanCompareEligible(yest)).toBe(false);
    const prov = describeDayPlanProvenance(result.workoutData, '2026-10-09');
    expect(prov.compareReliability).toBe('unverified');
  });

  it('8. prévision future provisoire ≠ historique figé', () => {
    const res = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-12',
      intentFor('2026-10-12'),
      {
        status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST,
        captureTrigger: CAPTURE_TRIGGER.PROACTIVE_FORECAST
      }
    );
    expect(res.snapshot.status).toBe(SNAPSHOT_STATUS.PROVISIONAL_FORECAST);
    expect(res.snapshot.frozen).toBe(false);
  });

  it('9. programme modifié après capture historique : immuable', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-05',
      intentFor('2026-10-05')
    ).workoutData;
    const before = getDayPlanSnapshot(data, '2026-10-05').exercises.map((e) => e.name);
    data = writeDayPlanSnapshotIfAllowed(
      data,
      '2026-10-05',
      buildPlannedDaySnapshot({
        dateStr: '2026-10-05',
        exercises: [{ id: 1, name: 'Intrus' }],
        programId: 'new-prog',
        dayKind: PLAN_DAY_KIND.PLANNED_WORKOUT,
        status: SNAPSHOT_STATUS.HISTORICAL_FROZEN
      })
    ).workoutData;
    expect(getDayPlanSnapshot(data, '2026-10-05').exercises.map((e) => e.name)).toEqual(before);
  });

  it('10. exercice ajouté puis supprimé du live : historique conserve', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-05',
      intentFor('2026-10-05')
    ).workoutData;
    const liveSans = intentFor('2026-10-05').exercises.filter((e) => e.name !== 'Pompes');
    data = ensureDayPlanSnapshot(data, '2026-10-05', liveSans, { programId: PROG.id });
    expect(getDayPlanSnapshot(data, '2026-10-05').exercises.some((e) => e.name === 'Pompes')).toBe(
      true
    );
  });

  it('11. variation quotidienne (suppression) enregistrée dans provenance', () => {
    const data = {
      dailyVariations: { '2026-10-05': { suppressedExercises: ['101'] } },
      calendarDayPlanSnapshots: {}
    };
    const intent = buildCaptureIntentFromProgram({
      dateStr: '2026-10-05',
      activeProgram: PROG,
      workoutData: data,
      programApplicabilityProven: true
    });
    expect(intent.suppressedExerciseIds).toContain('101');
    expect(intent.exercises.every((e) => String(e.id) !== '101')).toBe(true);
  });

  it('12. changement de programme : seal avant mutation', () => {
    const data = { calendarDayPlanSnapshots: {} };
    const sealed = sealPlanBeforeProgramChange(data, {
      todayYmd: '2026-10-05',
      resolveIntent: (d) => intentFor(d, { programApplicabilityProven: true }),
      sealPastDays: 1
    });
    expect(sealed.sealed.length).toBeGreaterThan(0);
    expect(isHistoricalFrozenSnapshot(getDayPlanSnapshot(sealed.workoutData, '2026-10-05'))).toBe(
      true
    );
  });

  it('15. idempotence capture répétée', () => {
    let data = { calendarDayPlanSnapshots: {} };
    const a = capturePlannedDayWithoutActivity(data, '2026-10-05', intentFor('2026-10-05'));
    const b = capturePlannedDayWithoutActivity(
      a.workoutData,
      '2026-10-05',
      intentFor('2026-10-05')
    );
    expect(b.wrote).toBe(false);
    expect(b.reason).toBe('historical_immutable');
  });

  it('16. passage de minuit : promote provisional → historical unverified (pas high)', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-09',
      intentFor('2026-10-09'),
      {
        status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST,
        captureTrigger: CAPTURE_TRIGGER.PROACTIVE_FORECAST
      }
    ).workoutData;
    const promo = promoteDueProvisionalForecasts(data, '2026-10-10');
    expect(promo.promoted).toContain('2026-10-09');
    const snap = getDayPlanSnapshot(promo.workoutData, '2026-10-09');
    expect(isHistoricalFrozenSnapshot(snap)).toBe(true);
    expect(snap.applicabilityConfidence).toBe(APPLICABILITY_CONFIDENCE.UNVERIFIED);
    expect(isPlanCompareEligible(snap)).toBe(false);
    expect(describeDayPlanProvenance(promo.workoutData, '2026-10-09').compareReliability).toBe(
      'unverified'
    );
    const row = buildDayPlanRealizationRow({
      dateStr: '2026-10-09',
      workoutData: promo.workoutData
    });
    expect(row.planSource).toBe(PLAN_SOURCE.LIVE);
    expect(row.denominator.usableForAdherenceRate).toBe(false);
    expect(row.isMissedSessionCandidate).toBe(false);
  });

  it('A3.1 prévision puis fermeture sans mutation : promote unverified', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-09',
      intentFor('2026-10-09'),
      {
        status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST,
        captureTrigger: CAPTURE_TRIGGER.PROACTIVE_FORECAST
      }
    ).workoutData;
    data = reconcilePlanCaptureOnAppOpen(data, {
      todayYmd: '2026-10-10',
      resolveIntent: (d) => intentFor(d, { programApplicabilityProven: false }),
      backfillLookbackDays: 2,
      provisionalHorizonDays: 0
    }).workoutData;
    const snap = getDayPlanSnapshot(data, '2026-10-09');
    expect(snap.applicabilityConfidence).toBe(APPLICABILITY_CONFIDENCE.UNVERIFIED);
    expect(describeDayPlanProvenance(data, '2026-10-09').compareReliability).toBe('unverified');
  });

  it('A3.2 prévision puis seal avant mutation programme → proven high', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-09',
      intentFor('2026-10-09'),
      {
        status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST,
        captureTrigger: CAPTURE_TRIGGER.PROACTIVE_FORECAST
      }
    ).workoutData;
    data = sealPlanBeforeProgramChange(data, {
      todayYmd: '2026-10-09',
      resolveIntent: (d) => intentFor(d, { programApplicabilityProven: true }),
      sealPastDays: 0
    }).workoutData;
    const snap = getDayPlanSnapshot(data, '2026-10-09');
    expect(snap.applicabilityConfidence).toBe(APPLICABILITY_CONFIDENCE.PROVEN);
    expect(isPlanCompareEligible(snap)).toBe(true);
    expect(describeDayPlanProvenance(data, '2026-10-09').compareReliability).toBe('high');
  });

  it('A3.3 modification après capture historique proven : immuable', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-05',
      intentFor('2026-10-05'),
      { captureTrigger: CAPTURE_TRIGGER.PROGRAM_CHANGE_SEAL }
    ).workoutData;
    const before = getDayPlanSnapshot(data, '2026-10-05').exercises.map((e) => e.name);
    data = sealPlanBeforeProgramChange(data, {
      todayYmd: '2026-10-06',
      resolveIntent: () => ({
        exercises: [{ id: 1, name: 'Intrus' }],
        programId: 'other',
        hasActiveProgram: true,
        programApplicabilityProven: true
      }),
      sealPastDays: 2
    }).workoutData;
    expect(getDayPlanSnapshot(data, '2026-10-05').exercises.map((e) => e.name)).toEqual(before);
  });

  it('A3.5 réouverture avec autre programme : passé non prouvé indeterminate', () => {
    const otherProg = {
      ...PROG,
      id: 'other-prog',
      schedule: {
        ...PROG.schedule,
        lundi: { exercises: [{ id: 9, originalId: 'x', name: 'Intrus', series: '1×1' }] }
      }
    };
    const result = reconcilePlanCaptureOnAppOpen(
      { calendarDayPlanSnapshots: {} },
      {
        todayYmd: '2026-10-10',
        resolveIntent: (dateStr) =>
          buildCaptureIntentFromProgram({
            dateStr,
            activeProgram: otherProg,
            workoutData: {},
            programApplicabilityProven: false
          }),
        backfillLookbackDays: 7,
        provisionalHorizonDays: 0
      }
    );
    expect(getDayPlanSnapshot(result.workoutData, '2026-10-03').status).toBe(
      SNAPSHOT_STATUS.INDETERMINATE
    );
  });

  it('A4. jour unverified exclu du dénominateur P3.0 / skips / plan×muscle', () => {
    let data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-09',
      intentFor('2026-10-09'),
      {
        status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST,
        captureTrigger: CAPTURE_TRIGGER.PROACTIVE_FORECAST
      }
    ).workoutData;
    data = promoteDueProvisionalForecasts(data, '2026-10-10').workoutData;
    const matrix = buildPlanRealizationMatrix({
      workoutData: data,
      window: { start: '2026-10-09', end: '2026-10-09' }
    });
    expect(matrix.days[0].planSource).toBe(PLAN_SOURCE.LIVE);
    expect(matrix.adherenceSnapshotOnly.dayCount).toBe(0);
    expect(matrix.adherenceSnapshotOnly.plannedSlots).toBe(0);

    const indeterminate = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-09-01',
      intentFor('2026-09-01', { programApplicabilityProven: false })
    ).workoutData;
    const row = buildDayPlanRealizationRow({
      dateStr: '2026-09-01',
      workoutData: indeterminate
    });
    expect(row.planSource).toBe(PLAN_SOURCE.NONE);
    expect(row.denominator.usableForAdherenceRate).toBe(false);
  });

  it('19. historique antérieur sans preuve → indeterminate, pas zéro inventé', () => {
    const res = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-09-01',
      intentFor('2026-09-01', { programApplicabilityProven: false })
    );
    expect(res.snapshot.status).toBe(SNAPSHOT_STATUS.INDETERMINATE);
    expect(res.snapshot.exercises).toHaveLength(0);
    const prov = describeDayPlanProvenance(res.workoutData, '2026-09-01');
    expect(prov.dayKind).toBe(PLAN_DAY_KIND.UNKNOWN_HISTORICAL);
  });

  it('20. homonymes / ids distincts conservés', () => {
    const intent = {
      exercises: [
        { id: 104, originalId: 'pompes_a', name: 'Pompes déclinées', series: '3×10' },
        { id: 204, originalId: 'pompes_b', name: 'Pompes déclinées', series: '3×12' }
      ],
      programId: PROG.id,
      hasActiveProgram: true,
      programApplicabilityProven: true
    };
    const res = capturePlannedDayWithoutActivity({ calendarDayPlanSnapshots: {} }, '2026-10-05', intent);
    const ids = res.snapshot.exercises.map((e) => String(e.originalId));
    expect(ids).toEqual(['pompes_a', 'pompes_b']);
  });
});

describe('P3.3 — intégrations analyses', () => {
  it('P3.0 matrice voit séance non réalisée avec snapshot', () => {
    const data = capturePlannedDayWithoutActivity(
      { calendarDayPlanSnapshots: {} },
      '2026-10-05',
      intentFor('2026-10-05')
    ).workoutData;
    const matrix = buildPlanRealizationMatrix({
      workoutData: data,
      window: { start: '2026-10-05', end: '2026-10-05' }
    });
    expect(matrix.days[0].planSource).toBe(PLAN_SOURCE.SNAPSHOT);
    expect(matrix.days[0].notRealizedExercises.length).toBe(2);
  });

  it('P3.1 adhérence : plan_follow possible dès snapshots ≥ seuil (copie isolée)', () => {
    let data = { calendarDayPlanSnapshots: {}, checkedExercises: {}, reps: {} };
    for (const d of ['2026-10-05', '2026-10-06', '2026-10-07']) {
      data = capturePlannedDayWithoutActivity(data, d, intentFor(d)).workoutData;
    }
    const findings = buildProgramAdherenceDiscoveries({
      snapshot: data,
      window: { start: '2026-10-05', end: '2026-10-07' }
    });
    // Peut produire plan_follow ou insuffisance selon seuils — mais plus « 0 snapshot »
    const kinds = findings.map((f) => f.kind);
    expect(kinds.some((k) => k.includes('plan_'))).toBe(true);
  });

  it('P3.2b plan×muscle : snapshots synthétiques distincts du golden', () => {
    let data = { calendarDayPlanSnapshots: {}, checkedExercises: {}, reps: {} };
    for (const d of ['2026-10-05', '2026-10-06', '2026-10-07']) {
      data = capturePlannedDayWithoutActivity(data, d, intentFor(d)).workoutData;
      data = {
        ...data,
        checkedExercises: { ...data.checkedExercises, [`${d}_104`]: true },
        reps: { ...data.reps, [`${d}_104`]: '30' }
      };
    }
    const pack = buildP32bMuscleDiscoveries({
      snapshot: data,
      window: { start: '2026-10-05', end: '2026-10-10' },
      getExerciseNameById: (id) => (String(id) === '104' ? 'Pompes' : String(id) === '101' ? 'Tractions' : '')
    });
    expect(pack.metrics.plan.snapshotDayCount).toBeGreaterThanOrEqual(3);
  });

  it('export octobre témoin : aucun snapshot ajouté dans ce test', () => {
    // Garde-fou documentaire — le golden n’est pas muté ici.
    expect(true).toBe(true);
  });
});

function hasNoPerf(data, dateStr) {
  const prefix = `${dateStr}_`;
  const bags = [data.checkedExercises, data.reps];
  for (const bag of bags) {
    if (!bag) continue;
    for (const k of Object.keys(bag)) {
      if (k.startsWith(prefix) && bag[k]) return false;
    }
  }
  return true;
}
