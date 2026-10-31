import { describe, expect, it } from 'vitest';
import {
  buildP35DayRecord,
  buildP35DayTable,
  classicExclusiveRepsForDay,
  extractDayFeedback,
  extractDayGtg,
  P35_DAY_ABSENCE_KIND
} from '../recapP35DayModel.js';
import { computeP35WindowMetrics, P35_THRESHOLDS } from '../recapP35Metrics.js';
import { buildP35Discoveries, P35_KINDS } from '../recapP35Discoveries.js';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries.js';
import { contentClassForKind, CONTENT_CLASS } from '../recapDiscoveryContentClass.js';
import {
  buildDayPlanSnapshotFromExercises,
  withDayPlanSnapshot
} from '../../calendarDayPlanSnapshot.js';
import { DAY_PLAN_PROOF } from '../../programRevisionJournalP34.js';
import { APPLICABILITY_CONFIDENCE, SNAPSHOT_STATUS } from '../../calendarPlanCaptureP33.js';
import { syncGtgDayToWorkoutData } from '../../../services/endurance/gtgWorkoutSync.js';
import { P35_RIVAL_GROUPS } from '../recapP35Kinds.js';

const W7 = { start: '2026-10-01', end: '2026-10-07' };
const W30 = { start: '2026-10-01', end: '2026-10-30' };

const EX = [
  { id: 101, originalId: 'exo_a', name: 'Tractions', series: '4×5' },
  { id: 104, originalId: 'exo_p', name: 'Pompes', series: '4×15' }
];

function stampProven(data, dateStr, exercises, extra = {}) {
  const base = buildDayPlanSnapshotFromExercises({
    dateStr,
    exercises,
    programId: 'prog1',
    ...extra
  });
  return withDayPlanSnapshot(data, dateStr, {
    ...base,
    status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    dayKind: exercises.length ? 'planned_workout' : 'planned_rest',
    plannedRest: exercises.length === 0,
    frozen: true,
    applicabilityConfidence: APPLICABILITY_CONFIDENCE.PROVEN,
    planCompareEligible: true,
    provenanceVersion: 'p33.v1',
    captureTrigger: 'test'
  });
}

function stampUnverified(data, dateStr, exercises) {
  const base = buildDayPlanSnapshotFromExercises({
    dateStr,
    exercises,
    programId: 'prog1'
  });
  return withDayPlanSnapshot(data, dateStr, {
    ...base,
    status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    applicabilityConfidence: APPLICABILITY_CONFIDENCE.UNVERIFIED,
    planCompareEligible: false,
    frozen: true
  });
}

function seedClassic(data, dateStr, id, reps) {
  const next = {
    ...data,
    checkedExercises: { ...(data.checkedExercises || {}) },
    reps: { ...(data.reps || {}) }
  };
  next.checkedExercises[`${dateStr}_${id}`] = true;
  next.reps[`${dateStr}_${id}`] = String(reps);
  return next;
}

function gtgConfig(overrides = {}) {
  return {
    selectedIds: ['pullups'],
    scheduleFrom: '08:00',
    scheduleTo: '20:00',
    intervalHours: 4,
    manualMax: { pullups: 10 },
    ...overrides
  };
}

function withGtgDay(data, dateStr, { slots = { 0: { done: true } }, adHoc = null, syncReps = 0 } = {}) {
  const gtg = {
    config: gtgConfig(),
    days: {
      ...(data.enduranceData?.gtg?.days || {}),
      [dateStr]: {
        exercises: { pullups: { slots } },
        ...(adHoc ? { adHoc } : {})
      }
    },
    workoutSync: {
      ...(data.enduranceData?.gtg?.workoutSync || {}),
      ...(syncReps > 0 ? { [dateStr]: { pullups: syncReps } } : {})
    }
  };
  return {
    ...data,
    enduranceData: { ...(data.enduranceData || {}), gtg }
  };
}

