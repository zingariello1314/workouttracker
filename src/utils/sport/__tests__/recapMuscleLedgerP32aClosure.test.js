import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildMuscleAccountingLedger,
  auditUnitAndDedupPipeline,
  buildDayEligibilityTable,
  weightStatus,
  WEIGHT_CLASS,
  UNIT_CLASS,
  attributeAnatomyForExercise
} from '../recapMuscleLedgerP32a';
import {
  buildReverseStableIdIndex,
  resolveStorageExerciseIdentity,
  createNameResolverFromMaps,
  IDENTITY_RESOLUTION_SOURCE
} from '../resolveStorageExerciseIdentity';
import { convertToStableNumericId } from '../../workoutExerciseIdResolve';

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

function loadSnap() {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}
function loadNames() {
  return JSON.parse(fs.readFileSync(nameMapPath, 'utf8'));
}

describe('resolveStorageExerciseIdentity', () => {
  it('résout un ID hashé via reverse stable hash sans fusionner les homonymes', () => {
    const nameById = {
      ex_a: 'Tractions supination',
      ex_b: 'Tractions supination'
    };
    const ha = String(convertToStableNumericId('ex_a'));
    const hb = String(convertToStableNumericId('ex_b'));
    expect(ha).not.toBe(hb);
    const ra = resolveStorageExerciseIdentity({ storageId: ha, nameById });
    const rb = resolveStorageExerciseIdentity({ storageId: hb, nameById });
    expect(ra.resolvedName).toBe('Tractions supination');
    expect(rb.resolvedName).toBe('Tractions supination');
    expect(ra.originalId).toBe('ex_a');
    expect(rb.originalId).toBe('ex_b');
    expect(ra.storageId).not.toBe(rb.storageId);
  });

  it('résout db_* vers entrée banque', () => {
    const r = resolveStorageExerciseIdentity({ storageId: 'db_tractions_pronation' });
    expect(r.resolutionSource).toBe(IDENTITY_RESOLUTION_SOURCE.DB_KEY_PREFIX);
    expect(r.resolvedName).toMatch(/traction/i);
    expect(r.identityConfidence).toBe('certain');
    expect(r.exerciseBankKey).toBeTruthy();
  });

  it('ne fusionne pas sur collision de hash (ambiguous)', () => {
    // Forcer collision artificielle dans l’index
    const index = buildReverseStableIdIndex({ a: 'Alpha', b: 'Beta' });
    // injecter collision manuelle
    index.set('999', {
      originalId: 'a',
      name: 'Alpha',
      ambiguous: true,
      collisionWith: 'b'
    });
    const r = resolveStorageExerciseIdentity({
      storageId: '999',
      reverseIndex: index
    });
    expect(r.hashAmbiguous).toBe(true);
    expect(r.resolvedName).toBeNull();
  });

  it('complementary_endurance_pushups nommé', () => {
    const r = resolveStorageExerciseIdentity({
      storageId: 'complementary_endurance_pushups'
    });
    expect(r.resolvedName).toMatch(/pompes/i);
    expect(r.identityConfidence).toBe('certain');
  });
});

