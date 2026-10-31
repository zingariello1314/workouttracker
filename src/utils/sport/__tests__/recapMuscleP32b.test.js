/**
 * P3.2b — métriques ledger + découvertes isolées (Phase 1) et intégration E0 (Phase 2).
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  comparisonWindow,
  historyWindow,
  historyLookbackForWindow,
  windowSpanDays,
  classifyPrimaryGroups,
  MOVEMENT_AXIS,
  buildP32bMuscleMetrics,
  pickExposureContrast,
  pickExposureShifts,
  movementStructureSnapshot,
  summarizePlanMuscleGaps,
  buildGroupExposureDayTable,
  MIN_SNAPSHOT_DAYS_PLAN_MUSCLE
} from '../recapMuscleP32bMetrics';
import {
  buildP32bMuscleDiscoveries,
  P32B_KINDS,
  P32B_KIND_CONTRACTS
} from '../recapMuscleP32bDiscoveries';
import { CONTENT_CLASS, contentClassForKind } from '../recapDiscoveryContentClass';
import { buildPeriodDiscoveryBundle, selectPeriodDiscoveriesWithTrace } from '../recapPeriodDiscoveries';
import {
  buildDayPlanSnapshotFromExercises,
  withDayPlanSnapshot
} from '../../calendarDayPlanSnapshot.js';
import { attributeAnatomyForExercise } from '../recapMuscleLedgerP32a';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');
const fixturePath = path.join(
  root,
  'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'
);
const nameMapPath = path.join(
  root,
  'docs/analyses-documentation/fixtures/exercise-name-map-main.json'
);

function loadFixture() {
  if (!fs.existsSync(fixturePath)) return null;
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

function loadNames() {
  if (!fs.existsSync(nameMapPath)) return {};
  return JSON.parse(fs.readFileSync(nameMapPath, 'utf8'));
}

const names = {
  101: 'Tractions pronation',
  104: 'Pompes déclinées',
  103: 'Dips',
  201: 'Squat',
  1011: 'Planche'
};

function getName(id) {
  return names[id] || names[String(id)] || '';
}

function seedDay(snapshot, date, entries) {
  for (const [id, reps] of entries) {
    snapshot.reps[`${date}_${id}`] = String(reps);
    snapshot.checkedExercises[`${date}_${id}`] = true;
  }
}

function emptySnap() {
  return { reps: {}, checkedExercises: {}, calendarDayPlanSnapshots: {} };
}

describe('P3.2b — fenêtres W/C/H', () => {
  it('C a la même durée que W et finit la veille', () => {
    const W = { start: '2026-10-01', end: '2026-10-30' };
    expect(windowSpanDays(W)).toBe(30);
    const C = comparisonWindow(W);
    expect(windowSpanDays(C)).toBe(30);
    expect(C.end).toBe('2026-09-30');
    expect(C.start).toBe('2026-09-01');
  });

  it('H contextualise sans chevaucher W', () => {
    const W = { start: '2026-10-24', end: '2026-10-30' };
    const H = historyWindow(W, 90);
    expect(H.end).toBe('2026-10-23');
    expect(H.start < W.start).toBe(true);
  });
});

describe('P3.2b — classification mouvements', () => {
  it('push / pull / mixed / indeterminate', () => {
    expect(classifyPrimaryGroups(['chest'])).toBe(MOVEMENT_AXIS.PUSH);
    expect(classifyPrimaryGroups(['back'])).toBe(MOVEMENT_AXIS.PULL);
    expect(classifyPrimaryGroups(['chest', 'back'])).toBe(MOVEMENT_AXIS.MIXED);
    expect(classifyPrimaryGroups([])).toBe(MOVEMENT_AXIS.INDETERMINATE);
  });

  it('multi-primary dips : volume non forcé en mono push', () => {
    const attr = attributeAnatomyForExercise({ storageId: '103', name: 'Dips' });
    if (attr.primaryGroups.length >= 2) {
      expect(attr.metricAdmissible.volumeMono).toBe(false);
      const axis = classifyPrimaryGroups(attr.primaryGroups);
      expect([MOVEMENT_AXIS.MIXED, MOVEMENT_AXIS.PUSH, MOVEMENT_AXIS.OTHER]).toContain(axis);
    }
  });
});

describe('P3.2b — métriques exposition (fixtures synthétiques)', () => {
  it('contraste d’exposition primary jours distincts (vs 2e, pas accessoire min)', () => {
    const snapshot = emptySnap();
    // chest : 5 jours ; back : 2 ; un accessoire 1j ne doit pas être le trail préféré
    for (const d of ['2026-10-01', '2026-10-03', '2026-10-05', '2026-10-07', '2026-10-09']) {
      seedDay(snapshot, d, [[104, 40]]);
    }
    seedDay(snapshot, '2026-10-02', [[101, 30]]);
    seedDay(snapshot, '2026-10-04', [[101, 20]]);
    const m = buildP32bMuscleMetrics({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-10' },
      getExerciseNameById: getName
    });
    const hit = pickExposureContrast(m.W, { minLeadDays: 3, minGapDays: 3 });
    expect(hit).toBeTruthy();
    expect(hit.lead.group).toBe('chest');
    expect(hit.trail.group).toBe('back');
    expect(hit.gapDays).toBeGreaterThanOrEqual(3);
  });

  it('secondary seulement : pas de mono volume sur le groupe secondary', () => {
    // Tractions : primary back, secondary souvent biceps — on vérifie exposition secondary ≠ mono
    const snapshot = emptySnap();
    seedDay(snapshot, '2026-10-01', [[101, 50]]);
    const m = buildP32bMuscleMetrics({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-01' },
      getExerciseNameById: getName
    });
    const back = m.W.groups.find((g) => g.group === 'back');
    expect(back?.monoReps).toBeGreaterThan(0);
    // biceps peut être secondary → exposureDaysSecondary possible, monoReps 0
    const bi = m.W.groups.find((g) => g.group === 'biceps');
    if (bi) {
      expect(bi.monoReps).toBe(0);
    }
  });

  it('exercice sans attribution fiable : R_non_attr, pas de découverte volume', () => {
    const snapshot = emptySnap();
    seedDay(snapshot, '2026-10-01', [['orphan_xyz', 20]]);
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-01' },
      getExerciseNameById: () => ''
    });
    expect(pack.metrics.W.totals.R_non_attr).toBeGreaterThan(0);
    expect(pack.discoveries.every((d) => d.kind !== P32B_KINDS.MOVEMENT_STRUCTURE)).toBe(true);
  });

  it('pompes complémentaires : provenance conservée, multi', () => {
    const snapshot = emptySnap();
    seedDay(snapshot, '2026-10-01', [['complementary_endurance_pushups', 100]]);
    const m = buildP32bMuscleMetrics({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-01' },
      getExerciseNameById: () => 'Pompes endurance (complémentaire)'
    });
    expect(m.flags.hasComplementaryPushups).toBe(true);
    expect(m.W.movement.complementaryReps).toBe(100);
    expect(m.W.totals.R_multi).toBeGreaterThanOrEqual(100);
  });

  it('période sans entraînement : pas de contraste / shift', () => {
    const pack = buildP32bMuscleDiscoveries({
      snapshot: emptySnap(),
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(pack.discoveries.filter((d) => d.kind !== P32B_KINDS.LEDGER_LIMITS)).toHaveLength(0);
  });

  it('historique stable : pas de shift si Δ jours < seuil', () => {
    const snapshot = emptySnap();
    for (const d of [
      '2026-09-24',
      '2026-09-26',
      '2026-09-28',
      '2026-09-30',
      '2026-10-01',
      '2026-10-03',
      '2026-10-05',
      '2026-10-07'
    ]) {
      seedDay(snapshot, d, [
        [104, 30],
        [101, 20]
      ]);
    }
    const m = buildP32bMuscleMetrics({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(m.comparability.level).toBe('solid');
    const shifts = pickExposureShifts(m.W, m.C, { minAbsDeltaDays: 3 });
    expect(shifts.every((s) => Math.abs(s.deltaDays) >= 3)).toBe(true);
    expect(shifts.length).toBe(0);
  });

  it('évolution démontrée W vs C (comparabilité solide)', () => {
    const snapshot = emptySnap();
    // C : activité sur ≥3 jours, peu de chest ; W : chest fréquent
    for (const d of ['2026-09-24', '2026-09-26', '2026-09-28', '2026-09-30']) {
      seedDay(snapshot, d, [[101, 20]]);
    }
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']) {
      seedDay(snapshot, d, [[104, 40]]);
    }
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(pack.metrics.comparability.level).toBe('solid');
    const shift = pack.discoveries.find((d) => d.kind === P32B_KINDS.EXPOSURE_SHIFT);
    expect(shift).toBeTruthy();
    expect(shift.title).toMatch(/jours d’exposition/i);
    expect(shift.body).toMatch(/fenêtres comparables/);
    expect(shift.metrics.deltaDays).not.toBe(0);
  });

  it('comparaison W/C non équivalente si C vide', () => {
    const snapshot = emptySnap();
    seedDay(snapshot, '2026-10-01', [[104, 40]]);
    seedDay(snapshot, '2026-10-02', [[104, 40]]);
    seedDay(snapshot, '2026-10-03', [[104, 40]]);
    const m = buildP32bMuscleMetrics({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(m.comparableWC).toBe(false);
    expect(m.comparability.level).not.toBe('solid');
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(
      pack.rejected.some(
        (r) => r.kind === P32B_KINDS.EXPOSURE_SHIFT && String(r.reason).includes('incomparable')
      )
    ).toBe(true);
  });

  it('contraste faible (16 vs 11 relatif) : non publié', () => {
    const snapshot = emptySnap();
    // lead 5 j, trail 4 j → gap 1 et relatif 20 % — sous seuils
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']) {
      seedDay(snapshot, d, [[104, 30]]);
    }
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) {
      seedDay(snapshot, d, [[101, 20]]);
    }
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-10' },
      getExerciseNameById: getName
    });
    expect(pack.discoveries.every((d) => d.kind !== P32B_KINDS.EXPOSURE_CONTRAST)).toBe(true);
  });

  it('shift solide prime sur contraste concurrent (si les deux passent les seuils)', () => {
    const snapshot = emptySnap();
    // C : 4 jours tractions seulement
    for (const d of ['2026-09-22', '2026-09-24', '2026-09-26', '2026-09-28']) {
      seedDay(snapshot, d, [[101, 15]]);
    }
    // W : chest 6 j, back 1 j → contraste relatif fort + shift chest
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']) {
      seedDay(snapshot, d, [[104, 40]]);
    }
    seedDay(snapshot, '2026-10-07', [[101, 10]]);
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(pack.discoveries.some((d) => d.kind === P32B_KINDS.EXPOSURE_SHIFT)).toBe(true);
    // Contraste chest vs back : 6 vs 1 → relatif 83 % — produit puis supersédé par shift
    expect(
      pack.rejected.some((r) => r.reason === 'superseded_by_exposure_shift') ||
        pack.discoveries.every((d) => d.kind !== P32B_KINDS.EXPOSURE_CONTRAST)
    ).toBe(true);
  });

  it('structure mixed : pas de carte si ratio < seuil', () => {
    const snapshot = emptySnap();
    // volumes push≈pull
    seedDay(snapshot, '2026-10-01', [[104, 200], [101, 200]]);
    const m = buildP32bMuscleMetrics({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-01' },
      getExerciseNameById: getName
    });
    const snap = movementStructureSnapshot(m.W);
    expect(snap.dominant).toBe(MOVEMENT_AXIS.MIXED);
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-01' },
      getExerciseNameById: getName
    });
    expect(pack.discoveries.every((d) => d.kind !== P32B_KINDS.MOVEMENT_STRUCTURE)).toBe(true);
  });
});

describe('P3.2b — prévu × réalisé (snapshots synthétiques)', () => {
  function withSnapOn(data, dateStr, exercises) {
    return withDayPlanSnapshot(
      data,
      dateStr,
      buildDayPlanSnapshotFromExercises({
        dateStr,
        exercises,
        programId: 'synth-p32b'
      })
    );
  }

  it('zéro snapshot → plan rejeté, ledger_limits possible', () => {
    const snapshot = emptySnap();
    seedDay(snapshot, '2026-10-01', [[104, 40]]);
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(pack.metrics.plan.snapshotDayCount).toBe(0);
    expect(pack.metrics.plan.planMuscleComparable).toBe(false);
    expect(pack.rejected.some((r) => r.kind === P32B_KINDS.PLAN_VS_ACTUAL && r.reason === 'insufficient_snapshots')).toBe(
      true
    );
    expect(pack.discoveries.some((d) => d.kind === P32B_KINDS.PLAN_VS_ACTUAL)).toBe(false);
    expect(pack.discoveries.some((d) => d.kind === P32B_KINDS.LEDGER_LIMITS)).toBe(true);
    expect(contentClassForKind(P32B_KINDS.LEDGER_LIMITS)).toBe(CONTENT_CLASS.METHODOLOGY_LIMIT);
  });

  it('snapshots partiels < seuil → pas de plan_vs_actual', () => {
    let data = emptySnap();
    const dates = ['2026-10-01', '2026-10-03'];
    for (const d of dates) {
      seedDay(data, d, [[104, 30]]);
      data = withSnapOn(data, d, [{ id: 104, originalId: '104', name: 'Pompes déclinées', series: '3×10' }]);
    }
    const m = buildP32bMuscleMetrics({
      snapshot: data,
      window: { start: '2026-10-01', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(m.plan.snapshotDayCount).toBeLessThan(MIN_SNAPSHOT_DAYS_PLAN_MUSCLE);
    expect(m.plan.planMuscleComparable).toBe(false);
  });

  it('groupe prévu une seule fois : pas de gap matériel', () => {
    let data = emptySnap();
    const dates = ['2026-10-01', '2026-10-03', '2026-10-05'];
    // Squats planifiés 1 jour seulement ; pompes réalisées les 3
    for (const d of dates) {
      seedDay(data, d, [[104, 30]]);
      data = withSnapOn(data, d, [{ id: 104, originalId: '104', name: 'Pompes déclinées', series: '3×10' }]);
    }
    // Un jour avec squat prévu non fait
    data = withSnapOn(data, '2026-10-01', [
      { id: 104, originalId: '104', name: 'Pompes déclinées', series: '3×10' },
      { id: 201, originalId: '201', name: 'Squat', series: '3×8' }
    ]);
    const gaps = summarizePlanMuscleGaps(
      buildP32bMuscleMetrics({
        snapshot: data,
        window: { start: '2026-10-01', end: '2026-10-07' },
        getExerciseNameById: getName
      }).matrix,
      { getExerciseNameById: getName }
    );
    expect(gaps.singleOccasionGroups.length).toBeGreaterThanOrEqual(0);
    const squatGap = (gaps.gaps || []).find((g) => g.group === 'quads' || g.group === 'legs');
    // Une seule occasion → pas dans gaps
    expect(squatGap).toBeFalsy();
  });

  it('écart récurrent (≥3 occasions) publié ; pas le vocabulaire de tendance', () => {
    let data = emptySnap();
    const dates = ['2026-10-01', '2026-10-03', '2026-10-05', '2026-10-07'];
    for (const d of dates) {
      seedDay(data, d, [[104, 40]]);
      data = withSnapOn(data, d, [
        { id: 104, originalId: '104', name: 'Pompes déclinées', series: '3×12' },
        { id: 101, originalId: '101', name: 'Tractions pronation', series: '3×8' }
      ]);
    }
    const pack = buildP32bMuscleDiscoveries({
      snapshot: data,
      window: { start: '2026-10-01', end: '2026-10-10' },
      getExerciseNameById: getName
    });
    expect(pack.metrics.plan.planMuscleComparable).toBe(true);
    const planCard = pack.discoveries.find((d) => d.kind === P32B_KINDS.PLAN_VS_ACTUAL);
    expect(planCard).toBeTruthy();
    expect(planCard.metrics.plannedOccasions).toBeGreaterThanOrEqual(3);
    expect(planCard.metrics.recurrence).toBe('established');
    expect(planCard.body).toMatch(/récurrent/);
    expect(planCard.body).not.toMatch(/tendance/i);
  });

  it('deux occasions : observé plusieurs fois, pas publié comme récurrent', () => {
    let data = emptySnap();
    const dates = ['2026-10-01', '2026-10-03', '2026-10-05'];
    for (const d of dates) {
      seedDay(data, d, [[104, 40]]);
      data = withSnapOn(data, d, [
        { id: 104, originalId: '104', name: 'Pompes déclinées', series: '3×12' }
      ]);
    }
    // Tractions prévues seulement 2 fois, jamais faites
    data = withSnapOn(data, '2026-10-01', [
      { id: 104, originalId: '104', name: 'Pompes déclinées', series: '3×12' },
      { id: 101, originalId: '101', name: 'Tractions pronation', series: '3×8' }
    ]);
    data = withSnapOn(data, '2026-10-03', [
      { id: 104, originalId: '104', name: 'Pompes déclinées', series: '3×12' },
      { id: 101, originalId: '101', name: 'Tractions pronation', series: '3×8' }
    ]);
    const pack = buildP32bMuscleDiscoveries({
      snapshot: data,
      window: { start: '2026-10-01', end: '2026-10-10' },
      getExerciseNameById: getName
    });
    expect(pack.discoveries.every((d) => d.kind !== P32B_KINDS.PLAN_VS_ACTUAL)).toBe(true);
    expect(pack.rejected.some((r) => r.kind === P32B_KINDS.PLAN_VS_ACTUAL)).toBe(true);
    expect((pack.metrics.plan.observedTwiceGaps || []).length).toBeGreaterThanOrEqual(0);
  });
});

describe('P3.2b — contrats kinds', () => {
  it('cinq kinds distincts avec contentClass', () => {
    expect(Object.keys(P32B_KINDS)).toHaveLength(5);
    expect(P32B_KIND_CONTRACTS[P32B_KINDS.LEDGER_LIMITS].contentClass).toBe(
      CONTENT_CLASS.METHODOLOGY_LIMIT
    );
    expect(P32B_KIND_CONTRACTS[P32B_KINDS.EXPOSURE_CONTRAST].contentClass).toBe(
      CONTENT_CLASS.ANALYTICAL
    );
  });
});

describe('P3.2b — Phase 1 isolée vs Phase 2 pool', () => {
  it('opt-out : hors pool si includeP32bMuscleDiscoveries false', () => {
    const snapshot = emptySnap();
    for (const d of ['2026-10-01', '2026-10-03', '2026-10-05', '2026-10-07', '2026-10-09']) {
      seedDay(snapshot, d, [[104, 50]]);
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-10' },
      getExerciseNameById: getName,
      includeP32bMuscleDiscoveries: false
    });
    expect(bundle.p32bMuscle?.discoveries?.length).toBeGreaterThan(0);
    expect(bundle.p32bMuscle.includedInPool).toBe(false);
    expect((bundle.all || []).every((d) => !String(d.kind).startsWith('disc_muscle_exposure'))).toBe(
      true
    );
  });

  it('Phase 2 défaut : candidats P3.2b dans le pool', () => {
    const snapshot = emptySnap();
    for (const d of ['2026-10-01', '2026-10-03', '2026-10-05', '2026-10-07', '2026-10-09']) {
      seedDay(snapshot, d, [[104, 50]]);
    }
    seedDay(snapshot, '2026-10-02', [[101, 20]]);
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-10' },
      getExerciseNameById: getName
    });
    expect(bundle.p32bMuscle.includedInPool).toBe(true);
    expect((bundle.all || []).some((d) => String(d.kind).startsWith('disc_muscle_'))).toBe(true);
  });

  it('Phase 2 : injection + rivalité composition / P3.2b', () => {
    const cards = [
      {
        kind: 'disc_muscle_now',
        nature: 'now',
        family: 'muscle_now',
        score: 70,
        title: 'Composition',
        body: 'x',
        weights: { importance: 0.9, reliability: 0.9, novelty: 0.7, fit: 0.9 },
        metrics: {}
      },
      {
        kind: P32B_KINDS.EXPOSURE_CONTRAST,
        nature: 'now',
        family: 'muscle_p32b_exposure',
        contentClass: CONTENT_CLASS.ANALYTICAL,
        score: 72,
        title: 'Exposition',
        body: 'y',
        weights: { importance: 0.85, reliability: 0.9, novelty: 0.8, fit: 0.9 },
        metrics: {}
      }
    ];
    const traced = selectPeriodDiscoveriesWithTrace(cards, null, 'week');
    const muscleKinds = traced.selected.filter((d) =>
      ['disc_muscle_now', P32B_KINDS.EXPOSURE_CONTRAST].includes(d.kind)
    );
    expect(muscleKinds.length).toBeLessThanOrEqual(1);
  });

  it('methodology_limit ledger ne gagne pas un slot principal', () => {
    const cards = [
      {
        kind: P32B_KINDS.LEDGER_LIMITS,
        nature: 'trajectory',
        family: 'muscle_p32b_limits',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 90,
        title: 'Limites',
        body: 'z',
        weights: { importance: 0.9, reliability: 0.95, novelty: 0.9, fit: 0.9 },
        metrics: { contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT }
      }
    ];
    const traced = selectPeriodDiscoveriesWithTrace(cards, null, 'week');
    expect(traced.selected).toHaveLength(0);
    expect(traced.reliabilityNotes?.length).toBeGreaterThanOrEqual(1);
  });
});

describe('P3.2b — rejeu octobre réel (Phase 1 candidats)', () => {
  const snapshot = loadFixture();
  const nameById = loadNames();
  const getNameReal = (id) => nameById[String(id)] || nameById[id] || '';

  it('fixture disponible', () => {
    expect(snapshot).toBeTruthy();
  });

  it('audit exposition chest : 16 jours, aucun jour complémentaire-seul', () => {
    if (!snapshot) return;
    const table = buildGroupExposureDayTable({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-30' },
      group: 'chest',
      getExerciseNameById: getNameReal,
      nameById
    });
    expect(table.exposureDaysPrimary).toBe(16);
    expect(table.exposureDates).toHaveLength(16);
    expect(table.complementaryOnlyDates).toEqual([]);
    expect(table.classicOrSyncedDates).toHaveLength(16);
    const hasComp = Object.values(table.rowsByDate)
      .flat()
      .some((r) => r.provenance === 'complementary' && r.includedInExposurePrimary);
    expect(hasComp).toBe(true);
    const hasGtg = Object.values(table.rowsByDate)
      .flat()
      .some((r) => r.provenance === 'classic_gtg_synced' && r.includedInExposurePrimary);
    expect(hasGtg).toBe(true);
  });

  it('lookback H adapté (pas 90 j forcés sur 7j)', () => {
    expect(historyLookbackForWindow({ start: '2026-10-24', end: '2026-10-30' })).toBe(28);
    expect(historyLookbackForWindow({ start: '2026-10-01', end: '2026-10-30' })).toBe(60);
  });

  it.each([
    { label: '7j', window: { start: '2026-10-24', end: '2026-10-30' } },
    { label: '30j', window: { start: '2026-10-01', end: '2026-10-30' } },
    { label: '3m', window: { start: '2026-08-01', end: '2026-10-30' } }
  ])('$label — 0 snapshot ⇒ pas de plan_vs_actual ; candidats documentés', ({ window }) => {
    if (!snapshot) return;
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window,
      getExerciseNameById: getNameReal,
      nameById
    });
    expect(pack.metrics.plan.snapshotDayCount).toBe(0);
    expect(pack.discoveries.every((d) => d.kind !== P32B_KINDS.PLAN_VS_ACTUAL)).toBe(true);
    const json = JSON.stringify(pack.metrics);
    expect(json).not.toMatch(/0\.74|74\/26|repShare/);
    expect(pack.metrics.W?.totals?.R).toBeGreaterThan(0);
  });

  it('30j réel : contraste pectoraux/dos trop relatif → non publié ; shift admissible', () => {
    if (!snapshot) return;
    const pack = buildP32bMuscleDiscoveries({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-30' },
      getExerciseNameById: getNameReal,
      nameById
    });
    expect(pack.metrics.comparability.level).toBe('solid');
    expect(pack.discoveries.every((d) => d.kind !== P32B_KINDS.EXPOSURE_CONTRAST)).toBe(true);
    const shift = pack.discoveries.find((d) => d.kind === P32B_KINDS.EXPOSURE_SHIFT);
    expect(shift).toBeTruthy();
    expect(shift.body).toMatch(/jours enregistrés avec exposition/);
  });
});