describe('P3.5 — modèle journée', () => {
  it('distingue GTG seul / classique seul / les deux / ni l’un ni l’autre', () => {
    let data = { checkedExercises: {}, reps: {}, enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } } };
    data = withGtgDay(data, '2026-10-01', { syncReps: 5 });
    data = seedClassic(data, '2026-10-02', 104, 40);
    data = withGtgDay(data, '2026-10-03', { syncReps: 5 });
    data = seedClassic(data, '2026-10-03', 104, 30);
    // 10-03 : classic exclusive 30 (pas de sync sur 104), GTG sur pullups

    const gtgOnly = buildP35DayRecord(data, '2026-10-01');
    expect(gtgOnly.coexistence.gtgOnly).toBe(true);
    expect(gtgOnly.gtg.hasActivity).toBe(true);

    const classicOnly = buildP35DayRecord(data, '2026-10-02');
    expect(classicOnly.coexistence.classicOnly).toBe(true);

    const both = buildP35DayRecord(data, '2026-10-03');
    expect(both.coexistence.both).toBe(true);

    const empty = buildP35DayRecord(data, '2026-10-04');
    expect(empty.coexistence.neither).toBe(true);
    // Sans journal / snapshot : absence non interprétable (≠ « repos » ni « oubli »).
    expect(empty.absenceKind).toBe(P35_DAY_ABSENCE_KIND.NON_RECONSTRUCTIBLE_PLAN);
  });

  it('ne double-compte pas les reps GTG synchronisées dans le classique exclusif', () => {
    let data = {
      checkedExercises: {},
      reps: { '2026-10-01_101': '125' },
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    data = withGtgDay(data, '2026-10-01', {
      slots: { 0: { done: true }, 1: { done: true } },
      syncReps: 45
    });
    const gtg = extractDayGtg(data, '2026-10-01');
    const vol = classicExclusiveRepsForDay(data, '2026-10-01', gtg);
    expect(vol.classicTotalReps).toBe(125);
    expect(vol.gtgSyncedReps).toBe(45);
    expect(vol.classicExclusiveReps).toBe(80);
    expect(vol.gtgNativeReps).toBeGreaterThan(0);
    // total documenté mouvement = exclusive + native ≠ total + native
    const documented = vol.classicExclusiveReps + vol.gtgNativeReps;
    expect(documented).toBeLessThan(vol.classicTotalReps + vol.gtgNativeReps);
  });

  it('marque repos prévu démontré vs non reconstructible', () => {
    let data = { checkedExercises: {}, reps: {} };
    data = stampProven(data, '2026-10-05', []);
    const rest = buildP35DayRecord(data, '2026-10-05');
    expect(rest.plan.plannedRest).toBe(true);
    expect(rest.absenceKind).toBe(P35_DAY_ABSENCE_KIND.PLANNED_REST);
    expect(rest.plan.proof).toBe(DAY_PLAN_PROOF.DEMONSTRATED);

    const unknown = buildP35DayRecord({ checkedExercises: {}, reps: {} }, '2026-10-06');
    expect(unknown.plan.proof).toBe(DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE);
    expect(unknown.absenceKind).toBe(P35_DAY_ABSENCE_KIND.NON_RECONSTRUCTIBLE_PLAN);
  });

  it('passage ad hoc hors horaire compté séparément', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    data = withGtgDay(data, '2026-10-01', {
      slots: {},
      adHoc: [
        {
          id: 'ah1',
          time: '23:10',
          items: [{ exerciseId: 'pullups', reps: 4, done: true }]
        }
      ]
    });
    const gtg = extractDayGtg(data, '2026-10-01');
    expect(gtg.hasActivity).toBe(true);
    expect(gtg.adHocDoneMiniSets).toBeGreaterThanOrEqual(1);
    expect(gtg.exercises[0]?.adHocDoneSlots).toBeGreaterThanOrEqual(1);
  });

  it('feedback absent ≠ ressenti faible ; échelle 1–10 sans conversion RPE', () => {
    const empty = extractDayFeedback({}, '2026-10-01');
    expect(empty.present).toBe(false);
    expect(empty.difficulte).toBeNull();

    const data = {
      sessionFeedbacks: {
        '2026-10-01': { difficulte: 8, ressenti: 6, notes: 'lourds' }
      }
    };
    const fb = extractDayFeedback(data, '2026-10-01');
    expect(fb.filled).toBe(true);
    expect(fb.scale).toBe('session_feedback_1_10');
    expect(fb.difficulte).toBe(8);
    expect(fb.scaleNote).toMatch(/pas un RPE/i);
  });

  it('identité ambiguë → pas de mouvement combiné certain', () => {
    let data = {
      checkedExercises: {},
      reps: { '2026-10-01_999': '50' },
      enduranceData: {
        gtg: {
          config: {
            selectedIds: ['unknown_custom_xyz'],
            scheduleFrom: '08:00',
            scheduleTo: '12:00',
            intervalHours: 4,
            manualMax: { unknown_custom_xyz: 5 },
            customCatalog: { unknown_custom_xyz: { name: 'Mystère' } }
          },
          days: {
            '2026-10-01': {
              exercises: { unknown_custom_xyz: { slots: { 0: { done: true } } } }
            }
          },
          workoutSync: {}
        }
      }
    };
    data = seedClassic(data, '2026-10-01', 999, 50);
    const day = buildP35DayRecord(data, '2026-10-01');
    // canonical id peut exister mais confidence uncertain → metrics abstiennent
    const metrics = computeP35WindowMetrics(data, {
      start: '2026-10-01',
      end: '2026-10-07'
    });
    expect(metrics.movementShares.publishable).toBe(false);
    void day;
  });
});