describe('P3.2a closure — unités, charges, golden figé', () => {
  const window = { start: '2026-10-01', end: '2026-10-30' };

  it('poids absent ≠ poids explicitement nul', () => {
    const snap = {
      reps: { '2026-10-01_101': '10' },
      checkedExercises: { '2026-10-01_101': true },
      exerciseWeights: { '2026-10-01_101': 0 }
    };
    const z = weightStatus(snap, '2026-10-01_101');
    expect(z.weightClass).toBe(WEIGHT_CLASS.EXPLICIT_ZERO);
    expect(z.weightUnknown).toBe(false);
    const absent = weightStatus({ exerciseWeights: {} }, '2026-10-01_101');
    expect(absent.weightClass).toBe(WEIGHT_CLASS.ABSENT);
  });

  it('pipeline brute→dedup→unités : invariants numériques', () => {
    const snap = loadSnap();
    const nameById = loadNames();
    const getName = createNameResolverFromMaps(nameById);
    const audit = auditUnitAndDedupPipeline({
      snapshot: snap,
      window,
      getExerciseNameById: getName,
      nameById
    });
    expect(audit.steps.rawCheckedInWindow.valueSum).toBe(4367);
    expect(audit.invariants.dedupSumPlusEliminatedEqualsRaw).toBe(true);
    expect(audit.invariants.certainSumPlusIsoSumEqualsDedupSumWhenOnlyThoseUnits).toBe(true);
    expect(audit.steps.afterUnitSplit.certain_reps.valueSum).toBe(4331);
    expect(audit.steps.afterUnitSplit.isometric_seconds.valueSum).toBe(36);
  });

  it('charges exclusives sur certain_reps === occurrences', () => {
    const snap = loadSnap();
    const nameById = loadNames();
    const getName = createNameResolverFromMaps(nameById);
    const ledger = buildMuscleAccountingLedger({
      snapshot: snap,
      window,
      getExerciseNameById: getName,
      nameById
    });
    const w = ledger.activity.weightClassesCertainReps;
    expect(w.present + w.explicitZero + w.absent).toBe(ledger.activity.occurrences);
    expect(ledger.invariants.weightClassesExclusiveOk).toBe(true);
  });

  it('golden après résolution : R inchangé, non_attr en baisse, identités certain↑', () => {
    const snap = loadSnap();
    const nameById = loadNames();
    const getName = createNameResolverFromMaps(nameById);
    const ledger = buildMuscleAccountingLedger({
      snapshot: snap,
      window,
      getExerciseNameById: getName,
      nameById
    });
    expect(ledger.totals.conservationOk).toBe(true);
    expect(ledger.totals.R).toBe(4331);
    expect(ledger.totals.isoSecondsSum).toBe(36);
    // Avant : 21 certain / 26 probable — après reverse hash + db_* :
    expect(ledger.identityInventory.certain.length).toBeGreaterThanOrEqual(45);
    expect(ledger.totals.R_non_attr).toBeLessThan(2389);
    expect(ledger.totals.R_mono + ledger.totals.R_multi).toBeGreaterThan(1072 + 870);

    const out = {
      generatedAt: new Date().toISOString(),
      before: { R: 4331, R_mono: 1072, R_multi: 870, R_non_attr: 2389, certain: 21, probable: 26 },
      after: {
        totals: ledger.totals,
        coverage: ledger.coverage,
        identityCounts: {
          certain: ledger.identityInventory.certain.length,
          probable: ledger.identityInventory.probable.length,
          unresolved: ledger.identityInventory.unresolved.length
        },
        activity: ledger.activity,
        volumePrimary: ledger.volumePrimary,
        multiPrimaryTouch: ledger.multiPrimaryTouch
      },
      identityDiagnostic: [
        ...ledger.identityInventory.certain.map((x) => ({ ...x, identityConfidence: 'certain' })),
        ...ledger.identityInventory.probable.map((x) => ({ ...x, identityConfidence: 'probable' })),
        ...ledger.identityInventory.unresolved.map((x) => ({
          ...x,
          identityConfidence: 'unresolved'
        }))
      ],
      unitPipeline: auditUnitAndDedupPipeline({
        snapshot: snap,
        window,
        getExerciseNameById: getName,
        nameById
      }),
      dayEligibility: buildDayEligibilityTable({
        snapshot: snap,
        window,
        getExerciseNameById: getName,
        nameById
      })
    };
    fs.writeFileSync(
      path.join(root, 'docs/analyses-documentation/fixtures/p32a-closure-recalc-oct-2026.json'),
      JSON.stringify(out, null, 2)
    );
  });

  it('GTG déjà sync : pas de double compte dans R', () => {
    const snap = loadSnap();
    const nameById = loadNames();
    const ledger = buildMuscleAccountingLedger({
      snapshot: snap,
      window,
      getExerciseNameById: createNameResolverFromMaps(nameById),
      nameById
    });
    expect(ledger.totals.gtgUniqueNotInClassic).toBe(0);
    expect(ledger.totals.pipelineAggregateSum).toBe(ledger.totals.R);
  });

  it('secondary incomplete ≠ empty si primary fiable', () => {
    const attr = attributeAnatomyForExercise({
      storageId: '104',
      name: 'Pompes déclinées'
    });
    if (attr.primaryGroups.length >= 1) {
      expect(attr.mappingQuality).not.toBe('empty');
      expect(attr.metricAdmissible.volumeMono || attr.metricAdmissible.volumeMulti).toBe(true);
    }
  });

  it('stabilité golden à entrée identique', () => {
    const snap = loadSnap();
    const nameById = loadNames();
    const opts = {
      snapshot: snap,
      window,
      getExerciseNameById: createNameResolverFromMaps(nameById),
      nameById
    };
    const a = buildMuscleAccountingLedger(opts);
    const b = buildMuscleAccountingLedger(opts);
    expect(a.totals).toEqual(b.totals);
  });
});