describe('P3.5 — métriques familles A/B/C', () => {
  it('coexistence publishable sur fenêtre riche en GTG', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    const dates = [
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07'
    ];
    dates.forEach((d, i) => {
      if (i % 2 === 0) data = withGtgDay(data, d, { syncReps: 3 });
      if (i % 3 === 0) data = seedClassic(data, d, 104, 20);
    });
    const m = computeP35WindowMetrics(data, W7);
    expect(m.coverage.calendarDays).toBe(7);
    expect(m.coexistence.gtgOnlyDays + m.coexistence.bothDays).toBeGreaterThanOrEqual(
      P35_THRESHOLDS.MIN_GTG_DAYS
    );
    expect(m.coexistence.publishable).toBe(true);
  });

  it('part mouvement : exclusive + GTG, pas double sync', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    for (const d of ['2026-10-01', '2026-10-03', '2026-10-05']) {
      data = withGtgDay(data, d, {
        slots: { 0: { done: true }, 1: { done: true } },
        syncReps: 10
      });
      // exclusive classic sur 101 : total 90, sync 10 → exclusive 80
      data = seedClassic(data, d, 101, 90);
    }
    const m = computeP35WindowMetrics(data, W7);
    expect(m.movementShares.publishable).toBe(true);
    const top = m.movementShares.topCombined;
    expect(top.id).toBe('101');
    expect(top.classicExclusiveReps).toBe(240);
    expect(top.gtgReps).toBeGreaterThanOrEqual(P35_THRESHOLDS.MIN_MOVEMENT_REPS_EACH);
    expect(top.totalDocumentedReps).toBe(top.classicExclusiveReps + top.gtgReps);
  });

  it('écarts : snapshot unverified n’entre pas dans usable demonstrated', () => {
    let data = { checkedExercises: {}, reps: {} };
    data = stampUnverified(data, '2026-10-01', EX);
    data = stampUnverified(data, '2026-10-02', EX);
    data = seedClassic(data, '2026-10-01', 101, 20);
    const m = computeP35WindowMetrics(data, W7);
    expect(m.gaps.usableDemonstratedDays).toBe(0);
    expect(m.gaps.publishable).toBe(false);
  });

  it('écarts : typologie sur snapshots proven', () => {
    let data = { checkedExercises: {}, reps: {}, dailyVariations: {} };
    const days = [
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06'
    ];
    days.forEach((d) => {
      data = stampProven(data, d, EX);
    });
    // full
    data = seedClassic(data, '2026-10-01', 101, 20);
    data = seedClassic(data, '2026-10-01', 104, 20);
    // partial
    data = seedClassic(data, '2026-10-02', 101, 20);
    // missed — rien
    // supplemental day
    data = seedClassic(data, '2026-10-04', 101, 20);
    data = seedClassic(data, '2026-10-04', 104, 20);
    data = seedClassic(data, '2026-10-04', 999, 10);
    data = {
      ...data,
      dailyVariations: {
        ...(data.dailyVariations || {}),
        '2026-10-04': { additionalExercises: [999] },
        '2026-10-05': { suppressedExercises: [104] }
      }
    };
    data = seedClassic(data, '2026-10-05', 101, 20);

    const m = computeP35WindowMetrics(data, W7);
    expect(m.gaps.usableDemonstratedDays).toBeGreaterThanOrEqual(5);
    expect(m.gaps.fullyRealizedSessions).toBeGreaterThanOrEqual(1);
    expect(m.gaps.partialSessions + m.gaps.missedSessions).toBeGreaterThanOrEqual(1);
    expect(m.gaps.daysWithSupplemental).toBeGreaterThanOrEqual(1);
    expect(m.gaps.daysWithSuppressed).toBeGreaterThanOrEqual(1);
    expect(m.gaps.publishable).toBe(true);
  });

  it('aucun feedback → famille C abstient, pas de découverte RPE', () => {
    const m = computeP35WindowMetrics(
      { checkedExercises: {}, reps: {} },
      W30
    );
    expect(m.feedback.publishable).toBe(false);
    expect(m.feedback.inventRpeForbidden).toBe(true);
    const pack = buildP35Discoveries({
      snapshot: { checkedExercises: {}, reps: {} },
      window: W30
    });
    expect(pack.discoveries.some((d) => d.kind === P35_KINDS.FEEDBACK_DIFFICULTE)).toBe(
      false
    );
    expect(pack.discoveries.some((d) => /RPE/i.test(d.title) && !d.body.includes('pas un RPE'))).toBe(
      false
    );
  });

  it('feedbacks isolés / échantillon trop petit → pas de croisement', () => {
    const feedbacks = {};
    feedbacks['2026-10-01'] = { difficulte: 8 };
    feedbacks['2026-10-02'] = { difficulte: 7 };
    const pack = buildP35Discoveries({
      snapshot: { sessionFeedbacks: feedbacks, checkedExercises: {}, reps: {} },
      window: W7
    });
    expect(pack.discoveries.some((d) => d.kind === P35_KINDS.CROSS_GTG_DIFFICULTE)).toBe(
      false
    );
    expect(pack.metrics.feedback.publishable).toBe(false);
  });

  it('valeur difficulté invalide ignorée', () => {
    const fb = extractDayFeedback(
      { sessionFeedbacks: { '2026-10-01': { difficulte: 99, notes: 'x' } } },
      '2026-10-01'
    );
    // notes remplissent filled, mais difficulte hors 1–10 → null
    expect(fb.filled).toBe(true);
    expect(fb.difficulte).toBeNull();
  });
});

describe('P3.5 — découvertes + E0', () => {
  it('produit des candidats A quand la couverture le permet', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    for (let i = 1; i <= 14; i += 1) {
      const d = `2026-10-${String(i).padStart(2, '0')}`;
      if (i % 2 === 0) data = withGtgDay(data, d, { syncReps: 4 });
      if (i % 3 === 0) data = seedClassic(data, d, 104, 25);
      if (i % 2 === 0 && i % 3 === 0) {
        data = withGtgDay(data, d, { syncReps: 10 });
        data = seedClassic(data, d, 101, 80);
      }
    }
    const pack = buildP35Discoveries({ snapshot: data, window: W30 });
    expect(pack.discoveries.length).toBeGreaterThan(0);
    expect(
      pack.discoveries.some(
        (d) =>
          d.kind === P35_KINDS.GTG_COEXISTENCE ||
          d.kind === P35_KINDS.GTG_OUTSIDE_CLASSIC ||
          d.kind === P35_KINDS.GTG_MOVEMENT_SHARE
      )
    ).toBe(true);
    for (const d of pack.discoveries) {
      expect(d.body.length).toBeGreaterThanOrEqual(40);
      expect(d.body).not.toMatch(/dynamique de compensation/i);
      expect(d.body).not.toMatch(/stimulus traditionnel/i);
    }
  });

  it('opt-out includeP35Discoveries: false → pool sans P3.5', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    for (let i = 1; i <= 10; i += 1) {
      data = withGtgDay(data, `2026-10-${String(i).padStart(2, '0')}`, { syncReps: 3 });
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot: data,
      window: W30,
      includeP35Discoveries: false,
      includeP32bMuscleDiscoveries: false,
      includeP34RevisionDiscoveries: false
    });
    expect(bundle.p35.includedInPool).toBe(false);
    expect((bundle.all || []).every((d) => !String(d.kind).startsWith('disc_p35_'))).toBe(
      true
    );
  });

  it('sélection déterministe : même entrée → mêmes kinds P3.5 dans all', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    for (let i = 1; i <= 12; i += 1) {
      const d = `2026-10-${String(i).padStart(2, '0')}`;
      data = withGtgDay(data, d, { syncReps: 5 });
      if (i % 2 === 0) data = seedClassic(data, d, 104, 30);
    }
    const a = buildP35Discoveries({ snapshot: data, window: W30 });
    const b = buildP35Discoveries({ snapshot: data, window: W30 });
    expect(a.discoveries.map((d) => d.kind)).toEqual(b.discoveries.map((d) => d.kind));
    expect(a.metrics.coexistence.bothDays).toBe(b.metrics.coexistence.bothDays);
  });

  it('classes de contenu : feedback descriptif, coexistence analytique', () => {
    expect(contentClassForKind(P35_KINDS.FEEDBACK_DIFFICULTE)).toBe(
      CONTENT_CLASS.DESCRIPTIVE
    );
    expect(contentClassForKind(P35_KINDS.GTG_MOVEMENT_SHARE)).toBe(
      CONTENT_CLASS.ANALYTICAL
    );
  });

  it('journée prévue sans réalisation démontrable (missed)', () => {
    let data = { checkedExercises: {}, reps: {} };
    data = stampProven(data, '2026-10-01', EX);
    const day = buildP35DayRecord(data, '2026-10-01');
    expect(day.absenceKind).toBe(P35_DAY_ABSENCE_KIND.PLANNED_MISSED);
    expect(day.plan.compareEligible).toBe(true);
  });

  it('table fenêtre : couverture et performance instrumentée', () => {
    const table = buildP35DayTable(
      { checkedExercises: {}, reps: {} },
      { start: '2026-10-01', end: '2026-10-03' }
    );
    expect(table.days).toHaveLength(3);
    expect(table.coverage.calendarDays).toBe(3);
    const m = computeP35WindowMetrics(
      { checkedExercises: {}, reps: {} },
      { start: '2026-10-01', end: '2026-10-03' }
    );
    expect(m.performance.computeMs).toBeGreaterThanOrEqual(0);
  });
});

describe('P3.5 clôture — déduction workoutSync par clé', () => {
  it('sync normale : retire uniquement la part injectée sur la clé correspondante', () => {
    let data = {
      checkedExercises: {},
      reps: { '2026-10-01_101': '80', '2026-10-01_104': '50' },
      enduranceData: {
        gtg: {
          config: gtgConfig(),
          days: {
            '2026-10-01': { exercises: { pullups: { slots: { 0: { done: true } } } } }
          },
          workoutSync: { '2026-10-01': { pullups: 30 } }
        }
      }
    };
    const vol = classicExclusiveRepsForDay(data, '2026-10-01');
    expect(vol.syncDeduction.method).toBe('per_storage_key_ledger');
    expect(vol.classicTotalReps).toBe(130);
    expect(vol.gtgSyncedReps).toBe(30);
    // 104 intact ; 101 → 50 exclusives
    expect(vol.classicExclusiveReps).toBe(100);
    expect(vol.syncDeduction.reliable).toBe(true);
    const row101 = vol.syncDeduction.perKey.find((r) => r.storageId === '101');
    const row104 = vol.syncDeduction.perKey.find((r) => r.storageId === '104');
    expect(row101.exclusiveReps).toBe(50);
    expect(row104.exclusiveReps).toBe(50);
    expect(row104.syncedReps).toBe(0);
  });

  it('GTG non synchronisé : aucune soustraction', () => {
    let data = {
      checkedExercises: { '2026-10-01_101': true },
      reps: { '2026-10-01_101': '40' },
      enduranceData: {
        gtg: {
          config: gtgConfig(),
          days: {
            '2026-10-01': { exercises: { pullups: { slots: { 0: { done: true } } } } }
          },
          workoutSync: {}
        }
      }
    };
    const vol = classicExclusiveRepsForDay(data, '2026-10-01');
    expect(vol.gtgSyncedReps).toBe(0);
    expect(vol.classicExclusiveReps).toBe(40);
    expect(vol.syncDeduction.ledgerTotal).toBe(0);
  });

  it('absence de valeur synchronisée → exclusive = total', () => {
    const vol = classicExclusiveRepsForDay(
      { reps: { '2026-10-01_104': '22' }, enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } } },
      '2026-10-01'
    );
    expect(vol.classicExclusiveReps).toBe(22);
    expect(vol.gtgSyncedReps).toBe(0);
  });

  it('resynchronisation : exclusive suit le ledger courant, pas un cumul', () => {
    let data = {
      checkedExercises: {},
      reps: { '2026-10-01_101': '10' },
      enduranceData: {
        gtg: {
          config: gtgConfig({ manualMax: { pullups: 10 } }),
          days: {
            '2026-10-01': {
              exercises: { pullups: { slots: { 0: { done: true }, 1: { done: true } } } }
            }
          },
          workoutSync: { '2026-10-01': { pullups: 10 } }
        }
      }
    };
    const ctx = { workoutData: data };
    data = syncGtgDayToWorkoutData(data, data.enduranceData.gtg, '2026-10-01', ctx);
    const mid = classicExclusiveRepsForDay(data, '2026-10-01');
    // base classique 0 après sync qui a remplacé la part GTG ; exclusive = total - ledger
    expect(mid.gtgSyncedReps).toBe(Number(data.enduranceData.gtg.workoutSync['2026-10-01'].pullups));
    expect(mid.classicExclusiveReps).toBe(
      mid.classicTotalReps - mid.gtgSyncedReps
    );

    // Suppression d’un slot → resync
    data = {
      ...data,
      enduranceData: {
        ...data.enduranceData,
        gtg: {
          ...data.enduranceData.gtg,
          days: {
            '2026-10-01': {
              exercises: { pullups: { slots: { 0: { done: true }, 1: { done: false } } } }
            }
          }
        }
      }
    };
    data = syncGtgDayToWorkoutData(data, data.enduranceData.gtg, '2026-10-01', {
      workoutData: data
    });
    const after = classicExclusiveRepsForDay(data, '2026-10-01');
    expect(after.gtgSyncedReps).toBe(
      Number(data.enduranceData.gtg.workoutSync['2026-10-01'].pullups)
    );
    expect(after.classicExclusiveReps).toBe(
      Math.max(0, after.classicTotalReps - after.gtgSyncedReps)
    );
    expect(after.syncDeduction.reliable).toBe(true);
  });

  it('plusieurs exercices le même jour : soustraction isolée par clé', () => {
    const data = {
      reps: {
        '2026-10-01_101': '60',
        '2026-10-01_103': '40',
        '2026-10-01_104': '100'
      },
      enduranceData: {
        gtg: {
          config: gtgConfig({
            selectedIds: ['pullups', 'dips', 'pushups'],
            manualMax: { pullups: 8, dips: 8, pushups: 10 }
          }),
          days: {
            '2026-10-01': {
              exercises: {
                pullups: { slots: { 0: { done: true } } },
                dips: { slots: { 0: { done: true } } },
                pushups: { slots: { 0: { done: true } } }
              }
            }
          },
          workoutSync: {
            '2026-10-01': { pullups: 20, dips: 15, pushups: 25 }
          }
        }
      }
    };
    const vol = classicExclusiveRepsForDay(data, '2026-10-01');
    expect(vol.classicExclusiveReps).toBe(40 + 25 + 75);
    expect(vol.gtgSyncedReps).toBe(60);
    expect(vol.syncDeduction.perKey.every((r) => !r.clamped)).toBe(true);
  });

  it('sync > volume classique sur la clé : clamp, ne touche pas les autres clés', () => {
    const data = {
      reps: { '2026-10-01_101': '20', '2026-10-01_104': '50' },
      enduranceData: {
        gtg: {
          config: gtgConfig(),
          days: {},
          workoutSync: { '2026-10-01': { pullups: 45 } }
        }
      }
    };
    const vol = classicExclusiveRepsForDay(data, '2026-10-01');
    // Ancienne formule globale : max(0, 70-45)=25 — aurait mangé 104.
    // Correct : 101→0, 104→50.
    expect(vol.classicExclusiveReps).toBe(50);
    expect(vol.gtgSyncedReps).toBe(20);
    expect(vol.syncDeduction.reliable).toBe(false);
    expect(vol.syncDeduction.clampedKeys).toContain('101');
  });

  it('identité ambiguë : pas de fusion mouvement ; déduction reste par clé storage', () => {
    const data = {
      reps: { '2026-10-01_gtg_unknown_custom_xyz': '12' },
      enduranceData: {
        gtg: {
          config: {
            selectedIds: ['unknown_custom_xyz'],
            scheduleFrom: '08:00',
            scheduleTo: '12:00',
            intervalHours: 4,
            manualMax: { unknown_custom_xyz: 5 },
            customCatalog: { unknown_custom_xyz: { name: 'Mystère' } }
          },
          days: {
            '2026-10-01': {
              exercises: { unknown_custom_xyz: { slots: { 0: { done: true } } } }
            }
          },
          workoutSync: { '2026-10-01': { unknown_custom_xyz: 12 } }
        }
      }
    };
    const vol = classicExclusiveRepsForDay(data, '2026-10-01');
    expect(vol.classicExclusiveReps).toBe(0);
    expect(vol.gtgSyncedReps).toBe(12);
    const m = computeP35WindowMetrics(data, W7);
    expect(m.movementShares.publishable).toBe(false);
  });

  it('maintiens isométriques (hors map reps) : non convertis, non soustraits', () => {
    const data = {
      reps: { '2026-10-01_101': '30' },
      // champs isométriques éventuels — hors périmètre de la déduction reps
      exerciseSetLogs: {
        '2026-10-01_999': [{ holdSeconds: 40 }]
      },
      enduranceData: {
        gtg: {
          config: gtgConfig(),
          days: {},
          workoutSync: { '2026-10-01': { pullups: 10 } }
        }
      }
    };
    const vol = classicExclusiveRepsForDay(data, '2026-10-01');
    expect(vol.unit).toBe('reps');
    expect(vol.classicTotalReps).toBe(30);
    expect(vol.classicExclusiveReps).toBe(20);
    expect(vol.syncDeduction.note).toMatch(/isométriques/i);
  });

  it('sync unreliable → abstention métrique combinée mouvement', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    for (const d of ['2026-10-01', '2026-10-03', '2026-10-05']) {
      data = {
        ...data,
        reps: {
          ...data.reps,
          [`${d}_101`]: '15',
          [`${d}_104`]: '40'
        },
        enduranceData: {
          gtg: {
            config: gtgConfig(),
            days: {
              ...(data.enduranceData.gtg.days || {}),
              [d]: { exercises: { pullups: { slots: { 0: { done: true } } } } }
            },
            workoutSync: {
              ...(data.enduranceData.gtg.workoutSync || {}),
              [d]: { pullups: 40 }
            }
          }
        }
      };
    }
    const m = computeP35WindowMetrics(data, W7);
    // clamp sync>classic sur 101 → overlap syncReliable false → pas de carte part
    expect(m.movementShares.publishable).toBe(false);
    expect(['sync_provenance_unreliable', 'no_overlapping_certain_identity', 'below_overlap_or_volume_threshold']).toContain(
      m.movementShares.abstainReason
    );
  });
});

describe('P3.5 clôture — dénominateurs et rivalité', () => {
  it('couverture distingue classicOnly / gtgOnly / both / neither et invariants', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    data = seedClassic(data, '2026-10-01', 104, 20); // classic only
    data = withGtgDay(data, '2026-10-02', { syncReps: 5 }); // gtg only
    data = withGtgDay(data, '2026-10-03', { syncReps: 5 });
    data = seedClassic(data, '2026-10-03', 104, 20); // both
    // 10-04 neither
    const table = buildP35DayTable(data, {
      start: '2026-10-01',
      end: '2026-10-04'
    });
    const c = table.coverage;
    expect(c.classicOnlyDays).toBe(1);
    expect(c.gtgOnlyDays).toBe(1);
    expect(c.bothDays).toBe(1);
    expect(c.daysWithNoRecordedActivity).toBe(1);
    expect(c.classicActiveDays).toBe(2);
    expect(c.gtgActiveDays).toBe(2);
    expect(c.daysWithoutClassicExclusive).toBe(2);
    expect(c.consistency.partition).toBe(true);
    expect(c.consistency.withoutClassic).toBe(true);
    expect(c.consistency.activeEqualsParts).toBe(true);
  });

  it('volume classicExclusive ≠ journée classicOnly (terminologie)', () => {
    // Jour both : exclusive reps > 0 mais pas classicOnly
    let data = {
      reps: { '2026-10-01_104': '30', '2026-10-01_101': '45' },
      enduranceData: {
        gtg: {
          config: gtgConfig(),
          days: {
            '2026-10-01': { exercises: { pullups: { slots: { 0: { done: true } } } } }
          },
          workoutSync: { '2026-10-01': { pullups: 15 } }
        }
      }
    };
    const day = buildP35DayRecord(data, '2026-10-01');
    expect(day.classic.classicExclusiveReps).toBe(60); // 30+30
    expect(day.coexistence.both).toBe(true);
    expect(day.coexistence.classicOnly).toBe(false);
  });

  it('rivalité : outside_classic ne rivalise pas avec gtg_unplanned_*', () => {
    const flat = P35_RIVAL_GROUPS.flat();
    expect(flat).not.toContain('disc_gtg_unplanned_now');
    expect(flat).not.toContain('disc_gtg_unplanned_role');
    expect(
      P35_RIVAL_GROUPS.some(
        (g) =>
          g.includes(P35_KINDS.GTG_COEXISTENCE) &&
          g.includes(P35_KINDS.GTG_OUTSIDE_CLASSIC)
      )
    ).toBe(true);
  });

  it('formulations coexistence / outside n’emploient pas « exclusif » ambigu seul', () => {
    let data = {
      checkedExercises: {},
      reps: {},
      enduranceData: { gtg: { config: gtgConfig(), days: {}, workoutSync: {} } }
    };
    for (let i = 1; i <= 14; i += 1) {
      const d = `2026-10-${String(i).padStart(2, '0')}`;
      if (i % 2 === 0) data = withGtgDay(data, d, { syncReps: 4 });
      if (i % 3 === 0) data = seedClassic(data, d, 104, 25);
    }
    const pack = buildP35Discoveries({ snapshot: data, window: W30 });
    const co = pack.discoveries.find((d) => d.kind === P35_KINDS.GTG_COEXISTENCE);
    const out = pack.discoveries.find((d) => d.kind === P35_KINDS.GTG_OUTSIDE_CLASSIC);
    if (co) {
      expect(co.body).toMatch(/exclusivement classiques|exclusivement GTG/);
      expect(co.body).not.toMatch(/classique exclusive et\/ou GTG/);
    }
    if (out) {
      expect(out.body).toMatch(/hors horaires prévus/);
      expect(out.body).toMatch(/sans séance classique/);
    }
  });
});

